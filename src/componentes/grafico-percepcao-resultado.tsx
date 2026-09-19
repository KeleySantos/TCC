"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

type ObservacaoPercepcao = { tentativa: string; nota: number; dificuldadePercebida: number; compreensaoPercebida: number };

export function GraficoPercepcaoResultado({ dados }: { dados: ObservacaoPercepcao[] }) {
  if (!dados.length) return <p className="rotulo">Ainda não há sessões com percepção e avaliação em uma exposição única para comparar.</p>;
  const descricao = dados.map((item) => `${item.tentativa}: compreensão ${item.compreensaoPercebida}/5, dificuldade ${item.dificuldadePercebida}/5 e nota ${Math.round(item.nota)}%`).join("; ");
  return <div className="grafico-acessivel">
    <div className="area-grafico" role="img" aria-label={`Gráfico de dispersão entre compreensão percebida e nota. ${descricao}.`}>
      <ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="compreensaoPercebida" domain={[1, 5]} name="Compreensão percebida" type="number" /><YAxis dataKey="nota" domain={[0, 100]} name="Nota" /><Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(valor, nome) => [nome === "Nota" ? `${valor}%` : `${valor}/5`, nome]} /><Scatter data={dados} fill="#2457d6" name="Observação" /></ScatterChart></ResponsiveContainer>
    </div>
    <details className="detalhes-grafico"><summary>Ver percepção e resultado em tabela</summary><table><caption>Percepção registrada e nota observada por tentativa</caption><thead><tr><th scope="col">Tentativa</th><th scope="col">Dificuldade</th><th scope="col">Compreensão</th><th scope="col">Nota</th></tr></thead><tbody>{dados.map((item) => <tr key={item.tentativa}><td>{item.tentativa}</td><td>{item.dificuldadePercebida}/5</td><td>{item.compreensaoPercebida}/5</td><td>{Math.round(item.nota)}%</td></tr>)}</tbody></table></details>
  </div>;
}
