"use client";

import { useId, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";
import estilos from "./interpretacao-automatica.module.css";

const ROTULOS_ORIGEM = { GROQ: "Groq", LOCAL: "resposta local" } as const;
const ROTULOS_CONFIANCA = { BAIXA: "Evidência inicial", MODERADA: "Evidência moderada", FORTE: "Padrão recorrente" } as const;

export type PropriedadesInterpretacao = {
  identificadorModulo?: string;
  className?: string;
  inicio?: string;
  fim?: string;
  compacto?: boolean;
  modalLateral?: boolean;
  moduloCompartilhadoId?: string;
  aoPerderAcesso?: () => void;
};

export function InterpretacaoAutomatica({ identificadorModulo, moduloCompartilhadoId, aoPerderAcesso, className, inicio, fim, compacto = false, modalLateral = false }: PropriedadesInterpretacao = {}) {
  const [interpretacao, definirInterpretacao] = useState<InterpretacaoGerada | null>(null);
  const [processando, definirProcessando] = useState(false);
  const [erro, definirErro] = useState(false);
  const [acessoPerdido, definirAcessoPerdido] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const botaoAbrir = useRef<HTMLButtonElement>(null);
  const tituloPainel = useId();
  const tituloConteudo = useId();

  const gerar = async () => {
    definirProcessando(true);
    definirErro(false);
    try {
      const parametros = new URLSearchParams();
      if (inicio && fim) { parametros.set("inicio", inicio); parametros.set("fim", fim); }
      const consulta = parametros.size ? `?${parametros.toString()}` : "";
      const endpoint = moduloCompartilhadoId ? `/api/compartilhamentos/modulos/${encodeURIComponent(moduloCompartilhadoId)}/interpretacoes${consulta}` : identificadorModulo ? `/api/modulos/${encodeURIComponent(identificadorModulo)}/interpretacoes${consulta}` : "/api/interpretacoes";
      const resposta = await fetch(endpoint, { method: "POST" });
      if (moduloCompartilhadoId && [401, 403, 404].includes(resposta.status)) {
        definirInterpretacao(null); definirErro(true); definirAcessoPerdido(true); aoPerderAcesso?.(); return;
      }
      const dados = await resposta.json();
      definirInterpretacao(resposta.ok ? dados.interpretacao : null);
      definirErro(!resposta.ok);
    } catch {
      definirInterpretacao(null);
      definirErro(true);
    } finally {
      definirProcessando(false);
    }
  };

  const conteudo = <section className={["cartao", className].filter(Boolean).join(" ")} aria-labelledby={tituloConteudo}>
    {!compacto && <p className="sobretitulo">INTERPRETAÇÃO OPCIONAL</p>}
    <h2 id={tituloConteudo}>Insights da IA</h2>
    {!compacto && <p className="rotulo">O Groq interpreta métricas já calculadas pelo sistema. A IA observa padrões e propõe reflexões; ela não calcula resultados nem altera registros.</p>}
    {!modalLateral && <button aria-busy={processando} className="botao" disabled={processando} onClick={gerar} type="button">{processando ? "Preparando interpretação..." : identificadorModulo ? "Analisar este módulo" : "Gerar interpretação"}</button>}
    {modalLateral && processando && <p className={estilos.estadoProcessando} role="status">Preparando interpretação...</p>}
    {erro && <p className="mensagem-erro" role="alert">{acessoPerdido ? "Seu acesso a este dashboard não está mais disponível." : "Não foi possível preparar a interpretação agora. Tente novamente."}</p>}
    {interpretacao && <div className="interpretacao" aria-live="polite"><p className="selo">{interpretacao.origem === "LOCAL" ? "Reflexão local de contingência" : `Interpretação por ${ROTULOS_ORIGEM[interpretacao.origem]}`}</p>{interpretacao.modelo && <p className="rotulo">Modelo utilizado: {interpretacao.modelo}</p>}{interpretacao.motivoContingencia && <p className="rotulo">A análise externa não estava disponível; as métricas continuaram funcionando e foi preparada uma reflexão local.</p>}{interpretacao.tentativas.length > 1 && <details><summary>Ver caminho do fallback</summary><ol>{interpretacao.tentativas.map((tentativa, indice) => <li key={`${tentativa.provedor}-${indice}`}>{ROTULOS_ORIGEM[tentativa.provedor]} · {tentativa.resultado}</li>)}</ol></details>}{interpretacao.insights.map((insight, indice) => <article key={`${insight.tipo}-${indice}`}><p className="rotulo">{ROTULOS_CONFIANCA[insight.confianca]}</p><h3>{insight.titulo}</h3><p>{insight.observacao}</p>{insight.resumoEvidencias && <p className="rotulo">{insight.resumoEvidencias}</p>}{insight.perguntaReflexiva && <p><strong>Para refletir:</strong> {insight.perguntaReflexiva}</p>}{insight.experimentoSugerido && <p><strong>Uma experiência possível:</strong> {insight.experimentoSugerido}</p>}</article>)}<p className="aviso">{interpretacao.limitacao}</p><p className="rotulo">Amostra: {interpretacao.contexto.quantidadeSessoesValidas} sessão(ões), {interpretacao.contexto.minutosValidos} minuto(s) válido(s), versão {interpretacao.contexto.versaoAlgoritmo}.</p></div>}
  </section>;

  if (!modalLateral) return conteudo;

  const fechar = () => dialogo.current?.close();
  const abrir = () => {
    dialogo.current?.showModal();
    if (!processando) void gerar();
  };
  return <>
    <button aria-busy={processando} className={estilos.botaoAbrir} onClick={abrir} ref={botaoAbrir} type="button"><Sparkles aria-hidden="true" size={17} />Gerar interpretação da IA</button>
    <dialog aria-labelledby={tituloPainel} className={estilos.dialogoLateral} onClick={(evento) => { if (evento.target === evento.currentTarget) fechar(); }} onClose={() => botaoAbrir.current?.focus()} ref={dialogo}>
      <div className={estilos.painel}>
        <header className={estilos.cabecalhoPainel}><h2 id={tituloPainel}>Interpretação da IA</h2><button aria-label="Fechar interpretação da IA" className={estilos.botaoFechar} onClick={fechar} type="button"><X aria-hidden="true" size={20} /></button></header>
        <div className={estilos.conteudoPainel}>{conteudo}</div>
      </div>
    </dialog>
  </>;
}
