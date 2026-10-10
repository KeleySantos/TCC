"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { definirSessaoDemonstracao, obterRotaInicial } from "@/servidor/autenticacao";
import { cadastrarContaPessoal, ErroCadastroConta } from "@/servidor/contas";
import { normalizarIdentificadorConta, verificarSenha } from "@/servidor/senhas";

const esquemaCredenciais = z.object({
  identificador: z.string().trim().min(2).max(80),
  senha: z.string().min(1).max(128),
});

export async function entrarComCredenciais(formulario: FormData) {
  const credenciais = esquemaCredenciais.safeParse({ identificador: formulario.get("identificador"), senha: formulario.get("senha") });
  if (!credenciais.success) redirect("/entrar?erro=credenciais");
  const nomeUsuario = normalizarIdentificadorConta(credenciais.data.identificador);
  const usuario = await prisma.usuario.findUnique({ where: { nomeUsuario } });
  if (!usuario || !verificarSenha(credenciais.data.senha, usuario.senhaHash)) redirect("/entrar?erro=credenciais");
  await definirSessaoDemonstracao(usuario.id);
  redirect(obterRotaInicial());
}

const errosCadastro: Record<ErroCadastroConta["codigo"], string> = {
  DADOS_INVALIDOS: "dados",
  SENHAS_DIFERENTES: "senhas",
  NOME_EXISTENTE: "nome",
};

export async function cadastrarConta(formulario: FormData) {
  let conta: Awaited<ReturnType<typeof cadastrarContaPessoal>>;
  try {
    conta = await cadastrarContaPessoal({
      nome: formulario.get("nome"),
      senha: formulario.get("senha"),
      confirmarSenha: formulario.get("confirmarSenha"),
    });
  } catch (erro) {
    if (erro instanceof ErroCadastroConta) redirect(`/entrar?modo=cadastro&erro=${errosCadastro[erro.codigo]}`);
    throw erro;
  }
  await definirSessaoDemonstracao(conta.id);
  redirect(obterRotaInicial());
}
