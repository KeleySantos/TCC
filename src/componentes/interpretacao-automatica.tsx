"use client";

import { useState } from "react";
import Link from "next/link";
import type { InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";

const ROTULOS_ORIGEM = { GROQ: "Groq", GEMINI: "Gemini", QWEN: "Qwen", LOCAL: "resposta local" } as const;
const ROTULOS_CONFIANCA = { BAIXA: "Evidência inicial", MODERADA: "Evidência moderada", FORTE: "Padrão recorrente" } as const;

export function InterpretacaoAutomatica({ identificadorModulo, className, inicio, fim, compacto = false }: { identificadorModulo?: string; className?: string; inicio?: string; fim?: string; compacto?: boolean } = {}) {
  const [interpretacao, definirInterpretacao] = useState<InterpretacaoGerada | null>(null);
  const [processando, definirProcessando] = useState(false);
  const [erro, definirErro] = useState(false);
  const gerar = async () => {
    definirProcessando(true);
    definirErro(false);
    try {
      const parametros = new URLSearchParams();
      if (inicio && fim) { parametros.set("inicio", inicio); parametros.set("fim", fim); }
      const consulta = parametros.size ? `?${parametros.toString()}` : "";
      const endpoint = identificadorModulo ? `/api/modulos/${encodeURIComponent(identificadorModulo)}/interpretacoes${consulta}` : "/api/interpretacoes";
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
  return <section className={["cartao", className].filter(Boolean).join(" ")} aria-labelledby="titulo-interpretacao">{!compacto && <p className="sobretitulo">INTERPRETAÇÃO OPCIONAL</p>}<h2 id="titulo-interpretacao">Insights da IA</h2>{!compacto && <p className="rotulo">Os provedores configurados interpretam métricas já calculadas pelo sistema. A IA observa padrões e propõe reflexões; ela não calcula resultados nem altera registros.</p>}<button aria-busy={processando} className="botao" disabled={processando} onClick={gerar} type="button">{processando ? "Preparando interpretação..." : identificadorModulo ? "Analisar este módulo" : "Gerar interpretação"}</button>{!compacto && <p className="rotulo"><Link href="/configuracoes/ia">Configurar provedores e chaves</Link></p>}{erro && <p className="mensagem-erro" role="alert">Não foi possível preparar a interpretação agora. Tente novamente.</p>}{interpretacao && <div className="interpretacao" aria-live="polite"><p className="selo">{interpretacao.origem === "LOCAL" ? "Reflexão local de contingência" : `Interpretação por ${ROTULOS_ORIGEM[interpretacao.origem]}`}</p>{interpretacao.modelo && <p className="rotulo">Modelo utilizado: {interpretacao.modelo}</p>}{interpretacao.motivoContingencia && <p className="rotulo">A análise externa não estava disponível; as métricas continuaram funcionando e foi preparada uma reflexão local.</p>}{interpretacao.tentativas.length > 1 && <details><summary>Ver caminho do fallback</summary><ol>{interpretacao.tentativas.map((tentativa, indice) => <li key={`${tentativa.provedor}-${indice}`}>{ROTULOS_ORIGEM[tentativa.provedor]} · {tentativa.resultado}</li>)}</ol></details>}{interpretacao.insights.map((insight, indice) => <article key={`${insight.tipo}-${indice}`}><p className="rotulo">{ROTULOS_CONFIANCA[insight.confianca]}</p><h3>{insight.titulo}</h3><p>{insight.observacao}</p>{insight.resumoEvidencias && <p className="rotulo">{insight.resumoEvidencias}</p>}{insight.perguntaReflexiva && <p><strong>Para refletir:</strong> {insight.perguntaReflexiva}</p>}{insight.experimentoSugerido && <p><strong>Uma experiência possível:</strong> {insight.experimentoSugerido}</p>}</article>)}<p className="aviso">{interpretacao.limitacao}</p><p className="rotulo">Amostra: {interpretacao.contexto.quantidadeSessoesValidas} sessão(ões), {interpretacao.contexto.minutosValidos} minuto(s) válido(s), versão {interpretacao.contexto.versaoAlgoritmo}.</p></div>}</section>;
}
