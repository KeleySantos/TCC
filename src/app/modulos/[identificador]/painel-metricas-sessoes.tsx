"use client";

import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, Clock3, Flame, TimerReset } from "lucide-react";
import { formatarFormato } from "@/biblioteca/formatacao";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import estilos from "./painel-metricas-sessoes.module.css";

type NivelAmostra = "AUSENTE" | "INSUFICIENTE" | "INICIAL" | "RECORRENTE";
type ResumoContextual<T extends string> = { chave: T; quantidadeSessoes: number; minutosAssociados: number; percentualSessoes: number; nivelAmostra: NivelAmostra };

export type MetricasSessoesExibicao = {
  versaoAlgoritmo: string;
  tempoEstudo: { quantidadeSessoesValidas: number; minutosTotais: number; mediaMinutos: number | null };
  frequencia: { diasComEstudo: number; maiorSequenciaDias: number; primeiraSessaoEm: string | null; ultimaSessaoEm: string | null };
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

function GraficoContexto<T extends string>({ dados, titulo, formatar }: { dados: ResumoContextual<T>[]; titulo: string; formatar: (valor: T) => string }) {
  if (!dados.length) return <div className={estilos.vazioCompacto}><p>Sem sessões válidas neste contexto.</p><small>Os dados aparecerão após a primeira sessão concluída.</small></div>;
  const preparados = dados.map((item) => ({ ...item, rotulo: formatar(item.chave), percentual: item.percentualSessoes * 100 }));
  const descricao = preparados.map((item) => `${item.rotulo}: ${item.quantidadeSessoes} sessão(ões), ${formatarDuracao(item.minutosAssociados)}`).join("; ");
  return <>
    <div aria-label={`${titulo}. ${descricao}. Os contextos não são exclusivos.`} className={estilos.graficoContexto} role="img">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart accessibilityLayer data={preparados} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 2 }}>
          <CartesianGrid horizontal={false} stroke="#e8e8f3" strokeDasharray="4 4" />
          <XAxis allowDecimals={false} axisLine={false} type="number" tickLine={false} />
          <YAxis axisLine={false} dataKey="rotulo" type="category" tickLine={false} width={105} />
          <Tooltip formatter={(valor, nome) => [nome === "quantidadeSessoes" ? `${valor} sessão(ões)` : valor, "Sessões"]} />
          <Bar dataKey="quantidadeSessoes" fill="#6847ef" name="Sessões" radius={[0, 7, 7, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <details className={estilos.detalhes}><summary>Ver valores em tabela</summary><div className={estilos.tabela}><table><caption>{titulo}; uma sessão pode aparecer em mais de um contexto.</caption><thead><tr><th scope="col">Contexto</th><th scope="col">Sessões</th><th scope="col">Tempo associado</th><th scope="col">Amostra</th></tr></thead><tbody>{preparados.map((item) => <tr key={item.chave}><td>{item.rotulo}</td><td>{item.quantidadeSessoes}</td><td>{formatarDuracao(item.minutosAssociados)}</td><td>{rotuloAmostra(item.nivelAmostra)}</td></tr>)}</tbody></table></div></details>
  </>;
}

export function PainelMetricasSessoes({ metricas, tituloModulo, idTitulo = "titulo-metricas-sessoes", tituloPainel }: { metricas: MetricasSessoesExibicao; tituloModulo: string; idTitulo?: string; tituloPainel?: string }) {
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

  return <section aria-labelledby={idTitulo} className={estilos.painel}>
    <header className={estilos.cabecalho}>
      <div><p className={estilos.sobretitulo}>MÉTRICAS DAS SESSÕES</p><h2 id={idTitulo}>{tituloPainel ?? `Seu ritmo em ${tituloModulo}`}</h2><p>Resultados descritivos das sessões concluídas. Eles não medem capacidade nem demonstram causa.</p></div>
      <div className={estilos.metadados}><strong>{periodo}</strong><span>{metricas.versaoAlgoritmo}</span></div>
    </header>

    <div className={estilos.indicadores}>
      <article><span className={estilos.icone}><Clock3 aria-hidden="true" /></span><div><p>Tempo estudado</p><strong>{formatarDuracao(metricas.tempoEstudo.minutosTotais)}</strong><small>Sessões concluídas com ao menos 5 min</small></div></article>
      <article><span className={estilos.icone}><CalendarDays aria-hidden="true" /></span><div><p>Sessões válidas</p><strong>{metricas.tempoEstudo.quantidadeSessoesValidas}</strong><small>Planejadas, ativas e invalidadas ficam fora</small></div></article>
      <article><span className={estilos.icone}><TimerReset aria-hidden="true" /></span><div><p>Duração média</p><strong>{formatarDuracao(metricas.tempoEstudo.mediaMinutos)}</strong><small>Média das sessões válidas</small></div></article>
      <article><span className={estilos.icone}><Flame aria-hidden="true" /></span><div><p>Frequência</p><strong>{metricas.frequencia.diasComEstudo} dia(s)</strong><small>Maior sequência: {metricas.frequencia.maiorSequenciaDias} dia(s)</small></div></article>
    </div>

    {!possuiSessoes ? <div className={estilos.vazioPrincipal}><Clock3 aria-hidden="true" /><h3>As métricas começam com uma sessão concluída</h3><p>Registre pelo menos cinco minutos de estudo para formar o primeiro resultado.</p></div> : <>
      <article className={estilos.cartaoLargo}>
        <div className={estilos.tituloCartao}><div><p>EVOLUÇÃO SEMANAL</p><h3>Tempo e quantidade de sessões</h3><span>Cada ponto usa semanas UTC iniciadas na segunda-feira.</span></div><strong>{pontos.length} período(s)</strong></div>
        <div aria-label={`Evolução semanal. ${pontos.map((ponto) => `${ponto.intervalo}: ${ponto.minutosTotais} minutos em ${ponto.quantidadeSessoes} sessão(ões)`).join("; ")}.`} className={estilos.graficoPrincipal} role="img">
          <ResponsiveContainer height="100%" width="100%"><ComposedChart accessibilityLayer data={pontos} margin={{ top: 16, right: 8, left: -12, bottom: 2 }}><CartesianGrid stroke="#e8e8f3" strokeDasharray="4 4" vertical={false} /><XAxis axisLine={false} dataKey="rotulo" minTickGap={20} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} yAxisId="minutos" /><YAxis allowDecimals={false} axisLine={false} orientation="right" tickLine={false} yAxisId="sessoes" /><Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"} /><Legend /><Bar dataKey="minutosTotais" fill="#6847ef" name="Minutos" radius={[7, 7, 0, 0]} yAxisId="minutos" /><Line dataKey="quantidadeSessoes" name="Sessões" stroke="#e17843" strokeWidth={3} type="monotone" yAxisId="sessoes" /></ComposedChart></ResponsiveContainer>
        </div>
        <details className={estilos.detalhes}><summary>Ver evolução em tabela</summary><div className={estilos.tabela}><table><caption>Tempo e frequência semanal das sessões</caption><thead><tr><th scope="col">Período</th><th scope="col">Sessões</th><th scope="col">Tempo</th><th scope="col">Média</th><th scope="col">Dias</th></tr></thead><tbody>{pontos.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{ponto.quantidadeSessoes}</td><td>{formatarDuracao(ponto.minutosTotais)}</td><td>{formatarDuracao(ponto.mediaMinutos)}</td><td>{ponto.diasComEstudo}</td></tr>)}</tbody></table></div></details>
      </article>

      <div className={estilos.gradeContextos}>
        <article className={estilos.cartao}><div className={estilos.tituloCartao}><div><p>COMO VOCÊ ESTUDOU</p><h3>Métodos utilizados</h3><span>Uma sessão pode registrar vários métodos.</span></div></div><GraficoContexto dados={metricas.porMetodo} formatar={formatarMetodoEstudo} titulo="Sessões por método" /></article>
        <article className={estilos.cartao}><div className={estilos.tituloCartao}><div><p>EM QUE FORMATO</p><h3>Formatos utilizados</h3><span>Os formatos são declarados na sessão.</span></div></div><GraficoContexto dados={metricas.porFormato} formatar={formatarFormato} titulo="Sessões por formato" /></article>
      </div>

      <article className={estilos.cartaoLargo}>
        <div className={estilos.tituloCartao}><div><p>PERCEPÇÕES</p><h3>Dificuldade e compreensão percebidas</h3><span>Médias semanais aparecem somente com duas percepções no período.</span></div><strong>{metricas.percepcoes.amostra} registro(s)</strong></div>
        <div className={estilos.resumoPercepcoes}><div><span>Dificuldade média</span><strong>{metricas.percepcoes.mediaDificuldadePercebida?.toFixed(1).replace(".", ",") ?? "—"}/5</strong></div><div><span>Compreensão média</span><strong>{metricas.percepcoes.mediaCompreensaoPercebida?.toFixed(1).replace(".", ",") ?? "—"}/5</strong></div><small>{rotuloAmostra(metricas.percepcoes.nivelAmostra)}</small></div>
        {pontosPercepcao.length ? <><div aria-label={`Evolução semanal das percepções. ${pontosPercepcao.map((ponto) => `${ponto.intervalo}: dificuldade ${ponto.mediaDificuldadePercebida?.toFixed(1)}, compreensão ${ponto.mediaCompreensaoPercebida?.toFixed(1)}`).join("; ")}.`} className={estilos.graficoPercepcoes} role="img"><ResponsiveContainer height="100%" width="100%"><ComposedChart accessibilityLayer data={pontosPercepcao} margin={{ top: 12, right: 8, left: -12, bottom: 2 }}><CartesianGrid stroke="#e8e8f3" strokeDasharray="4 4" vertical={false} /><XAxis axisLine={false} dataKey="rotulo" tickLine={false} /><YAxis axisLine={false} domain={[1, 5]} tickCount={5} tickLine={false} /><Tooltip labelFormatter={(_rotulo, itens) => itens?.[0]?.payload?.intervalo ?? "Período"} /><Legend /><Line dataKey="mediaDificuldadePercebida" name="Dificuldade" stroke="#d56a45" strokeWidth={3} type="monotone" /><Line dataKey="mediaCompreensaoPercebida" name="Compreensão" stroke="#347dcc" strokeWidth={3} type="monotone" /></ComposedChart></ResponsiveContainer></div><details className={estilos.detalhes}><summary>Ver percepções em tabela</summary><div className={estilos.tabela}><table><caption>Médias semanais com amostra suficiente</caption><thead><tr><th scope="col">Período</th><th scope="col">Amostra</th><th scope="col">Dificuldade</th><th scope="col">Compreensão</th></tr></thead><tbody>{pontosPercepcao.map((ponto) => <tr key={ponto.id}><td>{ponto.intervalo}</td><td>{ponto.quantidadePercepcoes}</td><td>{ponto.mediaDificuldadePercebida?.toFixed(1).replace(".", ",")}/5</td><td>{ponto.mediaCompreensaoPercebida?.toFixed(1).replace(".", ",")}/5</td></tr>)}</tbody></table></div></details></> : <div className={estilos.vazioCompacto}><p>Evidência semanal insuficiente.</p><small>São necessárias duas percepções na mesma semana para formar uma média.</small></div>}
      </article>
    </>}

    <details className={estilos.criterios}><summary>Como estas métricas são calculadas</summary><ul>{metricas.limitacoes.map((limitacao) => <li key={limitacao}>{limitacao}</li>)}</ul></details>
  </section>;
}
