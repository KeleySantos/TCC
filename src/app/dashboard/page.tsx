import Link from "next/link";
import { BookOpenText, CalendarDays, ChartNoAxesCombined, Clock3, ShieldCheck, Trophy } from "lucide-react";
import { formatarData } from "@/biblioteca/formatacao";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { GraficosDashboard, type PontoEvolucaoDashboard, type ResumoMetodoDashboard } from "@/componentes/graficos-dashboard";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { MetodoEstudo } from "@/gerado/prisma/enums";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelPessoal } from "@/servidor/paineis";
import estilos from "./page.module.css";

function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const restante = minutos % 60;
  return restante ? `${horas}h ${restante}min` : `${horas}h`;
}

export default async function PaginaDashboard() {
  const usuario = await exigirUsuario();
  const resumo = await obterPainelPessoal(usuario.id);
  const evolucao: PontoEvolucaoDashboard[] = resumo.consolidado.evolucaoSemanal.pontos.map((ponto) => ({
    id: ponto.periodoInicio.toISOString(), periodoInicio: ponto.periodoInicio.toISOString(), rotulo: formatarData(ponto.periodoInicio),
    minutosTotais: ponto.minutosTotais, quantidadeSessoes: ponto.quantidadeSessoes,
  }));
  const gruposMetodos = new Map<MetodoEstudo, { quantidadeSessoes: number; minutosAssociados: number; modulos: Set<string> }>();
  for (const item of resumo.metricasPorModulo) for (const metodo of item.metricas.porMetodo) {
    const grupo = gruposMetodos.get(metodo.chave) ?? { quantidadeSessoes: 0, minutosAssociados: 0, modulos: new Set<string>() };
    grupo.quantidadeSessoes += metodo.quantidadeSessoes;
    grupo.minutosAssociados += metodo.minutosAssociados;
    grupo.modulos.add(item.modulo.id);
    gruposMetodos.set(metodo.chave, grupo);
  }
  const metodos: ResumoMetodoDashboard[] = [...gruposMetodos.entries()].map(([metodo, grupo]) => ({
    id: metodo, metodo: formatarMetodoEstudo(metodo), minutosAssociados: grupo.minutosAssociados,
    quantidadeSessoes: grupo.quantidadeSessoes, quantidadeModulos: grupo.modulos.size,
  })).sort((a, b) => b.quantidadeSessoes - a.quantidadeSessoes || b.minutosAssociados - a.minutosAssociados || a.metodo.localeCompare(b.metodo));
  const metodoDestaque = metodos[0] ?? null;
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";

  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className={estilos.paginaDashboard} id="conteudo-principal" tabIndex={-1}>
    <header className={estilos.topoConta}><div className={estilos.contextoAtual}><ChartNoAxesCombined aria-hidden="true" /><span>Dashboard pessoal</span></div><Link className={estilos.conta} href="/perfil"><span className={estilos.avatar} aria-hidden="true">{primeiroNome.slice(0, 1).toUpperCase()}</span><span><strong>{usuario.nome}</strong><small>Ver perfil</small></span></Link></header>
    <div className={estilos.areaConteudo}>
      <section className={estilos.boasVindas} aria-labelledby="titulo-dashboard"><div><p className={estilos.sobretitulo}>SUA JORNADA DE APRENDIZAGEM</p><h1 id="titulo-dashboard">Olá, {primeiroNome}! <span aria-hidden="true">👋</span></h1><p>Aqui está o panorama das sessões que você registrou até agora.</p></div><blockquote>“Disciplina hoje,<br />liberdade amanhã.”<cite>— James Clear</cite></blockquote></section>
      <div className={estilos.gradeDashboard}><div className={estilos.colunaIndicadores}>
        <section className={estilos.gradeResumo} aria-label="Resumo pessoal">
          <article className={estilos.cartaoResumo}><span className={`${estilos.iconeResumo} ${estilos.iconeRoxo}`}><BookOpenText aria-hidden="true" /></span><div><p>Módulos ativos</p><strong>{resumo.modulos.length}</strong><small>Organizados na sua conta</small></div></article>
          <article className={estilos.cartaoResumo}><span className={`${estilos.iconeResumo} ${estilos.iconeAzul}`}><CalendarDays aria-hidden="true" /></span><div><p>Sessões concluídas</p><strong>{resumo.consolidado.tempoEstudo.quantidadeSessoesValidas}</strong><small>{resumo.consolidado.frequencia.diasComEstudo} dia(s) com estudo</small></div></article>
          <article className={estilos.cartaoResumo}><span className={`${estilos.iconeResumo} ${estilos.iconeRosa}`}><Clock3 aria-hidden="true" /></span><div><p>Tempo estudado</p><strong>{formatarDuracao(resumo.consolidado.tempoEstudo.minutosTotais)}</strong><small>Média de {resumo.consolidado.tempoEstudo.mediaMinutos === null ? "—" : `${Math.round(resumo.consolidado.tempoEstudo.mediaMinutos)} min`} por sessão</small></div></article>
          <article className={estilos.cartaoResumo}><span className={`${estilos.iconeResumo} ${estilos.iconeAmarelo}`}><Trophy aria-hidden="true" /></span><div><p>Método mais registrado</p><strong className={estilos.valorMetodo}>{metodoDestaque?.metodo ?? "Dados insuficientes"}</strong><small>{metodoDestaque ? `${metodoDestaque.quantidadeSessoes} sessão(ões) · ${metodoDestaque.minutosAssociados} min associados` : "Registre uma sessão concluída com método"}</small></div></article>
        </section>
        <div className={estilos.avisoResponsavel}><ShieldCheck aria-hidden="true" /><p><strong>Leitura responsável.</strong> Os gráficos descrevem tempo, frequência e percepções registradas; eles não medem aprendizagem objetiva, capacidade ou efeito causal de um método.</p></div>
        <GraficosDashboard evolucao={evolucao} metodos={metodos} />
      </div><aside className={estilos.areaInterpretacao} aria-label="Insights da IA"><InterpretacaoAutomatica /></aside></div>
    </div>
  </main></EstruturaAutenticada>;
}
