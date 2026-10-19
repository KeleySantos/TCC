import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { cifrarCredencial, decifrarCredencial, obterChaveMestraCredenciais } from "./ia/cofre-credenciais";

export class ErroCompartilhamentoModulo extends Error {
  constructor(public readonly codigo: "NAO_ENCONTRADO" | "ACESSO_REVOGADO" | "CODIGO_INVALIDO" | "MODULO_PROPRIO" | "CAPACIDADE_COMPLETA" | "TENTE_NOVAMENTE") { super(codigo); }
}
export type PeriodoCompartilhado = { inicio?: Date | null; fim?: Date };
export type ResumoCompartilhamentoModulo = {
  moduloId: string; titulo: string; codigo: string | null; quantidadeAtivos: number; limite: 3;
  convidados: Array<{ usuarioId: string; nome: string }>;
};
const moduloDisponivel = { arquivado: false, rascunho: false };
const contexto = (moduloId: string) => `learning-lab:compartilhamento-modulo:v1:${moduloId}`;
const normalizar = (codigo: string) => codigo.trim().replace(/\s+/g, "").toUpperCase();
const hashCodigo = (codigo: string) => createHash("sha256").update(`modulo:${normalizar(codigo)}`).digest("hex");
const codigoEntrada = z.object({ codigo: z.string().trim().min(8).max(80) });

async function exigirProprietario(usuarioId: string, moduloId: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({ where: { id: moduloId, usuarioId, ...moduloDisponivel }, select: { id: true, titulo: true } });
  if (!modulo) throw new ErroCompartilhamentoModulo("NAO_ENCONTRADO");
  return modulo;
}

/** Repetição apenas para conflitos transacionais. A restrição de vagas também vale entre processos. */
async function repetirConflito<T>(operacao: () => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try { return await operacao(); } catch (erro) {
      if (erro instanceof ErroCompartilhamentoModulo) throw erro;
      const codigo = erro && typeof erro === "object" && "code" in erro ? String(erro.code) : "";
      const conflito = ["P2002", "P2034", "P2028"].includes(codigo) || /SQLITE_BUSY|database is locked/i.test(String(erro));
      if (!conflito) throw erro;
      if (tentativa >= 2) throw new ErroCompartilhamentoModulo("TENTE_NOVAMENTE");
      await new Promise((resolver) => setTimeout(resolver, 30 * (tentativa + 1)));
    }
  }
}

export async function obterCompartilhamentoModulo(proprietarioId: string, moduloId: string): Promise<ResumoCompartilhamentoModulo> {
  const modulo = await exigirProprietario(proprietarioId, moduloId);
  const [convite, acessos] = await Promise.all([
    prisma.compartilhamentoModulo.findUnique({ where: { moduloId } }),
    prisma.acessoModuloCompartilhado.findMany({ where: { moduloId, vaga: { not: null } }, select: { convidado: { select: { id: true, nome: true } } }, orderBy: { concedidoEm: "asc" } }),
  ]);
  const codigo = convite?.codigoHash && convite.chaveCifrada && convite.vetorInicializacao && convite.etiquetaAutenticacao
    ? decifrarCredencial({ chaveCifrada: convite.chaveCifrada, vetorInicializacao: convite.vetorInicializacao, etiquetaAutenticacao: convite.etiquetaAutenticacao }, contexto(moduloId), await obterChaveMestraCredenciais()) : null;
  return { moduloId, titulo: modulo.titulo, codigo, limite: 3, quantidadeAtivos: acessos.length, convidados: acessos.map(({ convidado }) => ({ usuarioId: convidado.id, nome: convidado.nome })) };
}

export async function gerarCodigoCompartilhamentoModulo(proprietarioId: string, moduloId: string) {
  await exigirProprietario(proprietarioId, moduloId);
  const codigo = `MOD-${randomBytes(12).toString("hex").toUpperCase()}`;
  const segredo = cifrarCredencial(codigo, contexto(moduloId), await obterChaveMestraCredenciais());
  await repetirConflito(() => prisma.$transaction(async (tx) => {
    const convite = await tx.compartilhamentoModulo.upsert({ where: { moduloId }, create: { moduloId }, update: { atualizadoEm: new Date() } });
    if (!convite.codigoHash) await tx.compartilhamentoModulo.update({ where: { moduloId }, data: { codigoHash: hashCodigo(codigo), ...segredo } });
  }));
  return obterCompartilhamentoModulo(proprietarioId, moduloId);
}

