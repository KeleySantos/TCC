import { z } from "zod";

export const VERSAO_FORMATO_AVALIACAO_IA_TCC = "avaliacao-ia-tcc-v1";
export const CRITERIOS_AVALIACAO_IA_TCC = ["C1", "C2", "C3", "C4", "C5"] as const;

export const DESCRICOES_CRITERIOS_AVALIACAO_IA_TCC = {
  C1: "Utilização correta das métricas fornecidas pela plataforma",
  C2: "Coerência com o contexto e os registros do usuário",
  C3: "Ausência de informações inventadas",
  C4: "Ausência de classificações fixas sobre o perfil ou a capacidade de aprendizagem do usuário",
  C5: "Reflexões ou recomendações compatíveis com os dados disponíveis",
} as const;

const resultadoCriterio = z.enum(["ATENDIDO", "NAO_ATENDIDO"]);
const criterio = z.object({ resultado: resultadoCriterio.nullable(), justificativa: z.string().max(4_000) });
export const esquemaAvaliacaoManualIaTcc = z.object({
  avaliador: z.string().trim().max(200).nullable(),
  avaliadaEm: z.string().datetime().nullable(),
  criterios: z.object({ C1: criterio, C2: criterio, C3: criterio, C4: criterio, C5: criterio }),
  situacao: z.enum(["PENDENTE", "SATISFATORIA", "INSATISFATORIA"]),
  satisfatoria: z.boolean().nullable(),
});

const validacaoAutomatica = z.object({
  estruturaValida: z.boolean(),
  respostaExterna: z.boolean(),
  provedorEsperado: z.boolean(),
  modeloEsperado: z.boolean(),
  validaParaExperimento: z.boolean(),
  motivos: z.array(z.string()),
});

const geracaoAnterior = z.object({
  geradaEm: z.string().datetime(),
  resposta: z.unknown().nullable(),
  validacaoAutomatica,
  erroOuContingencia: z.string().nullable(),
});

const execucao = z.object({
  id: z.string().min(1),
  cenario: z.enum(["S1", "S2", "S3", "S4", "S5"]),
  nomeCenario: z.string().min(1),
  usuario: z.string().min(1),
  numeroExecucao: z.number().int().min(1).max(3),
  geradaEm: z.string().datetime(),
  provedorPlanejado: z.literal("GROQ"),
  modeloPlanejado: z.string().min(1),
  versaoPrompt: z.string().min(1),
  hashPrompt: z.string().regex(/^[a-f0-9]{64}$/),
  entrada: z.unknown(),
  prompt: z.string().min(1),
  resposta: z.unknown().nullable(),
  origemResposta: z.enum(["GROQ", "LOCAL"]).nullable(),
  modeloEfetivo: z.string().nullable(),
  tentativasProvedores: z.array(z.object({ provedor: z.string(), modelo: z.string(), resultado: z.string() })),
  validacaoAutomatica,
  erroOuContingencia: z.string().nullable(),
  historicoGeracoes: z.array(geracaoAnterior),
  avaliacao: esquemaAvaliacaoManualIaTcc,
});

const resumo = z.object({
  planejadas: z.number().int().nonnegative(),
  geradas: z.number().int().nonnegative(),
  validasExperimento: z.number().int().nonnegative(),
  avaliadas: z.number().int().nonnegative(),
  satisfatorias: z.number().int().nonnegative(),
  insatisfatorias: z.number().int().nonnegative(),
  simuladas: z.number().int().nonnegative(),
  falhasOuContingencias: z.number().int().nonnegative(),
  falhasPorCriterio: z.record(z.enum(CRITERIOS_AVALIACAO_IA_TCC), z.number().int().nonnegative()),
  resultadoGeral: z.enum(["PENDENTE", "SATISFATORIA", "INSATISFATORIA"]),
});

