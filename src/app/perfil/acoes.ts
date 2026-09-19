"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { exigirUsuario } from "@/servidor/autenticacao";
import { criarHashSenha, verificarSenha } from "@/servidor/senhas";

const esquemaPerfil = z.object({
  nome: z.string().trim().min(3).max(120),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]),
});

const esquemaSenha = z.object({
  senhaAtual: z.string().min(1).max(128),
  novaSenha: z.string().min(8).max(128),
  confirmarSenha: z.string().min(8).max(128),
});

export async function atualizarPerfil(formulario: FormData) {
  const usuario = await exigirUsuario();
  const dados = esquemaPerfil.safeParse({ nome: formulario.get("nome"), email: formulario.get("email") });
  if (!dados.success) redirect("/perfil?erro=dados");
  const email = dados.data.email || null;
  if (email) {
    const existente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    if (existente && existente.id !== usuario.id) redirect("/perfil?erro=email");
  }
  await prisma.usuario.update({ where: { id: usuario.id }, data: { nome: dados.data.nome, email } });
  redirect("/perfil?sucesso=perfil");
}

export async function trocarSenha(formulario: FormData) {
  const usuario = await exigirUsuario();
  const dados = esquemaSenha.safeParse({ senhaAtual: formulario.get("senhaAtual"), novaSenha: formulario.get("novaSenha"), confirmarSenha: formulario.get("confirmarSenha") });
  if (!dados.success || dados.data.novaSenha !== dados.data.confirmarSenha) redirect("/perfil?erro=senha");
  const conta = await prisma.usuario.findUniqueOrThrow({ where: { id: usuario.id }, select: { senhaHash: true } });
  if (!verificarSenha(dados.data.senhaAtual, conta.senhaHash)) redirect("/perfil?erro=atual");
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: criarHashSenha(dados.data.novaSenha) } });
  redirect("/perfil?sucesso=senha");
}
