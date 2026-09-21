"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricasSessoesExibicao } from "@/app/modulos/[identificador]/painel-metricas-sessoes";
import estilos from "./dashboard-sala.module.css";

type ParticipanteComparacao = { vinculoId: string; nome: string; metricas: MetricasSessoesExibicao };

export function ComparacaoMembros({ participantes }: { participantes: ParticipanteComparacao[] }) {
  const [visivel, definirVisivel] = useState(false);
  if (participantes.length < 2) return <p className={estilos.avisoPrivacidade}>A comparação exige consentimento ativo de pelo menos dois membros.</p>;
  const dados = participantes.map((item) => ({ nome: item.nome, minutos: item.metricas.tempoEstudo.minutosTotais, sessoes: item.metricas.tempoEstudo.quantidadeSessoesValidas }));
  return <section aria-labelledby="titulo-comparacao-membros" className={estilos.comparacao}>
    <div className={estilos.tituloComparacao}><div><p>COMPARAÇÃO OPCIONAL</p><h3 id="titulo-comparacao-membros">Evolução dos membros consentidos</h3></div><button aria-expanded={visivel} onClick={() => definirVisivel((atual) => !atual)} type="button">{visivel ? "Ocultar comparação" : "Mostrar comparação"}</button></div>
    <p>Leitura descritiva, sem ordem, ranking ou conclusão sobre capacidade. Somente membros que autorizaram aparecem.</p>
    {visivel && <><div aria-label={`Comparação consentida. ${dados.map((item) => `${item.nome}: ${item.minutos} minutos em ${item.sessoes} sessões`).join("; ")}.`} className={estilos.graficoComparacao} role="img"><ResponsiveContainer height="100%" width="100%"><BarChart accessibilityLayer data={dados}><CartesianGrid stroke="#e8e8f3" strokeDasharray="4 4" vertical={false} /><XAxis axisLine={false} dataKey="nome" tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} yAxisId="minutos" /><YAxis allowDecimals={false} axisLine={false} orientation="right" tickLine={false} yAxisId="sessoes" /><Tooltip /><Legend /><Bar dataKey="minutos" fill="#6847ef" name="Minutos" radius={[7, 7, 0, 0]} yAxisId="minutos" /><Bar dataKey="sessoes" fill="#e17843" name="Sessões" radius={[7, 7, 0, 0]} yAxisId="sessoes" /></BarChart></ResponsiveContainer></div><div className={estilos.tabela}><table><caption>Valores utilizados na comparação consentida</caption><thead><tr><th scope="col">Membro</th><th scope="col">Sessões</th><th scope="col">Minutos</th><th scope="col">Dificuldade</th><th scope="col">Compreensão</th></tr></thead><tbody>{participantes.map((item) => <tr key={item.vinculoId}><td>{item.nome}</td><td>{item.metricas.tempoEstudo.quantidadeSessoesValidas}</td><td>{item.metricas.tempoEstudo.minutosTotais}</td><td>{item.metricas.percepcoes.mediaDificuldadePercebida?.toFixed(1).replace(".", ",") ?? "—"}</td><td>{item.metricas.percepcoes.mediaCompreensaoPercebida?.toFixed(1).replace(".", ",") ?? "—"}</td></tr>)}</tbody></table></div></>}
  </section>;
}
