import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterArquivoMaterialPessoal } from "@/servidor/modulos";

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  const arquivo = await obterArquivoMaterialPessoal(acesso.usuario.id, id);
  if (!arquivo) return NextResponse.json({ erro: "NAO_ENCONTRADO" }, { status: 404 });
  const nomeCodificado = encodeURIComponent(arquivo.nomeOriginal);
  return new NextResponse(arquivo.conteudo, {
    headers: {
      "Content-Type": arquivo.tipoMime,
      "Content-Length": String(arquivo.tamanhoBytes),
      "Content-Disposition": `attachment; filename="arquivo"; filename*=UTF-8''${nomeCodificado}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
