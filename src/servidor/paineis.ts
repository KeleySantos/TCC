import { obterResumoPessoal } from "@/servidor/consultas";
import { obterMetricasSessoesPessoais } from "@/servidor/metricas";

export async function obterPainelPessoal(usuarioId: string) {
  const [resumo, analises] = await Promise.all([obterResumoPessoal(usuarioId), obterMetricasSessoesPessoais(usuarioId)]);
  return { ...resumo, ...analises };
}
