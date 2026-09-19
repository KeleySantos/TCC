import { obterResumoPessoal } from "@/servidor/consultas";
import { obterMetricasPessoais } from "@/servidor/metricas";

export async function obterPainelPessoal(usuarioId: string) {
  const [resumo, analises] = await Promise.all([obterResumoPessoal(usuarioId), obterMetricasPessoais(usuarioId)]);
  return { ...resumo, ...analises };
}
