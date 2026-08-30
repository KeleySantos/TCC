import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import type { UsuarioAtual } from "./autorizacao";

export type { UsuarioAtual } from "./autorizacao";

const NOME_COOKIE_SESSAO = "usuario_demonstracao";

export async function obterUsuarioAtual(): Promise<UsuarioAtual | null> {
  const armazenamentoCookies = await cookies();
  const usuarioId = armazenamentoCookies.get(NOME_COOKIE_SESSAO)?.value;
  if (!usuarioId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { perfilAluno: true, perfilProfessor: true },
  });
  if (!usuario) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    nomeUsuario: usuario.nomeUsuario,
    papel: usuario.papel,
    perfilAlunoId: usuario.perfilAluno?.id ?? null,
    perfilProfessorId: usuario.perfilProfessor?.id ?? null,
  };
}

export async function exigirUsuario(papel?: PapelUsuario): Promise<UsuarioAtual> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/entrar");
  if (papel && usuario.papel !== papel) redirect(obterRotaInicial(usuario.papel));
  return usuario;
}

export function obterRotaInicial(papel: PapelUsuario) {
  if (papel === PapelUsuario.ADMINISTRADOR) return "/administrador";
  return papel === PapelUsuario.PROFESSOR ? "/professor" : "/aluno";
}

export async function definirSessaoDemonstracao(usuarioId: string) {
  const armazenamentoCookies = await cookies();
  armazenamentoCookies.set(NOME_COOKIE_SESSAO, usuarioId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function encerrarSessaoDemonstracao() {
  const armazenamentoCookies = await cookies();
  armazenamentoCookies.delete(NOME_COOKIE_SESSAO);
}
