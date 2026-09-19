"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import estilos from "./painel-bloom.module.css";

export type DadoGraficoBloom = {
  nivel: string;
  taxaAcerto: number;
  quantidadeRespostas: number;
};

export function GraficoBloom({ dados }: { dados: DadoGraficoBloom[] }) {
  if (!dados.length) {
    return (
      <div className={estilos.estadoVazioGrafico}>
        <strong>Amostra ainda insuficiente</strong>
        <p>Cada nível precisa de ao menos duas respostas classificadas para aparecer no gráfico.</p>
      </div>
    );
  }

  const descricao = dados
    .map((item) => `${item.nivel}: ${Math.round(item.taxaAcerto)}% em ${item.quantidadeRespostas} respostas`)
    .join("; ");

  return (
    <div className={estilos.areaGrafico} role="img" aria-label={`Taxa de acerto por nível de Bloom. ${descricao}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 20, top: 6, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="#eceaf5" strokeDasharray="3 3" />
          <XAxis domain={[0, 100]} tickFormatter={(valor) => `${valor}%`} type="number" />
          <YAxis dataKey="nivel" tick={{ fill: "#5f6888", fontSize: 11 }} type="category" width={88} />
          <Tooltip
            formatter={(valor) => [`${Number(valor).toFixed(0)}%`, "Taxa de acerto"]}
            labelFormatter={(rotulo) => `Nível: ${rotulo}`}
          />
          <Bar dataKey="taxaAcerto" fill="#6947e8" radius={[0, 7, 7, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
