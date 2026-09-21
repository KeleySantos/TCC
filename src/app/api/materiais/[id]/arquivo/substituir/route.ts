import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { substituirArquivoMaterial } from "@/servidor/analises-materiais";
import { LIMITE_MAXIMO_CORPO_UPLOAD } from "@/servidor/arquivos-materiais";
import { ErroModulo } from "@/servidor/modulos";

export async function POST(requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const tamanho = Number(requisicao.headers.get("content-length"));
  if (Number.isFinite(tamanho) && tamanho > LIMITE_MAXIMO_CORPO_UPLOAD) return NextResponse.json({ erro: "ARQUIVO_INVALIDO" }, { status: 413 });
  const { id } = await contexto.params;
  try {
    const formulario = await requisicao.formData();
    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File)) return NextResponse.json({ erro: "ARQUIVO_INVALIDO" }, { status: 400 });
    return NextResponse.json(await substituirArquivoMaterial(acesso.usuario.id, id, arquivo));
  } catch (erro) {
    if (erro instanceof ErroModulo) {
      const status = erro.codigo === "NAO_ENCONTRADO" ? 404 : erro.codigo === "ARQUIVO_INVALIDO" ? 400 : 500;
      return NextResponse.json({ erro: erro.codigo }, { status });
    }
    return NextResponse.json({ erro: "FALHA_ARMAZENAMENTO" }, { status: 500 });
  }
}
