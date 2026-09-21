import { prisma } from "@/biblioteca/prisma";
import { calcularComparacaoDesafio } from "@/dominio/analises/comparar-desafio";
import { calcularMetricasSessoes, type SessaoParaMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";

type SessaoPersistidaParaMetricas = Omit<SessaoParaMetricasSessoes, "metodos" | "formatos"> & {
  metodos: Array<{ metodo: MetodoEstudo }>;
  formatos: Array<{ formato: FormatoConteudo }>;
};

function mapearSessaoOficial(sessao: SessaoPersistidaParaMetricas): SessaoParaMetricasSessoes {
  return { ...sessao, metodos: sessao.metodos.map((item) => item.metodo), formatos: sessao.formatos.map((item) => item.formato) };
}

const selecaoSessaoOficial = {
  id: true,
  moduloId: true,
  descricao: true,
  iniciadaEm: true,
  encerradaEm: true,
  duracaoMinutos: true,
  situacao: true,
  arquivada: true,
  dificuldadePercebida: true,
  compreensaoPercebida: true,
  metodos: { select: { metodo: true } },
  formatos: { select: { formato: true } },
} as const;

/** Métricas oficiais da jornada centrada em sessões. Não consulta tópicos nem avaliações. */
export async function obterMetricasSessoesModuloPessoal(usuarioId: string, identificadorModulo: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({
    where: { usuarioId, identificador: identificadorModulo, arquivado: false, rascunho: false },
    select: { id: true, identificador: true, titulo: true },
  });
  if (!modulo) return null;
  const sessoes = await prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: modulo.id }, select: selecaoSessaoOficial });
  return { modulo, metricas: calcularMetricasSessoes(sessoes.map(mapearSessaoOficial), modulo.id) };
}

/** Consolidação oficial da conta, restrita a módulos ativos e sessões próprias. */
export async function obterMetricasSessoesPessoais(usuarioId: string) {
  const modulos = await prisma.moduloAprendizagem.findMany({
    where: { usuarioId, arquivado: false, rascunho: false },
    select: { id: true, identificador: true, titulo: true },
    orderBy: { titulo: "asc" },
  });
  const idsModulos = modulos.map((modulo) => modulo.id);
  const sessoes = await prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: { in: idsModulos } }, select: selecaoSessaoOficial });
  const mapeadas = sessoes.map(mapearSessaoOficial);
  return {
    versaoAlgoritmo: "metricas-sessoes-v1",
    consolidado: calcularMetricasSessoes(mapeadas),
    metricasPorModulo: modulos.map((modulo) => ({ modulo, metricas: calcularMetricasSessoes(mapeadas, modulo.id) })),
  };
}

export async function obterComparacoesDesafiosPessoais(usuarioId: string) {
  const desafios = await prisma.desafioExperimentacao.findMany({
    where: { usuarioId, modulo: { arquivado: false, rascunho: false } },
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    select: { id: true, moduloId: true, metodo: true, meta: true, situacao: true, criadoEm: true, canceladoEm: true, modulo: { select: { titulo: true, identificador: true } } },
  });
  const idsModulos = [...new Set(desafios.map((desafio) => desafio.moduloId))];
  if (!idsModulos.length) return [];
  const sessoes = await prisma.sessaoEstudo.findMany({
    where: { usuarioId, moduloId: { in: idsModulos } },
    select: {
      id: true, moduloId: true, desafioId: true, encerradaEm: true, duracaoMinutos: true, situacao: true,
      dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } },
    },
  });
  const sessoesMapeadas = sessoes.map((sessao) => ({ ...sessao, metodos: sessao.metodos.map((item) => item.metodo) }));
  return desafios.map((desafio) => ({ ...desafio, comparacao: calcularComparacaoDesafio(desafio, sessoesMapeadas) }));
}
