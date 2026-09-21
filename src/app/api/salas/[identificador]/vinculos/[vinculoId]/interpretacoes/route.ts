import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { ErroInterpretacaoSala, gerarInterpretacaoMembroSala } from "@/servidor/ia/interpretacoes";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ identificador: string; vinculoId: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { identificador, vinculoId } = await contexto.params;
  try {
    const interpretacao = await gerarInterpretacaoMembroSala(acesso.usuario.id, identificador, vinculoId);
    return NextResponse.json({ interpretacao }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroInterpretacaoSala) return NextResponse.json({ erro: "NAO_ENCONTRADO" }, { status: 404 });
    return NextResponse.json({ erro: "FALHA_INTERPRETACAO" }, { status: 500 });
  }
}
