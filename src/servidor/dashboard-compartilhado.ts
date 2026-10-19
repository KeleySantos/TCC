import type { AprendizagemDashboardModulo } from "@/app/modulos/[identificador]/conteudo-dashboard-modulo";
import type { MetricasSessoesExibicao } from "@/app/modulos/[identificador]/painel-metricas-sessoes";
import { obterMetricasSessoesModuloPessoal } from "./metricas";
import { obterAprendizagemModuloPessoal } from "./aprendizagem-modulo";
import { ErroCompartilhamentoModulo, exigirAcessoDashboardCompartilhado, type PeriodoCompartilhado } from "./compartilhamento-modulos";

export type DashboardModuloCompartilhado = {
  modulo: { id: string; titulo: string; proprietarioNome: string };
  metricas: MetricasSessoesExibicao;
  aprendizagem: AprendizagemDashboardModulo;
};

export async function obterDashboardCompartilhado(convidadoId: string, moduloId: string, periodo: PeriodoCompartilhado = {}): Promise<DashboardModuloCompartilhado> {
  const acesso = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  const [resultado, aprendizagem] = await Promise.all([
    obterMetricasSessoesModuloPessoal(acesso.proprietarioId, acesso.identificador, periodo),
    obterAprendizagemModuloPessoal(acesso.proprietarioId, moduloId, periodo),
  ]);
  if (!resultado || !aprendizagem) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  const acessoFinal = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  if (acessoFinal.versaoAcesso !== acesso.versaoAcesso) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  const { metricas } = resultado;
  return {
    modulo: { id: moduloId, titulo: acesso.titulo, proprietarioNome: acesso.proprietarioNome },
    metricas: {
      ...metricas,
      frequencia: { ...metricas.frequencia, primeiraSessaoEm: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null, ultimaSessaoEm: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null },
      evolucaoSemanal: { ...metricas.evolucaoSemanal, pontos: metricas.evolucaoSemanal.pontos.map((ponto) => ({ ...ponto, periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString() })) },
    },
    aprendizagem: {
      resumoResultados: {
        ...aprendizagem.analises.resumoResultados,
        evolucaoPercepcaoEvidencia: aprendizagem.analises.evolucaoPercepcaoEvidencia.map((ponto) => ({ ...ponto, periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString() })),
      },
      metodosResultados: aprendizagem.analises.metodosResultados,
      formatosResultados: aprendizagem.analises.formatosResultados,
      conceitosMaiorDificuldade: aprendizagem.analises.conceitosMaiorDificuldade,
      conceitosMaiorCompreensao: aprendizagem.analises.conceitosMaiorCompreensao,
    },
  };
}
