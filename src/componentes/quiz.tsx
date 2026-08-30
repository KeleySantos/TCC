"use client";

import { useState } from "react";

type Questao = { id: string; enunciado: string; opcoes: string[] };
export function Quiz({ avaliacaoId, questoes }: { avaliacaoId: string; questoes: Questao[] }) {
  const [respostas, definirRespostas] = useState<Record<string, string>>({});
  const [resultado, definirResultado] = useState<string | null>(null);
  const [enviando, definirEnviando] = useState(false);
  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    definirEnviando(true);
    try {
      const resposta = await fetch("/api/tentativas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avaliacaoId, respostas }) });
      const dados = await resposta.json();
      definirResultado(resposta.ok ? `Resultado: ${Math.round(dados.notaNormalizada)}% (${dados.respostasCorretas}/${dados.totalQuestoes} respostas corretas).` : dados.erro ?? "Não foi possível enviar.");
    } finally {
      definirEnviando(false);
    }
  };
  return <form aria-busy={enviando} onSubmit={enviar} className="cartao" style={{ display: "grid", gap: 18 }}><h3>Verificação de aprendizagem</h3>{questoes.map((questao, indice) => <fieldset key={questao.id} style={{ border: 0, padding: 0 }}><legend><strong>{indice + 1}. {questao.enunciado}</strong></legend>{questao.opcoes.map((opcao) => <label key={opcao} style={{ display: "block", marginTop: 8 }}><input disabled={enviando} required type="radio" name={questao.id} value={opcao} checked={respostas[questao.id] === opcao} onChange={() => definirRespostas({ ...respostas, [questao.id]: opcao })} /> {opcao}</label>)}</fieldset>)}<button className="botao" disabled={enviando} type="submit">{enviando ? "Enviando respostas..." : "Enviar respostas"}</button>{resultado && <p aria-live="polite" className="aviso" role="status">{resultado}</p>}</form>;
}
