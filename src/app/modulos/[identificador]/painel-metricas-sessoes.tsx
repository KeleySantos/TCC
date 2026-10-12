"use client";
import { normalizarEscalaPercebida } from "@/dominio/analises/aprendizagem-modulo";

import type { ComponentProps } from "react";
import { Area as RechartsArea, AreaChart, CartesianGrid, ComposedChart, Legend, Line as RechartsLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BrainCircuit, Clock3, Shapes, TimerReset } from "lucide-react";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { GraficoAnelObservacional } from "@/componentes/grafico-anel-observacional";
import estilos from "./painel-metricas-sessoes.module.css";

function Area(props: ComponentProps<typeof RechartsArea>) { return <RechartsArea isAnimationActive={false} {...props} />; }
function Line(props: ComponentProps<typeof RechartsLine>) { return <RechartsLine isAnimationActive={false} {...props} />; }

type NivelAmostra = "AUSENTE" | "INSUFICIENTE" | "INICIAL" | "RECORRENTE";
type ResumoContextual<T extends string> = { chave: T; quantidadeSessoes: number; quantidadeCompreensoes: number; mediaCompreensaoPercebida: number | null; minutosAssociados: number; percentualSessoes: number; nivelAmostra: NivelAmostra };

export type MetricasSessoesExibicao = {
  versaoAlgoritmo: string;
  tempoEstudo: { quantidadeSessoesValidas: number; minutosTotais: number; mediaMinutos: number | null };
  frequencia: { diasComEstudo: number; maiorSequenciaDias: number; primeiraSessaoEm: string | null; ultimaSessaoEm: string | null };
  regularidade: { semanasAtivas: number; semanasNoPeriodo: number; proporcaoSemanasAtivas: number; classificacao: "SEM_DADOS" | "INSUFICIENTE" | "ESPORADICA" | "MODERADA" | "CONSTANTE" };
  percepcoes: { amostra: number; mediaDificuldadePercebida: number | null; mediaCompreensaoPercebida: number | null; nivelAmostra: NivelAmostra };
  porMetodo: ResumoContextual<MetodoEstudo>[];
  porFormato: ResumoContextual<FormatoConteudo>[];
  evolucaoSemanal: {
    periodicidade: "SEMANAL_UTC";
    pontos: Array<{
      periodoInicio: string;
      periodoFim: string;
      quantidadeSessoes: number;
      minutosTotais: number;
      mediaMinutos: number;
      diasComEstudo: number;
      quantidadePercepcoes: number;
      mediaDificuldadePercebida: number | null;
      mediaCompreensaoPercebida: number | null;
      metodos: Array<{ chave: MetodoEstudo; quantidadeSessoes: number }>;
      formatos: Array<{ chave: FormatoConteudo; quantidadeSessoes: number }>;
    }>;
  };
  limitacoes: string[];
};

export type AprendizagemMetricasExibicao = {
  duracaoSessoesComMelhorResultado: { mediaMinutos: number | null; quantidadeSessoes: number; compreensaoMinima: number; desempenhoMinimo: number };
  metodoMaiorCompreensao: ResultadoContextoAprendizagem | null;
  formatoMaiorCompreensao: ResultadoContextoAprendizagem | null;
  evolucaoPercepcaoEvidencia: Array<{ periodoInicio: string; periodoFim: string; quantidadePercepcoes: number; mediaCompreensaoPercebida: number | null; quantidadeEvidencias: number; desempenhoMedioEvidencias: number | null }>;
};

function formatarDuracao(minutos: number | null) {
  if (minutos === null) return "—";
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = Math.floor(minutos / 60);
  const restantes = Math.round(minutos % 60);
  return restantes ? `${horas}h ${restantes}min` : `${horas}h`;
}

function formatarDataUtc(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(valor));
}

