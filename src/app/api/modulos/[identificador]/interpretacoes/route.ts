import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { ErroInterpretacaoModulo, gerarInterpretacaoModuloPessoal } from "@/servidor/ia/interpretacoes";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ identificador: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { identificador } = await contexto.params;
  try {
    const interpretacao = await gerarInterpretacaoModuloPessoal(acesso.usuario.id, identificador);
    return NextResponse.json({ interpretacao });
  } catch (erro) {
    if (erro instanceof ErroInterpretacaoModulo) return NextResponse.json({ erro: "NAO_ENCONTRADO" }, { status: 404 });
    return NextResponse.json({ erro: "FALHA_INTERPRETACAO" }, { status: 500 });
  }
}
