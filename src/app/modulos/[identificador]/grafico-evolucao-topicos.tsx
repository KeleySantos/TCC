"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import estilos from "./page.module.css";

export type PontoGraficoTopicos = {
  id: string;
  rotulo: string;
  intervalo: string;
  taxa: number;
  quantidadeTopicos: number;
  quantidadeTentativas: number;
};

export function GraficoEvolucaoTopicos({ dados }: { dados: PontoGraficoTopicos[] }) {
  if (!dados.length) return <div className={estilos.estadoVazioGrafico}><p>Ainda não há avaliações concluídas para acompanhar a evolução.</p><small>O primeiro ponto aparecerá depois de uma avaliação válida.</small></div>;

  const descricao = dados.map((ponto) => `${ponto.rotulo}: ${Math.round(ponto.taxa)}%, ${ponto.quantidadeTopicos} tópico(s)`).join("; ");
  return <div>
    <div className={estilos.areaGraficoPrincipal} role="img" aria-label={`Evolução semanal da média das taxas de acerto por tópico. ${descricao}.`}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart accessibilityLayer data={dados} margin={{ top: 18, right: 12, left: -16, bottom: 2 }}>
          <defs>
            <linearGradient id="preenchimento-evolucao-topicos" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6847ef" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#6847ef" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7e8f5" strokeDasharray="4 4" vertical={false} />
          <XAxis axisLine={false} dataKey="rotulo" minTickGap={18} stroke="#70799b" tickLine={false} />
          <YAxis axisLine={false} domain={[0, 100]} stroke="#70799b" tickFormatter={(valor) => `${valor}%`} tickLine={false} />
          <Tooltip
            contentStyle={{ border: "1px solid #dedff0", borderRadius: 12, boxShadow: "0 12px 30px rgb(31 37 82 / 12%)" }}
            formatter={(valor) => [`${Math.round(Number(valor))}%`, "Média dos tópicos"]}
            labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"}
          />
          <Area activeDot={{ r: 7 }} dataKey="taxa" dot={{ r: 4, fill: "#fff", strokeWidth: 3 }} fill="url(#preenchimento-evolucao-topicos)" stroke="#6040ee" strokeWidth={3} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <details className={estilos.detalhesGrafico}>
      <summary>Ver valores e amostras em tabela</summary>
      <div className={estilos.tabelaGrafico}>
        <table>
          <caption>Média semanal das taxas de acerto dos tópicos com evidência</caption>
          <thead><tr><th scope="col">Período</th><th scope="col">Média</th><th scope="col">Tópicos</th><th scope="col">Tentativas</th></tr></thead>
          <tbody>{dados.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{Math.round(ponto.taxa)}%</td><td>{ponto.quantidadeTopicos}</td><td>{ponto.quantidadeTentativas}</td></tr>)}</tbody>
        </table>
      </div>
    </details>
  </div>;
}
