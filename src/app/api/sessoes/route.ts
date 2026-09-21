import { NextResponse } from "next/server";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import {
  iniciarCronometroPessoal,
  iniciarSessaoPessoal,
  listarSessoesModuloPessoal,
  registrarSessaoManualPessoal,
} from "@/servidor/sessoes";
import { lerJson, respostaErroSessao } from "./respostas";

export async function GET(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const url = new URL(requisicao.url);
  const moduloId = url.searchParams.get("moduloId");
  if (!moduloId) return NextResponse.json({ erro: "Informe o módulo." }, { status: 400 });
  try {
    const sessoes = await listarSessoesModuloPessoal(acesso.usuario.id, moduloId, {
      incluirArquivadas: url.searchParams.get("incluirArquivadas") === "true",
    });
    return NextResponse.json({ sessoes });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const leitura = await lerJson(requisicao);
  if (!leitura.valido) return NextResponse.json({ erro: "Dados da sessão inválidos." }, { status: 400 });
  try {
    const corpo = leitura.corpo;
    const objeto = corpo && typeof corpo === "object" ? corpo as Record<string, unknown> : {};
    if (!("tipo" in objeto) && "recursoId" in objeto) {
      const sessao = await iniciarSessaoPessoal(acesso.usuario.id, corpo);
      return NextResponse.json({ sessaoId: sessao.id });
    }
    if (objeto.tipo === "MANUAL") {
      const sessao = await registrarSessaoManualPessoal(acesso.usuario.id, objeto);
      return NextResponse.json({ sessao }, { status: 201 });
    }
    if (objeto.tipo === "CRONOMETRO") {
      const sessao = await iniciarCronometroPessoal(acesso.usuario.id, objeto);
      return NextResponse.json({ sessao }, { status: 201 });
    }
    return NextResponse.json({ erro: "Tipo de registro inválido." }, { status: 400 });
  } catch (erro) {
    return respostaErroSessao(erro);
  }
}
