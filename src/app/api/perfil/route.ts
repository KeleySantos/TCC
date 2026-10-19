import { NextResponse } from "next/server";
import { encerrarSessaoDemonstracao, obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { alterarFotoPerfil, alterarSenhaPerfil, atualizarNomePerfil, ErroPerfil, excluirContaPessoal, obterPerfil } from "@/servidor/perfil";
import { LIMITE_FOTO_PERFIL } from "@/servidor/foto-perfil";

function responderErro(erro: unknown) {
  if (erro instanceof ErroPerfil) return NextResponse.json({ erro: erro.codigo }, { status: erro.codigo === "NAO_ENCONTRADO" ? 404 : erro.codigo === "ADMIN_PROTEGIDO" ? 403 : erro.codigo === "NOME_EXISTENTE" ? 409 : 400 });
  return NextResponse.json({ erro: "FALHA_OPERACAO" }, { status: 500 });
}

export async function GET() {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  return NextResponse.json({ perfil: await obterPerfil(acesso.usuario.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  if (Number(requisicao.headers.get("content-length")) > LIMITE_FOTO_PERFIL + 16_384) return NextResponse.json({ erro: "FOTO_INVALIDA" }, { status: 413 });
  let dados: FormData;
  try { dados = await requisicao.formData(); } catch { return NextResponse.json({ erro: "DADOS_INVALIDOS" }, { status: 400 }); }
  try {
    const operacao = dados.get("operacao");
    if (operacao === "NOME") return NextResponse.json({ perfil: await atualizarNomePerfil(acesso.usuario.id, { nome: dados.get("nome"), nomeUsuario: dados.get("nomeUsuario") }) });
    if (operacao === "SENHA") {
      await alterarSenhaPerfil(acesso.usuario.id, { senhaAtual: dados.get("senhaAtual"), novaSenha: dados.get("novaSenha"), confirmarSenha: dados.get("confirmarSenha") });
      return NextResponse.json({ sucesso: true });
    }
    if (operacao === "FOTO") {
      const arquivo = dados.get("foto");
      if (!(arquivo instanceof File)) throw new ErroPerfil("FOTO_INVALIDA");
      return NextResponse.json({ perfil: await alterarFotoPerfil(acesso.usuario.id, arquivo) });
    }
    throw new ErroPerfil("DADOS_INVALIDOS");
  } catch (erro) { return responderErro(erro); }
}

export async function DELETE(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  let dados: unknown;
  try { dados = await requisicao.json(); } catch { return NextResponse.json({ erro: "DADOS_INVALIDOS" }, { status: 400 }); }
  try {
    await excluirContaPessoal(acesso.usuario.id, dados);
    await encerrarSessaoDemonstracao();
    return NextResponse.json({ sucesso: true });
  } catch (erro) { return responderErro(erro); }
}
