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

export default async function PaginaDashboard({ searchParams }: { searchParams: Promise<{ fim?: string | string[]; inicio?: string | string[] }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const periodo = resolverPeriodoModulo({ inicio: parametros.inicio, fim: parametros.fim });
  const dados = await obterDashboardObservacionalPessoal(usuario.id, { inicio: periodo.inicio, fim: periodo.fim });
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";

  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className={estilos.paginaDashboard} id="conteudo-principal" tabIndex={-1}>
    <div className={estilos.areaConteudo}>
      <section aria-labelledby="titulo-dashboard" className={estilos.boasVindas}><h1 id="titulo-dashboard">Olá, {primeiroNome}!</h1></section>
      <FiltroPeriodoModulo periodo={{ inicio: periodo.inicioTexto, fim: periodo.fimTexto, hoje: periodo.hoje, ativo: periodo.ativo, erro: periodo.erro }} />
      <CartoesInsightsDashboard dados={dados} />
      <div className={estilos.gradeDashboard}><div className={estilos.colunaPrincipal}>
        <GraficosDashboard dados={dados} />
        <ConsistenciaMetodosDashboard itens={dados.consistenciaMetodos} />
        <section aria-labelledby="titulo-base" className={estilos.cartao}><h2 id="titulo-base">Base das análises</h2><dl className={estilos.base}><div><dt>Sessões válidas</dt><dd>{dados.baseHistorica.quantidadeSessoes}</dd></div><div><dt>Módulos com sessões</dt><dd>{dados.baseHistorica.quantidadeModulosComSessoes}</dd></div><div><dt>Métodos registrados</dt><dd>{dados.baseHistorica.quantidadeMetodosRegistrados}</dd></div><div><dt>Arquivos analisados com conceitos</dt><dd>{dados.baseHistorica.quantidadeMateriaisAnalisados}</dd></div><div><dt>Tempo estudado</dt><dd>{duracao(dados.metricasSecundarias.minutosTotais)}</dd></div><div><dt>Sessões concluídas válidas</dt><dd>{dados.metricasSecundarias.quantidadeSessoes}</dd></div><div><dt>Dias com estudo</dt><dd>{dados.metricasSecundarias.diasComEstudo}</dd></div><div><dt>Duração média</dt><dd>{dados.metricasSecundarias.mediaMinutos === null ? "—" : duracao(Math.round(dados.metricasSecundarias.mediaMinutos))}</dd></div></dl></section>
      </div><aside aria-label="Interpretação opcional" className={estilos.areaInterpretacao}><InterpretacaoAutomatica compacto fim={periodo.ativo ? periodo.fimTexto : undefined} inicio={periodo.ativo ? periodo.inicioTexto : undefined} /></aside></div>
    </div>
  </main></EstruturaAutenticada>;
}
