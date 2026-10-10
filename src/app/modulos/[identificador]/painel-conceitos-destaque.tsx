import type { ClassificacaoConceitoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import estilos from "./page.module.css";

function escala(valor: number | null) { return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`; }
function ListaConceitos({ itens }: { itens: ClassificacaoConceitoAprendizagem[] }) {
  if (!itens.length) return <div className={estilos.estadoVazioAnalise}><p>Ainda não há dados suficientes para classificar conceitos.</p><small>São necessárias pelo menos duas observações recentes.</small></div>;
  return <ul className={estilos.listaConceitosDestaque}>{itens.map((item) => <li key={item.chave}><strong>{item.nome}</strong><span>Dificuldade percebida: {escala(item.dificuldadeMedia)}</span><span>Compreensão percebida: {escala(item.compreensaoMedia)}</span><span>Evidências: {item.desempenhoMedio === null ? "—" : `${item.desempenhoMedio.toFixed(0)}%`}</span><small>{item.sessoes} sessões · {item.evidencias} evidências{!item.evidenciasSuficientes ? " · Evidências ainda insuficientes" : ""}</small></li>)}</ul>;
}

export function PainelConceitosDestaque({ maiorDificuldade, maiorCompreensao }: { maiorDificuldade: ClassificacaoConceitoAprendizagem[]; maiorCompreensao: ClassificacaoConceitoAprendizagem[] }) {
  return <section className={estilos.gradeConceitosDestaque} aria-label="Conceitos em destaque nos últimos 90 dias"><article className={estilos.blocoAprendizagem}><h2>Conceitos com maior dificuldade</h2><p>Sinais recentes de dificuldade percebida, baixa compreensão ou baixo desempenho.</p><ListaConceitos itens={maiorDificuldade} /></article><article className={estilos.blocoAprendizagem}><h2>Conceitos com maior compreensão</h2><p>Sinais recentes de compreensão, baixa dificuldade e desempenho confirmado.</p><ListaConceitos itens={maiorCompreensao} /></article></section>;
}
