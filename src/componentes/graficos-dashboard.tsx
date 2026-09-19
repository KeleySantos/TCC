"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import estilos from "./graficos-dashboard.module.css";

export type PontoAvaliacaoDashboard = {
  id: string;
  modulo: string;
  concluidaEm: string;
  rotulo: string;
  tentativa: string;
  taxaAcerto: number;
};

export type ResumoMetodoDashboard = {
  id: string;
  metodo: string;
  mediaNotas: number;
  quantidadeEvidencias: number;
  quantidadeModulos: number;
};

type Periodo = 30 | 90 | "todos";

const PERIODOS: Array<{ valor: Periodo; rotulo: string }> = [
  { valor: 30, rotulo: "30 dias" },
  { valor: 90, rotulo: "90 dias" },
  { valor: "todos", rotulo: "Todo o histórico" },
];

function textoPeriodo(periodo: Periodo) {
  return periodo === "todos" ? "todo o histórico" : `${periodo} dias até o registro mais recente`;
}

export function GraficosDashboard({
  avaliacoes,
  metodos,
}: {
  avaliacoes: PontoAvaliacaoDashboard[];
  metodos: ResumoMetodoDashboard[];
}) {
  const [periodo, definirPeriodo] = useState<Periodo>(30);
  const avaliacoesFiltradas = useMemo(() => {
    if (periodo === "todos" || avaliacoes.length === 0) return avaliacoes;
    const registroMaisRecente = Math.max(...avaliacoes.map((item) => Date.parse(item.concluidaEm)));
    const limite = registroMaisRecente - periodo * 86_400_000;
    return avaliacoes.filter((item) => Date.parse(item.concluidaEm) >= limite);
  }, [avaliacoes, periodo]);
  return (
    <section className={estilos.gradeGraficos} aria-labelledby="titulo-indicadores-visuais">
      <h2 className={estilos.tituloOculto} id="titulo-indicadores-visuais">Indicadores visuais do dashboard</h2>

      <article className={`${estilos.cartaoGrafico} ${estilos.graficoPrincipal}`}>
        <div className={estilos.cabecalhoGrafico}>
          <div>
            <p className={estilos.sobretitulo}>EVOLUÇÃO OBSERVADA</p>
            <h3>Sua taxa de acerto ao longo do tempo</h3>
            <p>Cada ponto preserva o módulo, a tentativa e a data de origem.</p>
          </div>
          <div className={estilos.filtros} aria-label="Período do gráfico de notas">
            {PERIODOS.map((opcao) => (
              <button
                aria-pressed={periodo === opcao.valor}
                className={periodo === opcao.valor ? estilos.filtroAtivo : undefined}
                key={opcao.rotulo}
                onClick={() => definirPeriodo(opcao.valor)}
                type="button"
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>
        {avaliacoesFiltradas.length ? (
          <>
            <div
              className={estilos.areaGrafico}
              role="img"
              aria-label={`Gráfico de linha com ${avaliacoesFiltradas.length} taxa(s) de acerto em ${textoPeriodo(periodo)}.`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avaliacoesFiltradas} margin={{ top: 12, right: 12, left: -14, bottom: 0 }} accessibilityLayer>
                  <CartesianGrid stroke="#e7e8f5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="rotulo" stroke="#68739b" tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis domain={[0, 100]} stroke="#68739b" tickFormatter={(valor) => `${valor}%`} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ border: "1px solid #dedff0", borderRadius: 12, boxShadow: "0 10px 28px rgb(31 37 82 / 12%)" }}
                    formatter={(valor) => [`${Math.round(Number(valor))}%`, "Taxa de acerto"]}
                    labelFormatter={(rotulo, itens) => `${rotulo}${itens?.[0]?.payload?.modulo ? ` · ${itens[0].payload.modulo}` : ""}`}
                  />
                  <Line activeDot={{ r: 7 }} dataKey="taxaAcerto" dot={{ r: 4, fill: "#ffffff", strokeWidth: 3 }} stroke="#6040ee" strokeWidth={3} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className={estilos.detalhes}>
              <summary>Ver os {avaliacoesFiltradas.length} valores em tabela</summary>
              <div className={estilos.tabelaResponsiva}>
                <table>
                  <caption>Taxas de acerto em {textoPeriodo(periodo)}</caption>
                  <thead><tr><th scope="col">Módulo</th><th scope="col">Tentativa</th><th scope="col">Data</th><th scope="col">Taxa de acerto</th></tr></thead>
                  <tbody>{avaliacoesFiltradas.map((item) => <tr key={item.id}><td>{item.modulo}</td><td>{item.tentativa}</td><td>{item.rotulo}</td><td>{Math.round(item.taxaAcerto)}%</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </>
        ) : <p className={estilos.estadoVazio}>Ainda não há avaliações concluídas neste período.</p>}
      </article>

      <article className={estilos.cartaoGrafico}>
        <div className={estilos.cabecalhoGrafico}>
          <div>
            <p className={estilos.sobretitulo}>DESEMPENHO POR MÉTODO</p>
            <h3>Média observada por método</h3>
            <p>Apenas recorrências presentes em dois ou mais módulos.</p>
          </div>
        </div>
        {metodos.length ? (
          <>
            <div className={estilos.areaGrafico} role="img" aria-label={`Gráfico de barras com a média observada em ${metodos.length} método(s) recorrente(s).`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metodos} margin={{ top: 12, right: 8, left: -16, bottom: 4 }} accessibilityLayer>
                  <CartesianGrid stroke="#e7e8f5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="metodo" stroke="#68739b" tickLine={false} axisLine={false} tickFormatter={(valor) => String(valor).slice(0, 14)} />
                  <YAxis domain={[0, 100]} stroke="#68739b" tickFormatter={(valor) => `${valor}%`} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ border: "1px solid #dedff0", borderRadius: 12 }} formatter={(valor) => [`${Math.round(Number(valor))}%`, "Média observada"]} />
                  <Bar dataKey="mediaNotas" fill="#7858f3" radius={[8, 8, 2, 2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <details className={estilos.detalhes}>
              <summary>Ver médias, módulos e amostras</summary>
              <div className={estilos.tabelaResponsiva}><table><caption>Média observada por método recorrente</caption><thead><tr><th scope="col">Método</th><th scope="col">Média</th><th scope="col">Módulos</th><th scope="col">Amostra</th></tr></thead><tbody>{metodos.map((item) => <tr key={item.id}><td>{item.metodo}</td><td>{Math.round(item.mediaNotas)}%</td><td>{item.quantidadeModulos}</td><td>{item.quantidadeEvidencias}</td></tr>)}</tbody></table></div>
            </details>
          </>
        ) : <p className={estilos.estadoVazio}>Ainda não há um método observado em pelo menos dois módulos.</p>}
      </article>

    </section>
  );
}
