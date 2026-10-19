import { moduloDoProprietario, responderCompartilhamento } from "@/servidor/api-compartilhamentos";
import { encerrarCompartilhamentoModulo, gerarCodigoCompartilhamentoModulo, obterCompartilhamentoModulo } from "@/servidor/compartilhamento-modulos";

type Contexto = { params: Promise<{ identificador: string }> };
export async function GET(_requisicao: Request, contexto: Contexto) {
  return responderCompartilhamento(async (usuarioId) => {
    const moduloId = await resolverModulo(usuarioId, contexto);
    return { compartilhamento: await obterCompartilhamentoModulo(usuarioId, moduloId) };
  });
}
async function resolverModulo(usuarioId: string, contexto: Contexto) {
  return moduloDoProprietario(usuarioId, (await contexto.params).identificador);
}
export async function POST(_requisicao: Request, contexto: Contexto) {
  return responderCompartilhamento(async (usuarioId) => ({ compartilhamento: await gerarCodigoCompartilhamentoModulo(usuarioId, await resolverModulo(usuarioId, contexto)) }));
}
export async function DELETE(_requisicao: Request, contexto: Contexto) {
  return responderCompartilhamento(async (usuarioId) => {
    await encerrarCompartilhamentoModulo(usuarioId, await resolverModulo(usuarioId, contexto));
    return { sucesso: true };
  });
}
