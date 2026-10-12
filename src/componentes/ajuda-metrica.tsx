"use client";

import { useId, useRef } from "react";
import { CircleHelp, X } from "lucide-react";
import estilos from "./ajuda-metrica.module.css";

export function AjudaMetrica({ titulo, descricao }: { titulo: string; descricao: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const botaoAbrir = useRef<HTMLButtonElement>(null);
  const tituloId = useId();

  const abrir = () => dialogo.current?.showModal();
  const fechar = () => {
    dialogo.current?.close();
    botaoAbrir.current?.focus();
  };

  return <>
    <button aria-label={`Ver explicação sobre ${titulo}`} className={estilos.abrir} onClick={abrir} ref={botaoAbrir} type="button"><CircleHelp aria-hidden="true" /></button>
    <dialog aria-labelledby={tituloId} className={estilos.dialogo} onClick={(evento) => { if (evento.target === evento.currentTarget) fechar(); }} onClose={() => botaoAbrir.current?.focus()} ref={dialogo}>
      <div className={estilos.conteudo}>
        <header><h2 id={tituloId}>{titulo}</h2><button aria-label="Fechar explicação" className={estilos.fechar} onClick={fechar} type="button"><X aria-hidden="true" /></button></header>
        <p>{descricao}</p>
      </div>
    </dialog>
  </>;
}
