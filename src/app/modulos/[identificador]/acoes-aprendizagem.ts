"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/servidor/autenticacao";
import { confirmarEvidenciaPessoal, rejeitarEvidenciaPessoal } from "@/servidor/aprendizagem-modulo";

export async function confirmarEvidencia(formulario: FormData) {
  const usuario = await exigirUsuario();
  const evidenciaId = String(formulario.get("evidenciaId") ?? "");
  const caminho = String(formulario.get("caminho") ?? "/modulos");
  const questoes = [...formulario.entries()].filter(([chave]) => chave.startsWith("questao-resultado:")).map(([chave, valor]) => {
    const id = chave.slice("questao-resultado:".length);
    const lerNumero = (nome: string) => formulario.get(`${nome}:${id}`) === "" ? null : formulario.get(`${nome}:${id}`);
    return {
      id,
      resultado: String(valor) as "ACERTO" | "PARCIAL" | "ERRO" | "NAO_INFORMADO",
      tipo: String(formulario.get(`questao-tipo:${id}`) ?? "OUTRA"),
      pontuacaoObtida: lerNumero("questao-obtida"),
      pontuacaoMaxima: lerNumero("questao-maxima"),
      conceitoIds: formulario.getAll(`questao-conceito:${id}`).map(String),
    };
  });
  await confirmarEvidenciaPessoal(usuario.id, {
    evidenciaId,
    desempenhoPercentual: formulario.get("desempenhoPercentual") === "" ? null : formulario.get("desempenhoPercentual"),
    dataEvento: formulario.get("dataEvento"),
    questoes,
    conceitoIds: formulario.getAll("conceitoId").map(String),
  });
  revalidatePath(caminho);
}

export async function rejeitarEvidencia(formulario: FormData) {
  const usuario = await exigirUsuario();
  await rejeitarEvidenciaPessoal(usuario.id, String(formulario.get("evidenciaId") ?? ""));
  revalidatePath(String(formulario.get("caminho") ?? "/modulos"));
}
