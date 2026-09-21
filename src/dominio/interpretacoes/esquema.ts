import { z } from "zod";

const textoCurto = z.string().trim().min(3).max(420);

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
    metodos: Array<{ contexto: string; quantidadeSessoes: number; minutosAssociados: number }>;
    formatos: Array<{ contexto: string; quantidadeSessoes: number; minutosAssociados: number }>;
  }>;
  evolucaoSemanal: Array<{ periodoInicio: string; periodoFim: string; quantidadeSessoes: number; minutosTotais: number; diasComEstudo: number }>;
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
  limitacoes: string[];
};

export const esquemaConteudoInterpretacao = z.object({
  padroesObservados: z.array(textoCurto).min(1).max(3),
  feedbacks: z.array(textoCurto).min(1).max(3),
  conselhos: z.array(textoCurto).min(1).max(3),
  perguntasReflexao: z.array(textoCurto).min(1).max(3),
});

export type ConteudoInterpretacao = z.infer<typeof esquemaConteudoInterpretacao>;
export type OrigemInterpretacao = "GROQ" | "GEMINI" | "QWEN" | "LOCAL";
export type MotivoContingencia = "SEM_CHAVE" | "COTA_LOCAL" | "ENTRADA_EXCEDIDA" | "TODOS_INDISPONIVEIS" | "RESPOSTA_INVALIDA" | null;
export type CodigoTentativaProvedor = "SUCESSO" | "TEMPO_ESGOTADO" | "COTA" | "AUTENTICACAO" | "INDISPONIVEL" | "RESPOSTA_INVALIDA";

export type TentativaProvedor = {
  provedor: Exclude<OrigemInterpretacao, "LOCAL">;
  modelo: string;
  resultado: CodigoTentativaProvedor;
};

export type InterpretacaoGerada = ConteudoInterpretacao & {
  origem: OrigemInterpretacao;
  modelo: string | null;
  motivoContingencia: MotivoContingencia;
  tentativas: TentativaProvedor[];
  contexto: Pick<DtoInterpretacao, "versaoAlgoritmo" | "quantidadeModulos" | "quantidadeSessoesValidas" | "minutosValidos" | "periodo">;
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
  /nota(s)?\b/i,
  /avaliaç/i,
  /tópico(s)?\b/i,
];

export function validarConteudoInterpretacao(valor: unknown): ConteudoInterpretacao | null {
  const resultado = esquemaConteudoInterpretacao.safeParse(valor);
  if (!resultado.success) return null;
  const textos = Object.values(resultado.data).flat();
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
    limitacao: "Esta interpretação descreve apenas as sessões observadas. Ela não calcula métricas, não prova causalidade, não produz avaliações e não define um estilo de aprendizagem.",
  };
}
