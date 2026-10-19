import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/biblioteca/prisma";
import type { UsuarioAtual } from "./autorizacao";
import { podeAdministrarIa } from "@/dominio/administracao-ia";
import { obterChaveMestraCredenciais } from "./ia/cofre-credenciais";
import { criarTokenSessao, DURACAO_SESSAO_SEGUNDOS, validarTokenSessao } from "./sessao-assinada";

export type { UsuarioAtual } from "./autorizacao";

const NOME_COOKIE_SESSAO = "usuario_demonstracao";

export async function obterUsuarioAtual(): Promise<UsuarioAtual | null> {
  const armazenamentoCookies = await cookies();
  const token = armazenamentoCookies.get(NOME_COOKIE_SESSAO)?.value;
  if (!token) return null;
  const usuarioId = validarTokenSessao(token, await obterChaveMestraCredenciais());
  if (!usuarioId) return null;

  return prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, nomeUsuario: true, email: true, administradorIa: true, fotoPerfilAtualizadaEm: true },
  });
}

export async function exigirUsuario(): Promise<UsuarioAtual> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

export async function exigirAdministradorIa(): Promise<UsuarioAtual> {
  const usuario = await exigirUsuario();
  if (!podeAdministrarIa(usuario)) redirect("/dashboard");
  return usuario;
}

export function obterRotaInicial() {
  return "/dashboard";
}

export async function definirSessaoDemonstracao(usuarioId: string) {
  const armazenamentoCookies = await cookies();
  const token = criarTokenSessao(usuarioId, await obterChaveMestraCredenciais());
  armazenamentoCookies.set(NOME_COOKIE_SESSAO, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DURACAO_SESSAO_SEGUNDOS });
}

export async function encerrarSessaoDemonstracao() {
  const armazenamentoCookies = await cookies();
  armazenamentoCookies.delete(NOME_COOKIE_SESSAO);
}
