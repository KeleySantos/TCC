import { prisma } from "@/biblioteca/prisma";
import { calcularFrequenciaEstudo, calcularMetricasModulo, calcularRecorrenciasEntreModulos, calcularTaxaAcertoGeral, selecionarMetodoComMaiorMediaObservada } from "@/dominio/analises/metricas-modulo";
import { calcularAnaliseBloom } from "@/dominio/analises/analise-bloom";
import { calcularComparacaoDesafio } from "@/dominio/analises/comparar-desafio";

function mapearSessao(sessao: Awaited<ReturnType<typeof prisma.sessaoEstudo.findMany>>[number] & { recurso: { formato: import("@/gerado/prisma/enums").FormatoConteudo } }) {
  return { id: sessao.id, moduloId: sessao.moduloId, topicoId: sessao.topicoId, formato: sessao.recurso.formato, metodo: sessao.metodo, desafioId: sessao.desafioId, dificuldadePercebida: sessao.dificuldadePercebida, compreensaoPercebida: sessao.compreensaoPercebida, encerradaEm: sessao.encerradaEm, duracaoMinutos: sessao.duracaoMinutos, situacao: sessao.situacao };
}

function mapearTentativa(tentativa: Awaited<ReturnType<typeof prisma.tentativaAvaliacao.findMany>>[number]) {
  return { id: tentativa.id, moduloId: tentativa.moduloId, topicoId: tentativa.topicoId, concluidaEm: tentativa.concluidaEm, notaNormalizada: tentativa.notaNormalizada, numeroTentativa: tentativa.numeroTentativa, respostasCorretas: tentativa.respostasCorretas, totalQuestoes: tentativa.totalQuestoes };
}

export async function obterMetricasModuloPessoal(usuarioId: string, identificadorModulo: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({ where: { usuarioId, identificador: identificadorModulo, arquivado: false, rascunho: false }, select: { id: true } });
  if (!modulo) return null;
  const [sessoes, tentativas] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: modulo.id, topico: { ativo: true, rascunho: false } }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { usuarioId, moduloId: modulo.id, topico: { ativo: true, rascunho: false } } }),
  ]);
  return calcularMetricasModulo(modulo.id, sessoes.map(mapearSessao), tentativas.map(mapearTentativa));
}

export async function obterMetricasPessoais(usuarioId: string) {
  const modulos = await prisma.moduloAprendizagem.findMany({ where: { usuarioId, arquivado: false, rascunho: false }, select: { id: true }, orderBy: { titulo: "asc" } });
  const idsModulos = modulos.map((modulo) => modulo.id);
  const [sessoes, tentativas] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: { in: idsModulos }, topico: { ativo: true, rascunho: false } }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { usuarioId, moduloId: { in: idsModulos }, topico: { ativo: true, rascunho: false } } }),
  ]);
  const sessoesMapeadas = sessoes.map(mapearSessao);
  const tentativasMapeadas = tentativas.map(mapearTentativa);
  const metricasPorModulo = modulos.map((modulo) => ({ modulo, metricas: calcularMetricasModulo(modulo.id, sessoesMapeadas, tentativasMapeadas) }));
  const metricasDosModulos = metricasPorModulo.map((item) => item.metricas);
  const recorrencias = calcularRecorrenciasEntreModulos(metricasDosModulos);
  return {
    metricasPorModulo,
    recorrencias,
    frequencia: calcularFrequenciaEstudo(sessoesMapeadas),
    taxaAcertoGeral: calcularTaxaAcertoGeral(metricasDosModulos),
    metodoComMaiorMediaObservada: selecionarMetodoComMaiorMediaObservada(recorrencias),
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
  const [sessoes, tentativas] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: { in: idsModulos }, topico: { ativo: true, rascunho: false } }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { usuarioId, moduloId: { in: idsModulos }, topico: { ativo: true, rascunho: false } } }),
  ]);
  const sessoesMapeadas = sessoes.map(mapearSessao);
  const tentativasMapeadas = tentativas.map(mapearTentativa);
  return desafios.map((desafio) => ({ ...desafio, comparacao: calcularComparacaoDesafio(desafio, sessoesMapeadas, tentativasMapeadas) }));
}

export async function obterAnaliseBloomModuloPessoal(usuarioId: string, identificadorModulo: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({
    where: { usuarioId, identificador: identificadorModulo, arquivado: false, rascunho: false },
    select: { id: true },
  });
  if (!modulo) return null;
  const respostas = await prisma.respostaQuestao.findMany({
    where: { tentativa: { usuarioId, moduloId: modulo.id, concluidaEm: { not: null }, topico: { ativo: true, rascunho: false } } },
    select: { correta: true, questao: { select: { nivelBloom: true } }, tentativa: { select: { concluidaEm: true } } },
  });
  return calcularAnaliseBloom(respostas.map((resposta) => ({ nivelBloom: resposta.questao.nivelBloom, correta: resposta.correta, concluidaEm: resposta.tentativa.concluidaEm })));
}
