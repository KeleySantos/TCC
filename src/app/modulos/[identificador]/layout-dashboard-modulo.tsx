import type { ReactNode } from "react";
import estilos from "./page.module.css";

export function LayoutDashboardModulo({ conteudo }: { conteudo: ReactNode }) {
  return <div className={estilos.conteudoDashboardModulo}>{conteudo}</div>;
}
