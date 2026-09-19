"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PontoEvolucao = { rotulo: string; nota: number; tentativa: string };

export function GraficoEvolucao({ dados }: { dados: PontoEvolucao[] }) {
  if (!dados.length) return <p className="rotulo">Ainda não há avaliações concluídas para mostrar uma evolução.</p>;
  const descricao = dados.map((item) => `${item.rotulo}: ${Math.round(item.nota)}%`).join("; ");
  return <div className="grafico-acessivel">
    <div className="area-grafico" role="img" aria-label={`Gráfico de linha das notas por tentativa. ${descricao}.`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={dados}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="rotulo" /><YAxis domain={[0, 100]} /><Tooltip formatter={(valor) => [`${valor}%`, "Nota"]} /><Line dataKey="nota" dot={{ r: 4 }} stroke="#2457d6" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer>
    </div>
    <details className="detalhes-grafico"><summary>Ver valores da evolução em tabela</summary><table><caption>Notas cronológicas por tentativa</caption><thead><tr><th scope="col">Tentativa</th><th scope="col">Data</th><th scope="col">Nota</th></tr></thead><tbody>{dados.map((item) => <tr key={item.tentativa}><td>{item.tentativa}</td><td>{item.rotulo}</td><td>{Math.round(item.nota)}%</td></tr>)}</tbody></table></details>
  </div>;
}
