"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function GraficoDesempenho({ dados }: { dados: Array<{ topico: string; nota: number | null }> }) {
  const dadosValidos = dados.filter((item): item is { topico: string; nota: number } => item.nota !== null);
  if (!dadosValidos.length) return <p className="rotulo">Ainda não há resultados suficientes para exibir o gráfico.</p>;
  const descricao = dadosValidos.map((item) => `${item.topico}: ${Math.round(item.nota)}%`).join("; ");
  return <div className="grafico-acessivel">
    <div className="area-grafico" role="img" aria-label={`Gráfico de barras com a última nota por tópico. ${descricao}.`}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={dadosValidos}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="topico" /><YAxis domain={[0, 100]} /><Tooltip formatter={(valor) => [`${valor}%`, "Última nota"]} /><Bar dataKey="nota" fill="#2457d6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
    </div>
    <details className="detalhes-grafico">
      <summary>Ver valores do gráfico em tabela</summary>
      <table>
        <caption>Última nota registrada por tópico</caption>
        <thead><tr><th scope="col">Tópico</th><th scope="col">Última nota</th></tr></thead>
        <tbody>{dadosValidos.map((item) => <tr key={item.topico}><td>{item.topico}</td><td>{Math.round(item.nota)}%</td></tr>)}</tbody>
      </table>
    </details>
  </div>;
}
