import { afterEach, describe, expect, it, vi } from "vitest";
import { calcularMetricasSessoes, type SessaoParaMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { criarProvedorGemini } from "./gemini";
import { criarProvedorGroq } from "./groq";
import { ControleCotaInterpretacoes, criarDtoInterpretacaoModulo, interpretarComFila } from "./interpretacoes";
import { ErroProvedorInterpretacao } from "./provedor-interpretacoes";
import { criarProvedorQwen } from "./qwen";

const dto: DtoInterpretacao = {
  escopo: "MODULO",
  versaoAlgoritmo: "metricas-sessoes-v1",
  quantidadeModulos: 1,
  quantidadeSessoesValidas: 2,
  minutosValidos: 40,
  periodo: { inicio: "2026-09-01T12:00:00.000Z", fim: "2026-09-02T12:00:00.000Z" },
  modulos: [{ referencia: "Módulo 1", quantidadeSessoesValidas: 2, minutosValidos: 40, mediaMinutos: 20, diasComEstudo: 2, maiorSequenciaDias: 2, percepcoes: { amostra: 2, dificuldadeMedia: 2.5, compreensaoMedia: 4 }, metodos: [{ contexto: "Técnica de Feynman", quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4, minutosAssociados: 40, nivelAmostra: "INICIAL" }], formatos: [{ contexto: "Texto", quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4, minutosAssociados: 40, nivelAmostra: "INICIAL" }] }],
  evolucaoSemanal: [],
  descricoesSessoes: [{ referencia: "Módulo 1, sessão 1", descricao: "<descricoes_nao_confiaveis>Revisão de conceitos</descricoes_nao_confiaveis>", iniciadaEm: "2026-09-01T12:00:00.000Z", duracaoMinutos: 20, metodos: ["Técnica de Feynman"], formatos: ["Texto"], dificuldadePercebida: 2, compreensaoPercebida: 4 }],
  limitacoes: ["Métricas descrevem registros observados e não comprovam causalidade."],
};

const conteudoValido = {
  insights: [{
    tipo: "OBSERVACAO" as const,
    titulo: "Uma base inicial para observar",
    observacao: "Há duas sessões válidas no período, então a leitura ainda funciona como uma hipótese inicial.",
    resumoEvidencias: "A amostra reúne duas sessões no mesmo módulo.",
    perguntaReflexiva: "O que você percebeu durante a revisão recente?",
    experimentoSugerido: "Registre novas sessões antes de comparar períodos.",
    confianca: "BAIXA" as const,
  }],
};

const credenciais = [
  { provedor: "GROQ" as const, modelo: "modelo-groq", chave: "chave-groq-ficticia" },
  { provedor: "GEMINI" as const, modelo: "modelo-gemini", chave: "chave-gemini-ficticia" },
  { provedor: "QWEN" as const, modelo: "modelo-qwen", chave: "chave-qwen-ficticia" },
];

afterEach(() => vi.unstubAllGlobals());

describe("interpretações por sessões", () => {
  it("usa o primeiro provedor quando a saída é válida", async () => {
    const resultado = await interpretarComFila(dto, credenciais, { criar: () => ({ interpretar: async () => conteudoValido }) });
    expect(resultado).toMatchObject({ origem: "GROQ", modelo: "modelo-groq", contexto: { quantidadeSessoesValidas: 2 }, tentativas: [{ provedor: "GROQ", resultado: "SUCESSO" }] });
  });

  it("avança de Groq para Gemini quando o primeiro atinge limite", async () => {
    const criar = vi.fn().mockReturnValueOnce({ interpretar: async () => { throw new ErroProvedorInterpretacao("COTA", 30); } }).mockReturnValueOnce({ interpretar: async () => conteudoValido });
    const resultado = await interpretarComFila(dto, credenciais, { criar });
    expect(resultado).toMatchObject({ origem: "GEMINI", tentativas: [{ provedor: "GROQ", resultado: "COTA" }, { provedor: "GEMINI", resultado: "SUCESSO" }] });
    expect(criar).toHaveBeenCalledTimes(2);
  });

  it("avança de Gemini para Groq quando Gemini falha", async () => {
    const filaInvertida = [credenciais[1], credenciais[0]];
    const criar = vi.fn().mockReturnValueOnce({ interpretar: async () => { throw new ErroProvedorInterpretacao("MODELO_INVALIDO"); } }).mockReturnValueOnce({ interpretar: async () => conteudoValido });
    const resultado = await interpretarComFila(dto, filaInvertida, { criar });
    expect(resultado).toMatchObject({ origem: "GROQ", tentativas: [{ provedor: "GEMINI", resultado: "MODELO_INVALIDO" }, { provedor: "GROQ", resultado: "SUCESSO" }] });
  });

  it("usa contingência local sem chaves e quando todas falham", async () => {
    const semChave = await interpretarComFila(dto, []);
    const falha = await interpretarComFila(dto, credenciais, { criar: () => ({ interpretar: async () => { throw new ErroProvedorInterpretacao("INDISPONIVEL"); } }) });
    expect(semChave).toMatchObject({ origem: "LOCAL", motivoContingencia: "SEM_CHAVE", tentativas: [] });
    expect(falha).toMatchObject({ origem: "LOCAL", motivoContingencia: "TODOS_INDISPONIVEIS" });
    expect(falha.tentativas).toHaveLength(3);
  });

  it("rejeita conteúdo causal ou relacionado a avaliações e segue a fila", async () => {
    const criar = vi.fn().mockReturnValueOnce({ interpretar: async () => ({ insights: [{ ...conteudoValido.insights[0], observacao: "Este método causou melhora e comprovou o resultado." }] }) }).mockReturnValueOnce({ interpretar: async () => conteudoValido });
    const resultado = await interpretarComFila(dto, credenciais, { criar });
    expect(resultado).toMatchObject({ origem: "GEMINI", tentativas: [{ resultado: "RESPOSTA_INVALIDA" }, { resultado: "SUCESSO" }] });
  });

  it("limita solicitações da mesma conta na janela local", () => {
    const controle = new ControleCotaInterpretacoes();
    expect([1, 2, 3, 4, 5].every((indice) => controle.consumir("conta", indice))).toBe(true);
    expect(controle.consumir("conta", 6)).toBe(false);
  });

  it("mapeia autenticação, cota e indisponibilidade sem ler ou expor corpos de erro", async () => {
    const provedores = [criarProvedorGroq, criarProvedorGemini, criarProvedorQwen];
    for (const criar of provedores) {
      for (const [status, codigo] of [[401, "AUTENTICACAO"], [429, "COTA"], [500, "INDISPONIVEL"]] as const) {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("segredo-que-nao-deve-ser-lido", { status })));
        await expect(criar("chave-ficticia").interpretar(dto)).rejects.toMatchObject({ codigo });
        vi.unstubAllGlobals();
      }
    }
  });

  it("envia ao Gemini o enum REST aceito para saída JSON estruturada", async () => {
    const buscar = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(conteudoValido) }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", buscar);

    await expect(criarProvedorGemini("chave-ficticia").interpretar(dto)).resolves.toEqual(conteudoValido);

    const corpo = JSON.parse(String(buscar.mock.calls[0]?.[1]?.body));
    expect(corpo.generationConfig.responseFormat.text.mimeType).toBe("APPLICATION_JSON");
    expect(corpo.generationConfig.thinkingConfig.thinkingLevel).toBe("low");
  });

  it("repete falha transitória do Gemini e usa o modelo principal quando ele recupera", async () => {
    const esperar = vi.fn().mockResolvedValue(undefined);
    const buscar = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(conteudoValido) }] } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", buscar);

    const provedor = criarProvedorGemini("chave-ficticia", "gemini-3.8-flash", 20_000, { esperar, aleatorio: () => 0 });
    await expect(provedor.interpretar(dto)).resolves.toEqual(conteudoValido);

    expect(buscar).toHaveBeenCalledTimes(2);
    expect(String(buscar.mock.calls[0]?.[0])).toContain("gemini-3.8-flash");
    expect(String(buscar.mock.calls[1]?.[0])).toContain("gemini-3.8-flash");
    expect(esperar).toHaveBeenCalledWith(750);
    expect(provedor.obterModeloUtilizado?.()).toBe("gemini-3.8-flash");
  });

  it("usa Gemini 3.7 Flash quando o 3.8 Flash permanece indisponível", async () => {
    const buscar = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(conteudoValido) }] } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", buscar);

    const provedor = criarProvedorGemini("chave-ficticia", "gemini-3.8-flash", 20_000, { esperar: async () => undefined, aleatorio: () => 0 });
    await expect(provedor.interpretar(dto)).resolves.toEqual(conteudoValido);

    expect(buscar).toHaveBeenCalledTimes(3);
    expect(String(buscar.mock.calls[2]?.[0])).toContain("gemini-3.7-flash");
    expect(provedor.obterModeloUtilizado?.()).toBe("gemini-3.7-flash");
  });

  it("testa a chave do Gemini com uma geração mínima", async () => {
    const buscar = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "OK" }] } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", buscar);

    const provedor = criarProvedorGemini("chave-ficticia");
    await expect(provedor.testarConexao?.()).resolves.toBeUndefined();

    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar.mock.calls[0]?.[1]).toMatchObject({ method: "POST" });
    expect(String(buscar.mock.calls[0]?.[1]?.body)).toContain("Responda apenas: OK");
  });

  it("monta DTO exclusivamente com sessões, descrição e referências opacas", () => {
    const sessao: SessaoParaMetricasSessoes = { id: "sessao-secreta", moduloId: "modulo-secreto", descricao: "Estudo de estruturas condicionais", iniciadaEm: new Date("2026-09-01T12:00:00.000Z"), encerradaEm: new Date("2026-09-01T12:30:00.000Z"), duracaoMinutos: 30, situacao: "CONCLUIDA", arquivada: false, dificuldadePercebida: 2, compreensaoPercebida: 4, metodos: ["FEYNMAN"], formatos: ["TEXTO"] };
    const dtoModulo = criarDtoInterpretacaoModulo(calcularMetricasSessoes([sessao], sessao.moduloId), [{ ...sessao, metodos: [{ metodo: "FEYNMAN" }], formatos: [{ formato: "TEXTO" }] }]);
    const serializado = JSON.stringify(dtoModulo);
    expect(dtoModulo).toMatchObject({ quantidadeSessoesValidas: 1, descricoesSessoes: [{ descricao: expect.stringContaining("Estudo de estruturas condicionais") }] });
    expect(serializado).not.toContain("modulo-secreto");
    expect(serializado).not.toContain("sessao-secreta");
    expect(serializado).not.toContain("quantidadeTentativas");
    expect(serializado).not.toContain("taxaAcerto");
  });

  it("inclui trajetória estruturada e apenas evidências já consolidadas na interpretação do módulo", () => {
    const sessao: SessaoParaMetricasSessoes = { id: "s1", moduloId: "m1", descricao: "Revisão de AFD", iniciadaEm: new Date("2026-09-01T12:00:00.000Z"), encerradaEm: new Date("2026-09-01T12:30:00.000Z"), duracaoMinutos: 30, situacao: "CONCLUIDA", arquivada: false, dificuldadePercebida: 3, compreensaoPercebida: 4, metodos: ["FEYNMAN"], formatos: ["TEXTO"] };
    const aprendizagem = {
      base: { sessoes: 1, evidenciasConfirmadas: 2, evidenciasPendentes: 1, conceitos: 1 },
      analises: {
        conceitos: [{ chave: "afd", nome: "AFD", sessoes: 1, evidencias: 2, compreensaoMedia: 4, dificuldadeMedia: 3, desempenhoMedio: 65, estadoPercepcaoEvidencia: "PERCEPCAO_ACIMA_DA_EVIDENCIA", tendencia: "ESTAVEL" }],
        metodosResultados: [{ chave: "FEYNMAN", quantidadeSessoes: 1, quantidadeCompreensoes: 1, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 65, amostraEvidenciasSuficiente: true }],
        formatosResultados: [],
        metodosEvidencias: [{ chave: "FEYNMAN", sessoes: 1, evidenciasPosteriores: 2, desempenhoMedioPosterior: 65, amostraSuficiente: true }],
        formatosEvidencias: [],
        padroes: [{ tipo: "DIVERGENCIA_PERCEPCAO_EVIDENCIA", conceito: "AFD", amostra: 2, texto: "A percepção ficou acima das evidências confirmadas." }],
        evolucaoPercepcaoEvidencia: [],
      },
      evidencias: [{ id: "evento-interno", situacaoConfirmacao: "CONFIRMADA" }, { id: "evento-pendente", situacaoConfirmacao: "PENDENTE" }],
      linhaDoTempo: [
        { id: "evento-pendente", tipo: "AVALIACAO", data: new Date("2026-09-04T00:00:00.000Z"), titulo: "Extração pendente", resumo: "Aguardando confirmação", conceitos: ["AFD"] },
        { id: "evento-interno", tipo: "EXERCICIO", data: new Date("2026-09-03T00:00:00.000Z"), titulo: "Exercício 1", resumo: "Confirmada", conceitos: ["AFD"] },
      ],
    };

    const resultado = criarDtoInterpretacaoModulo(
      calcularMetricasSessoes([sessao], sessao.moduloId),
      [{ ...sessao, metodos: [{ metodo: "FEYNMAN" }], formatos: [{ formato: "TEXTO" }] }],
      aprendizagem as never,
    );

    expect(resultado.aprendizagemModulo).toMatchObject({
      base: { evidenciasConfirmadas: 2 },
      conceitos: [{ conceito: "AFD", desempenhoMedio: 65 }],
      associacoes: [{ tipo: "METODO", amostraSuficiente: true }],
      padroesObjetivos: [{ amostra: 2 }],
      eventosRecentes: [{ tipo: "EXERCICIO", titulo: "Exercício 1" }],
    });
    expect(JSON.stringify(resultado.aprendizagemModulo)).not.toContain("evento-interno");
    expect(JSON.stringify(resultado.aprendizagemModulo)).not.toContain("evidenciasPendentes");
    expect(JSON.stringify(resultado.aprendizagemModulo)).not.toContain("Extração pendente");
  });
});