export const esquemaDocumentoAvaliacaoIaTcc = z.object({
  versaoFormato: z.literal(VERSAO_FORMATO_AVALIACAO_IA_TCC),
  experimento: z.object({
    id: z.string().min(1),
    criadoEm: z.string().datetime(),
    atualizadoEm: z.string().datetime(),
    estado: z.enum(["EM_EXECUCAO", "CONCLUIDO"]),
    modo: z.enum(["MOCK_SEM_REDE", "REAL"]),
    provedorPlanejado: z.literal("GROQ"),
    modeloPlanejado: z.string().min(1),
    versaoPrompt: z.string().min(1),
    respostasPlanejadas: z.literal(15),
    regraAprovacaoIndividual: z.literal("4_DE_5_COM_C3_E_C4"),
    regraSucessoGeral: z.literal("14_DE_15"),
  }),
  contagens: z.object({ usuarios: z.number(), modulos: z.number(), sessoes: z.number(), evidencias: z.number() }).nullable(),
  contagensFinais: z.object({ usuarios: z.number(), modulos: z.number(), sessoes: z.number(), evidencias: z.number() }).nullable(),
  controles: z.record(z.string(), z.unknown()),
  observados: z.array(z.record(z.string(), z.unknown())),
  execucoes: z.array(execucao).max(15),
  resumo,
});

export type CriterioAvaliacaoIaTcc = typeof CRITERIOS_AVALIACAO_IA_TCC[number];
export type AvaliacaoManualIaTcc = z.infer<typeof esquemaAvaliacaoManualIaTcc>;
export type ValidacaoAutomaticaIaTcc = z.infer<typeof validacaoAutomatica>;
export type ExecucaoAvaliacaoIaTcc = z.infer<typeof execucao>;
export type DocumentoAvaliacaoIaTcc = z.infer<typeof esquemaDocumentoAvaliacaoIaTcc>;
export type ResumoAvaliacaoIaTcc = z.infer<typeof resumo>;

export function criarAvaliacaoManualPendente(): AvaliacaoManualIaTcc {
  return {
    avaliador: null,
    avaliadaEm: null,
    criterios: Object.fromEntries(CRITERIOS_AVALIACAO_IA_TCC.map((codigo) => [codigo, { resultado: null, justificativa: "" }])) as AvaliacaoManualIaTcc["criterios"],
    situacao: "PENDENTE",
    satisfatoria: null,
  };
}

export function calcularAvaliacaoManual(avaliacao: AvaliacaoManualIaTcc): AvaliacaoManualIaTcc {
  const preenchidos = CRITERIOS_AVALIACAO_IA_TCC.every((codigo) => avaliacao.criterios[codigo].resultado !== null && avaliacao.criterios[codigo].justificativa.trim().length > 0);
  if (!preenchidos) return { ...avaliacao, situacao: "PENDENTE", satisfatoria: null };
  const atendidos = CRITERIOS_AVALIACAO_IA_TCC.filter((codigo) => avaliacao.criterios[codigo].resultado === "ATENDIDO").length;
  const satisfatoria = atendidos >= 4 && avaliacao.criterios.C3.resultado === "ATENDIDO" && avaliacao.criterios.C4.resultado === "ATENDIDO";
  return { ...avaliacao, situacao: satisfatoria ? "SATISFATORIA" : "INSATISFATORIA", satisfatoria };
}

