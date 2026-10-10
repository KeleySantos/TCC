import Link from "next/link";
import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { formatarData } from "@/biblioteca/formatacao";
import { CartoesInsightsDashboard } from "@/componentes/cartoes-insights-dashboard";
import { ConsistenciaMetodosDashboard } from "@/componentes/consistencia-metodos-dashboard";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { GraficosDashboard } from "@/componentes/graficos-dashboard";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterDashboardObservacionalPessoal } from "@/servidor/dashboard-observacional";
import { FiltroPeriodoModulo } from "@/app/modulos/[identificador]/filtro-periodo-modulo";
import estilos from "./page.module.css";

function duracao(minutos: number) {
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  return horas ? `${horas}h${restante ? ` ${restante}min` : ""}` : `${minutos} min`;
}

function formatarLimitePeriodo(valor: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(valor);
}

export default async function PaginaDashboard({ searchParams }: { searchParams: Promise<{ fim?: string | string[]; inicio?: string | string[] }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const periodo = resolverPeriodoModulo({ inicio: parametros.inicio, fim: parametros.fim });
  const dados = await obterDashboardObservacionalPessoal(usuario.id, { inicio: periodo.inicio, fim: periodo.fim });
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";
  const periodoRecente = `${formatarLimitePeriodo(dados.periodoRecente.inicio)} a ${formatarLimitePeriodo(dados.periodoRecente.fim)}`;

  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className={estilos.paginaDashboard} id="conteudo-principal" tabIndex={-1}>
    <header className={estilos.topoConta}><div className={estilos.contextoAtual}><ChartNoAxesCombined aria-hidden="true" /><span>Dashboard pessoal</span></div><Link className={estilos.conta} href="/perfil"><span className={estilos.avatar} aria-hidden="true">{primeiroNome.slice(0, 1).toUpperCase()}</span><span><strong>{usuario.nome}</strong><small>Ver perfil</small></span></Link></header>
    <div className={estilos.areaConteudo}>
      <section aria-labelledby="titulo-dashboard" className={estilos.boasVindas}><p className={estilos.sobretitulo}>SUA JORNADA DE APRENDIZAGEM</p><h1 id="titulo-dashboard">Olá, {primeiroNome}!</h1><p>Observe como você tem estudado e o que seus registros mostram.</p><small>{periodo.ativo ? "Período filtrado" : "Leitura recente"}: {periodoRecente} · {dados.versaoAlgoritmo}</small></section>
      <FiltroPeriodoModulo periodo={{ inicio: periodo.inicioTexto, fim: periodo.fimTexto, hoje: periodo.hoje, ativo: periodo.ativo, erro: periodo.erro }} />
      <CartoesInsightsDashboard dados={dados} />
      <div className={estilos.gradeDashboard}><div className={estilos.colunaPrincipal}>
        <GraficosDashboard dados={dados} />
        <ConsistenciaMetodosDashboard itens={dados.consistenciaMetodos} />
        <section aria-labelledby="titulo-base" className={estilos.cartao}><p className={estilos.sobretitulo}>CONTEXTO DAS ANÁLISES</p><h2 id="titulo-base">Base das análises</h2><p className={estilos.introducao}>{dados.baseHistorica.quantidadeSessoes ? `${periodo.ativo ? "Registros válidos no período" : "Todo o histórico válido dos módulos ativos"}, de ${formatarData(dados.baseHistorica.primeiraSessaoEm)} a ${formatarData(dados.baseHistorica.ultimaSessaoEm)}.` : periodo.ativo ? "Não há sessões válidas no período filtrado." : "Ainda não há sessões válidas nos módulos ativos."} {periodo.ativo ? `Os cards e gráficos usam somente o intervalo de ${periodoRecente}.` : `A janela recente dos cards e gráficos é de ${periodoRecente}.`}</p><dl className={estilos.base}><div><dt>Sessões válidas</dt><dd>{dados.baseHistorica.quantidadeSessoes}</dd></div><div><dt>Módulos com sessões</dt><dd>{dados.baseHistorica.quantidadeModulosComSessoes}</dd></div><div><dt>Métodos registrados</dt><dd>{dados.baseHistorica.quantidadeMetodosRegistrados}</dd></div><div><dt>Arquivos analisados com conceitos</dt><dd>{dados.baseHistorica.quantidadeMateriaisAnalisados}</dd></div></dl><div className={estilos.avisoResponsavel}><ShieldCheck aria-hidden="true" /><p>As percepções são autorrelatos, enquanto as evidências confirmadas registram desempenhos posteriores. As relações apresentadas são observacionais e não demonstram causalidade.</p></div><details className={estilos.criterios}><summary>Como interpretar estes dados</summary><ul>{dados.limitacoes.map((limite) => <li key={limite}>{limite}</li>)}</ul></details></section>
        <details className={estilos.tradicionais}><summary>Ver métricas de atividade {periodo.ativo ? "do período" : "do histórico"}</summary><dl className={estilos.base}><div><dt>Tempo estudado</dt><dd>{duracao(dados.metricasSecundarias.minutosTotais)}</dd></div><div><dt>Sessões concluídas válidas</dt><dd>{dados.metricasSecundarias.quantidadeSessoes}</dd></div><div><dt>Dias com estudo</dt><dd>{dados.metricasSecundarias.diasComEstudo}</dd></div><div><dt>Duração média</dt><dd>{dados.metricasSecundarias.mediaMinutos === null ? "—" : duracao(Math.round(dados.metricasSecundarias.mediaMinutos))}</dd></div></dl></details>
      </div><aside aria-label="Interpretação opcional" className={estilos.areaInterpretacao}><InterpretacaoAutomatica fim={periodo.ativo ? periodo.fimTexto : undefined} inicio={periodo.ativo ? periodo.inicioTexto : undefined} /></aside></div>
    </div>
  </main></EstruturaAutenticada>;
}
