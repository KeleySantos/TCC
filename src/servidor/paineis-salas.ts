import { z } from "zod";
import { calcularMetricasSessoes, type MetricasSessoes, type SessaoParaMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { FormatoConteudo, MetodoEstudo, SituacaoParticipacaoModuloSala, SituacaoSala, SituacaoVinculoModuloSala } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { obterResumoAprendizagemVinculoSala } from "./aprendizagem-sala";
import { criarReferenciaContribuinteAnonimo } from "./salas";

export const MINIMO_CONTRIBUIDORES_AGREGADO_SALA = 3;

const esquemaMetodos = z.array(z.nativeEnum(MetodoEstudo));
const esquemaFormatos = z.array(z.nativeEnum(FormatoConteudo));

type EvidenciaComContribuinte = { sessao: SessaoParaMetricasSessoes; contribuinte: string };

function estadoAgregado(evidencias: EvidenciaComContribuinte[], moduloId: string) {
  const contribuintes = new Set(evidencias.filter((item) => item.sessao.situacao === "CONCLUIDA" && (item.sessao.duracaoMinutos ?? 0) >= 5).map((item) => item.contribuinte));
  if (contribuintes.size < MINIMO_CONTRIBUIDORES_AGREGADO_SALA) return { disponivel: false as const, quantidadeContribuidores: contribuintes.size, metricas: null };
  return { disponivel: true as const, quantidadeContribuidores: contribuintes.size, metricas: calcularMetricasSessoes(evidencias.map((item) => item.sessao), moduloId) };
}

export function serializarMetricasSala(metricas: MetricasSessoes) {
  return {
    ...metricas,
    frequencia: {
      ...metricas.frequencia,
      primeiraSessaoEm: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null,
      ultimaSessaoEm: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null,
    },
    evolucaoSemanal: {
      ...metricas.evolucaoSemanal,
      pontos: metricas.evolucaoSemanal.pontos.map((ponto) => ({ ...ponto, periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString() })),
    },
  };
}

export async function obterDashboardModuloSalaDoProprietario(usuarioId: string, identificadorSala: string, moduloSalaId: string) {
  const modulo = await prisma.moduloSala.findFirst({
    where: {
      id: moduloSalaId,
      situacao: "ATIVO",
      sala: { identificador: identificadorSala, proprietarioId: usuarioId, situacao: { not: SituacaoSala.EXCLUIDA } },
    },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      salaId: true,
      vinculos: {
        where: {
          situacao: SituacaoVinculoModuloSala.ATIVO,
          compartilharDashboard: true,
          participacaoModuloSala: { situacao: SituacaoParticipacaoModuloSala.ATIVA },
        },
        select: {
          id: true,
          usuarioId: true,
          moduloPessoalId: true,
          dadosDesde: true,
          usuario: { select: { nome: true } },
          moduloPessoal: { select: { titulo: true, identificador: true } },
        },
      },
      evidenciasHistoricas: true,
    },
  });
  if (!modulo) return null;

  const evidenciasModulo: EvidenciaComContribuinte[] = [];
  const individuais = [];
  for (const vinculo of modulo.vinculos) {
    const [sessoes, aprendizagem] = await Promise.all([
      prisma.sessaoEstudo.findMany({
        where: {
          usuarioId: vinculo.usuarioId,
          moduloId: vinculo.moduloPessoalId,
          ...(vinculo.dadosDesde ? { iniciadaEm: { gte: vinculo.dadosDesde } } : {}),
        },
        select: {
          id: true,
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
        },
      }),
      obterResumoAprendizagemVinculoSala(vinculo.usuarioId, vinculo.moduloPessoalId, modulo.id, vinculo.dadosDesde),
    ]);
    const sessoesMapeadas: SessaoParaMetricasSessoes[] = sessoes.map((sessao) => ({
      ...sessao,
      id: `vivo:${modulo.id}:${sessao.id}`,
      moduloId: modulo.id,
      descricao: "",
      metodos: sessao.metodos.map((item) => item.metodo),
      formatos: sessao.formatos.map((item) => item.formato),
    }));
    const contribuinte = criarReferenciaContribuinteAnonimo(modulo.salaId, vinculo.usuarioId);
    evidenciasModulo.push(...sessoesMapeadas.map((sessao) => ({ sessao, contribuinte })));
    individuais.push({
      vinculoId: vinculo.id,
      nome: vinculo.usuario.nome,
      tituloModuloPessoal: vinculo.moduloPessoal.titulo,
      identificadorModuloPessoal: vinculo.moduloPessoal.identificador,
      metricas: calcularMetricasSessoes(sessoesMapeadas, modulo.id),
      aprendizagem,
    });
  }

  for (const historica of modulo.evidenciasHistoricas) {
    const metodos = esquemaMetodos.safeParse(JSON.parse(historica.metodosJson));
    const formatos = esquemaFormatos.safeParse(JSON.parse(historica.formatosJson));
    if (!metodos.success || !formatos.success) continue;
    evidenciasModulo.push({
      contribuinte: historica.contribuinteAnonimoHash,
      sessao: {
        id: `historica:${historica.referenciaSessaoHash}`,
        moduloId: modulo.id,
        descricao: "",
        iniciadaEm: new Date(historica.encerradaEm.getTime() - historica.duracaoMinutos * 60_000),
        encerradaEm: historica.encerradaEm,
        duracaoMinutos: historica.duracaoMinutos,
        situacao: "CONCLUIDA",
        arquivada: false,
        dificuldadePercebida: historica.dificuldadePercebida,
        compreensaoPercebida: historica.compreensaoPercebida,
        metodos: metodos.data,
        formatos: formatos.data,
      },
    });
  }

  return {
    id: modulo.id,
    titulo: modulo.titulo,
    descricao: modulo.descricao,
    agregado: estadoAgregado(evidenciasModulo, modulo.id),
    individuais,
    quantidadeHistoricas: modulo.evidenciasHistoricas.length,
  };
}

export async function obterDashboardIndividualAutorizado(usuarioId: string, identificadorSala: string, vinculoId: string) {
  const vinculo = await prisma.vinculoModuloSala.findFirst({
    where: {
      id: vinculoId,
      situacao: SituacaoVinculoModuloSala.ATIVO,
      compartilharDashboard: true,
      participacaoModuloSala: { situacao: SituacaoParticipacaoModuloSala.ATIVA },
      moduloSala: {
        situacao: "ATIVO",
        sala: { identificador: identificadorSala, proprietarioId: usuarioId, situacao: { not: SituacaoSala.EXCLUIDA } },
      },
    },
    select: { moduloSalaId: true },
  });
  if (!vinculo) return null;
  const modulo = await obterDashboardModuloSalaDoProprietario(usuarioId, identificadorSala, vinculo.moduloSalaId);
  const individual = modulo?.individuais.find((item) => item.vinculoId === vinculoId);
  return modulo && individual ? { modulo: { id: modulo.id, titulo: modulo.titulo }, individual } : null;
}
