"use client";

import { Ban, FlaskConical, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import estilos from "./page.module.css";

export function BotaoCriarDesafio({ desabilitado = false }: { desabilitado?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={estilos.botaoCriar} disabled={desabilitado || pending} type="submit">
      {pending ? <LoaderCircle aria-hidden="true" className={estilos.girando} /> : <FlaskConical aria-hidden="true" />}
      {pending ? "Criando desafio..." : "Criar desafio"}
    </button>
  );
}

export function BotaoCancelarDesafio() {
  const { pending } = useFormStatus();
  return (
    <button className={estilos.botaoCancelar} disabled={pending} type="submit">
      {pending ? <LoaderCircle aria-hidden="true" className={estilos.girando} /> : <Ban aria-hidden="true" />}
      {pending ? "Cancelando..." : "Cancelar"}
    </button>
  );
}
