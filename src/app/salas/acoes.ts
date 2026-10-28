"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/servidor/autenticacao";
import {
  arquivarSala,
  criarModuloSala,
  criarSala,
  entrarModuloSalaComCodigo,
  desvincularInstanciaModuloSala,
  ErroSala,
  excluirSala,
  gerarConviteModuloSala,
  removerParticipanteModuloSala,
  removerMembroSala,
  revogarConviteModuloSala,
  sairDaSala,
  sairDoModuloSala,
  vincularInstanciaModuloSala,
} from "@/servidor/salas";

export type EstadoGeracaoConvite = { codigo?: string; link?: string; expiraEm?: string; erro?: string };

function texto(formulario: FormData, campo: string) {
  const valor = formulario.get(campo);
  return typeof valor === "string" ? valor : "";
}

function codigoErro(erro: unknown) {
  if (!(erro instanceof ErroSala)) return "falha";
  const mapa = {
    DADOS_INVALIDOS: "dados",
    NAO_ENCONTRADO: "indisponivel",
    CONVITE_INVALIDO: "convite",
    SOLICITACAO_DUPLICADA: "duplicada",
    LIMITE_MODULOS: "limite",
    ESTADO_INVALIDO: "estado",
    VINCULO_DUPLICADO: "vinculo",
  } as const;
  return mapa[erro.codigo];
}

function caminhoSala(formulario: FormData) {
  const identificador = texto(formulario, "identificadorSala");
  return identificador ? `/salas/${encodeURIComponent(identificador)}` : "/salas";
}

export async function criarNovaSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  let sala;
  try {
    sala = await criarSala(usuario.id, Object.fromEntries(formulario.entries()));
  } catch (erro) {
    redirect(`/salas?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  redirect(`/salas/${sala.identificador}?sucesso=sala`);
}

export async function entrarEmSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  let destino: { identificadorSala: string; moduloSalaId: string };
  try {
    destino = await entrarModuloSalaComCodigo(usuario.id, { codigo: texto(formulario, "codigo") });
  } catch (erro) {
    redirect(`/salas?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  revalidatePath(`/salas/${destino.identificadorSala}`);
  redirect(`/salas/${destino.identificadorSala}/modulos/${destino.moduloSalaId}?sucesso=entrada`);
}

export async function gerarNovoConvite(_: EstadoGeracaoConvite, formulario: FormData): Promise<EstadoGeracaoConvite> {
  const usuario = await exigirUsuario();
  try {
    const convite = await gerarConviteModuloSala(usuario.id, { moduloSalaId: texto(formulario, "moduloSalaId") });
    revalidatePath(caminhoSala(formulario));
    return { codigo: convite.codigo, link: `/salas/convite/${encodeURIComponent(convite.codigo)}`, expiraEm: convite.expiraEm.toISOString() };
  } catch (erro) {
    return { erro: codigoErro(erro) === "indisponivel" ? "O módulo não está disponível." : "Não foi possível gerar o convite." };
  }
}

export async function revogarConvite(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await revogarConviteModuloSala(usuario.id, texto(formulario, "conviteId"));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=convite-revogado`);
}

export async function criarNovoModuloSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await criarModuloSala(usuario.id, Object.fromEntries(formulario.entries()));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=modulo`);
}

export async function aderirModuloSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  const moduloPessoalId = texto(formulario, "moduloPessoalId");
  try {
    await vincularInstanciaModuloSala(usuario.id, {
      moduloSalaId: texto(formulario, "moduloSalaId"),
      moduloPessoalId: moduloPessoalId || undefined,
      criarInstancia: texto(formulario, "modo") === "criar",
    });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  revalidatePath("/modulos");
  redirect(`${caminho}?sucesso=vinculo`);
}

export async function desvincularInstancia(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await desvincularInstanciaModuloSala(usuario.id, texto(formulario, "vinculoId"));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=desvinculado`);
}

export async function sairModulo(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = `${caminhoSala(formulario)}/modulos/${encodeURIComponent(texto(formulario, "moduloSalaId"))}`;
  try {
    await sairDoModuloSala(usuario.id, { moduloSalaId: texto(formulario, "moduloSalaId") });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  revalidatePath(caminhoSala(formulario));
  redirect(caminhoSala(formulario));
}

export async function removerParticipanteModulo(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = `${caminhoSala(formulario)}/modulos/${encodeURIComponent(texto(formulario, "moduloSalaId"))}`;
  try {
    await removerParticipanteModuloSala(usuario.id, {
      moduloSalaId: texto(formulario, "moduloSalaId"),
      participacaoId: texto(formulario, "participacaoId"),
    });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  revalidatePath(caminhoSala(formulario));
  redirect(`${caminho}?sucesso=participante-removido`);
}

export async function removerMembro(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await removerMembroSala(usuario.id, { salaId: texto(formulario, "salaId"), membroId: texto(formulario, "membroId") });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=membro-removido`);
}

export async function sairSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await sairDaSala(usuario.id, { salaId: texto(formulario, "salaId") });
  } catch (erro) {
    redirect(`${caminhoSala(formulario)}?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  redirect("/salas?sucesso=saida");
}

export async function arquivarSalaAtual(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await arquivarSala(usuario.id, { salaId: texto(formulario, "salaId") });
  } catch (erro) {
    redirect(`${caminhoSala(formulario)}?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  redirect("/salas?sucesso=arquivada");
}

export async function excluirSalaAtual(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await excluirSala(usuario.id, { salaId: texto(formulario, "salaId") });
  } catch (erro) {
    redirect(`${caminhoSala(formulario)}?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  redirect("/salas?sucesso=excluida");
}
