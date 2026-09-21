"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterDefinicaoProvedor } from "@/servidor/ia/catalogo-provedores";
import { definirConfiguracaoIaAtiva, desativarTodasConfiguracoesIa, obterCredencialConfigurada, removerConfiguracaoIa, salvarConfiguracaoIa } from "@/servidor/ia/configuracoes";
import { testarProvedorConfigurado } from "@/servidor/ia/interpretacoes";

const esquemaProvedor = z.enum(["GROQ", "GEMINI", "QWEN"]);

function lerProvedor(formulario: FormData) {
  return esquemaProvedor.safeParse(formulario.get("provedor"));
}

export async function salvarChaveIa(formulario: FormData) {
  const usuario = await exigirUsuario();
  const provedor = lerProvedor(formulario);
  const chave = formulario.get("chave");
  if (!provedor.success || typeof chave !== "string") redirect("/configuracoes/ia?erro=dados");
  try {
    await salvarConfiguracaoIa(usuario.id, provedor.data, chave);
  } catch {
    redirect("/configuracoes/ia?erro=cofre");
  }
  revalidatePath("/configuracoes/ia");
  redirect(`/configuracoes/ia?sucesso=salva&provedor=${provedor.data}`);
}

export async function alternarProvedorIa(formulario: FormData) {
  const usuario = await exigirUsuario();
  const provedor = lerProvedor(formulario);
  const ativa = formulario.get("ativa") === "sim";
  if (!provedor.success || !(await definirConfiguracaoIaAtiva(usuario.id, provedor.data, ativa))) redirect("/configuracoes/ia?erro=ausente");
  revalidatePath("/configuracoes/ia");
  redirect(`/configuracoes/ia?sucesso=${ativa ? "ativada" : "desativada"}&provedor=${provedor.data}`);
}

export async function removerChaveIa(formulario: FormData) {
  const usuario = await exigirUsuario();
  const provedor = lerProvedor(formulario);
  if (!provedor.success) redirect("/configuracoes/ia?erro=dados");
  await removerConfiguracaoIa(usuario.id, provedor.data);
  revalidatePath("/configuracoes/ia");
  redirect(`/configuracoes/ia?sucesso=removida&provedor=${provedor.data}`);
}

export async function testarChaveIa(formulario: FormData) {
  const usuario = await exigirUsuario();
  const provedor = lerProvedor(formulario);
  if (!provedor.success) redirect("/configuracoes/ia?erro=dados");
  const chave = await obterCredencialConfigurada(usuario.id, provedor.data);
  if (!chave) redirect("/configuracoes/ia?erro=ausente");
  const definicao = obterDefinicaoProvedor(provedor.data);
  const estado = await testarProvedorConfigurado(usuario.id, { provedor: definicao.provedor, modelo: definicao.modelo, chave });
  revalidatePath("/configuracoes/ia");
  redirect(`/configuracoes/ia?teste=${estado}&provedor=${provedor.data}`);
}

export async function usarSomenteInterpretacaoLocal() {
  const usuario = await exigirUsuario();
  await desativarTodasConfiguracoesIa(usuario.id);
  revalidatePath("/configuracoes/ia");
  redirect("/configuracoes/ia?sucesso=local");
}
