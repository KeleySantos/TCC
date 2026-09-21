import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { excluirMaterialPermanentemente } from "@/servidor/analises-materiais";
import { ErroModulo } from "@/servidor/modulos";

export async function DELETE(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  try {
    await excluirMaterialPermanentemente(acesso.usuario.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (erro) {
    if (erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO") return NextResponse.json({ erro: erro.codigo }, { status: 404 });
    return NextResponse.json({ erro: "FALHA_ARMAZENAMENTO" }, { status: 500 });
  }
}
