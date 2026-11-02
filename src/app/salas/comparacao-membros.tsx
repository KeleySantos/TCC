"use client";

import { normalizarEscalaPercebida } from "@/dominio/analises/aprendizagem-modulo";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import estilos from "./dashboard-sala.module.css";

type PontoPercepcaoEvidencia = {
  quantidadePercepcoes: number;
  mediaCompreensaoPercebida: number | null;
  quantidadeEvidencias: number;
  desempenhoMedioEvidencias: number | null;
};

export type ParticipanteComparacao = {
  vinculoId: string;
  nome: string;
  evolucaoPercepcaoEvidencia: PontoPercepcaoEvidencia[];
};

function mediaPonderada(pontos: PontoPercepcaoEvidencia[], quantidade: "quantidadePercepcoes" | "quantidadeEvidencias", valor: "mediaCompreensaoPercebida" | "desempenhoMedioEvidencias") {
  return pontos.reduce((acumulado, ponto) => {
    const amostra = ponto[quantidade];
    const media = ponto[valor];
    if (amostra <= 0 || media === null) return acumulado;
    return { soma: acumulado.soma + media * amostra, quantidade: acumulado.quantidade + amostra };
  }, { soma: 0, quantidade: 0 });
}

function limitarPercentual(valor: number) {
  return Math.min(100, Math.max(0, valor));
}

export function agregarComparacaoMembros(participantes: ParticipanteComparacao[]) {
  return participantes.map((participante) => {
    const percepcoes = mediaPonderada(participante.evolucaoPercepcaoEvidencia, "quantidadePercepcoes", "mediaCompreensaoPercebida");
    const evidencias = mediaPonderada(participante.evolucaoPercepcaoEvidencia, "quantidadeEvidencias", "desempenhoMedioEvidencias");
    return {
      vinculoId: participante.vinculoId,
      nome: participante.nome,
      percepcao: percepcoes.quantidade ? limitarPercentual(normalizarEscalaPercebida(percepcoes.soma / percepcoes.quantidade)) : null,
      evidencias: evidencias.quantidade ? limitarPercentual(evidencias.soma / evidencias.quantidade) : null,
      quantidadePercepcoes: percepcoes.quantidade,
      quantidadeEvidencias: evidencias.quantidade,
    };
  });
}

function rotuloPercepcao(valor: number | null) {
  return valor === null ? "Sem percepção no período" : `${valor.toFixed(0)}/100`;
}

function rotuloEvidencias(valor: number | null) {
  return valor === null ? "Sem evidências válidas no período" : `${valor.toFixed(0)}%`;
}

export function ComparacaoMembros({ participantes }: { participantes: ParticipanteComparacao[] }) {
  const dados = agregarComparacaoMembros(participantes);
  const descricao = dados.map((item) => `${item.nome}: percepção ${rotuloPercepcao(item.percepcao)}; evidências ${rotuloEvidencias(item.evidencias)}`).join(". ");

  return <section aria-labelledby="titulo-comparacao-membros" className={estilos.comparacao}>
    <div className={estilos.tituloComparacao}><div><p>COMPARAÇÃO DA SALA</p><h3 id="titulo-comparacao-membros">Percepção × evidências por participante</h3></div></div>
    <p>Comparação descritiva no período atual, sem ordem, ranking ou conclusão sobre capacidade.</p>
    {dados.length ? <>
      <div aria-label={`Percepção e evidências por participante. ${descricao}.`} className={estilos.graficoComparacao} role="img">
        <ResponsiveContainer height="100%" width="100%"><BarChart accessibilityLayer data={dados} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}><CartesianGrid stroke="#e8e8f3" strokeDasharray="4 4" vertical={false} /><XAxis axisLine={false} dataKey="nome" tickLine={false} /><YAxis axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} /><Tooltip formatter={(valor, nome) => [valor === null || valor === undefined ? "Sem dado" : `${Number(valor).toFixed(0)}${String(nome) === "Percepção" ? "/100" : "%"}`, nome]} /><Legend /><Bar dataKey="percepcao" fill="var(--cor-dados-azul)" name="Percepção" radius={[7, 7, 0, 0]} /><Bar dataKey="evidencias" fill="var(--cor-dados-amarelo)" name="Evidências" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <div className={estilos.tabela}><table aria-label="Percepção e evidências por participante"><caption>Percepção e evidências por participante</caption><thead><tr><th scope="col">Participante</th><th scope="col">Percepção</th><th scope="col">Evidências</th><th scope="col">Amostra</th></tr></thead><tbody>{dados.map((item) => <tr key={item.vinculoId}><td>{item.nome}</td><td>{rotuloPercepcao(item.percepcao)}</td><td>{rotuloEvidencias(item.evidencias)}</td><td>{item.quantidadePercepcoes} percepção(ões) · {item.quantidadeEvidencias} evidência(s)</td></tr>)}</tbody></table></div>
    </> : <p className={estilos.avisoPrivacidade}>Ainda não há participantes ativos com dashboard compartilhado para comparar.</p>}
  </section>;
}
