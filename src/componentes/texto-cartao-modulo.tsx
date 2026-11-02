import type { ReactNode } from "react";
import estilos from "./texto-cartao-modulo.module.css";

type TextoCartaoModuloProps = {
  children: ReactNode;
  variante?: "escuro" | "claro";
};

export function TextoCartaoModulo({ children, variante = "escuro" }: TextoCartaoModuloProps) {
  const classe = variante === "claro"
    ? `${estilos.textoCartaoModulo} ${estilos.claro}`
    : estilos.textoCartaoModulo;

  return <strong className={classe} data-padrao="#textcardmodule">{children}</strong>;
}
