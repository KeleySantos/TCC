"use client";

import { useActionState } from "react";
import { gerarNovoConvite, type EstadoGeracaoConvite } from "./acoes";
import estilos from "./page.module.css";

const estadoInicial: EstadoGeracaoConvite = {};

export function GeradorConvite({ salaId, identificadorSala }: { salaId: string; identificadorSala: string }) {
  const [estado, acao, pendente] = useActionState(gerarNovoConvite, estadoInicial);
  return (
    <div className={estilos.blocoConvite}>
      <form action={acao}>
        <input name="salaId" type="hidden" value={salaId} />
        <input name="identificadorSala" type="hidden" value={identificadorSala} />
        <button disabled={pendente} type="submit">{pendente ? "Gerando…" : "Gerar código e link"}</button>
      </form>
      {estado.erro && <p className="mensagem-erro" role="alert">{estado.erro}</p>}
      {estado.codigo && (
        <div className={estilos.conviteGerado} role="status">
          <strong>Código: {estado.codigo}</strong>
          <a href={estado.link}>Abrir link de convite</a>
          <small>Exibido somente agora. Expira em {new Date(estado.expiraEm ?? "").toLocaleDateString("pt-BR")}.</small>
        </div>
      )}
    </div>
  );
}
