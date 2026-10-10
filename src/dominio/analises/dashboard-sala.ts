import { calcularDashboardObservacional, type AnaliseAprendizagemParaDashboard, type ModuloParaDashboard } from "./dashboard-observacional";
import type { SessaoParaMetricasSessoes } from "./metricas-sessoes";

export type EntradaDashboardSala = {
  modulos: ModuloParaDashboard[];
  sessoes: SessaoParaMetricasSessoes[];
  analises: AnaliseAprendizagemParaDashboard[];
  referencia: Date;
};

export function calcularDashboardObservacionalSala({ modulos, sessoes, analises, referencia }: EntradaDashboardSala) {
  const sessoesUnicas = [...new Map(sessoes.map((sessao) => [`${sessao.moduloId}:${sessao.id}`, sessao])).values()];
  return calcularDashboardObservacional(modulos, sessoesUnicas, [], referencia, null, analises);
}
