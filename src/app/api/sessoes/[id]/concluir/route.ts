import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { ErroSessao, concluirSessaoPessoal } from "@/servidor/sessoes";

export async function POST(requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json({ erro: "Autoavaliação inválida." }, { status: 400 });
  }
  try {
    const sessao = await concluirSessaoPessoal(acesso.usuario.id, id, corpo);
    return NextResponse.json({ situacao: sessao.situacao, duracaoMinutos: sessao.duracaoMinutos });
  } catch (erro) {
    if (erro instanceof ErroSessao && erro.codigo === "NAO_ENCONTRADA") return NextResponse.json({ erro: "Sessão ativa não encontrada." }, { status: 404 });
    return NextResponse.json({ erro: "Autoavaliação inválida." }, { status: 400 });
  }
}
