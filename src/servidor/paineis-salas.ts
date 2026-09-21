import { z } from "zod";
import { calcularMetricasSessoes, type MetricasSessoes, type SessaoParaMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { FormatoConteudo, MetodoEstudo, SituacaoSala, SituacaoVinculoModuloSala } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { criarReferenciaContribuinteAnonimo } from "./salas";

export const MINIMO_CONTRIBUIDORES_AGREGADO_SALA = 3;

const esquemaMetodos = z.array(z.nativeEnum(MetodoEstudo));
const esquemaFormatos = z.array(z.nativeEnum(FormatoConteudo));

type EvidenciaComContribuinte = { sessao: SessaoParaMetricasSessoes; contribuinte: string };

function estadoAgregado(evidencias: EvidenciaComContribuinte[], moduloId: string | null = null) {
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

export async function obterDashboardsSalaDoProprietario(usuarioId: string, identificadorSala: string) {
  const sala = await prisma.sala.findFirst({
    where: { identificador: identificadorSala, proprietarioId: usuarioId, situacao: { not: SituacaoSala.EXCLUIDA } },
    select: { id: true, identificador: true, nome: true, descricao: true, situacao: true },
  });
  if (!sala) return null;
  const modulosPersistidos = await prisma.moduloSala.findMany({
    where: { salaId: sala.id, situacao: "ATIVO" },
    select: {
      id: true, titulo: true, descricao: true, posicao: true,
      vinculos: {
        where: { situacao: SituacaoVinculoModuloSala.ATIVO, compartilharDashboard: true, membroSala: { situacao: "ATIVO" } },
        select: {
          id: true, usuarioId: true, moduloPessoalId: true, dadosDesde: true, permitirComparacao: true, permitirIa: true,
          usuario: { select: { nome: true } },
          moduloPessoal: { select: { titulo: true, identificador: true } },
        },
      },
      evidenciasHistoricas: true,
    },
    orderBy: { posicao: "asc" },
  });

  const modulos = [];
  const evidenciasSala: EvidenciaComContribuinte[] = [];
  for (const modulo of modulosPersistidos) {
    const evidenciasModulo: EvidenciaComContribuinte[] = [];
    const individuais = [];
    for (const vinculo of modulo.vinculos) {
      const sessoes = await prisma.sessaoEstudo.findMany({
        where: {
          usuarioId: vinculo.usuarioId,
          moduloId: vinculo.moduloPessoalId,
          ...(vinculo.dadosDesde ? { encerradaEm: { gte: vinculo.dadosDesde } } : {}),
        },
        select: {
          id: true, descricao: true, iniciadaEm: true, encerradaEm: true, duracaoMinutos: true, situacao: true, arquivada: true,
          dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } },
        },
      });
      const sessoesMapeadas: SessaoParaMetricasSessoes[] = sessoes.map((sessao) => ({
        ...sessao,
        id: `vivo:${modulo.id}:${sessao.id}`,
        moduloId: modulo.id,
        descricao: "",
        metodos: sessao.metodos.map((item) => item.metodo),
        formatos: sessao.formatos.map((item) => item.formato),
      }));
      const contribuinte = criarReferenciaContribuinteAnonimo(sala.id, vinculo.usuarioId);
      evidenciasModulo.push(...sessoesMapeadas.map((sessao) => ({ sessao, contribuinte })));
      individuais.push({
        vinculoId: vinculo.id,
        nome: vinculo.usuario.nome,
        tituloModuloPessoal: vinculo.moduloPessoal.titulo,
        identificadorModuloPessoal: vinculo.moduloPessoal.identificador,
        permitirComparacao: vinculo.permitirComparacao,
        permitirIa: vinculo.permitirIa,
        metricas: calcularMetricasSessoes(sessoesMapeadas, modulo.id),
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
    evidenciasSala.push(...evidenciasModulo);
    modulos.push({
      id: modulo.id,
      titulo: modulo.titulo,
      descricao: modulo.descricao,
      agregado: estadoAgregado(evidenciasModulo, modulo.id),
      individuais,
      quantidadeHistoricas: modulo.evidenciasHistoricas.length,
    });
  }
  return { sala, geral: estadoAgregado(evidenciasSala), modulos };
}

export async function obterDashboardIndividualAutorizado(usuarioId: string, identificadorSala: string, vinculoId: string) {
  const dashboards = await obterDashboardsSalaDoProprietario(usuarioId, identificadorSala);
  if (!dashboards) return null;
  for (const modulo of dashboards.modulos) {
    const individual = modulo.individuais.find((item) => item.vinculoId === vinculoId);
    if (individual) return { sala: dashboards.sala, modulo: { id: modulo.id, titulo: modulo.titulo }, individual };
  }
  return null;
}
