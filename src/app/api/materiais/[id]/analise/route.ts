import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { processarAnaliseMaterial } from "@/servidor/analises-materiais";
import { ErroModulo } from "@/servidor/modulos";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  try {
    const analise = await processarAnaliseMaterial(acesso.usuario.id, id);
    revalidatePath("/dashboard");
    revalidatePath("/modulos/[identificador]", "page");
    return NextResponse.json({ analise }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO") return NextResponse.json({ erro: erro.codigo }, { status: 404 });
    return NextResponse.json({ erro: "FALHA_PROCESSAMENTO" }, { status: 500 });
  }
}
