import { NextResponse } from "next/server";
import { prisma } from "@/biblioteca/prisma";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { obterUsuarioAtual } from "./autenticacao";
import { ErroCompartilhamentoModulo } from "./compartilhamento-modulos";

export async function responderCompartilhamento(operacao: (usuarioId: string) => Promise<unknown>) {
  const usuario = await obterUsuarioAtual();
  const headers = { "Cache-Control": "no-store" };
  if (!usuario) return NextResponse.json({ erro: "NAO_AUTENTICADO" }, { status: 401, headers });
  try { return NextResponse.json(await operacao(usuario.id), { headers }); } catch (erro) {
    if (erro instanceof ErroCompartilhamentoModulo) {
      const status = erro.codigo === "NAO_ENCONTRADO" ? 404 : erro.codigo === "ACESSO_REVOGADO" ? 403 : erro.codigo === "CAPACIDADE_COMPLETA" || erro.codigo === "TENTE_NOVAMENTE" ? 409 : 400;
      return NextResponse.json({ erro: erro.codigo }, { status, headers });
    }
    if (erro instanceof SyntaxError) return NextResponse.json({ erro: "DADOS_INVALIDOS" }, { status: 400, headers });
    if (erro instanceof Error && erro.message === "PERIODO_INVALIDO") return NextResponse.json({ erro: "PERIODO_INVALIDO" }, { status: 400, headers });
    return NextResponse.json({ erro: "FALHA_COMPARTILHAMENTO" }, { status: 500, headers });
  }
}

export async function moduloDoProprietario(usuarioId: string, identificador: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({ where: { usuarioId, identificador, arquivado: false, rascunho: false }, select: { id: true } });
  if (!modulo) throw new ErroCompartilhamentoModulo("NAO_ENCONTRADO");
  return modulo.id;
}

export function periodoCompartilhado(requisicao: Request) {
  const url = new URL(requisicao.url);
  const periodo = resolverPeriodoModulo({ inicio: url.searchParams.get("inicio") ?? undefined, fim: url.searchParams.get("fim") ?? undefined });
  if (periodo.erro) throw new Error("PERIODO_INVALIDO");
  return { inicio: periodo.inicio, fim: periodo.fim };
}
