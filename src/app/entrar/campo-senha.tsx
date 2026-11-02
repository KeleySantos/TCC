"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import estilos from "./page.module.css";

export function CampoSenha({ id, rotulo = "Senha", nome = "senha", autoComplete, placeholder, minLength, maxLength }: {
  id: string;
  rotulo?: string;
  nome?: "senha" | "confirmarSenha";
  autoComplete: "current-password" | "new-password";
  placeholder: string;
  minLength?: number;
  maxLength?: number;
}) {
  const [visivel, definirVisivel] = useState(false);
  const descricao = nome === "confirmarSenha" ? "confirmação de senha" : "senha";

  return <div className={estilos.campoLogin}>
    <label htmlFor={id}>{rotulo}</label>
    <span className={estilos.controleCampo}>
      <LockKeyhole aria-hidden="true" />
      <input autoComplete={autoComplete} id={id} maxLength={maxLength} minLength={minLength} name={nome} placeholder={placeholder} required type={visivel ? "text" : "password"} />
      <button aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${descricao}`} aria-pressed={visivel} className={estilos.alternarSenha} onClick={() => definirVisivel(!visivel)} type="button">
        {visivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </span>
  </div>;
}
