"use client";

import type { ComponentProps } from "react";
import { Area as RechartsArea, AreaChart, CartesianGrid, Legend, Line as RechartsLine, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { GraficoAnelObservacional } from "./grafico-anel-observacional";
import estilos from "./graficos-dashboard.module.css";

function Area(props: ComponentProps<typeof RechartsArea>) { return <RechartsArea isAnimationActive={false} {...props} />; }
function Line(props: ComponentProps<typeof RechartsLine>) { return <RechartsLine isAnimationActive={false} {...props} />; }

function dataUtc(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(data));
}

function escala(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`;
}

function percentual(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(0)}%`;
}

function GraficoContextual({ itens, titulo, formatar, vazio }: {
  itens: ResultadoContextoAprendizagem[];
  titulo: string;
  formatar: (chave: string) => string;
  vazio: string;
}) {
  const dados = itens.map((item) => ({ ...item, contexto: formatar(item.chave), compreensaoPercentual: item.compreensaoMedia === null ? null : item.compreensaoMedia * 20 }));
  if (!dados.length) return <p className={estilos.estadoVazio}>{vazio}</p>;
  const descricao = dados.map((item) => `${item.contexto}: compreensão ${escala(item.compreensaoMedia)}, evidência ${percentual(item.desempenhoMedioPosterior)}`).join("; ");
  return <>
    <div aria-label={`${titulo}. ${descricao}. Consulte a tabela para valores e amostras.`} className={estilos.areaGrafico} role="img">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={dados} margin={{ top: 18, right: 12, left: -15, bottom: 8 }} accessibilityLayer><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis dataKey="contexto" tickFormatter={(valor) => String(valor).slice(0, 13)} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(valor) => `${valor}%`} tickLine={false} axisLine={false} /><Tooltip formatter={(valor, nome) => [`${Number(valor).toFixed(0)}%`, nome]} /><Legend align="right" verticalAlign="top" /><Line connectNulls={false} dataKey="compreensaoPercentual" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 2 }} name="Compreensão percebida" stroke="#4d9bf9" strokeWidth={2.5} type="monotone" /><Line connectNulls={false} dataKey="desempenhoMedioPosterior" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 2 }} name="Evidência posterior" stroke="#ff7a1a" strokeWidth={2.5} type="monotone" /></LineChart></ResponsiveContainer>
    </div>
    <details className={estilos.detalhes}><summary>Ver dados em tabela</summary><div className={estilos.tabelaResponsiva}><table><caption>{titulo}</caption><thead><tr><th scope="col">Contexto</th><th scope="col">Compreensão percebida</th><th scope="col">Evidência posterior</th><th scope="col">Base</th></tr></thead><tbody>{dados.map((item) => <tr key={item.chave}><td>{item.contexto}</td><td>{escala(item.compreensaoMedia)} ({percentual(item.compreensaoPercentual)})</td><td>{percentual(item.desempenhoMedioPosterior)}</td><td>{item.quantidadeCompreensoes} compreensão(ões) em {item.quantidadeSessoes} sessão(ões) · {item.quantidadeEvidenciasPosteriores} evidência(s){item.quantidadeEvidenciasPosteriores > 0 && !item.amostraEvidenciasSuficiente ? " · Amostra insuficiente" : ""}</td></tr>)}</tbody></table></div></details>
  </>;
}

