import { responderCompartilhamento } from "@/servidor/api-compartilhamentos";
import { aceitarCodigoModulo, listarModulosCompartilhados } from "@/servidor/compartilhamento-modulos";

export async function GET() {
  return responderCompartilhamento(async (usuarioId) => ({ modulos: await listarModulosCompartilhados(usuarioId) }));
}
export async function POST(requisicao: Request) {
  return responderCompartilhamento(async (usuarioId) => aceitarCodigoModulo(usuarioId, await requisicao.json()));
}
