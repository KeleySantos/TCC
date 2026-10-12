import { describe, expect, it, vi } from "vitest";
import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { gerarRespostaLocal } from "@/dominio/interpretacoes/resposta-local";
import { extrairRespostaEstruturada } from "./contrato-provedores";
import { montarCatalogoProvedores } from "./catalogo-provedores";
import { interpretarComFila, prepararDtoParaProvedor } from "./interpretacoes";

const insightValido = {
  insights: [{
    tipo: "ESTRATEGIA",
    titulo: "Uma hipótese para observar",
    observacao: "Nas sessões analisadas, recuperação ativa apareceu junto das maiores compreensões percebidas.",
    resumoEvidencias: "Foram oito sessões com esse método.",
    perguntaReflexiva: "Você percebeu alguma diferença no esforço para lembrar sem consultar o material?",
    experimentoSugerido: "Teste o método novamente em um conteúdo de dificuldade parecida.",
    confianca: "MODERADA",
  }],
};

function dtoBase(alteracoes: Partial<DtoInterpretacao> = {}): DtoInterpretacao {
  return {
    escopo: "MODULO",
    versaoAlgoritmo: "metricas-sessoes-v1",
    quantidadeModulos: 1,
    quantidadeSessoesValidas: 2,
    minutosValidos: 40,
    periodo: { inicio: "2026-09-01T12:00:00.000Z", fim: "2026-09-02T12:00:00.000Z" },
    modulos: [],
    evolucaoSemanal: [],
    descricoesSessoes: [],
    limitacoes: ["Dados observacionais."],
    ...alteracoes,
  };
}

