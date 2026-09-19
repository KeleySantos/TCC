import Link from "next/link";
import {
  BookOpenText,
  CalendarDays,
  ChartNoAxesCombined,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { formatarData, formatarPorcentagem } from "@/biblioteca/formatacao";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import {
  GraficosDashboard,
  type PontoAvaliacaoDashboard,
  type ResumoMetodoDashboard,
} from "@/componentes/graficos-dashboard";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelPessoal } from "@/servidor/paineis";
import estilos from "./page.module.css";

export default async function PaginaDashboard() {
  const usuario = await exigirUsuario();
  const resumo = await obterPainelPessoal(usuario.id);
  const avaliacoes: PontoAvaliacaoDashboard[] = resumo.metricasPorModulo.flatMap((item) => {
    const modulo = resumo.modulos.find((moduloAtual) => moduloAtual.id === item.modulo.id);
    return item.metricas.evolucao.pontos.map((ponto) => ({
      id: ponto.tentativaId,
      modulo: modulo?.titulo ?? "Módulo arquivado",
      concluidaEm: ponto.concluidaEm.toISOString(),
      rotulo: formatarData(ponto.concluidaEm),
      tentativa: `Tentativa ${ponto.numeroTentativa}`,
      taxaAcerto: ponto.nota,
    }));
  }).sort((a, b) => Date.parse(a.concluidaEm) - Date.parse(b.concluidaEm) || a.id.localeCompare(b.id));
  const metodosGrafico: ResumoMetodoDashboard[] = resumo.recorrencias
    .filter((item) => item.tipo === "METODO")
    .map((item) => ({
      id: `${item.tipo}-${item.chave}`,
      metodo: formatarMetodoEstudo(item.chave),
      mediaNotas: item.mediaNotas,
      quantidadeEvidencias: item.quantidadeEvidencias,
      quantidadeModulos: item.quantidadeModulos,
    }));
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";
  const metodoDestaque = resumo.metodoComMaiorMediaObservada;

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.paginaDashboard} id="conteudo-principal" tabIndex={-1}>
        <header className={estilos.topoConta}>
          <div className={estilos.contextoAtual}><ChartNoAxesCombined aria-hidden="true" /><span>Dashboard pessoal</span></div>
          <Link className={estilos.conta} href="/perfil">
            <span className={estilos.avatar} aria-hidden="true">{primeiroNome.slice(0, 1).toUpperCase()}</span>
            <span><strong>{usuario.nome}</strong><small>Ver perfil</small></span>
          </Link>
        </header>

        <div className={estilos.areaConteudo}>
          <section className={estilos.boasVindas} aria-labelledby="titulo-dashboard">
            <div>
              <p className={estilos.sobretitulo}>SUA JORNADA DE APRENDIZAGEM</p>
              <h1 id="titulo-dashboard">Olá, {primeiroNome}! <span aria-hidden="true">👋</span></h1>
              <p>Aqui está o panorama dos registros que você construiu até agora.</p>
            </div>
            <blockquote>“Disciplina hoje,<br />liberdade amanhã.”<cite>— James Clear</cite></blockquote>
          </section>

          <div className={estilos.gradeDashboard}>
            <div className={estilos.colunaIndicadores}>
              <section className={estilos.gradeResumo} aria-label="Resumo pessoal">
                <article className={estilos.cartaoResumo}>
                  <span className={`${estilos.iconeResumo} ${estilos.iconeRoxo}`}><BookOpenText aria-hidden="true" /></span>
                  <div><p>Módulos ativos</p><strong>{resumo.modulos.length}</strong><small>Organizados na sua conta</small></div>
                </article>
                <article className={estilos.cartaoResumo}>
                  <span className={`${estilos.iconeResumo} ${estilos.iconeAzul}`}><CalendarDays aria-hidden="true" /></span>
                  <div><p>Sessões concluídas</p><strong>{resumo.quantidadeSessoesValidas}</strong><small>Registros próprios válidos</small></div>
                </article>
                <article className={estilos.cartaoResumo}>
                  <span className={`${estilos.iconeResumo} ${estilos.iconeRosa}`}><Target aria-hidden="true" /></span>
                  <div><p>Taxa média de acerto</p><strong>{formatarPorcentagem(resumo.taxaAcertoGeral.taxaAcerto === null ? null : resumo.taxaAcertoGeral.taxaAcerto * 100)}</strong><small>{resumo.taxaAcertoGeral.totalQuestoes ? `${resumo.taxaAcertoGeral.respostasCorretas}/${resumo.taxaAcertoGeral.totalQuestoes} respostas corretas em ${resumo.taxaAcertoGeral.quantidadeModulosComEvidencia} módulo(s)` : "Ainda não há questões respondidas"}</small></div>
                </article>
                <article className={estilos.cartaoResumo}>
                  <span className={`${estilos.iconeResumo} ${estilos.iconeAmarelo}`}><Trophy aria-hidden="true" /></span>
                  <div><p>Método com melhor resultado</p><strong className={estilos.valorMetodo}>{metodoDestaque ? formatarMetodoEstudo(metodoDestaque.chave) : "Dados insuficientes"}</strong><small>{metodoDestaque ? `${formatarPorcentagem(metodoDestaque.mediaNotas)} de média em ${metodoDestaque.quantidadeEvidencias} evidência(s) e ${metodoDestaque.quantidadeModulos} módulo(s)` : "É necessário observar o mesmo método em pelo menos dois módulos"}</small></div>
                </article>
              </section>

              <div className={estilos.avisoResponsavel}>
                <ShieldCheck aria-hidden="true" />
                <p><strong>Leitura responsável.</strong> Os gráficos mostram registros observados e preservam seu contexto; eles não definem capacidade, estilo fixo ou resultado futuro.</p>
              </div>

              <GraficosDashboard avaliacoes={avaliacoes} metodos={metodosGrafico} />
            </div>

            <aside className={estilos.areaInterpretacao} aria-label="Insights da IA">
              <InterpretacaoAutomatica />
            </aside>
          </div>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
