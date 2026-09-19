import { NextResponse } from "next/server";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { criarMaterialComArquivoPessoal, ErroModulo } from "@/servidor/modulos";
import { LIMITE_MAXIMO_CORPO_UPLOAD } from "@/servidor/arquivos-materiais";

function respostaDeErro(erro: unknown) {
  if (!(erro instanceof ErroModulo)) return NextResponse.json({ erro: "FALHA_ARMAZENAMENTO" }, { status: 500 });
  if (erro.codigo === "NAO_ENCONTRADO") return NextResponse.json({ erro: erro.codigo }, { status: 404 });
  if (erro.codigo === "IDENTIFICADOR_DUPLICADO") return NextResponse.json({ erro: erro.codigo }, { status: 409 });
  if (erro.codigo === "ARQUIVO_INVALIDO" || erro.codigo === "DADOS_INVALIDOS") return NextResponse.json({ erro: erro.codigo }, { status: 400 });
  return NextResponse.json({ erro: erro.codigo }, { status: 500 });
}

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const tamanhoDeclarado = Number(requisicao.headers.get("content-length"));
  if (Number.isFinite(tamanhoDeclarado) && tamanhoDeclarado > LIMITE_MAXIMO_CORPO_UPLOAD) return NextResponse.json({ erro: "ARQUIVO_INVALIDO" }, { status: 413 });
  let formulario: FormData;
  try {
    formulario = await requisicao.formData();
  } catch {
    return NextResponse.json({ erro: "DADOS_INVALIDOS" }, { status: 400 });
  }
  const arquivo = formulario.get("arquivo");
  if (!(arquivo instanceof File)) return NextResponse.json({ erro: "ARQUIVO_INVALIDO" }, { status: 400 });
  try {
    const material = await criarMaterialComArquivoPessoal(acesso.usuario.id, {
      topicoId: formulario.get("topicoId"),
      titulo: formulario.get("titulo"),
      descricao: formulario.get("descricao"),
      minutosEstimados: formulario.get("minutosEstimados"),
    }, arquivo);
    return NextResponse.json({ material: { id: material.id, identificador: material.identificador, formato: material.formato, origem: material.origem } }, { status: 201 });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
