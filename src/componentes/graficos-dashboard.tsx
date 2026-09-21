"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import estilos from "./graficos-dashboard.module.css";

export type PontoEvolucaoDashboard = {
  id: string;
  periodoInicio: string;
  rotulo: string;
  minutosTotais: number;
  quantidadeSessoes: number;
};

export type ResumoMetodoDashboard = {
  id: string;
  metodo: string;
  minutosAssociados: number;
  quantidadeSessoes: number;
  quantidadeModulos: number;
};

type Periodo = 30 | 90 | "todos";
const PERIODOS: Array<{ valor: Periodo; rotulo: string }> = [
  { valor: 30, rotulo: "30 dias" }, { valor: 90, rotulo: "90 dias" }, { valor: "todos", rotulo: "Todo o histórico" },
];

function textoPeriodo(periodo: Periodo) {
  return periodo === "todos" ? "todo o histórico" : `${periodo} dias até a semana mais recente`;
}

export function GraficosDashboard({ evolucao, metodos }: { evolucao: PontoEvolucaoDashboard[]; metodos: ResumoMetodoDashboard[] }) {
  const [periodo, definirPeriodo] = useState<Periodo>(30);
  const evolucaoFiltrada = useMemo(() => {
    if (periodo === "todos" || evolucao.length === 0) return evolucao;
    const registroMaisRecente = Math.max(...evolucao.map((item) => Date.parse(item.periodoInicio)));
    const limite = registroMaisRecente - periodo * 86_400_000;
    return evolucao.filter((item) => Date.parse(item.periodoInicio) >= limite);
  }, [evolucao, periodo]);

  return <section className={estilos.gradeGraficos} aria-labelledby="titulo-indicadores-visuais">
    <h2 className={estilos.tituloOculto} id="titulo-indicadores-visuais">Indicadores visuais do dashboard</h2>
    <article className={`${estilos.cartaoGrafico} ${estilos.graficoPrincipal}`}>
      <div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>EVOLUÇÃO DO ESTUDO</p><h3>Minutos estudados por semana</h3><p>Cada ponto reúne somente sessões concluídas válidas.</p></div><div className={estilos.filtros} aria-label="Período do gráfico de estudo">{PERIODOS.map((opcao) => <button aria-pressed={periodo === opcao.valor} className={periodo === opcao.valor ? estilos.filtroAtivo : undefined} key={opcao.rotulo} onClick={() => definirPeriodo(opcao.valor)} type="button">{opcao.rotulo}</button>)}</div></div>
      {evolucaoFiltrada.length ? <><div className={estilos.areaGrafico} role="img" aria-label={`Gráfico de linha com ${evolucaoFiltrada.length} semana(s) em ${textoPeriodo(periodo)}.`}><ResponsiveContainer width="100%" height="100%"><LineChart data={evolucaoFiltrada} margin={{ top: 12, right: 12, left: -14, bottom: 0 }} accessibilityLayer><CartesianGrid stroke="#e7e8f5" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="rotulo" stroke="#68739b" tickLine={false} axisLine={false} minTickGap={18} /><YAxis domain={[0, "auto"]} stroke="#68739b" tickFormatter={(valor) => `${valor} min`} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ border: "1px solid #dedff0", borderRadius: 12, boxShadow: "0 10px 28px rgb(31 37 82 / 12%)" }} formatter={(valor) => [`${Math.round(Number(valor))} min`, "Tempo estudado"]} /><Line activeDot={{ r: 7 }} dataKey="minutosTotais" dot={{ r: 4, fill: "#ffffff", strokeWidth: 3 }} stroke="#6040ee" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer></div><details className={estilos.detalhes}><summary>Ver as {evolucaoFiltrada.length} semanas em tabela</summary><div className={estilos.tabelaResponsiva}><table><caption>Tempo estudado em {textoPeriodo(periodo)}</caption><thead><tr><th scope="col">Semana</th><th scope="col">Sessões</th><th scope="col">Minutos</th></tr></thead><tbody>{evolucaoFiltrada.map((item) => <tr key={item.id}><td>{item.rotulo}</td><td>{item.quantidadeSessoes}</td><td>{item.minutosTotais}</td></tr>)}</tbody></table></div></details></> : <p className={estilos.estadoVazio}>Ainda não há sessões concluídas neste período.</p>}
    </article>
    <article className={estilos.cartaoGrafico}>
      <div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretitulo}>CONTEXTO POR MÉTODO</p><h3>Tempo associado a cada método</h3><p>Métodos múltiplos são contextos não exclusivos e podem compartilhar a mesma sessão.</p></div></div>
      {metodos.length ? <><div className={estilos.areaGrafico} role="img" aria-label={`Gráfico de barras com o tempo associado a ${metodos.length} método(s).`}><ResponsiveContainer width="100%" height="100%"><BarChart data={metodos} margin={{ top: 12, right: 8, left: -16, bottom: 4 }} accessibilityLayer><CartesianGrid stroke="#e7e8f5" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="metodo" stroke="#68739b" tickLine={false} axisLine={false} tickFormatter={(valor) => String(valor).slice(0, 14)} /><YAxis domain={[0, "auto"]} stroke="#68739b" tickFormatter={(valor) => `${valor} min`} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ border: "1px solid #dedff0", borderRadius: 12 }} formatter={(valor) => [`${Math.round(Number(valor))} min`, "Tempo associado"]} /><Bar dataKey="minutosAssociados" fill="#7858f3" radius={[8, 8, 2, 2]} /></BarChart></ResponsiveContainer></div><details className={estilos.detalhes}><summary>Ver métodos, módulos e amostras</summary><div className={estilos.tabelaResponsiva}><table><caption>Tempo e sessões por método</caption><thead><tr><th scope="col">Método</th><th scope="col">Minutos</th><th scope="col">Módulos</th><th scope="col">Sessões</th></tr></thead><tbody>{metodos.map((item) => <tr key={item.id}><td>{item.metodo}</td><td>{item.minutosAssociados}</td><td>{item.quantidadeModulos}</td><td>{item.quantidadeSessoes}</td></tr>)}</tbody></table></div></details></> : <p className={estilos.estadoVazio}>Ainda não há métodos em sessões concluídas.</p>}
    </article>
  </section>;
}