export async function aceitarCodigoModulo(convidadoId: string, entrada: unknown) {
  const dados = codigoEntrada.safeParse(entrada);
  if (!dados.success || !/^MOD-[A-F0-9]{24}$/.test(normalizar(dados.data.codigo))) throw new ErroCompartilhamentoModulo("CODIGO_INVALIDO");
  const codigoHash = hashCodigo(dados.data.codigo);
  return repetirConflito(() => prisma.$transaction(async (tx) => {
    // Primeira operação é escrita: serializa adesões/encerramento antes de ler as vagas.
    const travado = await tx.compartilhamentoModulo.updateMany({ where: { codigoHash }, data: { atualizadoEm: new Date() } });
    if (!travado.count) throw new ErroCompartilhamentoModulo("CODIGO_INVALIDO");
    const convite = await tx.compartilhamentoModulo.findUnique({ where: { codigoHash }, select: { moduloId: true, modulo: { select: { usuarioId: true, arquivado: true, rascunho: true } } } });
    if (!convite || convite.modulo.arquivado || convite.modulo.rascunho) throw new ErroCompartilhamentoModulo("CODIGO_INVALIDO");
    if (convite.modulo.usuarioId === convidadoId) throw new ErroCompartilhamentoModulo("MODULO_PROPRIO");
    const { moduloId } = convite;
    const anterior = await tx.acessoModuloCompartilhado.findUnique({ where: { moduloId_convidadoId: { moduloId, convidadoId } } });
    if (anterior?.vaga != null) return { moduloId, jaPossuiAcesso: true };
    const ativos = await tx.acessoModuloCompartilhado.findMany({ where: { moduloId, vaga: { not: null } }, select: { vaga: true } });
    const vaga = [1, 2, 3].find((numero) => !ativos.some((acesso) => acesso.vaga === numero));
    if (!vaga) throw new ErroCompartilhamentoModulo("CAPACIDADE_COMPLETA");
    // Uma reativação é uma nova concessão, inclusive se acontecer no mesmo milissegundo.
    await tx.acessoModuloCompartilhado.upsert({ where: { moduloId_convidadoId: { moduloId, convidadoId } }, create: { moduloId, convidadoId, vaga }, update: { id: randomUUID(), vaga, revogadoEm: null, concedidoEm: new Date() } });
    return { moduloId, jaPossuiAcesso: false };
  }));
}

export async function removerAcessoModulo(proprietarioId: string, moduloId: string, convidadoId: string) {
  await exigirProprietario(proprietarioId, moduloId);
  await prisma.acessoModuloCompartilhado.updateMany({ where: { moduloId, convidadoId, vaga: { not: null } }, data: { vaga: null, revogadoEm: new Date() } });
}

export async function encerrarCompartilhamentoModulo(proprietarioId: string, moduloId: string) {
  await exigirProprietario(proprietarioId, moduloId);
  await repetirConflito(() => prisma.$transaction(async (tx) => {
    await tx.compartilhamentoModulo.updateMany({ where: { moduloId }, data: { codigoHash: null, chaveCifrada: null, vetorInicializacao: null, etiquetaAutenticacao: null } });
    await tx.acessoModuloCompartilhado.updateMany({ where: { moduloId, vaga: { not: null } }, data: { vaga: null, revogadoEm: new Date() } });
  }));
}

export async function listarModulosCompartilhados(convidadoId: string) {
  const acessos = await prisma.acessoModuloCompartilhado.findMany({ where: { convidadoId, vaga: { not: null }, modulo: { ...moduloDisponivel, compartilhamento: { codigoHash: { not: null } } } }, select: { modulo: { select: { id: true, identificador: true, titulo: true, usuario: { select: { nome: true } } } } }, orderBy: { concedidoEm: "desc" } });
  return acessos.map(({ modulo }) => ({ moduloId: modulo.id, identificador: modulo.identificador, titulo: modulo.titulo, proprietarioNome: modulo.usuario.nome }));
}

export async function exigirAcessoDashboardCompartilhado(convidadoId: string, moduloId: string) {
  const acesso = await prisma.acessoModuloCompartilhado.findFirst({ where: { moduloId, convidadoId, vaga: { not: null }, modulo: { ...moduloDisponivel, compartilhamento: { codigoHash: { not: null } } } }, select: { id: true, concedidoEm: true, modulo: { select: { id: true, identificador: true, titulo: true, usuarioId: true, usuario: { select: { nome: true } } } } } });
  if (!acesso) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  return { moduloId, identificador: acesso.modulo.identificador, titulo: acesso.modulo.titulo, proprietarioId: acesso.modulo.usuarioId, proprietarioNome: acesso.modulo.usuario.nome, concedidoEm: acesso.concedidoEm, versaoAcesso: acesso.id };
}
