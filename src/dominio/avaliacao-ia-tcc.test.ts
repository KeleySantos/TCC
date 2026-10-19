import { describe, expect, it } from "vitest";
import {
  calcularAvaliacaoManual,
  calcularResumoAvaliacaoIaTcc,
  criarAvaliacaoManualPendente,
  gerarCsvAvaliacaoIaTcc,
  gerarRelatorioMarkdownAvaliacaoIaTcc,
  esquemaDocumentoAvaliacaoIaTcc,
  type DocumentoAvaliacaoIaTcc,
  type ExecucaoAvaliacaoIaTcc,
} from "./avaliacao-ia-tcc";

function avaliacao(resultados: Array<"ATENDIDO" | "NAO_ATENDIDO">) {
  const base = criarAvaliacaoManualPendente();
  (["C1", "C2", "C3", "C4", "C5"] as const).forEach((codigo, indice) => {
    base.criterios[codigo] = { resultado: resultados[indice], justificativa: `Justificativa ${codigo}` };
  });
  return calcularAvaliacaoManual(base);
}

function execucao(indice: number, opcoes: { valida?: boolean; avaliacao?: ReturnType<typeof avaliacao> } = {}): ExecucaoAvaliacaoIaTcc {
  const valida = opcoes.valida ?? true;
  return {
    id: `S${Math.floor(indice / 3) + 1}-${indice % 3 + 1}`,
    cenario: `S${Math.floor(indice / 3) + 1}` as ExecucaoAvaliacaoIaTcc["cenario"],
    nomeCenario: "Cenário sintético",
    usuario: "usuario.sintetico",
    numeroExecucao: indice % 3 + 1,
    geradaEm: "2026-10-12T12:00:00.000Z",
    provedorPlanejado: "GROQ",
    modeloPlanejado: "modelo-teste",
    versaoPrompt: "prompt-v1",
    hashPrompt: "a".repeat(64),
    entrada: { quantidadeSessoesValidas: 10 },
    prompt: "Prompt sintético completo",
    resposta: { insights: [{ observacao: "Interpretação sintética para conferência manual." }] },
    origemResposta: valida ? "GROQ" : "LOCAL",
    modeloEfetivo: valida ? "modelo-teste" : null,
    tentativasProvedores: [],
    validacaoAutomatica: { estruturaValida: true, respostaExterna: valida, provedorEsperado: valida, modeloEsperado: valida, validaParaExperimento: valida, motivos: valida ? [] : ["CONTINGENCIA_LOCAL"] },
    erroOuContingencia: valida ? null : "TODOS_INDISPONIVEIS",
    historicoGeracoes: [],
    avaliacao: opcoes.avaliacao ?? criarAvaliacaoManualPendente(),
  };
}

function documento(execucoes: ExecucaoAvaliacaoIaTcc[]): DocumentoAvaliacaoIaTcc {
  return {
    versaoFormato: "avaliacao-ia-tcc-v1",
    experimento: { id: "experimento-teste", criadoEm: "2026-10-12T12:00:00.000Z", atualizadoEm: "2026-10-12T12:00:00.000Z", estado: "CONCLUIDO", modo: "REAL", provedorPlanejado: "GROQ", modeloPlanejado: "modelo-teste", versaoPrompt: "prompt-v1", respostasPlanejadas: 15, regraAprovacaoIndividual: "4_DE_5_COM_C3_E_C4", regraSucessoGeral: "14_DE_15" },
    contagens: { usuarios: 5, modulos: 15, sessoes: 150, evidencias: 150 },
    contagensFinais: { usuarios: 5, modulos: 15, sessoes: 152, evidencias: 151 },
    controles: {},
    observados: [],
    execucoes,
    resumo: calcularResumoAvaliacaoIaTcc(execucoes),
  };
}

describe("avaliação manual da IA do TCC", () => {
  it("aceita somente Groq como provedor planejado da avaliação real", () => {
    const legado = documento([execucao(0)]) as unknown as Record<string, unknown>;
    legado.experimento = { ...(legado.experimento as object), provedorPlanejado: "PROVEDOR_REMOVIDO" };

    expect(esquemaDocumentoAvaliacaoIaTcc.safeParse(legado).success).toBe(false);
  });

  it("mantém resposta parcial pendente", () => {
    const parcial = criarAvaliacaoManualPendente();
    parcial.criterios.C1 = { resultado: "ATENDIDO", justificativa: "A métrica citada confere." };
    expect(calcularAvaliacaoManual(parcial)).toMatchObject({ situacao: "PENDENTE", satisfatoria: null });
  });

  it("exige quatro critérios e torna C3 e C4 obrigatórios", () => {
    expect(avaliacao(["ATENDIDO", "ATENDIDO", "ATENDIDO", "ATENDIDO", "NAO_ATENDIDO"])).toMatchObject({ situacao: "SATISFATORIA", satisfatoria: true });
    expect(avaliacao(["ATENDIDO", "ATENDIDO", "NAO_ATENDIDO", "ATENDIDO", "ATENDIDO"])).toMatchObject({ situacao: "INSATISFATORIA", satisfatoria: false });
    expect(avaliacao(["ATENDIDO", "ATENDIDO", "ATENDIDO", "NAO_ATENDIDO", "ATENDIDO"])).toMatchObject({ situacao: "INSATISFATORIA", satisfatoria: false });
  });

  it("só conclui o resultado geral com 15 respostas externas válidas e avaliadas", () => {
    const aprovada = avaliacao(["ATENDIDO", "ATENDIDO", "ATENDIDO", "ATENDIDO", "ATENDIDO"]);
    const reprovada = avaliacao(["NAO_ATENDIDO", "NAO_ATENDIDO", "ATENDIDO", "ATENDIDO", "ATENDIDO"]);
    expect(calcularResumoAvaliacaoIaTcc(Array.from({ length: 14 }, (_, indice) => execucao(indice, { avaliacao: aprovada })))).toMatchObject({ resultadoGeral: "PENDENTE", validasExperimento: 14 });
    expect(calcularResumoAvaliacaoIaTcc(Array.from({ length: 15 }, (_, indice) => execucao(indice, { avaliacao: indice === 14 ? reprovada : aprovada })))).toMatchObject({ resultadoGeral: "SATISFATORIA", satisfatorias: 14, insatisfatorias: 1 });
    expect(calcularResumoAvaliacaoIaTcc(Array.from({ length: 15 }, (_, indice) => execucao(indice, { valida: indice !== 14, avaliacao: aprovada })))).toMatchObject({ resultadoGeral: "PENDENTE", falhasOuContingencias: 1 });
  });

  it("exporta Markdown e CSV sem antecipar resultado pendente", () => {
    const arquivo = documento([execucao(0)]);
    const markdown = gerarRelatorioMarkdownAvaliacaoIaTcc(arquivo);
    const csv = gerarCsvAvaliacaoIaTcc(arquivo);
    expect(markdown).toContain("Resultado geral: **PENDENTE**");
    expect(markdown).toContain("dados utilizados são exclusivamente sintéticos");
    expect(csv).toContain('"justificativa_C3"');
    expect(csv).toContain('"S1","1"');
  });
});
