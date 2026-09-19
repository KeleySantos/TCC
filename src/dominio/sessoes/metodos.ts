import { MetodoEstudo } from "@/gerado/prisma/enums";

/** Métodos introduzidos na Entrega B e disponíveis para novos registros. */
export const METODOS_ESTUDO = [
  { valor: MetodoEstudo.FEYNMAN, rotulo: "Técnica de Feynman" },
  { valor: MetodoEstudo.RECUPERACAO_ATIVA, rotulo: "Recuperação ativa" },
  { valor: MetodoEstudo.REPETICAO_ESPACADA, rotulo: "Repetição espaçada" },
  { valor: MetodoEstudo.POMODORO, rotulo: "Pomodoro" },
  { valor: MetodoEstudo.INTERCALAMENTO, rotulo: "Intercalamento" },
  { valor: MetodoEstudo.PRATICA_DISTRIBUIDA, rotulo: "Prática distribuída" },
] as const;

/** Valores anteriores permanecem apenas para que o histórico sintético siga legível. */
const METODOS_HISTORICOS = [
  { valor: MetodoEstudo.LEITURA_ATIVA, rotulo: "Leitura ativa" },
  { valor: MetodoEstudo.VIDEO_GUIADO, rotulo: "Vídeo guiado" },
  { valor: MetodoEstudo.RESUMO, rotulo: "Resumo" },
  { valor: MetodoEstudo.EXERCICIO, rotulo: "Exercício" },
  { valor: MetodoEstudo.REVISAO, rotulo: "Revisão" },
  { valor: MetodoEstudo.OUTRO, rotulo: "Outro método" },
] as const;

export type MetodoEstudoPessoal = typeof METODOS_ESTUDO[number]["valor"];

export function metodoDisponivelParaNovoRegistro(metodo: string): metodo is MetodoEstudoPessoal {
  return METODOS_ESTUDO.some((item) => item.valor === metodo);
}

export function formatarMetodoEstudo(metodo: string | null | undefined) {
  return [...METODOS_ESTUDO, ...METODOS_HISTORICOS].find((item) => item.valor === metodo)?.rotulo ?? "Não informado";
}
