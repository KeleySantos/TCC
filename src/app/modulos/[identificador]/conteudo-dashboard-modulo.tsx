import type { ClassificacaoConceitoAprendizagem, ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import { PainelConceitosDestaque } from "./painel-conceitos-destaque";
import { PainelMetricasSessoes, type AprendizagemMetricasExibicao, type MetricasSessoesExibicao } from "./painel-metricas-sessoes";
import { PainelResultadosContextuais } from "./painel-resultados-contextuais";

export type AprendizagemDashboardModulo = {
  resumoResultados: AprendizagemMetricasExibicao;
  metodosResultados: ResultadoContextoAprendizagem[];
  formatosResultados: ResultadoContextoAprendizagem[];
  conceitosMaiorDificuldade: ClassificacaoConceitoAprendizagem[];
  conceitosMaiorCompreensao: ClassificacaoConceitoAprendizagem[];
};

export function ConteudoDashboardModulo({
  aprendizagem,
  idTitulo,
  metricas,
  tituloModulo,
  tituloPainel,
}: {
  aprendizagem: AprendizagemDashboardModulo;
  idTitulo?: string;
  metricas: MetricasSessoesExibicao;
  tituloModulo: string;
  tituloPainel?: string;
}) {
  return <>
    <PainelMetricasSessoes aprendizagem={aprendizagem.resumoResultados} idTitulo={idTitulo} metricas={metricas} tituloModulo={tituloModulo} tituloPainel={tituloPainel} />
    <PainelResultadosContextuais formatos={aprendizagem.formatosResultados} idTitulo={idTitulo ? `${idTitulo}-resultados` : undefined} metodos={aprendizagem.metodosResultados} />
    <PainelConceitosDestaque maiorCompreensao={aprendizagem.conceitosMaiorCompreensao} maiorDificuldade={aprendizagem.conceitosMaiorDificuldade} />
  </>;
}
