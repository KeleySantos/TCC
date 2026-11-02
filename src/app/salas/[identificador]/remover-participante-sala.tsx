"use client";

import { Minus } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { removerParticipanteDaSala } from "../acoes";
import estilos from "../page.module.css";

export function RemoverParticipanteSala({ identificadorSala, nome, salaId, usuarioId }: {
  identificadorSala: string;
  nome: string;
  salaId: string;
  usuarioId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const tituloId = useId();
  const descricaoId = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const [, confirmarRemocao, pendente] = useActionState(async (_: null, formulario: FormData) => {
    await removerParticipanteDaSala(formulario);
    return null;
  }, null);

  useEffect(() => {
    if (!aberto || !dialogo.current) return;
    if (typeof dialogo.current.showModal === "function") dialogo.current.showModal();
    else dialogo.current.setAttribute("open", "");
    cancelar.current?.focus();
  }, [aberto]);

  function fechar() {
    if (pendente) return;
    if (dialogo.current?.open && typeof dialogo.current.close === "function") dialogo.current.close();
    setAberto(false);
    gatilho.current?.focus();
  }

  return <>
    <button aria-label={`Remover ${nome} da sala`} className={estilos.botaoRemoverMembro} onClick={() => setAberto(true)} ref={gatilho} title={`Remover ${nome} da sala`} type="button"><Minus aria-hidden="true" /></button>
    {aberto ? <dialog aria-describedby={descricaoId} aria-labelledby={tituloId} aria-modal="true" className={estilos.confirmacaoRemocao} onCancel={(evento) => { evento.preventDefault(); fechar(); }} onKeyDown={(evento) => { if (evento.key === "Escape") { evento.preventDefault(); fechar(); } }} ref={dialogo}>
        <h3 id={tituloId}>Remover {nome} da sala?</h3>
        <p id={descricaoId}>{nome} perderá o acesso à sala. As instâncias pessoais e os registros de estudo serão preservados.</p>
        <div className={estilos.acoesConfirmacaoRemocao}>
          <button className={estilos.cancelarRemocao} disabled={pendente} onClick={fechar} ref={cancelar} type="button">Cancelar</button>
          <form action={confirmarRemocao}>
            <input name="salaId" type="hidden" value={salaId} />
            <input name="usuarioId" type="hidden" value={usuarioId} />
            <input name="identificadorSala" type="hidden" value={identificadorSala} />
            <button className={estilos.confirmarRemocao} disabled={pendente} type="submit">{pendente ? "Processando…" : "Confirmar remoção"}</button>
          </form>
        </div>
    </dialog> : null}
  </>;
}
