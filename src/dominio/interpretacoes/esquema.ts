import { z } from "zod";

const textoCurto = z.string().trim().min(3).max(420);

export type DtoInterpretacao = {
  escopo: "PESSOAL" | "MODULO";
  versaoAlgoritmo: string;
  quantidadeModulos: number;
  quantidadeTentativas: number;
  minutosValidos: number;
  periodo: { inicio: string | null; fim: string | null };
  modulos: Array<{
    referencia: string;
    quantidadeTentativas: number;
    taxaAcerto: number | null;
    mediaNotas: number | null;
    minutosValidos: number;
    exposicoesMistas: number;
    observacoesPercepcao: number;
  }>;
  recorrencias: Array<{ tipo: "FORMATO" | "METODO"; contexto: string; quantidadeModulos: number; quantidadeEvidencias: number; mediaNotas: number }>;
  quantidadeTopicosComEvidencia: number;
  evolucaoTaxaMediaTopicos: Array<{
    periodoInicio: string;
    periodoFim: string;
    mediaTaxasAcertoTopicos: number;
    quantidadeTopicosComEvidencia: number;
    quantidadeTentativas: number;
    respostasCorretas: number;
    totalQuestoes: number;
  }>;
  dificuldadeAtualEstimada: {
    status: "ALTA" | "INTERMEDIARIA" | "BAIXA" | null;
    taxaReferencia: number | null;
    quantidadePeriodos: number;
    amostraReduzida: boolean;
  } | null;
  limitacoes: string[];
};

export const esquemaConteudoInterpretacao = z.object({
  padroesObservados: z.array(textoCurto).min(1).max(3),
  feedbacks: z.array(textoCurto).min(1).max(3),
  conselhos: z.array(textoCurto).min(1).max(3),
  perguntasReflexao: z.array(textoCurto).min(1).max(3),
});

export type ConteudoInterpretacao = z.infer<typeof esquemaConteudoInterpretacao>;
export type OrigemInterpretacao = "GEMINI" | "LOCAL";
export type MotivoContingencia = "SEM_CHAVE" | "COTA" | "TEMPO_ESGOTADO" | "FALHA_EXTERNA" | "RESPOSTA_INVALIDA" | null;

export type InterpretacaoGerada = ConteudoInterpretacao & {
  origem: OrigemInterpretacao;
  motivoContingencia: MotivoContingencia;
  contexto: Pick<DtoInterpretacao, "versaoAlgoritmo" | "quantidadeModulos" | "quantidadeTentativas" | "minutosValidos" | "periodo">;
  limitacao: string;
};

const expressoesProibidas = [
  /você aprende melhor/i,
  /melhor formato/i,
  /estilo de aprendizagem/i,
  /estilo fixo/i,
  /causou/i,
  /fez você aprender/i,
  /comprov(a|ou|ado)/i,
  /diagnóstic/i,
  /garante/i,
];

export function validarConteudoInterpretacao(valor: unknown): ConteudoInterpretacao | null {
  const resultado = esquemaConteudoInterpretacao.safeParse(valor);
  if (!resultado.success) return null;
  const textos = Object.values(resultado.data).flat();
  return textos.some((texto) => expressoesProibidas.some((expressao) => expressao.test(texto))) ? null : resultado.data;
}

export function montarInterpretacao(conteudo: ConteudoInterpretacao, origem: OrigemInterpretacao, dto: DtoInterpretacao, motivoContingencia: MotivoContingencia): InterpretacaoGerada {
  return {
    ...conteudo,
    origem,
    motivoContingencia,
    contexto: { versaoAlgoritmo: dto.versaoAlgoritmo, quantidadeModulos: dto.quantidadeModulos, quantidadeTentativas: dto.quantidadeTentativas, minutosValidos: dto.minutosValidos, periodo: dto.periodo },
    limitacao: "Esta interpretação descreve apenas os indicadores observados. Ela não calcula métricas, não prova causalidade e não define um estilo de aprendizagem.",
  };
}
