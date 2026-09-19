"use client";

import { useState } from "react";
import type { InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";

export function InterpretacaoAutomatica({ identificadorModulo, className }: { identificadorModulo?: string; className?: string } = {}) {
  const [interpretacao, definirInterpretacao] = useState<InterpretacaoGerada | null>(null);
  const [processando, definirProcessando] = useState(false);
  const [erro, definirErro] = useState(false);
  const gerar = async () => {
    definirProcessando(true);
    definirErro(false);
    try {
      const endpoint = identificadorModulo ? `/api/modulos/${encodeURIComponent(identificadorModulo)}/interpretacoes` : "/api/interpretacoes";
      const resposta = await fetch(endpoint, { method: "POST" });
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
  return <section className={["cartao", className].filter(Boolean).join(" ")} aria-labelledby="titulo-interpretacao"><p className="sobretitulo">INTERPRETAÇÃO OPCIONAL</p><h2 id="titulo-interpretacao">Insights da IA</h2><p className="rotulo">{identificadorModulo ? "Padrões, feedbacks e perguntas de reflexão baseados somente nas métricas deste módulo." : "Gemini, quando configurada, interpreta um resumo agregado. Ela não recebe nome, respostas, observações livres ou permissão para calcular ou alterar dados."}</p><button aria-busy={processando} className="botao" disabled={processando} onClick={gerar} type="button">{processando ? "Preparando interpretação..." : identificadorModulo ? "Analisar este módulo" : "Gerar interpretação"}</button>{erro && <p className="mensagem-erro" role="alert">Não foi possível preparar a interpretação agora. Tente novamente.</p>}{interpretacao && <div className="interpretacao" aria-live="polite"><p className="selo">{interpretacao.origem === "GEMINI" ? "Interpretação por Gemini" : "Resposta local de contingência"}</p>{interpretacao.motivoContingencia && <p className="rotulo">A interpretação automática não esteve disponível neste momento; foi exibida uma resposta local baseada nas mesmas métricas.</p>}<h3>Padrões observados</h3><ul>{interpretacao.padroesObservados.map((item) => <li key={item}>{item}</li>)}</ul><h3>Feedbacks e próximos passos</h3><ul>{[...interpretacao.feedbacks, ...interpretacao.conselhos].map((item) => <li key={item}>{item}</li>)}</ul><h3>Perguntas para reflexão</h3><ul>{interpretacao.perguntasReflexao.map((item) => <li key={item}>{item}</li>)}</ul><p className="aviso">{interpretacao.limitacao}</p><p className="rotulo">Amostra: {interpretacao.contexto.quantidadeTentativas} tentativa(s), {interpretacao.contexto.minutosValidos} minuto(s) válido(s), versão {interpretacao.contexto.versaoAlgoritmo}.</p></div>}</section>;
}
