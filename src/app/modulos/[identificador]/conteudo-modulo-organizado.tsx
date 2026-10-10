import type { ReactNode } from "react";
import type { PeriodoFiltroExibicao } from "./filtro-periodo-modulo";
import { SubabasModulo } from "./subabas-modulo";

export function ConteudoModuloOrganizado({ abaInicial, cabecalho, dashboard, linhaDoTempo, periodo, sessoesMateriais }: { abaInicial?: "dashboard" | "linha-do-tempo" | "sessoes-materiais"; cabecalho: ReactNode; dashboard: ReactNode; linhaDoTempo: ReactNode; periodo: PeriodoFiltroExibicao; sessoesMateriais: ReactNode }) {
  return <>{cabecalho}<SubabasModulo abaInicial={abaInicial} dashboard={dashboard} linhaDoTempo={linhaDoTempo} periodo={periodo} sessoesMateriais={sessoesMateriais} /></>;
}
