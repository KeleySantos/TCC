import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { NOME_USUARIO_ADMIN } from "@/dominio/administracao-ia";
import { criarHashSenha, verificarSenha } from "./senhas";
import { prepararFotoPerfil } from "./foto-perfil";
import { prepararRemocaoArquivoMaterial } from "./arquivos-materiais";
import { prepararExclusaoContaNasSalas } from "./salas";

export class ErroPerfil extends Error {
  constructor(public readonly codigo: "DADOS_INVALIDOS" | "SENHA_INCORRETA" | "NOME_EXISTENTE" | "ADMIN_PROTEGIDO" | "FOTO_INVALIDA" | "NAO_ENCONTRADO") {
    super(codigo);
  }
}

const esquemaNome = z.object({ nome: z.string().trim().min(2).max(80), nomeUsuario: z.string().trim().toLowerCase().min(2).max(40).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/) });
const esquemaSenha = z.object({ senhaAtual: z.string().min(1).max(128), novaSenha: z.string().min(8).max(128), confirmarSenha: z.string() }).refine((dados) => dados.novaSenha === dados.confirmarSenha);

export async function obterPerfil(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nome: true, nomeUsuario: true, administradorIa: true, fotoPerfilAtualizadaEm: true } });
  if (!usuario) throw new ErroPerfil("NAO_ENCONTRADO");
  return { nome: usuario.nome, nomeUsuario: usuario.nomeUsuario, administradorIa: usuario.administradorIa, fotoVersao: usuario.fotoPerfilAtualizadaEm?.toISOString() ?? null };
}

async function conferirSenha(usuarioId: string, senha: unknown) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { senhaHash: true, administradorIa: true } });
  if (!usuario) throw new ErroPerfil("NAO_ENCONTRADO");
  if (typeof senha !== "string" || senha.length > 128 || !verificarSenha(senha, usuario.senhaHash)) throw new ErroPerfil("SENHA_INCORRETA");
  return usuario;
}

export async function atualizarNomePerfil(usuarioId: string, entrada: unknown) {
  const dados = esquemaNome.safeParse(entrada);
  if (!dados.success) throw new ErroPerfil("DADOS_INVALIDOS");
  const atual = await obterPerfil(usuarioId);
  if (atual.administradorIa && dados.data.nomeUsuario !== NOME_USUARIO_ADMIN) throw new ErroPerfil("ADMIN_PROTEGIDO");
  if (!atual.administradorIa && dados.data.nomeUsuario === NOME_USUARIO_ADMIN) throw new ErroPerfil("NOME_EXISTENTE");
  try {
    await prisma.usuario.update({ where: { id: usuarioId }, data: dados.data });
  } catch (erro) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "P2002") throw new ErroPerfil("NOME_EXISTENTE");
    throw erro;
  }
  return obterPerfil(usuarioId);
}

export async function alterarSenhaPerfil(usuarioId: string, entrada: unknown) {
  const dados = esquemaSenha.safeParse(entrada);
  if (!dados.success) throw new ErroPerfil("DADOS_INVALIDOS");
  await conferirSenha(usuarioId, dados.data.senhaAtual);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash: criarHashSenha(dados.data.novaSenha) } });
}

export async function alterarFotoPerfil(usuarioId: string, arquivo: File) {
  let foto: Buffer;
  try { foto = await prepararFotoPerfil(arquivo); } catch { throw new ErroPerfil("FOTO_INVALIDA"); }
  await prisma.usuario.update({ where: { id: usuarioId }, data: { fotoPerfil: new Uint8Array(foto), fotoPerfilAtualizadaEm: new Date() } });
  return obterPerfil(usuarioId);
}

export async function excluirContaPessoal(usuarioId: string, entrada: unknown) {
  const dados = z.object({ senhaAtual: z.string().min(1).max(128), confirmacao: z.literal("EXCLUIR") }).safeParse(entrada);
  if (!dados.success) throw new ErroPerfil("DADOS_INVALIDOS");
  const usuario = await conferirSenha(usuarioId, dados.data.senhaAtual);
  if (usuario.administradorIa) throw new ErroPerfil("ADMIN_PROTEGIDO");
  const arquivos = await prisma.arquivoMaterial.findMany({ where: { recurso: { modulo: { usuarioId } } }, select: { chaveArmazenamento: true } });
  const remocoes: Array<NonNullable<Awaited<ReturnType<typeof prepararRemocaoArquivoMaterial>>>> = [];
  try {
    for (const arquivo of arquivos) {
      const remocao = await prepararRemocaoArquivoMaterial(arquivo.chaveArmazenamento);
      if (remocao) remocoes.push(remocao);
    }
    await prisma.$transaction(async (transacao) => {
      await prepararExclusaoContaNasSalas(transacao, usuarioId);
      // Relações docentes legadas não podem bloquear a exclusão de uma conta pessoal.
      await transacao.turma.deleteMany({ where: { professor: { usuarioId } } });
      await transacao.sessaoEstudo.deleteMany({ where: { usuarioId } });
      await transacao.usuario.delete({ where: { id: usuarioId } });
    });
  } catch (erro) {
    await Promise.all(remocoes.map((remocao) => remocao.restaurar()));
    throw erro;
  }
  const limpeza = await Promise.allSettled(remocoes.map((remocao) => remocao.confirmar()));
  if (limpeza.some((item) => item.status === "rejected")) console.error("[Perfil] Arquivos excluídos permanecem em quarentena para limpeza local.");
}
