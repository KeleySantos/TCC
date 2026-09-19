import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { concluirTentativaPessoal, ErroAvaliacao } from "@/servidor/avaliacoes";

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Respostas inválidas." }, { status: 400 });
  }
  try {
    const tentativa = await concluirTentativaPessoal(acesso.usuario.id, corpo);
    return NextResponse.json({ tentativaId: tentativa.id, numeroTentativa: tentativa.numeroTentativa, notaNormalizada: tentativa.notaNormalizada, respostasCorretas: tentativa.respostasCorretas, totalQuestoes: tentativa.totalQuestoes });
  } catch (erro) {
    if (erro instanceof ErroAvaliacao && erro.codigo === "NAO_ENCONTRADA") return NextResponse.json({ erro: "Avaliação não encontrada." }, { status: 404 });
    return NextResponse.json({ erro: "Respostas inválidas." }, { status: 400 });
  }
}
