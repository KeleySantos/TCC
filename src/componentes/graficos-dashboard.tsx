"use client";
import { normalizarEscalaPercebida } from "@/dominio/analises/aprendizagem-modulo";

import type { ComponentProps } from "react";
import { Bar as RechartsBar, BarChart, CartesianGrid, Legend, Line as RechartsLine, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { AjudaMetrica } from "./ajuda-metrica";
import { GraficoAnelObservacional } from "./grafico-anel-observacional";
import estilos from "./graficos-dashboard.module.css";

const DESCRICAO_AUTORRELATO = "Médias semanais de dificuldade e compreensão percebidas, de 1 a 5. Cada ponto requer duas percepções na semana; não mede desempenho.";
const DESCRICAO_SINTESE = "Resume somente contextos com amostra suficiente; não demonstra causalidade.";

function Bar(props: ComponentProps<typeof RechartsBar>) { return <RechartsBar isAnimationActive={false} {...props} />; }
function Line(props: ComponentProps<typeof RechartsLine>) { return <RechartsLine isAnimationActive={false} {...props} />; }

function dataUtc(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(data));
}

function escala(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`;
}

function percentual(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(0)}%`;
}

function GraficoContextual({ itens, titulo, formatar, vazio }: {
  itens: ResultadoContextoAprendizagem[];
  titulo: string;
  formatar: (chave: string) => string;
  vazio: string;
}) {
  const dados = itens.map((item) => ({ ...item, contexto: formatar(item.chave), compreensaoPercentual: item.compreensaoMedia === null ? null : normalizarEscalaPercebida(item.compreensaoMedia) }));
  if (!dados.length) return <p className={estilos.estadoVazio}>{vazio}</p>;
  const descricao = dados.map((item) => `${item.contexto}: compreensão percebida ${escala(item.compreensaoMedia)} (${item.compreensaoPercentual === null ? "—" : `${item.compreensaoPercentual.toFixed(0)}/100`}), evidência posterior ${percentual(item.desempenhoMedioPosterior)}, ${item.quantidadeCompreensoes} compreensão(ões) em ${item.quantidadeSessoes} sessão(ões) e ${item.quantidadeEvidenciasPosteriores} evidência(s)`).join("; ");
  return <>
    <div aria-label={`${titulo}. ${descricao}.`} className={estilos.areaGrafico} role="img">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={dados} layout="vertical" barCategoryGap="38%" margin={{ top: 18, right: 12, left: 4, bottom: 8 }} accessibilityLayer><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" horizontal={false} /><XAxis type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(valor) => `${valor}`} tickLine={false} axisLine={false} /><YAxis dataKey="contexto" type="category" width={108} tickFormatter={(valor) => String(valor).slice(0, 18)} tickLine={false} axisLine={false} /><Tooltip formatter={(valor, nome) => [`${Number(valor).toFixed(0)}${String(nome).includes("Compreensão") ? "/100" : "%"}`, nome]} /><Legend align="right" verticalAlign="top" /><Bar dataKey="compreensaoPercentual" fill="#95B1EE" maxBarSize={14} name="Compreensão percebida (0–100)" radius={[0, 3, 3, 0]} /><Bar dataKey="desempenhoMedioPosterior" fill="#FCDD9D" maxBarSize={14} name="Evidência posterior" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer>
    </div>
  </>;
}

