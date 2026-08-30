import { FormatoConteudo, NivelEvidencia } from "@/gerado/prisma/enums";
import { formatarFormato } from "@/biblioteca/formatacao";
import { VERSAO_ALGORITMO, type AnaliseTopico, type ResumoFormato } from "@/dominio/analises/evidencias";

export type CandidatoRecomendacao = {
  id: string;
  formato: FormatoConteudo;
  titulo: string;
  aprovadoProfessor: boolean;
};

export type RecomendacaoGerada = {
  recursoId: string | null;
  formatoSugerido: FormatoConteudo;
  nivelEvidencia: NivelEvidencia;
  quantidadeEvidencias: number;
  notaComparada: number | null;
  justificativa: string;
  versaoAlgoritmo: string;
};

function escolherCandidato(candidatos: CandidatoRecomendacao[], formato?: FormatoConteudo) {
  return candidatos.filter((candidato) => !formato || candidato.formato === formato)
    .sort((a, b) => Number(b.aprovadoProfessor) - Number(a.aprovadoProfessor) || a.titulo.localeCompare(b.titulo))[0] ?? null;
}

function escolherMelhorResumo(resumos: ResumoFormato[]) {
  return resumos.find((resumo) => resumo.nivelEvidencia !== NivelEvidencia.INSUFICIENTE) ?? resumos[0] ?? null;
}

export function gerarRecomendacao(analise: AnaliseTopico, candidatos: CandidatoRecomendacao[]): RecomendacaoGerada | null {
  if (candidatos.length === 0) return null;
  const formatosObservados = new Set(analise.resumosFormatos.map((resumo) => resumo.formato));
  const exploracao = candidatos.find((candidato) => !formatosObservados.has(candidato.formato) && candidato.aprovadoProfessor)
    ?? candidatos.find((candidato) => !formatosObservados.has(candidato.formato));
  const melhor = escolherMelhorResumo(analise.resumosFormatos);

  if (!melhor || analise.evidencias.length < 2) {
    const candidato = exploracao ?? escolherCandidato(candidatos);
    if (!candidato) return null;
    return {
      recursoId: candidato.id,
      formatoSugerido: candidato.formato,
      nivelEvidencia: NivelEvidencia.INSUFICIENTE,
      quantidadeEvidencias: analise.evidencias.length,
      notaComparada: null,
      versaoAlgoritmo: VERSAO_ALGORITMO,
      justificativa: `Ainda não há dados suficientes para apontar uma estratégia com mais evidência neste tópico. Experimente ${formatarFormato(candidato.formato).toLowerCase()} e avalie novamente seu desempenho.`,
    };
  }

  const candidato = escolherCandidato(candidatos, melhor.formato) ?? exploracao ?? escolherCandidato(candidatos);
  if (!candidato) return null;
  const comparacao = analise.resumosFormatos.find((resumo) => resumo.formato !== melhor.formato);
  const textoComparacao = comparacao ? `, em comparação com ${Math.round(comparacao.mediaNotas)}% após ${formatarFormato(comparacao.formato).toLowerCase()}` : "";
  return {
    recursoId: candidato.id,
    formatoSugerido: candidato.formato,
    nivelEvidencia: melhor.nivelEvidencia,
    quantidadeEvidencias: melhor.quantidadeEvidencias,
    notaComparada: melhor.mediaNotas,
    versaoAlgoritmo: VERSAO_ALGORITMO,
    justificativa: `Em ${melhor.quantidadeEvidencias} observações válidas deste tópico, ${formatarFormato(melhor.formato).toLowerCase()} foi seguido por média de ${Math.round(melhor.mediaNotas)}%${textoComparacao}. Isso descreve somente os dados observados até agora; experimente ${candidato.titulo} e reavalie seu resultado.`,
  };
}
