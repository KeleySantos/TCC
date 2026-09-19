import { MetodoEstudo, NivelEvidencia } from "@/gerado/prisma/enums";
import { construirEvidencias, obterNivelEvidencia, type EvidenciaAprendizagem } from "./evidencias";
import type { SessaoParaMetricas, TentativaParaMetricas } from "./metricas-modulo";

export const VERSAO_COMPARACAO_DESAFIO = "comparacao-desafio-v1";

export type DesafioParaComparacao = {
  id: string;
  moduloId: string;
  metodo: MetodoEstudo;
};

export type GrupoComparacaoDesafio = {
  quantidadeEvidencias: number;
  mediaNotas: number | null;
  nivelEvidencia: NivelEvidencia;
  periodoInicio: Date | null;
  periodoFim: Date | null;
};

export type ComparacaoDesafio = {
  desafioId: string;
  moduloId: string;
  metodo: MetodoEstudo;
  desafio: GrupoComparacaoDesafio;
  contextoExterno: GrupoComparacaoDesafio;
  diferencaMedias: number | null;
  comparavel: boolean;
  versaoAlgoritmo: string;
};

function resumirGrupo(evidencias: EvidenciaAprendizagem[]): GrupoComparacaoDesafio {
  const notas = evidencias.map((evidencia) => evidencia.nota);
  const ordenadas = [...evidencias].sort((a, b) => a.observadaEm.getTime() - b.observadaEm.getTime() || a.tentativaId.localeCompare(b.tentativaId));
  const quantidadeEvidencias = notas.length;
  return {
    quantidadeEvidencias,
    mediaNotas: quantidadeEvidencias >= 2 ? notas.reduce((soma, nota) => soma + nota, 0) / quantidadeEvidencias : null,
    nivelEvidencia: obterNivelEvidencia(quantidadeEvidencias, notas),
    periodoInicio: ordenadas[0]?.observadaEm ?? null,
    periodoFim: ordenadas.at(-1)?.observadaEm ?? null,
  };
}

export function calcularComparacaoDesafio(
  desafio: DesafioParaComparacao,
  sessoes: SessaoParaMetricas[],
  tentativas: TentativaParaMetricas[],
): ComparacaoDesafio {
  const sessoesDoModulo = sessoes.filter((sessao) => sessao.moduloId === desafio.moduloId);
  const tentativasDoModulo = tentativas.filter((tentativa) => tentativa.moduloId === desafio.moduloId);
  const { evidencias } = construirEvidencias(sessoesDoModulo, tentativasDoModulo);
  const evidenciasDoMetodo = evidencias.filter((evidencia) => evidencia.metodo === desafio.metodo);
  const grupoDesafio = resumirGrupo(evidenciasDoMetodo.filter((evidencia) => evidencia.desafioId === desafio.id));
  const grupoContextoExterno = resumirGrupo(evidenciasDoMetodo.filter((evidencia) => evidencia.desafioId === null));
  const comparavel = grupoDesafio.mediaNotas !== null && grupoContextoExterno.mediaNotas !== null;
  return {
    desafioId: desafio.id,
    moduloId: desafio.moduloId,
    metodo: desafio.metodo,
    desafio: grupoDesafio,
    contextoExterno: grupoContextoExterno,
    diferencaMedias: comparavel ? grupoDesafio.mediaNotas! - grupoContextoExterno.mediaNotas! : null,
    comparavel,
    versaoAlgoritmo: VERSAO_COMPARACAO_DESAFIO,
  };
}
