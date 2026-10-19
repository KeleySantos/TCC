import { moduloDoProprietario, responderCompartilhamento } from "@/servidor/api-compartilhamentos";
import { removerAcessoModulo } from "@/servidor/compartilhamento-modulos";

export async function DELETE(_requisicao: Request, contexto: { params: Promise<{ identificador: string; convidadoId: string }> }) {
  return responderCompartilhamento(async (usuarioId) => {
    const { identificador, convidadoId } = await contexto.params;
    await removerAcessoModulo(usuarioId, await moduloDoProprietario(usuarioId, identificador), convidadoId);
    return { sucesso: true };
  });
}
