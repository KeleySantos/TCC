import type { RecomendacaoMaterial } from "@/dominio/analises/recomendacoes-materiais";
import { z } from "zod";

const textoTitulo = z.string().trim().min(3).max(100);
const textoInsight = z.string().trim().min(12).max(700);
const textoOpcional = z.string().trim().min(3).max(360).nullable();

export type DtoInterpretacao = {
  escopo: "PESSOAL" | "MODULO" | "MEMBRO_SALA";
  versaoAlgoritmo: string;
  quantidadeModulos: number;
  quantidadeSessoesValidas: number;
  minutosValidos: number;
  periodo: { inicio: string | null; fim: string | null };
  modulos: Array<{
    referencia: string;
    quantidadeSessoesValidas: number;
    minutosValidos: number;
    mediaMinutos: number | null;
    diasComEstudo: number;
    maiorSequenciaDias: number;
    percepcoes: { amostra: number; dificuldadeMedia: number | null; compreensaoMedia: number | null };
    metodos: Array<{ contexto: string; quantidadeSessoes: number; quantidadeCompreensoes: number; compreensaoMedia: number | null; minutosAssociados: number; nivelAmostra: string }>;
    formatos: Array<{ contexto: string; quantidadeSessoes: number; quantidadeCompreensoes: number; compreensaoMedia: number | null; minutosAssociados: number; nivelAmostra: string }>;
  }>;
  evolucaoSemanal: Array<{
    periodoInicio: string;
    periodoFim: string;
    quantidadeSessoes: number;
    minutosTotais: number;
    diasComEstudo: number;
    quantidadePercepcoes?: number;
    dificuldadeMedia?: number | null;
    compreensaoMedia?: number | null;
  }>;
  descricoesSessoes: Array<{
    referencia: string;
    descricao: string;
    iniciadaEm: string;
    duracaoMinutos: number;
    metodos: string[];
    formatos: string[];
    dificuldadePercebida: number | null;
    compreensaoPercebida: number | null;
  }>;
  recomendacoes?: RecomendacaoMaterial[];
  aprendizagemModulo?: {
    base: { sessoes: number; evidenciasValidas: number; conceitos: number };
    conceitos: Array<{ conceito: string; sessoes: number; evidencias: number; compreensaoMedia: number | null; desempenhoMedio: number | null; relacaoPercepcaoEvidencia: string; tendencia: string }>;
    associacoes: Array<{ tipo: "METODO" | "FORMATO"; contexto: string; sessoes: number; compreensoes: number; compreensaoMedia: number | null; evidenciasPosteriores: number; desempenhoMedioPosterior: number | null; amostraSuficiente: boolean }>;
    padroesObjetivos: Array<{ tipo: string; conceito: string; amostra: number; texto: string }>;
    eventosRecentes: Array<{ tipo: string; data: string; titulo: string; conceitos: string[] }>;
    evolucaoPercepcaoEvidencia: Array<{ periodoInicio: string; quantidadePercepcoes: number; compreensaoMedia: number | null; quantidadeEvidencias: number; desempenhoMedio: number | null }>;
  };
  bloom?: Partial<Record<"lembrar" | "compreender" | "aplicar" | "analisar" | "avaliar" | "criar", number>>;
  evolucaoAprendizagem?: number[];
  limitacoes: string[];
};

export const esquemaInsightAprendizagem = z.object({
  tipo: z.enum(["OBSERVACAO", "CALIBRACAO", "ESTRATEGIA", "PROGRESSO", "DIFICULDADE", "EXPERIMENTO"]),
  titulo: textoTitulo,
  observacao: textoInsight,
  resumoEvidencias: textoOpcional,
  perguntaReflexiva: textoOpcional,
  experimentoSugerido: textoOpcional,
  confianca: z.enum(["BAIXA", "MODERADA", "FORTE"]),
});

