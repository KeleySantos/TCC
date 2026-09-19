import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { cancelarDesafioPessoal, ErroDesafio } from "@/servidor/desafios";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  try {
    const desafio = await cancelarDesafioPessoal(acesso.usuario.id, id);
    return NextResponse.json({ desafio });
  } catch (erro) {
    if (erro instanceof ErroDesafio) return NextResponse.json({ erro: "Desafio não encontrado." }, { status: 404 });
    return NextResponse.json({ erro: "Não foi possível cancelar o desafio." }, { status: 400 });
  }
}