function rotuloAmostra(nivel: NivelAmostra) {
  if (nivel === "RECORRENTE") return "Amostra recorrente";
  if (nivel === "INICIAL") return "Amostra inicial";
  if (nivel === "INSUFICIENTE") return "Evidência insuficiente";
  return "Sem evidência";
}

function formatarEscala(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`;
}

export function PainelMetricasSessoes({ metricas, aprendizagem, tituloModulo, idTitulo = "titulo-metricas-sessoes", tituloPainel }: { metricas: MetricasSessoesExibicao; aprendizagem?: AprendizagemMetricasExibicao; tituloModulo: string; idTitulo?: string; tituloPainel?: string }) {
  const pontos = metricas.evolucaoSemanal.pontos.map((ponto) => ({
    ...ponto,
    id: ponto.periodoInicio,
    rotulo: formatarDataUtc(ponto.periodoInicio),
    intervalo: `${formatarDataUtc(ponto.periodoInicio)} a ${formatarDataUtc(ponto.periodoFim)}`,
  }));
  const possuiSessoes = metricas.tempoEstudo.quantidadeSessoesValidas > 0;
  const periodo = metricas.frequencia.primeiraSessaoEm && metricas.frequencia.ultimaSessaoEm
    ? `${formatarDataUtc(metricas.frequencia.primeiraSessaoEm)} a ${formatarDataUtc(metricas.frequencia.ultimaSessaoEm)}`
    : "Nenhum período disponível";
  const pontosPercepcao = pontos.filter((ponto) => ponto.mediaDificuldadePercebida !== null && ponto.mediaCompreensaoPercebida !== null);
  const pontosResultados = (aprendizagem?.evolucaoPercepcaoEvidencia ?? []).map((ponto) => ({
    ...ponto,
    id: ponto.periodoInicio,
    rotulo: formatarDataUtc(ponto.periodoInicio),
    intervalo: `${formatarDataUtc(ponto.periodoInicio)} a ${formatarDataUtc(ponto.periodoFim)}`,
    compreensaoPercentual: ponto.mediaCompreensaoPercebida === null ? null : normalizarEscalaPercebida(ponto.mediaCompreensaoPercebida),
  }));
  const metodoDestaque = aprendizagem?.metodoMaiorCompreensao ?? null;
  const formatoDestaque = aprendizagem?.formatoMaiorCompreensao ?? null;
  const percentualRegularidade = Math.round(metricas.regularidade.proporcaoSemanasAtivas * 100);
  const semanasSemEstudo = Math.max(0, metricas.regularidade.semanasNoPeriodo - metricas.regularidade.semanasAtivas);
  const duracaoDestaque = aprendizagem?.duracaoSessoesComMelhorResultado.mediaMinutos === null
    ? "Dados insuficientes"
    : formatarDuracao(aprendizagem?.duracaoSessoesComMelhorResultado.mediaMinutos ?? null);
  const metodoDestaqueRotulo = metodoDestaque ? formatarMetodoEstudo(metodoDestaque.chave as MetodoEstudo) : "Dados insuficientes";
  const formatoDestaqueRotulo = formatoDestaque ? formatarFormato(formatoDestaque.chave as FormatoConteudo) : "Dados insuficientes";

  return <section aria-labelledby={idTitulo} className={estilos.painel}>
    <header className={estilos.cabecalho}>
      <div><p className={estilos.sobretitulo}>MÉTRICAS DAS SESSÕES</p><h2 id={idTitulo}>{tituloPainel ?? `Seu ritmo em ${tituloModulo}`}</h2><p>Resultados descritivos das sessões concluídas. Eles não medem capacidade nem demonstram causa.</p></div>
      <div className={estilos.metadados}><strong>{periodo}</strong><span>{metricas.versaoAlgoritmo}</span></div>
    </header>

    {aprendizagem ? <div className={estilos.indicadores}>
      <article><span className={estilos.icone}><TimerReset aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Duração associada a melhores resultados</span><strong>{duracaoDestaque}</strong></div></article>
      <article><span className={estilos.icone}><BrainCircuit aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Método associado à maior compreensão</span><strong>{metodoDestaqueRotulo}</strong></div></article>
      <article><span className={estilos.icone}><Shapes aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Formato associado à maior compreensão</span><strong>{formatoDestaqueRotulo}</strong></div></article>
    </div> : <div className={estilos.indicadores}>
      <article><span className={estilos.icone}><Clock3 aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Tempo estudado</span><strong>{formatarDuracao(metricas.tempoEstudo.minutosTotais)}</strong></div></article>
      <article><span className={estilos.icone}><TimerReset aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Duração média</span><strong>{formatarDuracao(metricas.tempoEstudo.mediaMinutos)}</strong></div></article>
      <article><span className={estilos.icone}><TimerReset aria-hidden="true" /></span><div className={estilos.conteudoIndicador}><span className={estilos.rotuloIndicador}>Regularidade do estudo</span><strong>{metricas.regularidade.classificacao === "SEM_DADOS" ? "—" : metricas.regularidade.classificacao === "INSUFICIENTE" ? "Dados insuficientes" : metricas.regularidade.classificacao.toLowerCase()}</strong></div></article>
    </div>}

    {!possuiSessoes ? <div className={estilos.vazioPrincipal}><Clock3 aria-hidden="true" /><h3>As métricas começam com uma sessão concluída</h3><p>Registre pelo menos cinco minutos de estudo para formar o primeiro resultado.</p></div> : <>
      {aprendizagem ? <div className={estilos.gradeDestaque}>
        <article className={estilos.cartaoLargo}>
          <div className={estilos.tituloCartao}><div><p>EVOLUÇÃO SEMANAL</p><h3>Percepção × evidências ao longo do tempo</h3><span>Compara a compreensão percebida com o desempenho registrado em avaliações posteriores, sem atribuir causalidade. Percepção normalizada de 0 a 100 não é percentual de acertos.</span></div><strong>{pontosResultados.length} período(s)</strong></div>
          {pontosResultados.length ? <><div aria-label={`Evolução semanal da percepção e das evidências. ${pontosResultados.map((ponto) => `${ponto.intervalo}: compreensão ${ponto.mediaCompreensaoPercebida === null ? "sem dado" : ponto.mediaCompreensaoPercebida.toFixed(1)} de 5 e evidências ${ponto.desempenhoMedioEvidencias === null ? "sem dado" : `${ponto.desempenhoMedioEvidencias.toFixed(0)}%`}`).join("; ")}.`} className={estilos.graficoPrincipal} role="img">
            <ResponsiveContainer height="100%" width="100%"><AreaChart accessibilityLayer data={pontosResultados} margin={{ top: 6, right: 8, left: -12, bottom: 2 }}><defs><linearGradient id="preenchimentoCompreensaoModulo" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4d9bf9" stopOpacity={0.22} /><stop offset="100%" stopColor="#4d9bf9" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis axisLine={false} dataKey="rotulo" minTickGap={20} tickLine={false} /><YAxis axisLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(valor) => `${valor}`} tickLine={false} /><Tooltip formatter={(valor, nome) => [`${Number(valor).toFixed(0)}${String(nome).includes("Compreensão") ? "/100" : "%"}`, nome]} labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"} /><Legend align="right" verticalAlign="top" /><Area connectNulls={false} dataKey="compreensaoPercentual" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 3 }} fill="url(#preenchimentoCompreensaoModulo)" name="Compreensão percebida (0–100)" stroke="#4d9bf9" strokeWidth={3} type="monotone" /><Line connectNulls={false} dataKey="desempenhoMedioEvidencias" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Evidências válidas" stroke="#ff7a1a" strokeWidth={3} type="monotone" /></AreaChart></ResponsiveContainer>
          </div>
          <details className={estilos.detalhes}><summary>Ver evolução em tabela</summary><div className={estilos.tabela}><table><caption>Compreensão percebida e evidências válidas por semana</caption><thead><tr><th scope="col">Período</th><th scope="col">Compreensão</th><th scope="col">Percepções</th><th scope="col">Desempenho nas evidências</th><th scope="col">Evidências</th></tr></thead><tbody>{pontosResultados.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{formatarEscala(ponto.mediaCompreensaoPercebida)}</td><td>{ponto.quantidadePercepcoes}</td><td>{ponto.desempenhoMedioEvidencias === null ? "—" : `${ponto.desempenhoMedioEvidencias.toFixed(0)}%`}</td><td>{ponto.quantidadeEvidencias}</td></tr>)}</tbody></table></div></details></> : <div className={estilos.vazioCompacto}><p>Ainda não há percepção e evidência posterior para comparar.</p><small>Registre a compreensão nas sessões e resultados em avaliações posteriores.</small></div>}
        </article>
        <article className={`${estilos.cartaoLargo} ${estilos.cartaoAnel}`}>
          <div className={estilos.tituloCartao}><div><p>REGULARIDADE</p><h3>Regularidade do estudo</h3><span>{metricas.regularidade.classificacao === "SEM_DADOS" ? "Sem dados" : metricas.regularidade.classificacao === "INSUFICIENTE" ? "Dados insuficientes" : metricas.regularidade.classificacao.toLowerCase()} · semanas com ao menos uma sessão válida.</span></div></div>
          <GraficoAnelObservacional ariaLabel={`Regularidade observada: ${metricas.regularidade.semanasAtivas} de ${metricas.regularidade.semanasNoPeriodo} semanas com estudo`} centro="Regularidade observada" primario={{ rotulo: `${percentualRegularidade}% das semanas`, descricao: "Com pelo menos uma sessão válida.", valor: metricas.regularidade.semanasAtivas }} secundario={{ rotulo: "Sem estudo registrado", descricao: "Sem sessão válida no período.", valor: semanasSemEstudo }} />
        </article>
      </div> : <article className={estilos.cartaoLargo}>
        <div className={estilos.tituloCartao}><div><p>EVOLUÇÃO SEMANAL</p><h3>Tempo e compreensão ao longo do tempo</h3><span>Cada ponto usa semanas UTC iniciadas na segunda-feira.</span></div><strong>{pontos.length} período(s)</strong></div>
        <div aria-label={`Evolução semanal. ${pontos.map((ponto) => `${ponto.intervalo}: ${ponto.minutosTotais} minutos em ${ponto.quantidadeSessoes} sessão(ões)`).join("; ")}.`} className={estilos.graficoPrincipal} role="img">
          <ResponsiveContainer height="100%" width="100%"><AreaChart accessibilityLayer data={pontos} margin={{ top: 6, right: 8, left: -12, bottom: 2 }}><defs><linearGradient id="preenchimentoMinutosModulo" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4d9bf9" stopOpacity={0.22} /><stop offset="100%" stopColor="#4d9bf9" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis axisLine={false} dataKey="rotulo" minTickGap={20} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} yAxisId="minutos" /><YAxis axisLine={false} domain={[1, 5]} orientation="right" ticks={[1, 2, 3, 4, 5]} tickLine={false} yAxisId="compreensao" /><Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"} /><Legend align="right" verticalAlign="top" /><Area dataKey="minutosTotais" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 3 }} fill="url(#preenchimentoMinutosModulo)" name="Minutos" stroke="#4d9bf9" strokeWidth={3} type="monotone" yAxisId="minutos" /><Line connectNulls={false} dataKey="mediaCompreensaoPercebida" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Compreensão média" stroke="#ff7a1a" strokeWidth={3} type="monotone" yAxisId="compreensao" /></AreaChart></ResponsiveContainer>
        </div>
        <details className={estilos.detalhes}><summary>Ver evolução em tabela</summary><div className={estilos.tabela}><table><caption>Tempo e compreensão percebida por semana</caption><thead><tr><th scope="col">Período</th><th scope="col">Tempo</th><th scope="col">Compreensão média</th><th scope="col">Percepções</th></tr></thead><tbody>{pontos.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{formatarDuracao(ponto.minutosTotais)}</td><td>{formatarEscala(ponto.mediaCompreensaoPercebida)}</td><td>{ponto.quantidadePercepcoes}</td></tr>)}</tbody></table></div></details>
      </article>}

      <article className={estilos.cartaoLargo}>
        <div className={estilos.tituloCartao}><div><p>PERCEPÇÕES</p><h3>Dificuldade e compreensão percebidas</h3><span>Médias semanais aparecem somente com duas percepções no período.</span></div><strong>{metricas.percepcoes.amostra} registro(s)</strong></div>
        <div className={estilos.resumoPercepcoes}><div><span>Dificuldade média</span><strong>{metricas.percepcoes.mediaDificuldadePercebida?.toFixed(1).replace(".", ",") ?? "—"}/5</strong></div><div><span>Compreensão média</span><strong>{metricas.percepcoes.mediaCompreensaoPercebida?.toFixed(1).replace(".", ",") ?? "—"}/5</strong></div><small>{rotuloAmostra(metricas.percepcoes.nivelAmostra)}</small></div>
        {pontosPercepcao.length ? <><div aria-label={`Evolução semanal das percepções. ${pontosPercepcao.map((ponto) => `${ponto.intervalo}: dificuldade ${ponto.mediaDificuldadePercebida?.toFixed(1)}, compreensão ${ponto.mediaCompreensaoPercebida?.toFixed(1)}`).join("; ")}.`} className={estilos.graficoPercepcoes} role="img"><ResponsiveContainer height="100%" width="100%"><ComposedChart accessibilityLayer data={pontosPercepcao} margin={{ top: 6, right: 8, left: -12, bottom: 2 }}><CartesianGrid stroke="#e7edf4" strokeDasharray="3 5" vertical /><XAxis axisLine={false} dataKey="rotulo" tickLine={false} /><YAxis axisLine={false} domain={[1, 5]} tickCount={5} tickLine={false} /><Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"} /><Legend align="right" verticalAlign="top" /><Line dataKey="mediaDificuldadePercebida" dot={{ fill: "#ff7a1a", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Dificuldade" stroke="#ff7a1a" strokeWidth={3} type="monotone" /><Line dataKey="mediaCompreensaoPercebida" dot={{ fill: "#4d9bf9", r: 5, stroke: "#fff", strokeWidth: 3 }} name="Compreensão" stroke="#4d9bf9" strokeWidth={3} type="monotone" /></ComposedChart></ResponsiveContainer></div><details className={estilos.detalhes}><summary>Ver percepções em tabela</summary><div className={estilos.tabela}><table><caption>Médias semanais com amostra suficiente</caption><thead><tr><th scope="col">Período</th><th scope="col">Amostra</th><th scope="col">Dificuldade</th><th scope="col">Compreensão</th></tr></thead><tbody>{pontosPercepcao.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{ponto.quantidadePercepcoes}</td><td>{ponto.mediaDificuldadePercebida?.toFixed(1).replace(".", ",")}/5</td><td>{ponto.mediaCompreensaoPercebida?.toFixed(1).replace(".", ",")}/5</td></tr>)}</tbody></table></div></details></> : <div className={estilos.vazioCompacto}><p>Evidência semanal insuficiente.</p><small>São necessárias duas percepções na mesma semana para formar uma média.</small></div>}
      </article>
    </>}

    <details className={estilos.criterios}><summary>Como estas métricas são calculadas</summary><ul>{metricas.limitacoes.map((limitacao) => <li key={limitacao}>{limitacao}</li>)}</ul></details>
  </section>;
}
