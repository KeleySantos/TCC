"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/servidor/autenticacao";
import {
  alterarConsentimentosVinculo,
  arquivarSala,
  criarModuloSala,
  criarSala,
  decidirSolicitacaoSala,
  desvincularInstanciaModuloSala,
  ErroSala,
  excluirSala,
  gerarConviteSala,
  publicarComentarioSala,
  removerMembroSala,
  revogarConviteSala,
  sairDaSala,
  solicitarEntradaSala,
  vincularInstanciaModuloSala,
} from "@/servidor/salas";

export type EstadoGeracaoConvite = { codigo?: string; link?: string; expiraEm?: string; erro?: string };

function texto(formulario: FormData, campo: string) {
  const valor = formulario.get(campo);
  return typeof valor === "string" ? valor : "";
}

function booleano(formulario: FormData, campo: string) {
  return formulario.get(campo) === "on" || formulario.get(campo) === "true";
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

export async function pedirEntradaSala(formulario: FormData) {
  const usuario = await exigirUsuario();
  try {
    await solicitarEntradaSala(usuario.id, { codigo: texto(formulario, "codigo") });
  } catch (erro) {
    redirect(`/salas?erro=${codigoErro(erro)}`);
  }
  revalidatePath("/salas");
  redirect("/salas?sucesso=solicitada");
}

export async function gerarNovoConvite(_: EstadoGeracaoConvite, formulario: FormData): Promise<EstadoGeracaoConvite> {
  const usuario = await exigirUsuario();
  try {
    const convite = await gerarConviteSala(usuario.id, { salaId: texto(formulario, "salaId") });
    revalidatePath(caminhoSala(formulario));
    return { codigo: convite.codigo, link: `/salas/convite/${encodeURIComponent(convite.codigo)}`, expiraEm: convite.expiraEm.toISOString() };
  } catch (erro) {
    return { erro: codigoErro(erro) === "indisponivel" ? "A sala não está disponível." : "Não foi possível gerar o convite." };
  }
}

export async function revogarConvite(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await revogarConviteSala(usuario.id, texto(formulario, "conviteId"));
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=convite-revogado`);
}

export async function decidirSolicitacao(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await decidirSolicitacaoSala(usuario.id, { solicitacaoId: texto(formulario, "solicitacaoId"), aprovar: texto(formulario, "decisao") === "aprovar" });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=solicitacao`);
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

export async function atualizarConsentimentos(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await alterarConsentimentosVinculo(usuario.id, {
      vinculoId: texto(formulario, "vinculoId"),
      permitirComparacao: booleano(formulario, "permitirComparacao"),
      permitirIa: booleano(formulario, "permitirIa"),
    });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=consentimentos`);
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

export async function publicarComentario(formulario: FormData) {
  const usuario = await exigirUsuario();
  const caminho = caminhoSala(formulario);
  try {
    await publicarComentarioSala(usuario.id, {
      salaId: texto(formulario, "salaId"),
      escopo: texto(formulario, "escopo"),
      moduloSalaId: texto(formulario, "moduloSalaId") || undefined,
      destinatarioId: texto(formulario, "destinatarioId") || undefined,
      conteudo: texto(formulario, "conteudo"),
    });
  } catch (erro) {
    redirect(`${caminho}?erro=${codigoErro(erro)}`);
  }
  revalidatePath(caminho);
  redirect(`${caminho}?sucesso=comentario`);
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