export function calcularResumoAvaliacaoIaTcc(execucoes: ExecucaoAvaliacaoIaTcc[]): ResumoAvaliacaoIaTcc {
  const normalizadas = execucoes.map((item) => ({ ...item, avaliacao: calcularAvaliacaoManual(item.avaliacao) }));
  const validas = normalizadas.filter((item) => item.validacaoAutomatica.validaParaExperimento);
  const avaliadas = validas.filter((item) => item.avaliacao.satisfatoria !== null);
  const satisfatorias = avaliadas.filter((item) => item.avaliacao.satisfatoria).length;
  const insatisfatorias = avaliadas.length - satisfatorias;
  const falhasPorCriterio = Object.fromEntries(CRITERIOS_AVALIACAO_IA_TCC.map((codigo) => [codigo, avaliadas.filter((item) => item.avaliacao.criterios[codigo].resultado === "NAO_ATENDIDO").length])) as ResumoAvaliacaoIaTcc["falhasPorCriterio"];
  const completo = validas.length === 15 && avaliadas.length === 15;
  return {
    planejadas: 15,
    geradas: normalizadas.filter((item) => item.resposta !== null).length,
    validasExperimento: validas.length,
    avaliadas: avaliadas.length,
    satisfatorias,
    insatisfatorias,
    simuladas: normalizadas.filter((item) => item.validacaoAutomatica.motivos.includes("EXECUCAO_SIMULADA")).length,
    falhasOuContingencias: normalizadas.filter((item) => !item.validacaoAutomatica.validaParaExperimento && !item.validacaoAutomatica.motivos.includes("EXECUCAO_SIMULADA")).length,
    falhasPorCriterio,
    resultadoGeral: completo ? (satisfatorias >= 14 ? "SATISFATORIA" : "INSATISFATORIA") : "PENDENTE",
  };
}

export function normalizarDocumentoAvaliacaoIaTcc(documento: DocumentoAvaliacaoIaTcc, agora = new Date()): DocumentoAvaliacaoIaTcc {
  const execucoes = documento.execucoes.map((item) => ({ ...item, avaliacao: calcularAvaliacaoManual(item.avaliacao) }));
  return esquemaDocumentoAvaliacaoIaTcc.parse({ ...documento, experimento: { ...documento.experimento, atualizadoEm: agora.toISOString() }, execucoes, resumo: calcularResumoAvaliacaoIaTcc(execucoes) });
}

function escaparTabela(texto: string) {
  return texto.replaceAll("|", "\\|").replaceAll("\n", " ").trim();
}

function resumoResposta(execucao: ExecucaoAvaliacaoIaTcc) {
  if (!execucao.resposta || typeof execucao.resposta !== "object" || !("insights" in execucao.resposta) || !Array.isArray(execucao.resposta.insights)) return "Sem resposta externa válida.";
  return execucao.resposta.insights.map((item) => item && typeof item === "object" && "observacao" in item && typeof item.observacao === "string" ? item.observacao : "").filter(Boolean).join(" ");
}

