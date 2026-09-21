"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/servidor/autenticacao";
import {
  arquivarMaterialPessoal,
  arquivarModuloPessoal,
  atualizarMaterialPessoal,
  atualizarModuloPessoal,
  criarMaterialPessoal,
  criarModuloPessoal,
  criarRascunhoModuloPessoal,
  ErroModulo,
} from "@/servidor/modulos";

function objetoDoFormulario(formulario: FormData) {
  return Object.fromEntries(formulario.entries());
}

function codigoDeErro(erro: unknown) {
  if (!(erro instanceof ErroModulo)) return "dados";
  if (erro.codigo === "IDENTIFICADOR_DUPLICADO") return "duplicado";
  if (erro.codigo === "NAO_ENCONTRADO") return "indisponivel";
  return "dados";
}

function caminhoModulo(identificador: FormDataEntryValue | null) {
  return typeof identificador === "string" ? `/modulos/${encodeURIComponent(identificador)}` : "/modulos";
}

export async function criarModulo(formulario: FormData) {
  const usuario = await exigirUsuario();
  let modulo;
  try {
    modulo = await criarModuloPessoal(usuario.id, objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`/modulos?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath("/modulos");
  revalidatePath("/dashboard");
  redirect(`/modulos/${modulo.identificador}`);
}

export async function criarRascunhoModulo() {
  const usuario = await exigirUsuario();
  let modulo;
  try {
    modulo = await criarRascunhoModuloPessoal(usuario.id);
  } catch (erro) {
    redirect(`/modulos?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath("/modulos");
  redirect(`/modulos/${modulo.identificador}`);
}

export async function atualizarModulo(formulario: FormData) {
  const usuario = await exigirUsuario();
  let modulo;
  const id = formulario.get("id");
  try {
    modulo = await atualizarModuloPessoal(usuario.id, typeof id === "string" ? id : "", objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`${caminhoModulo(formulario.get("identificadorAtual"))}?erro=${codigoDeErro(erro)}`);
  }
  const caminhoAtual = caminhoModulo(formulario.get("identificadorAtual"));
  revalidatePath("/modulos");
  revalidatePath("/dashboard");
  revalidatePath(caminhoAtual);
  revalidatePath(caminhoModulo(modulo.identificador));
  redirect(`/modulos/${modulo.identificador}?sucesso=modulo`);
}

export async function arquivarModulo(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await arquivarModuloPessoal(usuario.id, objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`${caminhoModulo(formulario.get("identificadorAtual"))}?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath("/modulos");
  revalidatePath("/dashboard");
  redirect("/modulos?sucesso=arquivado");
}

export async function criarMaterial(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoModulo(formulario.get("identificadorModulo"));
  try {
    await criarMaterialPessoal(usuario.id, objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=material`);
}

export async function atualizarMaterial(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoModulo(formulario.get("identificadorModulo"));
  const id = formulario.get("id");
  try {
    await atualizarMaterialPessoal(usuario.id, typeof id === "string" ? id : "", objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=material`);
}

export async function arquivarMaterial(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoModulo(formulario.get("identificadorModulo"));
  try {
    await arquivarMaterialPessoal(usuario.id, objetoDoFormulario(formulario));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoDeErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=material-arquivado`);
}
