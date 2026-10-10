import type { ReactNode } from "react";
import estilos from "./page.module.css";

export function LayoutDashboardModulo({ conteudo, insights }: { conteudo: ReactNode; insights: ReactNode }) {
  return <div className={estilos.gradeDashboardModulo}>
    <div className={estilos.conteudoDashboardModulo}>{conteudo}</div>
    <aside aria-label="Interpretação opcional do módulo" className={estilos.colunaInsightsModulo}>{insights}</aside>
  </div>;
}