export function GraficosDashboard({ dados }: { dados: DashboardObservacional }) {
  const percepcoes = dados.evolucaoPercepcoes.filter((item) => item.mediaCompreensaoPercebida !== null && item.mediaDificuldadePercebida !== null).map((item) => ({ ...item, semana: dataUtc(item.periodoInicio), intervalo: `${dataUtc(item.periodoInicio)} a ${dataUtc(item.periodoFim)}` }));
  const contextosComparaveis = [...dados.resultadosMetodosEvidencias, ...dados.resultadosFormatosEvidencias].filter((item) => item.compreensaoMedia !== null && item.desempenhoMedioPosterior !== null && item.amostraEvidenciasSuficiente);
  const contextosEmLinha = contextosComparaveis.filter((item) => Math.abs(normalizarEscalaPercebida(item.compreensaoMedia ?? 1) - (item.desempenhoMedioPosterior ?? 0)) <= 15).length;
  const contextosEmDesacordo = contextosComparaveis.length - contextosEmLinha;
  const descricaoPercepcoes = percepcoes.map((item) => `${item.intervalo}: ${item.quantidadePercepcoes} percepção(ões), compreensão ${escala(item.mediaCompreensaoPercebida)} e dificuldade ${escala(item.mediaDificuldadePercebida)}`).join("; ");
  return <section aria-labelledby="titulo-graficos-dashboard" className={estilos.gradeGraficos}>
    <h2 className={estilos.tituloOculto} id="titulo-graficos-dashboard">Gráficos dos registros de estudo</h2>
    <article className={`${estilos.cartaoGrafico} ${estilos.cartaoEvolucao}`}>
      <div className={estilos.cabecalhoGrafico}><h3>Evolução da percepção</h3><AjudaMetrica descricao={DESCRICAO_AUTORRELATO} titulo="Evolução da percepção" /></div>
      {percepcoes.length ? <>
        <div aria-label={`Evolução das percepções em ${percepcoes.length} semana(s) com amostra suficiente. ${descricaoPercepcoes}.`} className={estilos.areaGraficoPrincipal} role="img"><ResponsiveContainer width="100%" height="100%"><LineChart data={percepcoes} margin={{ top: 18, right: 14, left: 8, bottom: 2 }} accessibilityLayer><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis dataKey="semana" tickLine={false} axisLine={false} /><YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(valor) => ({ 1: "Muito baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito alta" }[valor as 1 | 2 | 3 | 4 | 5])} tickLine={false} axisLine={false} width={72} /><Tooltip labelFormatter={(_valor, itens) => itens?.[0]?.payload?.intervalo ?? "Semana"} formatter={(valor) => [escala(Number(valor)), "Percepção"]} /><Legend align="right" verticalAlign="top" /><Line dataKey="mediaCompreensaoPercebida" dot={{ fill: "#95B1EE", r: 5, stroke: "#fff", strokeWidth: 2 }} name="Compreensão" stroke="#95B1EE" strokeWidth={2.5} type="linear" /><Line dataKey="mediaDificuldadePercebida" dot={{ fill: "#FCDD9D", r: 5, stroke: "#fff", strokeWidth: 2 }} name="Dificuldade" stroke="#FCDD9D" strokeWidth={2.5} type="linear" /></LineChart></ResponsiveContainer></div>
      </> : <p className={estilos.estadoVazio}>Ainda não há semanas com duas percepções registradas. Registre compreensão e dificuldade ao concluir as sessões.</p>}
    </article>
    <article className={`${estilos.cartaoGrafico} ${estilos.cartaoAnel}`}>
      <div className={estilos.cabecalhoGrafico}><h3>Percepção × evidências</h3><AjudaMetrica descricao={DESCRICAO_SINTESE} titulo="Percepção × evidências" /></div>
      <GraficoAnelObservacional ariaLabel={`Resumo em anel: ${contextosEmLinha} contextos em linha e ${contextosEmDesacordo} em desacordo`} centro="Associação observacional" primario={{ rotulo: "Em linha", descricao: "Diferença de até 15 pontos entre percepção e evidência.", valor: contextosEmLinha }} secundario={{ rotulo: "Em desacordo", descricao: "Diferença acima de 15 pontos nos contextos comparáveis.", valor: contextosEmDesacordo }} />
    </article>
    <div className={estilos.contextosSecundarios}>
      <div className={estilos.gradeContextos}>
        <article className={estilos.cartaoGrafico}><div className={estilos.cabecalhoGrafico}><div><h3>Métodos × Resultados</h3><p>Compara compreensão percebida nas sessões com o desempenho das evidências válidas posteriormente no mesmo módulo.</p></div></div><GraficoContextual itens={dados.resultadosMetodosEvidencias} titulo="Métodos × Resultados" formatar={(chave) => formatarMetodoEstudo(chave as MetodoEstudo)} vazio="Ainda não há métodos com percepção e evidências posteriores suficientes para esta comparação." /></article>
        <article className={estilos.cartaoGrafico}><div className={estilos.cabecalhoGrafico}><div><h3>Formatos × Resultados</h3><p>Compara compreensão percebida com as evidências válidas posteriores associadas a cada formato registrado.</p></div></div><GraficoContextual itens={dados.resultadosFormatosEvidencias} titulo="Formatos × Resultados" formatar={(chave) => formatarFormato(chave as FormatoConteudo)} vazio="Ainda não há formatos com percepção e evidências posteriores suficientes para esta comparação." /></article>
      </div>
    </div>
  </section>;
}
