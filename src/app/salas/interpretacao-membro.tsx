"use client";

import { useState } from "react";
import Link from "next/link";
import type { InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";

const ROTULOS = { GROQ: "Groq", GEMINI: "Gemini", QWEN: "Qwen", LOCAL: "resposta local" } as const;

export function InterpretacaoMembroSala({ identificadorSala, vinculoId }: { identificadorSala: string; vinculoId: string }) {
  const [resultado, definirResultado] = useState<InterpretacaoGerada | null>(null);
  const [processando, definirProcessando] = useState(false);
  const [erro, definirErro] = useState(false);
  async function gerar() {
    definirProcessando(true); definirErro(false);
    try {
      const resposta = await fetch(`/api/salas/${encodeURIComponent(identificadorSala)}/vinculos/${encodeURIComponent(vinculoId)}/interpretacoes`, { method: "POST" });
      const dados = await resposta.json();
      definirResultado(resposta.ok ? dados.interpretacao : null); definirErro(!resposta.ok);
    } catch { definirResultado(null); definirErro(true); } finally { definirProcessando(false); }
  }
  return <section className="cartao"><p className="sobretitulo">IA AUTORIZADA PELO MEMBRO</p><h3>Feedback interpretativo</h3><p className="rotulo">Somente métricas do dashboard são enviadas. Materiais e descrições das sessões permanecem privados.</p><button aria-busy={processando} className="botao" disabled={processando} onClick={gerar} type="button">{processando ? "Preparando…" : "Gerar feedback"}</button><p className="rotulo"><Link href="/configuracoes/ia">Configurar provedores</Link></p>{erro && <p className="mensagem-erro" role="alert">A autorização ou o provedor não está disponível.</p>}{resultado && <div className="interpretacao" aria-live="polite"><p className="selo">{resultado.origem === "LOCAL" ? "Resposta local de contingência" : `Interpretação por ${ROTULOS[resultado.origem]}`}</p><h4>Padrões observados</h4><ul>{resultado.padroesObservados.map((item) => <li key={item}>{item}</li>)}</ul><h4>Feedbacks e próximos passos</h4><ul>{[...resultado.feedbacks, ...resultado.conselhos].map((item) => <li key={item}>{item}</li>)}</ul><p className="aviso">{resultado.limitacao}</p></div>}</section>;
}
