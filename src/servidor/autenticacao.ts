import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/biblioteca/prisma";
import type { UsuarioAtual } from "./autorizacao";

export type { UsuarioAtual } from "./autorizacao";

const NOME_COOKIE_SESSAO = "usuario_demonstracao";

export async function obterUsuarioAtual(): Promise<UsuarioAtual | null> {
  const armazenamentoCookies = await cookies();
  const usuarioId = armazenamentoCookies.get(NOME_COOKIE_SESSAO)?.value;
  if (!usuarioId) return null;

  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, nomeUsuario: true, email: true },
  });
}

export async function exigirUsuario(): Promise<UsuarioAtual> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

export function obterRotaInicial() {
  return "/dashboard";
}

export async function definirSessaoDemonstracao(usuarioId: string) {
  const armazenamentoCookies = await cookies();
  armazenamentoCookies.set(NOME_COOKIE_SESSAO, usuarioId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function encerrarSessaoDemonstracao() {
  const armazenamentoCookies = await cookies();
  armazenamentoCookies.delete(NOME_COOKIE_SESSAO);
}
