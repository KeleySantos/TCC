import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { criarDesafioPessoal, ErroDesafio } from "@/servidor/desafios";

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Dados do desafio inválidos." }, { status: 400 });
  }
  try {
    const desafio = await criarDesafioPessoal(acesso.usuario.id, corpo);
    return NextResponse.json({ desafio }, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroDesafio && erro.codigo === "NAO_ENCONTRADO") return NextResponse.json({ erro: "Módulo não encontrado." }, { status: 404 });
    return NextResponse.json({ erro: "Dados do desafio inválidos." }, { status: 400 });
  }
}