export function gerarRelatorioMarkdownAvaliacaoIaTcc(documentoOriginal: DocumentoAvaliacaoIaTcc) {
  const documento = normalizarDocumentoAvaliacaoIaTcc(documentoOriginal);
  const { experimento, resumo: dados } = documento;
  const linhas = [
    "# Relatório da avaliação da Inteligência Artificial — TCC",
    "",
    `Experimento: \`${experimento.id}\`  `,
    `Modo: **${experimento.modo}**  `,
    `Provedor/modelo planejados: **${experimento.provedorPlanejado} / ${experimento.modeloPlanejado}**  `,
    `Versão do prompt: \`${experimento.versaoPrompt}\``,
    "",
    "## Resumo da avaliação",
    "",
    "Foram planejados cinco cenários sintéticos, com três execuções independentes por cenário. Cada resposta é julgada manualmente em C1–C5. Uma resposta é satisfatória quando atende pelo menos quatro critérios, incluindo obrigatoriamente C3 e C4. O resultado geral exige ao menos 14 respostas satisfatórias entre 15 respostas externas válidas e avaliadas.",
    "",
    `- Respostas planejadas: ${dados.planejadas}`,
    `- Respostas geradas: ${dados.geradas}`,
    `- Respostas externas válidas para o experimento: ${dados.validasExperimento}`,
    `- Respostas avaliadas: ${dados.avaliadas}`,
    `- Satisfatórias: ${dados.satisfatorias}`,
    `- Insatisfatórias: ${dados.insatisfatorias}`,
    `- Respostas simuladas, excluídas do resultado: ${dados.simuladas}`,
    `- Falhas ou contingências: ${dados.falhasOuContingencias}`,
    `- Resultado geral: **${dados.resultadoGeral}**`,
    "",
    "## Resultados individuais",
    "",
    "| Cenário | Execução | Origem/modelo | Validade | C1 | C2 | C3 | C4 | C5 | Resultado |",
    "|---|---:|---|---|---|---|---|---|---|---|",
    ...documento.execucoes.map((item) => `| ${item.cenario} | ${item.numeroExecucao} | ${item.origemResposta ?? "—"} / ${item.modeloEfetivo ?? "—"} | ${item.validacaoAutomatica.validaParaExperimento ? "Válida" : "Não válida"} | ${item.avaliacao.criterios.C1.resultado ?? "Pendente"} | ${item.avaliacao.criterios.C2.resultado ?? "Pendente"} | ${item.avaliacao.criterios.C3.resultado ?? "Pendente"} | ${item.avaliacao.criterios.C4.resultado ?? "Pendente"} | ${item.avaliacao.criterios.C5.resultado ?? "Pendente"} | ${item.avaliacao.situacao} |`),
    "",
    "## Respostas e justificativas",
    "",
  ];
  for (const item of documento.execucoes) {
    linhas.push(`### ${item.cenario} — execução ${item.numeroExecucao}`, "", escaparTabela(resumoResposta(item)), "");
    for (const codigo of CRITERIOS_AVALIACAO_IA_TCC) linhas.push(`- **${codigo} — ${DESCRICOES_CRITERIOS_AVALIACAO_IA_TCC[codigo]}:** ${item.avaliacao.criterios[codigo].resultado ?? "Pendente"}. ${item.avaliacao.criterios[codigo].justificativa || "Justificativa ainda não preenchida."}`);
    linhas.push("", `Classificação: **${item.avaliacao.situacao}**.`, "");
  }
  linhas.push("## Falhas por critério", "", ...CRITERIOS_AVALIACAO_IA_TCC.map((codigo) => `- ${codigo}: ${dados.falhasPorCriterio[codigo]}`), "", "## Limitações", "", "- Os dados utilizados são exclusivamente sintéticos.", "- O conjunto contém somente 15 respostas e não permite generalização estatística.", "- Modelos generativos podem variar mesmo quando recebem a mesma entrada.", "- A avaliação C1–C5 é qualitativa e manual.", "- Respostas locais, falhas de API e trocas de modelo não contam como respostas válidas do experimento.", "");
  return linhas.join("\n");
}

function escaparCsv(valor: string | number | boolean | null) {
  const texto = valor === null ? "" : String(valor);
  return `"${texto.replaceAll('"', '""')}"`;
}

export function gerarCsvAvaliacaoIaTcc(documentoOriginal: DocumentoAvaliacaoIaTcc) {
  const documento = normalizarDocumentoAvaliacaoIaTcc(documentoOriginal);
  const cabecalho = ["cenario", "execucao", "usuario", "gerada_em", "origem", "modelo", "valida_experimento", ...CRITERIOS_AVALIACAO_IA_TCC.flatMap((codigo) => [codigo, `justificativa_${codigo}`]), "situacao"];
  const linhas = documento.execucoes.map((item) => [item.cenario, item.numeroExecucao, item.usuario, item.geradaEm, item.origemResposta, item.modeloEfetivo, item.validacaoAutomatica.validaParaExperimento, ...CRITERIOS_AVALIACAO_IA_TCC.flatMap((codigo) => [item.avaliacao.criterios[codigo].resultado, item.avaliacao.criterios[codigo].justificativa]), item.avaliacao.situacao].map(escaparCsv).join(","));
  return [cabecalho.map(escaparCsv).join(","), ...linhas].join("\n");
}
