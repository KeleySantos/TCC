import type { ReactNode } from "react";
import estilos from "./subtitulo.module.css";

type PropriedadesSubtitulo = {
  children?: ReactNode;
  className?: string;
  como?: "h2" | "h3" | "p";
  id?: string;
  nivel?: 2 | 3;
};

export function Subtitulo({ children, className, como, id, nivel = 2 }: PropriedadesSubtitulo) {
  const Elemento = como ?? (nivel === 3 ? "h3" : "h2");
  const classes = [estilos.subtitulo, className].filter(Boolean).join(" ");
  return <Elemento className={classes} id={id}>{children}</Elemento>;
}
