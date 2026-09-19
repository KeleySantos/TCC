"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/servidor/autenticacao";
import { cancelarDesafioPessoal, criarDesafioPessoal, ErroDesafio } from "@/servidor/desafios";

function voltarComErro(codigo: "dados" | "indisponivel") {
  redirect(`/desafios?erro=${codigo}`);
}

export async function criarDesafio(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await criarDesafioPessoal(usuario.id, {
      moduloId: formulario.get("moduloId"),
      metodo: formulario.get("metodo"),
      meta: formulario.get("meta"),
    });
  } catch (erro) {
    if (erro instanceof ErroDesafio) voltarComErro(erro.codigo === "DADOS_INVALIDOS" ? "dados" : "indisponivel");
    throw erro;
  }
  revalidatePath("/desafios");
  revalidatePath("/modulos/[identificador]", "page");
  redirect("/desafios?sucesso=criado");
}

export async function cancelarDesafio(formulario: FormData) {
  const usuario = await exigirUsuario();
  const desafioId = formulario.get("desafioId");
  if (typeof desafioId !== "string") {
    voltarComErro("dados");
    return;
  }
  try {
    await cancelarDesafioPessoal(usuario.id, desafioId);
  } catch (erro) {
    if (erro instanceof ErroDesafio) voltarComErro("indisponivel");
    throw erro;
  }
  revalidatePath("/desafios");
  revalidatePath("/modulos/[identificador]", "page");
  redirect("/desafios?sucesso=cancelado");
}
