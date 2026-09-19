import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { gerarInterpretacaoPessoal } from "@/servidor/ia/interpretacoes";

export async function POST() {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const interpretacao = await gerarInterpretacaoPessoal(acesso.usuario.id);
  return NextResponse.json({ interpretacao });
}
