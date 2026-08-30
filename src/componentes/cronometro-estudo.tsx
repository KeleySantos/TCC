"use client";

import { useState } from "react";

export function CronometroEstudo({ recursoId }: { recursoId: string }) {
  const [sessaoId, definirSessaoId] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState<string | null>(null);
  const [processando, definirProcessando] = useState(false);
  const iniciar = async () => {
    definirProcessando(true);
    try {
      const resposta = await fetch("/api/sessoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recursoId }) });
      const dados = await resposta.json();
      if (!resposta.ok) return definirMensagem(dados.erro ?? "Não foi possível iniciar a sessão.");
      definirSessaoId(dados.sessaoId); definirMensagem("Sessão iniciada. O tempo será registrado ao encerrar.");
    } finally {
      definirProcessando(false);
    }
  };
  const concluir = async () => {
    if (!sessaoId) return;
    definirProcessando(true);
    try {
      const resposta = await fetch(`/api/sessoes/${sessaoId}/concluir`, { method: "POST" });
      const dados = await resposta.json();
      if (!resposta.ok) return definirMensagem(dados.erro ?? "Não foi possível encerrar a sessão.");
      definirSessaoId(null); definirMensagem(dados.situacao === "CONCLUIDA" ? `Sessão concluída: ${dados.duracaoMinutos} minuto(s) válido(s).` : "Sessão registrada como inválida por ter menos de 5 minutos.");
    } finally {
      definirProcessando(false);
    }
  };
  return <div style={{ display: "grid", gap: 8 }}><button aria-busy={processando} className="botao" disabled={processando} onClick={sessaoId ? concluir : iniciar}>{processando ? "Processando sessão..." : sessaoId ? "Encerrar sessão" : "Iniciar sessão de estudo"}</button>{mensagem && <p aria-live="polite" className="rotulo" role="status">{mensagem}</p>}</div>;
}
