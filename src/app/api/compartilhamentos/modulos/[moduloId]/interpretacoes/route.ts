import { periodoCompartilhado, responderCompartilhamento } from "@/servidor/api-compartilhamentos";
import { gerarInterpretacaoCompartilhada } from "@/servidor/ia/interpretacao-compartilhada";

export async function POST(requisicao: Request, contexto: { params: Promise<{ moduloId: string }> }) {
  return responderCompartilhamento(async (usuarioId) => ({ interpretacao: await gerarInterpretacaoCompartilhada(usuarioId, (await contexto.params).moduloId, periodoCompartilhado(requisicao)) }));
}
