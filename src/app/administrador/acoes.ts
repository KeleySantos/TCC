"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { exigirUsuario } from "@/servidor/autenticacao";
import { criarHashSenha, normalizarNomeUsuario } from "@/servidor/senhas";

const esquemaNovoProfessor = z.object({
  nome: z.string().trim().min(3).max(120),
  nomeUsuario: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().min(8).max(128),
});

export async function cadastrarProfessor(formulario: FormData) {
  const administrador = await exigirUsuario(PapelUsuario.ADMINISTRADOR);
  const dados = esquemaNovoProfessor.safeParse({
    nome: formulario.get("nome"),
    nomeUsuario: formulario.get("nomeUsuario"),
    senha: formulario.get("senha"),
  });
  if (!dados.success) redirect("/administrador?erro=dados");
  const nomeUsuario = normalizarNomeUsuario(dados.data.nomeUsuario);
  const existente = await prisma.usuario.findUnique({ where: { nomeUsuario } });
  if (existente) redirect("/administrador?erro=usuario");
  const professor = await prisma.usuario.create({
    data: {
      nome: dados.data.nome,
      nomeUsuario,
      senhaHash: criarHashSenha(dados.data.senha),
      papel: PapelUsuario.PROFESSOR,
      perfilProfessor: { create: {} },
    },
  });
  await prisma.eventoAuditoria.create({ data: { atorId: administrador.id, acao: "PROFESSOR_CADASTRADO", alvo: professor.id, metadados: JSON.stringify({ nomeUsuario }) } });
  revalidatePath("/administrador");
  redirect("/administrador?sucesso=professor");
}
