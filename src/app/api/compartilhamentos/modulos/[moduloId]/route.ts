import { periodoCompartilhado, responderCompartilhamento } from "@/servidor/api-compartilhamentos";
import { obterDashboardCompartilhado } from "@/servidor/dashboard-compartilhado";

export async function GET(requisicao: Request, contexto: { params: Promise<{ moduloId: string }> }) {
  return responderCompartilhamento(async (usuarioId) => ({ dashboard: await obterDashboardCompartilhado(usuarioId, (await contexto.params).moduloId, periodoCompartilhado(requisicao)) }));
}
