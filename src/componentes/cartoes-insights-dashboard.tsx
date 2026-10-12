import { ChartNoAxesCombined, Compass, Shapes, Timer } from "lucide-react";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import type { FormatoConteudo } from "@/gerado/prisma/enums";
import estilos from "./cartoes-insights-dashboard.module.css";

export function CartoesInsightsDashboard({ dados }: { dados: DashboardObservacional }) {
  const metodo = dados.metodoMaiorCompreensao;
  const formato = dados.formatoMaiorCompreensao;
  const duracao = dados.duracaoSessoesMelhoresResultados;
  const atencao = dados.pontoAtencao;
  return <section aria-labelledby="titulo-insights-dashboard" className={estilos.secao}>
    <div className={estilos.cabecalho}><h2 id="titulo-insights-dashboard">O que seus registros mostram</h2></div>
    <div className={estilos.grade}>
      <article className={estilos.cartao}>
        <span className={estilos.icone}><ChartNoAxesCombined aria-hidden="true" /></span>
        <div className={estilos.conteudo}><span className={estilos.rotulo}>Método associado à maior compreensão</span><strong>{metodo ? formatarMetodoEstudo(metodo.chave) : "Dados insuficientes"}</strong></div>
      </article>
      <article className={estilos.cartao}>
        <span className={estilos.icone}><Shapes aria-hidden="true" /></span>
        <div className={estilos.conteudo}><span className={estilos.rotulo}>Formato associado à maior compreensão</span><strong>{formato ? formatarFormato(formato.chave as FormatoConteudo) : "Nenhum formato elegível"}</strong></div>
      </article>
      <article className={estilos.cartao}>
        <span className={estilos.icone}><Timer aria-hidden="true" /></span>
        <div className={estilos.conteudo}><span className={estilos.rotulo}>Duração associada a melhores resultados</span><strong>{duracao.mediaMinutos === null ? "Sem sessões elegíveis" : `${Math.round(duracao.mediaMinutos)} min`}</strong></div>
      </article>
      <article className={estilos.cartao}>
        <span className={estilos.icone}><Compass aria-hidden="true" /></span>
        <div className={estilos.conteudo}><span className={estilos.rotulo}>Maior dificuldade percebida</span><strong>{atencao?.tituloModulo ?? "Sem ponto de atenção suficiente"}</strong></div>
      </article>
    </div>
  </section>;
}
