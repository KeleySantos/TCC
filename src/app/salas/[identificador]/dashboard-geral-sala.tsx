import { CartoesInsightsDashboard } from "@/componentes/cartoes-insights-dashboard";
import { GraficosDashboard } from "@/componentes/graficos-dashboard";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import estilos from "../dashboard-sala.module.css";

export function DashboardGeralSala({ dados, nomeSala }: { dados: DashboardObservacional; nomeSala: string }) {
  return <section aria-labelledby="titulo-dashboard-geral-sala" className={estilos.dashboardGeral}>
    <header className={estilos.tituloDashboardGeral}>
      <p>VISÃO CONSOLIDADA</p>
      <h3 id="titulo-dashboard-geral-sala">Visão geral de {nomeSala}</h3>
      <span>Cards e gráficos calculados com os dashboards compartilhados pelos membros ativos.</span>
    </header>
    <CartoesInsightsDashboard dados={dados} />
    <GraficosDashboard dados={dados} />
  </section>;
}
