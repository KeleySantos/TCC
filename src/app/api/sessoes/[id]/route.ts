import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { editarSessaoPessoal, obterSessaoPessoal } from "@/servidor/sessoes";
import { lerJson, respostaErroSessao } from "../respostas";

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  try {
    return NextResponse.json({ sessao: await obterSessaoPessoal(acesso.usuario.id, id) });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}

export async function PATCH(requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const leitura = await lerJson(requisicao);
  if (!leitura.valido) return NextResponse.json({ erro: "Dados da sessão inválidos." }, { status: 400 });
  const { id } = await contexto.params;
  try {
    return NextResponse.json({ sessao: await editarSessaoPessoal(acesso.usuario.id, id, leitura.corpo) });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}
