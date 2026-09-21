import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { arquivarSessaoPessoal } from "@/servidor/sessoes";
import { respostaErroSessao } from "../../respostas";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  try {
    return NextResponse.json({ sessao: await arquivarSessaoPessoal(acesso.usuario.id, id) });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}