export const esquemaConteudoInterpretacao = z.object({ insights: z.array(esquemaInsightAprendizagem).min(1).max(3) });

export type InsightAprendizagem = z.infer<typeof esquemaInsightAprendizagem>;
export type ConteudoInterpretacao = z.infer<typeof esquemaConteudoInterpretacao>;
export type OrigemInterpretacao = "GROQ" | "LOCAL";
export type MotivoContingencia = "SEM_CHAVE" | "COTA_LOCAL" | "ENTRADA_EXCEDIDA" | "TODOS_INDISPONIVEIS" | "RESPOSTA_INVALIDA" | "DADOS_INSUFICIENTES" | null;
export type CodigoTentativaProvedor = "SUCESSO" | "TEMPO_ESGOTADO" | "COTA" | "AUTENTICACAO" | "MODELO_INVALIDO" | "REQUISICAO_INVALIDA" | "REDE" | "INDISPONIVEL" | "RESPOSTA_INVALIDA";

export type TentativaProvedor = { provedor: Exclude<OrigemInterpretacao, "LOCAL">; modelo: string; resultado: CodigoTentativaProvedor };

export type InterpretacaoGerada = ConteudoInterpretacao & {
  origem: OrigemInterpretacao;
  modelo: string | null;
  motivoContingencia: MotivoContingencia;
  tentativas: TentativaProvedor[];
  contexto: Pick<DtoInterpretacao, "versaoAlgoritmo" | "quantidadeModulos" | "quantidadeSessoesValidas" | "minutosValidos" | "periodo">;
  limitacao: string;
  padroesObservados: string[];
  feedbacks: string[];
  conselhos: string[];
  perguntasReflexao: string[];
};

const expressoesProibidas = [
  /você aprende melhor/i, /melhor (método|formato)/i, /mais (eficaz|eficiente)/i,
  /estilo de aprendizagem/i, /estilo fixo/i, /causou/i, /fez você aprender/i,
  /comprov(a|ou|ado)/i, /diagnóstic/i, /garante/i, /você (não entende|é fraco)/i,
];

export function validarConteudoInterpretacao(valor: unknown): ConteudoInterpretacao | null {
  const resultado = esquemaConteudoInterpretacao.safeParse(valor);
  if (!resultado.success) return null;
  const textos = resultado.data.insights.flatMap((insight) => [insight.titulo, insight.observacao, insight.resumoEvidencias, insight.perguntaReflexiva, insight.experimentoSugerido]).filter((item): item is string => Boolean(item));
  return textos.some((texto) => expressoesProibidas.some((expressao) => expressao.test(texto))) ? null : resultado.data;
}

export function montarInterpretacao(conteudo: ConteudoInterpretacao, origem: OrigemInterpretacao, dto: DtoInterpretacao, opcoes: { modelo?: string | null; motivo?: MotivoContingencia; tentativas?: TentativaProvedor[] } = {}): InterpretacaoGerada {
  return {
    ...conteudo,
    origem,
    modelo: opcoes.modelo ?? null,
    motivoContingencia: opcoes.motivo ?? null,
    tentativas: opcoes.tentativas ?? [],
    contexto: { versaoAlgoritmo: dto.versaoAlgoritmo, quantidadeModulos: dto.quantidadeModulos, quantidadeSessoesValidas: dto.quantidadeSessoesValidas, minutosValidos: dto.minutosValidos, periodo: dto.periodo },
    limitacao: "Esta interpretação usa apenas os registros observados. Ela não calcula métricas, não prova causalidade, não faz diagnóstico e não define como você aprende.",
    padroesObservados: conteudo.insights.map((item) => item.observacao),
    feedbacks: conteudo.insights.flatMap((item) => item.resumoEvidencias ?? []),
    conselhos: conteudo.insights.flatMap((item) => item.experimentoSugerido ?? []),
    perguntasReflexao: conteudo.insights.flatMap((item) => item.perguntaReflexiva ?? []),
  };
}
