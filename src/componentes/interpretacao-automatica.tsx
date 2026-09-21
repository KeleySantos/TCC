"use client";

import { useState } from "react";
import Link from "next/link";
import type { InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";

const ROTULOS_ORIGEM = { GROQ: "Groq", GEMINI: "Gemini", QWEN: "Qwen", LOCAL: "resposta local" } as const;

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
  return <section className={["cartao", className].filter(Boolean).join(" ")} aria-labelledby="titulo-interpretacao"><p className="sobretitulo">INTERPRETAÇÃO OPCIONAL</p><h2 id="titulo-interpretacao">Insights da IA</h2><p className="rotulo">A fila Groq → Gemini → Qwen interpreta métricas e descrições das sessões. Ela não calcula métricas, não altera registros e não gera avaliações.</p><button aria-busy={processando} className="botao" disabled={processando} onClick={gerar} type="button">{processando ? "Preparando interpretação..." : identificadorModulo ? "Analisar este módulo" : "Gerar interpretação"}</button><p className="rotulo"><Link href="/configuracoes/ia">Configurar provedores e chaves</Link></p>{erro && <p className="mensagem-erro" role="alert">Não foi possível preparar a interpretação agora. Tente novamente.</p>}{interpretacao && <div className="interpretacao" aria-live="polite"><p className="selo">{interpretacao.origem === "LOCAL" ? "Resposta local de contingência" : `Interpretação por ${ROTULOS_ORIGEM[interpretacao.origem]}`}</p>{interpretacao.modelo && <p className="rotulo">Modelo utilizado: {interpretacao.modelo}</p>}{interpretacao.motivoContingencia && <p className="rotulo">Nenhum provedor configurado e disponível produziu uma resposta válida; foi usada a interpretação local.</p>}{interpretacao.tentativas.length > 1 && <details><summary>Ver caminho do fallback</summary><ol>{interpretacao.tentativas.map((tentativa, indice) => <li key={`${tentativa.provedor}-${indice}`}>{ROTULOS_ORIGEM[tentativa.provedor]} · {tentativa.resultado}</li>)}</ol></details>}<h3>Padrões observados</h3><ul>{interpretacao.padroesObservados.map((item) => <li key={item}>{item}</li>)}</ul><h3>Feedbacks e próximos passos</h3><ul>{[...interpretacao.feedbacks, ...interpretacao.conselhos].map((item) => <li key={item}>{item}</li>)}</ul><h3>Perguntas para reflexão</h3><ul>{interpretacao.perguntasReflexao.map((item) => <li key={item}>{item}</li>)}</ul><p className="aviso">{interpretacao.limitacao}</p><p className="rotulo">Amostra: {interpretacao.contexto.quantidadeSessoesValidas} sessão(ões), {interpretacao.contexto.minutosValidos} minuto(s) válido(s), versão {interpretacao.contexto.versaoAlgoritmo}.</p></div>}</section>;
}
