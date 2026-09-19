import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { ErroSessao, iniciarSessaoPessoal } from "@/servidor/sessoes";

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Dados da sessão inválidos." }, { status: 400 });
  }
  try {
    const sessao = await iniciarSessaoPessoal(acesso.usuario.id, corpo);
    return NextResponse.json({ sessaoId: sessao.id });
  } catch (erro) {
    if (erro instanceof ErroSessao && erro.codigo === "NAO_ENCONTRADA") return NextResponse.json({ erro: "Material não encontrado." }, { status: 404 });
    return NextResponse.json({ erro: "Dados da sessão inválidos." }, { status: 400 });
  }
}
