"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { definirSessaoDemonstracao, obterRotaInicial } from "@/servidor/autenticacao";
import { normalizarNomeUsuario, verificarSenha } from "@/servidor/senhas";

const esquemaCredenciais = z.object({
  nomeUsuario: z.string().trim().min(3).max(40),
  senha: z.string().min(1).max(128),
});

export async function entrarComCredenciais(formulario: FormData) {
  const credenciais = esquemaCredenciais.safeParse({ nomeUsuario: formulario.get("nomeUsuario"), senha: formulario.get("senha") });
  if (!credenciais.success) redirect("/entrar?erro=credenciais");
  const nomeUsuario = normalizarNomeUsuario(credenciais.data.nomeUsuario);
  const usuario = await prisma.usuario.findUnique({ where: { nomeUsuario } });
  if (!usuario || !verificarSenha(credenciais.data.senha, usuario.senhaHash)) redirect("/entrar?erro=credenciais");
  await definirSessaoDemonstracao(usuario.id);
  redirect(obterRotaInicial(usuario.papel));
}
