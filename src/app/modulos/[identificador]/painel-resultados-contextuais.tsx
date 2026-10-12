"use client";
import { normalizarEscalaPercebida } from "@/dominio/analises/aprendizagem-modulo";

import type { ComponentProps } from "react";
import { CartesianGrid, Legend, Line as RechartsLine, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import estilos from "./page.module.css";

function Line(props: ComponentProps<typeof RechartsLine>) { return <RechartsLine isAnimationActive={false} {...props} />; }

function escala(valor: number | null) { return valor === null ? "Sem média disponível" : `${valor.toFixed(1).replace(".", ",")}/5`; }
function percentual(valor: number | null) { return valor === null ? "Sem evidência posterior" : `${valor.toFixed(0)}%`; }
function plural(quantidade: number, singular: string, plural: string) { return `${quantidade} ${quantidade === 1 ? singular : plural}`; }

function GraficoResultados({ itens, formatar, titulo }: { itens: ResultadoContextoAprendizagem[]; formatar: (chave: string) => string; titulo: string }) {
  if (!itens.length) return <div className={estilos.estadoVazioAnalise}><p>Ainda não há sessões válidas neste contexto.</p><small>Os resultados aparecerão após registros concluídos.</small></div>;
  const dados = itens.map((item) => ({ ...item, contexto: formatar(item.chave), compreensaoPercentual: item.compreensaoMedia === null ? null : normalizarEscalaPercebida(item.compreensaoMedia) }));
  const descricao = dados.map((item) => `${item.contexto}: compreensão ${escala(item.compreensaoMedia)}, evidências ${percentual(item.desempenhoMedioPosterior)}`).join("; ");
  return <>
    <div aria-label={`${titulo}. ${descricao}. Consulte a tabela para valores e amostras.`} className={estilos.graficoResultadosContextuais} role="img">
      <ResponsiveContainer height="100%" width="100%"><LineChart accessibilityLayer data={dados} margin={{ top: 6, right: 8, left: -12, bottom: 5 }}><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis axisLine={false} dataKey="contexto" tickFormatter={(valor) => String(valor).slice(0, 11)} tickLine={false} /><YAxis axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(valor) => `${valor}`} tickLine={false} /><Tooltip formatter={(valor, nome) => [`${Number(valor).toFixed(0)}${String(nome).includes("Compreensão") ? "/100" : "%"}`, nome]} /><Legend align="right" verticalAlign="top" /><Line connectNulls={false} dataKey="compreensaoPercentual" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Compreensão percebida (0–100)" stroke="#4d9bf9" strokeWidth={3} type="monotone" /><Line connectNulls={false} dataKey="desempenhoMedioPosterior" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Evidências posteriores" stroke="#ff7a1a" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer>
    </div>
    <details className={estilos.detalhesResultadosContextuais}><summary>Ver dados em tabela</summary><div className={estilos.tabelaResultadosContextuais}><table><caption>{titulo}</caption><thead><tr><th scope="col">Contexto</th><th scope="col">Compreensão</th><th scope="col">Evidências</th><th scope="col">Base</th></tr></thead><tbody>{dados.map((item) => <tr key={item.chave}><td>{item.contexto}</td><td>{escala(item.compreensaoMedia)}</td><td>{percentual(item.desempenhoMedioPosterior)}</td><td>{plural(item.quantidadeCompreensoes, "compreensão", "compreensões")} em {plural(item.quantidadeSessoes, "sessão", "sessões")} · {plural(item.quantidadeEvidenciasPosteriores, "evidência", "evidências")}{item.quantidadeEvidenciasPosteriores > 0 && !item.amostraEvidenciasSuficiente ? " · Amostra insuficiente" : ""}</td></tr>)}</tbody></table></div></details>
  </>;
}

export function PainelResultadosContextuais({ metodos, formatos, idTitulo = "titulo-resultados-contextuais" }: { metodos: ResultadoContextoAprendizagem[]; formatos: ResultadoContextoAprendizagem[]; idTitulo?: string }) {
  return <section aria-labelledby={idTitulo} className={estilos.blocoResultadosContextuais}><header><p className={estilos.sobretituloPagina}>PERCEPÇÃO E EVIDÊNCIAS</p><h2 id={idTitulo}>Resultados associados às formas de estudo</h2><p>As relações descrevem o que foi observado nas sessões e nas evidências posteriores disponíveis; não demonstram causalidade. Contextos podem se sobrepor. Percepção normalizada (1→0; 5→100) não é percentual de acertos.</p></header><div className={estilos.gradeResultadosContextuais}><article className={estilos.blocoAprendizagem}><h3>Métodos × Resultados</h3><GraficoResultados formatar={(chave) => formatarMetodoEstudo(chave as MetodoEstudo)} itens={metodos} titulo="Métodos × Resultados" /></article><article className={estilos.blocoAprendizagem}><h3>Formatos × Resultados</h3><GraficoResultados formatar={(chave) => formatarFormato(chave as FormatoConteudo)} itens={formatos} titulo="Formatos × Resultados" /></article></div></section>;
}
