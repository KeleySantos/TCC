import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { concluirSessaoPessoal } from "@/servidor/sessoes";
import { lerJson, respostaErroSessao } from "../../respostas";

export async function POST(requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  const leitura = await lerJson(requisicao);
  if (!leitura.valido) return NextResponse.json({ erro: "Autoavaliação inválida." }, { status: 400 });
  try {
    const sessao = await concluirSessaoPessoal(acesso.usuario.id, id, leitura.corpo);
    return NextResponse.json({ sessao });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}