export function GraficosDashboard({ dados }: { dados: DashboardObservacional }) {
  const percepcoes = dados.evolucaoPercepcoes.filter((item) => item.mediaCompreensaoPercebida !== null && item.mediaDificuldadePercebida !== null).map((item) => ({ ...item, semana: dataUtc(item.periodoInicio), intervalo: `${dataUtc(item.periodoInicio)} a ${dataUtc(item.periodoFim)}` }));
  const contextosComparaveis = [...dados.resultadosMetodosEvidencias, ...dados.resultadosFormatosEvidencias].filter((item) => item.compreensaoMedia !== null && item.desempenhoMedioPosterior !== null && item.amostraEvidenciasSuficiente);
  const contextosEmLinha = contextosComparaveis.filter((item) => Math.abs((item.compreensaoMedia ?? 0) * 20 - (item.desempenhoMedioPosterior ?? 0)) <= 15).length;
  const contextosEmDesacordo = contextosComparaveis.length - contextosEmLinha;
  return <section aria-labelledby="titulo-graficos-dashboard" className={estilos.gradeGraficos}>
    <h2 className={estilos.tituloOculto} id="titulo-graficos-dashboard">Gráficos dos registros de estudo</h2>
    <article className={`${estilos.cartaoGrafico} ${estilos.cartaoEvolucao}`}>
      <div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>AUTORRELATO</p><h3>Evolução da percepção</h3><p>Médias semanais de dificuldade e compreensão percebidas, de 1 a 5. Cada ponto requer duas percepções na semana; não mede desempenho.</p></div></div>
      {percepcoes.length ? <>
        <div aria-label={`Evolução das percepções em ${percepcoes.length} semana(s) com amostra suficiente. Consulte a tabela para valores exatos.`} className={estilos.areaGraficoPrincipal} role="img"><ResponsiveContainer width="100%" height="100%"><AreaChart data={percepcoes} margin={{ top: 18, right: 14, left: 8, bottom: 2 }} accessibilityLayer><defs><linearGradient id="area-compreensao-dashboard" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4d9bf9" stopOpacity={0.18} /><stop offset="100%" stopColor="#4d9bf9" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis dataKey="semana" tickLine={false} axisLine={false} /><YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(valor) => ({ 1: "Muito baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito alta" }[valor as 1 | 2 | 3 | 4 | 5])} tickLine={false} axisLine={false} width={72} /><Tooltip labelFormatter={(_valor, itens) => itens?.[0]?.payload?.intervalo ?? "Semana"} formatter={(valor) => [escala(Number(valor)), "Percepção"]} /><Legend align="right" verticalAlign="top" /><Area dataKey="mediaCompreensaoPercebida" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 2 }} fill="url(#area-compreensao-dashboard)" name="Compreensão" stroke="#4d9bf9" strokeWidth={2.5} type="monotone" /><Line dataKey="mediaDificuldadePercebida" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 2 }} name="Dificuldade" stroke="#ff7a1a" strokeWidth={2.5} type="monotone" /></AreaChart></ResponsiveContainer></div>
        <details className={estilos.detalhes}><summary>Ver dados em tabela</summary><div className={estilos.tabelaResponsiva}><table><caption>Médias semanais da percepção {dados.periodoFiltrado ? "no período filtrado" : "nos últimos 90 dias"}</caption><thead><tr><th scope="col">Semana</th><th scope="col">Percepções</th><th scope="col">Compreensão</th><th scope="col">Dificuldade</th></tr></thead><tbody>{percepcoes.map((item) => <tr key={item.periodoInicio.toISOString()}><td>{item.intervalo}</td><td>{item.quantidadePercepcoes}</td><td>{escala(item.mediaCompreensaoPercebida)}</td><td>{escala(item.mediaDificuldadePercebida)}</td></tr>)}</tbody></table></div></details>
      </> : <p className={estilos.estadoVazio}>Ainda não há semanas com duas percepções registradas. Registre compreensão e dificuldade ao concluir as sessões.</p>}
    </article>
    <article className={`${estilos.cartaoGrafico} ${estilos.cartaoAnel}`}>
      <div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>SÍNTESE VISUAL</p><h3>Percepção × evidências</h3><p>Resume somente contextos com amostra suficiente; não demonstra causalidade.</p></div></div>
      <GraficoAnelObservacional ariaLabel={`Resumo em anel: ${contextosEmLinha} contextos em linha e ${contextosEmDesacordo} em desacordo`} centro="Associação observacional" primario={{ rotulo: "Em linha", descricao: "Diferença de até 15 pontos entre percepção e evidência.", valor: contextosEmLinha }} secundario={{ rotulo: "Em desacordo", descricao: "Diferença acima de 15 pontos nos contextos comparáveis.", valor: contextosEmDesacordo }} />
    </article>
    <details className={estilos.contextosSecundarios}>
      <summary>Ver métodos e formatos</summary>
      <div className={estilos.gradeContextos}>
        <article className={estilos.cartaoGrafico}><div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>PERCEPÇÃO E EVIDÊNCIAS</p><h3>Métodos × Resultados</h3><p>Compara compreensão percebida nas sessões com o desempenho das evidências confirmadas posteriormente no mesmo módulo.</p></div></div><GraficoContextual itens={dados.resultadosMetodosEvidencias} titulo="Métodos × Resultados" formatar={(chave) => formatarMetodoEstudo(chave as MetodoEstudo)} vazio="Ainda não há métodos com percepção e evidências posteriores suficientes para esta comparação." /></article>
        <article className={estilos.cartaoGrafico}><div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>PERCEPÇÃO E EVIDÊNCIAS</p><h3>Formatos × Resultados</h3><p>Compara compreensão percebida com as evidências confirmadas posteriores associadas a cada formato registrado.</p></div></div><GraficoContextual itens={dados.resultadosFormatosEvidencias} titulo="Formatos × Resultados" formatar={(chave) => formatarFormato(chave as FormatoConteudo)} vazio="Ainda não há formatos com percepção e evidências posteriores suficientes para esta comparação." /></article>
      </div>
    </details>
  </section>;
}
