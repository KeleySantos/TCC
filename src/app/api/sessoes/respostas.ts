import { NextResponse } from "next/server";
import { ErroSessao } from "@/servidor/sessoes";

export function respostaErroSessao(erro: unknown) {
  if (!(erro instanceof ErroSessao)) return NextResponse.json({ erro: "Não foi possível processar a sessão." }, { status: 400 });
  if (erro.codigo === "NAO_ENCONTRADA") return NextResponse.json({ erro: "Sessão, módulo ou material não encontrado." }, { status: 404 });
  if (erro.codigo === "SOBREPOSICAO") return NextResponse.json({ erro: "O período informado se sobrepõe a outra sessão." }, { status: 409 });
  if (erro.codigo === "ESTADO_INVALIDO") return NextResponse.json({ erro: "A sessão não pode realizar esta operação no estado atual." }, { status: 409 });
  return NextResponse.json({ erro: "Dados da sessão inválidos." }, { status: 400 });
}

export async function lerJson(requisicao: Request) {
  try {
    return { valido: true as const, corpo: await requisicao.json() as unknown };
  } catch {
    return { valido: false as const };
  }
}
