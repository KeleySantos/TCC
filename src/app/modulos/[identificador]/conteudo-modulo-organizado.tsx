import type { ReactNode } from "react";
import type { PeriodoFiltroExibicao } from "./filtro-periodo-modulo";
import { SubabasModulo } from "./subabas-modulo";

export function ConteudoModuloOrganizado({ abaInicial, acoesDashboard, cabecalho, dashboard, linhaDoTempo, periodo, sessoesMateriais }: { abaInicial?: "dashboard" | "linha-do-tempo" | "sessoes-materiais"; acoesDashboard?: ReactNode; cabecalho: ReactNode; dashboard: ReactNode; linhaDoTempo: ReactNode; periodo: PeriodoFiltroExibicao; sessoesMateriais: ReactNode }) {
  return <>{cabecalho}<SubabasModulo abaInicial={abaInicial} acoesDashboard={acoesDashboard} dashboard={dashboard} linhaDoTempo={linhaDoTempo} periodo={periodo} sessoesMateriais={sessoesMateriais} /></>;
}
