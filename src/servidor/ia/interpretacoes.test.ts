import { afterEach, describe, expect, it, vi } from "vitest";
import { calcularMetricasModulo } from "@/dominio/analises/metricas-modulo";
import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { criarProvedorGemini } from "./gemini";
import { ControleCotaInterpretacoes, criarDtoInterpretacaoModulo, interpretarDto } from "./interpretacoes";
import { ErroProvedorInterpretacao } from "./provedor-interpretacoes";

const dto: DtoInterpretacao = {
  escopo: "PESSOAL",
  versaoAlgoritmo: "metricas-oficiais-v2",
  quantidadeModulos: 1,
  quantidadeTentativas: 2,
  minutosValidos: 40,
  periodo: { inicio: "2026-09-01T12:00:00.000Z", fim: "2026-09-02T12:00:00.000Z" },
  modulos: [{ referencia: "Módulo 1", quantidadeTentativas: 2, taxaAcerto: 0.7, mediaNotas: 70, minutosValidos: 40, exposicoesMistas: 0, observacoesPercepcao: 2 }],
  recorrencias: [],
  quantidadeTopicosComEvidencia: 1,
  evolucaoTaxaMediaTopicos: [],
  dificuldadeAtualEstimada: null,
  limitacoes: ["Métricas descrevem registros observados e não comprovam causalidade."],
};

const conteudoValido = {
  padroesObservados: ["Há duas tentativas concluídas no resumo atual."],
  feedbacks: ["A amostra ainda é pequena e deve ser lida no contexto do módulo."],
  conselhos: ["Registre uma nova sessão válida antes de reavaliar o mesmo tópico."],
  perguntasReflexao: ["Que estratégia você quer experimentar no próximo registro?"],
};

afterEach(() => vi.unstubAllGlobals());

describe("interpretações opcionais", () => {
  it("usa Gemini somente para conteúdo validado e mantém o contexto oficial", async () => {
    const resultado = await interpretarDto(dto, { apiKey: "chave-sintetica", provedor: { interpretar: async () => conteudoValido } });
    expect(resultado).toMatchObject({ origem: "GEMINI", motivoContingencia: null, contexto: { quantidadeTentativas: 2, versaoAlgoritmo: "metricas-oficiais-v2" } });
  });

  it("usa resposta local sem chave, em timeout e em texto inválido ou proibido", async () => {
    const semChave = await interpretarDto(dto);
    const timeout = await interpretarDto(dto, { apiKey: "chave-sintetica", provedor: { interpretar: async () => { throw new ErroProvedorInterpretacao("TEMPO_ESGOTADO"); } } });
    const invalida = await interpretarDto(dto, { apiKey: "chave-sintetica", provedor: { interpretar: async () => ({ ...conteudoValido, padroesObservados: ["Você aprende melhor por vídeo."] }) } });
    expect(semChave).toMatchObject({ origem: "LOCAL", motivoContingencia: "SEM_CHAVE" });
    expect(timeout).toMatchObject({ origem: "LOCAL", motivoContingencia: "TEMPO_ESGOTADO" });
    expect(invalida).toMatchObject({ origem: "LOCAL", motivoContingencia: "RESPOSTA_INVALIDA" });
  });

  it("mapeia 401, 429 e 500 do provedor sem expor a resposta externa", async () => {
    for (const [status, codigo] of [[401, "FALHA_EXTERNA"], [429, "COTA"], [500, "FALHA_EXTERNA"]] as const) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
      await expect(criarProvedorGemini("chave-sintetica", "gemini-2.5-flash").interpretar(dto)).rejects.toMatchObject({ codigo });
      vi.unstubAllGlobals();
    }
  });

  it("limita a quantidade de solicitações da mesma conta na janela local", () => {
    const controle = new ControleCotaInterpretacoes();
    expect([1, 2, 3, 4, 5].every((indice) => controle.consumir("conta", indice))).toBe(true);
    expect(controle.consumir("conta", 6)).toBe(false);
  });

  it("monta DTO de módulo com referências opacas e sem identificadores internos", () => {
    const metricas = calcularMetricasModulo("modulo-secreto", [], [{
      id: "tentativa-secreta",
      moduloId: "modulo-secreto",
      topicoId: "topico-secreto",
      concluidaEm: new Date("2026-09-01T12:00:00.000Z"),
      notaNormalizada: 80,
      numeroTentativa: 1,
      respostasCorretas: 4,
      totalQuestoes: 5,
    }]);
    const dtoModulo = criarDtoInterpretacaoModulo(metricas);
    const serializado = JSON.stringify(dtoModulo);
    expect(dtoModulo).toMatchObject({ escopo: "MODULO", quantidadeModulos: 1, quantidadeTopicosComEvidencia: 1, dificuldadeAtualEstimada: { status: "BAIXA", amostraReduzida: true } });
    expect(serializado).not.toContain("modulo-secreto");
    expect(serializado).not.toContain("topico-secreto");
    expect(serializado).not.toContain("tentativa-secreta");
  });
});
