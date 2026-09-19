"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DadoDesempenho = { contexto: string; mediaNotas: number; quantidadeEvidencias: number };

export function GraficoDesempenhoContextual({ titulo, dados }: { titulo: string; dados: DadoDesempenho[] }) {
  if (!dados.length) return <p className="rotulo">Ainda não há exposições únicas suficientes para comparar este contexto.</p>;
  const descricao = dados.map((item) => `${item.contexto}: ${Math.round(item.mediaNotas)}% em ${item.quantidadeEvidencias} observação(ões)`).join("; ");
  return <div className="grafico-acessivel">
    <div className="area-grafico" role="img" aria-label={`${titulo}. ${descricao}.`}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={dados}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="contexto" /><YAxis domain={[0, 100]} /><Tooltip formatter={(valor) => [`${valor}%`, "Média observada"]} /><Bar dataKey="mediaNotas" fill="#2457d6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>
    <details className="detalhes-grafico"><summary>Ver valores do gráfico em tabela</summary><table><caption>{titulo}</caption><thead><tr><th scope="col">Contexto</th><th scope="col">Média observada</th><th scope="col">Amostra</th></tr></thead><tbody>{dados.map((item) => <tr key={item.contexto}><td>{item.contexto}</td><td>{Math.round(item.mediaNotas)}%</td><td>{item.quantidadeEvidencias}</td></tr>)}</tbody></table></details>
  </div>;
}