describe("contrato humanizado dos insights", () => {
  it("aceita JSON puro e JSON cercado por Markdown", () => {
    expect(extrairRespostaEstruturada(JSON.stringify(insightValido))).toEqual(insightValido);
    expect(extrairRespostaEstruturada(`\n\`\`\`json\n${JSON.stringify(insightValido)}\n\`\`\`\n`)).toEqual(insightValido);
  });

  it.each(["", "texto sem JSON", "{invalido", JSON.stringify({ insights: [{ titulo: "Incompleto" }] })])("rejeita resposta vazia, inválida ou incompleta", (resposta) => {
    expect(extrairRespostaEstruturada(resposta)).toBeNull();
  });

  it("não chama provedor quando não existem sessões", async () => {
    const criar = vi.fn();
    const resultado = await interpretarComFila(dtoBase({ quantidadeSessoesValidas: 0, minutosValidos: 0 }), [{ provedor: "GROQ", modelo: "modelo", chave: "segredo" }], { criar });
    expect(criar).not.toHaveBeenCalled();
    expect(resultado).toMatchObject({ origem: "LOCAL", motivoContingencia: "DADOS_INSUFICIENTES" });
  });

  it("compacta muitas descrições sem remover métricas calculadas", () => {
    const descricoesSessoes = Array.from({ length: 40 }, (_, indice) => ({
      referencia: `Módulo 1, sessão ${indice + 1}`,
      descricao: `<descricoes_nao_confiaveis>${"conteúdo ".repeat(100)}</descricoes_nao_confiaveis>`,
      iniciadaEm: new Date(2026, 0, indice + 1).toISOString(),
      duracaoMinutos: 30,
      metodos: ["Recuperação ativa"],
      formatos: ["Texto"],
      dificuldadePercebida: 3,
      compreensaoPercebida: 4,
    }));
    const preparado = prepararDtoParaProvedor(dtoBase({ quantidadeSessoesValidas: 40, minutosValidos: 1_200, descricoesSessoes }));
    expect(preparado.descricoesSessoes.length).toBeLessThanOrEqual(10);
    expect(preparado.quantidadeSessoesValidas).toBe(40);
    expect(JSON.stringify(preparado).length).toBeLessThan(12_000);
  });

  it("trata poucos dados promissores como hipótese de baixa confiança", () => {
    const resultado = gerarRespostaLocal(dtoBase({
      quantidadeSessoesValidas: 2,
      modulos: [{ referencia: "Módulo 1", quantidadeSessoesValidas: 2, minutosValidos: 40, mediaMinutos: 20, diasComEstudo: 2, maiorSequenciaDias: 1, percepcoes: { amostra: 2, dificuldadeMedia: 2, compreensaoMedia: 4.8 }, metodos: [{ contexto: "Feynman", quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4.8, minutosAssociados: 40, nivelAmostra: "INICIAL" }], formatos: [] }],
    }), "TODOS_INDISPONIVEIS");
    expect(resultado.insights[0]).toMatchObject({ confianca: "BAIXA" });
    expect(resultado.insights[0].observacao).toMatch(/pouc|inicial|hipótese/i);
    expect(resultado.insights[0].observacao).not.toMatch(/melhor método|mais eficaz/i);
  });

  it("prioriza diferença entre percepção alta e evidência baixa sem diagnosticar", () => {
    const resultado = gerarRespostaLocal(dtoBase({
      aprendizagemModulo: {
        base: { sessoes: 5, evidenciasValidas: 3, conceitos: 1 },
        conceitos: [{ conceito: "Funções", sessoes: 5, evidencias: 3, compreensaoMedia: 4.6, desempenhoMedio: 58, relacaoPercepcaoEvidencia: "POSSIVEL_SUPERESTIMACAO", tendencia: "ESTAVEL" }],
        associacoes: [], padroesObjetivos: [], eventosRecentes: [], evolucaoPercepcaoEvidencia: [],
      },
    }), "TODOS_INDISPONIVEIS");
    expect(resultado.insights[0]).toMatchObject({ tipo: "CALIBRACAO" });
    expect(resultado.insights[0].observacao).toMatch(/diferença|percepção/i);
    expect(resultado.insights[0].observacao).not.toMatch(/não entende|diagnóst/i);
  });

  it("descreve estratégia muito usada associada a resultado baixo sem culpar o método", () => {
    const resultado = gerarRespostaLocal(dtoBase({ aprendizagemModulo: {
      base: { sessoes: 10, evidenciasValidas: 6, conceitos: 1 }, conceitos: [],
      associacoes: [{ tipo: "METODO", contexto: "RELEITURA", sessoes: 10, compreensoes: 8, compreensaoMedia: 3.2, evidenciasPosteriores: 6, desempenhoMedioPosterior: 54, amostraSuficiente: true }],
      padroesObjetivos: [], eventosRecentes: [], evolucaoPercepcaoEvidencia: [],
    } }), "TODOS_INDISPONIVEIS");
    expect(resultado.insights[0]).toMatchObject({ tipo: "ESTRATEGIA" });
    expect(resultado.insights[0].observacao).toMatch(/frequ|resultado|associad/i);
    expect(resultado.insights[0].observacao).not.toMatch(/prejudica|ineficaz|caus/i);
  });

  it("mantém Bloom e mudança temporal como observações, sem atribuir causa", () => {
    const resultado = gerarRespostaLocal(dtoBase({
      bloom: { compreender: 88, aplicar: 73, analisar: 48 },
      evolucaoAprendizagem: [52, 61, 72, 81],
    }), "TODOS_INDISPONIVEIS");
    const texto = resultado.insights.map((item) => item.observacao).join(" ");
    expect(texto).toMatch(/analis|evolu|melhorando/i);
    expect(texto).not.toMatch(/caus|prova|você não entende/i);
  });

  it("permite escolher Gemini ou Groq como provedor principal", () => {
    vi.stubEnv("AI_PRIMARY_PROVIDER", "gemini");
    expect(montarCatalogoProvedores()[0].provedor).toBe("GEMINI");
    vi.stubEnv("AI_PRIMARY_PROVIDER", "groq");
    expect(montarCatalogoProvedores()[0].provedor).toBe("GROQ");
    vi.unstubAllEnvs();
  });
});
