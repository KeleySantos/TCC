import { FormatoConteudo, MetodoEstudo, NivelEvidencia } from "@/gerado/prisma/enums";

export const VERSAO_ALGORITMO = "metricas-oficiais-v2";
export const MINUTOS_MINIMOS_SESSAO_VALIDA = 5;
export const JANELA_ATRIBUICAO_DIAS = 7;

export type SessaoParaEvidencia = {
  id: string;
  topicoId: string;
  formato: FormatoConteudo;
  encerradaEm: Date | null;
  duracaoMinutos: number | null;
  situacao: "CONCLUIDA" | "ATIVA" | "ABANDONADA" | "INVALIDADA";
  metodo?: MetodoEstudo | null;
  desafioId?: string | null;
  dificuldadePercebida?: number | null;
  compreensaoPercebida?: number | null;
};

export type TentativaParaEvidencia = {
  id: string;
  topicoId: string;
  numeroTentativa?: number;
  concluidaEm: Date | null;
  notaNormalizada: number | null;
};

export type EvidenciaAprendizagem = {
  tentativaId: string;
  numeroTentativa: number | null;
  sessaoId: string;
  topicoId: string;
  formato: FormatoConteudo;
  metodo: MetodoEstudo | null;
  desafioId: string | null;
  dificuldadePercebida: number | null;
  compreensaoPercebida: number | null;
  nota: number;
  observadaEm: Date;
};

export type ResumoFormato = {
  formato: FormatoConteudo;
  quantidadeEvidencias: number;
  mediaNotas: number;
  nivelEvidencia: NivelEvidencia;
};

export type AnaliseTopico = {
  topicoId: string;
  evidencias: EvidenciaAprendizagem[];
  quantidadeExposicoesMistas: number;
  resumosFormatos: ResumoFormato[];
  ultimaNota: number | null;
  tendenciaNota: number | null;
};

function sessaoElegivel(sessao: SessaoParaEvidencia) {
  return sessao.situacao === "CONCLUIDA" && sessao.encerradaEm !== null && (sessao.duracaoMinutos ?? 0) >= MINUTOS_MINIMOS_SESSAO_VALIDA;
}

export function obterNivelEvidencia(quantidade: number, notas: number[] = []): NivelEvidencia {
  if (quantidade < 2) return NivelEvidencia.INSUFICIENTE;
  if (quantidade === 2) return NivelEvidencia.INICIAL;
  if (quantidade <= 4) return NivelEvidencia.MODERADA;
  return Math.max(...notas) - Math.min(...notas) <= 25 ? NivelEvidencia.FORTE : NivelEvidencia.MODERADA;
}

export function construirEvidencias(
  sessoes: SessaoParaEvidencia[],
  tentativas: TentativaParaEvidencia[],
): { evidencias: EvidenciaAprendizagem[]; quantidadeExposicoesMistas: number } {
  const evidencias: EvidenciaAprendizagem[] = [];
  let quantidadeExposicoesMistas = 0;
  const janelaMilissegundos = JANELA_ATRIBUICAO_DIAS * 24 * 60 * 60 * 1000;

  for (const tentativa of tentativas) {
    if (!tentativa.concluidaEm || tentativa.notaNormalizada === null) continue;
    const sessoesElegiveis = sessoes.filter((sessao) => {
      if (!sessaoElegivel(sessao) || sessao.topicoId !== tentativa.topicoId || !sessao.encerradaEm) return false;
      const intervalo = tentativa.concluidaEm!.getTime() - sessao.encerradaEm.getTime();
      return intervalo >= 0 && intervalo <= janelaMilissegundos;
    });
    if (sessoesElegiveis.length !== 1) {
      if (sessoesElegiveis.length > 1) quantidadeExposicoesMistas += 1;
      continue;
    }
    const sessao = sessoesElegiveis[0];
    evidencias.push({
      tentativaId: tentativa.id,
      numeroTentativa: tentativa.numeroTentativa ?? null,
      sessaoId: sessao.id,
      topicoId: tentativa.topicoId,
      formato: sessao.formato,
      metodo: sessao.metodo ?? null,
      desafioId: sessao.desafioId ?? null,
      dificuldadePercebida: sessao.dificuldadePercebida ?? null,
      compreensaoPercebida: sessao.compreensaoPercebida ?? null,
      nota: tentativa.notaNormalizada,
      observadaEm: tentativa.concluidaEm,
    });
  }
  return { evidencias, quantidadeExposicoesMistas };
}

export function resumirEvidencias(evidencias: EvidenciaAprendizagem[]): ResumoFormato[] {
  const agrupadas = new Map<FormatoConteudo, EvidenciaAprendizagem[]>();
  for (const evidencia of evidencias) agrupadas.set(evidencia.formato, [...(agrupadas.get(evidencia.formato) ?? []), evidencia]);

  return [...agrupadas.entries()].map(([formato, itens]) => {
    const notas = itens.map((item) => item.nota);
    return {
      formato,
      quantidadeEvidencias: itens.length,
      mediaNotas: notas.reduce((soma, nota) => soma + nota, 0) / notas.length,
      nivelEvidencia: obterNivelEvidencia(itens.length, notas),
    };
  }).sort((a, b) => b.mediaNotas - a.mediaNotas || b.quantidadeEvidencias - a.quantidadeEvidencias || a.formato.localeCompare(b.formato));
}

export function calcularAnaliseTopico(topicoId: string, sessoes: SessaoParaEvidencia[], tentativas: TentativaParaEvidencia[]): AnaliseTopico {
  const tentativasTopico = tentativas.filter((tentativa) => tentativa.topicoId === topicoId);
  const { evidencias, quantidadeExposicoesMistas } = construirEvidencias(sessoes, tentativasTopico);
  const cronologicas = tentativasTopico
    .filter((tentativa): tentativa is TentativaParaEvidencia & { concluidaEm: Date; notaNormalizada: number } => tentativa.concluidaEm !== null && tentativa.notaNormalizada !== null)
    .sort((a, b) => a.concluidaEm.getTime() - b.concluidaEm.getTime());
  return {
    topicoId,
    evidencias,
    quantidadeExposicoesMistas,
    resumosFormatos: resumirEvidencias(evidencias),
    ultimaNota: cronologicas.at(-1)?.notaNormalizada ?? null,
    tendenciaNota: cronologicas.length >= 2 ? cronologicas.at(-1)!.notaNormalizada - cronologicas[0].notaNormalizada : null,
  };
}
