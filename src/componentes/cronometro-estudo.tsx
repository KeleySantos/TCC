"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { METODOS_ESTUDO } from "@/dominio/sessoes/metodos";

type DesafioAtivo = { id: string; metodo: string; meta: string };

export function CronometroEstudo({ recursoId, desafios = [] }: { recursoId: string; desafios?: DesafioAtivo[] }) {
  const roteador = useRouter();
  const [sessaoId, definirSessaoId] = useState<string | null>(null);
  const [metodo, definirMetodo] = useState<string>(METODOS_ESTUDO[0].valor);
  const [desafioId, definirDesafioId] = useState("");
  const [dificuldadePercebida, definirDificuldadePercebida] = useState("");
  const [compreensaoPercebida, definirCompreensaoPercebida] = useState("");
  const [observacao, definirObservacao] = useState("");
  const [mensagem, definirMensagem] = useState<string | null>(null);
  const [processando, definirProcessando] = useState(false);

  const iniciar = async () => {
    definirProcessando(true);
    try {
      const resposta = await fetch("/api/sessoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recursoId, metodo, ...(desafioId ? { desafioId } : {}) }) });
      const dados = await resposta.json();
      if (!resposta.ok) return definirMensagem(dados.erro ?? "Não foi possível iniciar a sessão.");
      definirSessaoId(dados.sessaoId);
      definirMensagem("Sessão iniciada. Ao encerrar, registre sua percepção; a duração oficial será calculada pelo servidor.");
    } finally {
      definirProcessando(false);
    }
  };

  const concluir = async () => {
    if (!sessaoId) return;
    if (!dificuldadePercebida || !compreensaoPercebida) return definirMensagem("Informe as duas escalas de 1 a 5 antes de encerrar.");
    definirProcessando(true);
    try {
      const resposta = await fetch(`/api/sessoes/${sessaoId}/concluir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dificuldadePercebida, compreensaoPercebida, observacao }) });
      const dados = await resposta.json();
      if (!resposta.ok) return definirMensagem(dados.erro ?? "Não foi possível encerrar a sessão.");
      definirSessaoId(null);
      definirDificuldadePercebida("");
      definirCompreensaoPercebida("");
      definirObservacao("");
      definirMensagem(dados.sessao?.situacao === "CONCLUIDA" ? `Sessão concluída: ${dados.sessao.duracaoMinutos} minuto(s) válido(s).` : "Sessão registrada como inválida por ter menos de 5 minutos.");
      roteador.refresh();
    } finally {
      definirProcessando(false);
    }
  };

  return <div className="cronometro-estudo">
    {!sessaoId && <><div className="campo-formulario"><label htmlFor={`metodo-${recursoId}`}>Método usado</label><select disabled={processando} id={`metodo-${recursoId}`} onChange={(evento) => { definirMetodo(evento.target.value); if (desafios.some((desafio) => desafio.id === desafioId && desafio.metodo !== evento.target.value)) definirDesafioId(""); }} value={metodo}>{METODOS_ESTUDO.map((item) => <option key={item.valor} value={item.valor}>{item.rotulo}</option>)}</select></div>
    {desafios.length > 0 && <div className="campo-formulario"><label htmlFor={`desafio-${recursoId}`}>Vincular a um desafio (opcional)</label><select disabled={processando} id={`desafio-${recursoId}`} onChange={(evento) => { const desafioSelecionado = desafios.find((desafio) => desafio.id === evento.target.value); definirDesafioId(evento.target.value); if (desafioSelecionado) definirMetodo(desafioSelecionado.metodo); }} value={desafioId}><option value="">Sem desafio nesta sessão</option>{desafios.map((desafio) => <option key={desafio.id} value={desafio.id}>{desafio.meta}</option>)}</select><span className="rotulo">Ao selecionar um desafio, o método correspondente é aplicado e validado pelo servidor.</span></div>}</>}
    {sessaoId && <fieldset className="autoavaliacao"><legend>Ao encerrar, como foi esta sessão?</legend><div className="campo-formulario"><label htmlFor={`dificuldade-${recursoId}`}>Dificuldade percebida (1 baixa, 5 alta)</label><select disabled={processando} id={`dificuldade-${recursoId}`} onChange={(evento) => definirDificuldadePercebida(evento.target.value)} required value={dificuldadePercebida}><option value="">Selecione de 1 a 5</option>{[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select></div><div className="campo-formulario"><label htmlFor={`compreensao-${recursoId}`}>Compreensão percebida (1 baixa, 5 alta)</label><select disabled={processando} id={`compreensao-${recursoId}`} onChange={(evento) => definirCompreensaoPercebida(evento.target.value)} required value={compreensaoPercebida}><option value="">Selecione de 1 a 5</option>{[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}</select></div><div className="campo-formulario"><label htmlFor={`observacao-${recursoId}`}>Observação opcional</label><textarea disabled={processando} id={`observacao-${recursoId}`} maxLength={500} onChange={(evento) => definirObservacao(evento.target.value)} rows={3} value={observacao} /><span className="rotulo">Máximo de 500 caracteres. Não inclua dados pessoais.</span></div></fieldset>}
    <button aria-busy={processando} className="botao" disabled={processando} onClick={sessaoId ? concluir : iniciar} type="button">{processando ? "Processando sessão..." : sessaoId ? "Encerrar sessão" : "Iniciar sessão de estudo"}</button>
    {mensagem && <p aria-live="polite" className="rotulo" role="status">{mensagem}</p>}
  </div>;
}
