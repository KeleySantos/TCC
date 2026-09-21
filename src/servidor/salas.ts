import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  EscopoComentarioSala,
  PapelMembroSala,
  SituacaoMembroSala,
  SituacaoModuloSala,
  SituacaoSala,
  SituacaoSolicitacaoSala,
  SituacaoVinculoModuloSala,
} from "@/gerado/prisma/enums";
import type { Prisma } from "@/gerado/prisma/client";
import { prisma } from "@/biblioteca/prisma";

export type CodigoErroSala =
  | "DADOS_INVALIDOS"
  | "NAO_ENCONTRADO"
  | "CONVITE_INVALIDO"
  | "SOLICITACAO_DUPLICADA"
  | "LIMITE_MODULOS"
  | "ESTADO_INVALIDO"
  | "VINCULO_DUPLICADO";

export class ErroSala extends Error {
  constructor(public readonly codigo: CodigoErroSala) {
    super(codigo);
  }
}

const textoNome = z.string().trim().min(3).max(100);
const textoTitulo = z.string().trim().min(3).max(120);
const textoDescricao = z.string().trim().min(3).max(500);
const esquemaCriacaoSala = z.object({
  nome: textoNome,
  descricao: textoDescricao,
  tituloModuloInicial: textoTitulo,
  descricaoModuloInicial: textoDescricao,
});
const esquemaCriacaoModulo = z.object({ salaId: z.string().min(1), titulo: textoTitulo, descricao: textoDescricao });
const esquemaReferenciaSala = z.object({ salaId: z.string().min(1) });
const esquemaReferenciaMembro = esquemaReferenciaSala.extend({ membroId: z.string().min(1) });
const esquemaDecisao = z.object({ solicitacaoId: z.string().min(1), aprovar: z.boolean() });
const esquemaCodigo = z.object({ codigo: z.string().trim().min(8).max(80) });
const esquemaVinculo = z.object({
  moduloSalaId: z.string().min(1),
  moduloPessoalId: z.string().min(1).optional(),
  criarInstancia: z.boolean().default(false),
}).refine((dados) => dados.criarInstancia !== Boolean(dados.moduloPessoalId), "Escolha uma forma de vínculo.");
const esquemaConsentimentos = z.object({
  vinculoId: z.string().min(1),
  permitirComparacao: z.boolean(),
  permitirIa: z.boolean(),
});
const esquemaComentario = z.object({
  salaId: z.string().min(1),
  escopo: z.nativeEnum(EscopoComentarioSala),
  moduloSalaId: z.string().min(1).optional(),
  destinatarioId: z.string().min(1).optional(),
  conteudo: z.string().trim().min(1).max(2_000),
});

function validar<T>(resultado: z.ZodSafeParseResult<T>) {
  if (!resultado.success) throw new ErroSala("DADOS_INVALIDOS");
  return resultado.data;
}

function criarIdentificadorPublico() {
  return `sala-${randomUUID()}`;
}

function normalizarCodigo(codigo: string) {
  return codigo.trim().replace(/\s+/g, "").toUpperCase();
}

function resumirCodigo(codigo: string) {
  return createHash("sha256").update(normalizarCodigo(codigo), "utf8").digest("hex");
}

function criarCodigoConvite() {
  return randomBytes(9).toString("base64url").toUpperCase();
}

export function criarReferenciaContribuinteAnonimo(salaId: string, usuarioId: string) {
  return createHash("sha256").update(`sala:${salaId}:participante:${usuarioId}`, "utf8").digest("hex");
}

async function preservarEvidenciasHistoricas(
  transacao: Prisma.TransactionClient,
  vinculo: { moduloSalaId: string; moduloPessoalId: string; usuarioId: string; dadosDesde: Date | null },
  salaId: string,
) {
  const sessoes = await transacao.sessaoEstudo.findMany({
    where: {
      usuarioId: vinculo.usuarioId,
      moduloId: vinculo.moduloPessoalId,
      situacao: "CONCLUIDA",
      encerradaEm: { not: null, ...(vinculo.dadosDesde ? { gte: vinculo.dadosDesde } : {}) },
      duracaoMinutos: { gte: 5 },
    },
    select: { id: true, encerradaEm: true, duracaoMinutos: true, dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } } },
  });
  if (!sessoes.length) return;
  const contribuinteAnonimoHash = criarReferenciaContribuinteAnonimo(salaId, vinculo.usuarioId);
  for (const sessao of sessoes) {
    if (!sessao.encerradaEm || !sessao.duracaoMinutos) continue;
    await transacao.evidenciaHistoricaModuloSala.upsert({
      where: { referenciaSessaoHash: createHash("sha256").update(`${salaId}:${vinculo.moduloSalaId}:${sessao.id}`, "utf8").digest("hex") },
      create: {
        moduloSalaId: vinculo.moduloSalaId,
        referenciaSessaoHash: createHash("sha256").update(`${salaId}:${vinculo.moduloSalaId}:${sessao.id}`, "utf8").digest("hex"),
        contribuinteAnonimoHash,
        encerradaEm: sessao.encerradaEm,
        duracaoMinutos: sessao.duracaoMinutos,
        dificuldadePercebida: sessao.dificuldadePercebida,
        compreensaoPercebida: sessao.compreensaoPercebida,
        metodosJson: JSON.stringify(sessao.metodos.map((item) => item.metodo)),
        formatosJson: JSON.stringify(sessao.formatos.map((item) => item.formato)),
      },
      update: {},
    });
  }
}

function identificadorModulo(titulo: string) {
  const base = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 55);
  return `${base || "modulo"}-sala-${randomUUID().slice(0, 8)}`;
}

async function exigirSalaDoProprietario(usuarioId: string, salaId: string, permitirArquivada = false) {
  const sala = await prisma.sala.findFirst({
    where: {
      id: salaId,
      proprietarioId: usuarioId,
      situacao: permitirArquivada ? { not: SituacaoSala.EXCLUIDA } : SituacaoSala.ATIVA,
    },
  });
  if (!sala) throw new ErroSala("NAO_ENCONTRADO");
  return sala;
}

async function exigirMembroAtivo(usuarioId: string, salaId: string) {
  const membro = await prisma.membroSala.findFirst({
    where: { salaId, usuarioId, situacao: SituacaoMembroSala.ATIVO, sala: { situacao: SituacaoSala.ATIVA } },
  });
  if (!membro) throw new ErroSala("NAO_ENCONTRADO");
  return membro;
}

export async function criarSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaCriacaoSala.safeParse(entrada));
  return prisma.$transaction(async (transacao) => {
    const sala = await transacao.sala.create({
      data: { proprietarioId: usuarioId, identificador: criarIdentificadorPublico(), nome: dados.nome, descricao: dados.descricao },
    });
    await transacao.membroSala.create({
      data: { salaId: sala.id, usuarioId, papel: PapelMembroSala.PROPRIETARIO },
    });
    await transacao.moduloSala.create({
      data: { salaId: sala.id, titulo: dados.tituloModuloInicial, descricao: dados.descricaoModuloInicial, posicao: 1 },
    });
    await transacao.eventoAuditoria.create({
      data: { atorId: usuarioId, acao: "SALA_CRIADA", alvo: sala.id, metadados: JSON.stringify({ quantidadeModulos: 1 }) },
    });
    return sala;
  });
}

export async function listarSalasDaConta(usuarioId: string) {
  const associacoes = await prisma.membroSala.findMany({
    where: { usuarioId, situacao: SituacaoMembroSala.ATIVO, sala: { situacao: { not: SituacaoSala.EXCLUIDA } } },
    select: {
      papel: true,
      sala: {
        select: {
          id: true, identificador: true, nome: true, descricao: true, situacao: true, atualizadaEm: true,
          _count: { select: { modulos: { where: { situacao: SituacaoModuloSala.ATIVO } }, membros: { where: { situacao: SituacaoMembroSala.ATIVO } } } },
        },
      },
    },
    orderBy: { sala: { atualizadaEm: "desc" } },
  });
  return associacoes.map(({ papel, sala }) => ({ ...sala, papel }));
}

export async function obterSalaDaConta(usuarioId: string, identificador: string) {
  const associacao = await prisma.membroSala.findFirst({
    where: { usuarioId, situacao: SituacaoMembroSala.ATIVO, sala: { identificador, situacao: { not: SituacaoSala.EXCLUIDA } } },
    select: { id: true, papel: true, sala: { select: { id: true, identificador: true, nome: true, descricao: true, situacao: true, proprietarioId: true } } },
  });
  if (!associacao) return null;
  const proprietario = associacao.papel === PapelMembroSala.PROPRIETARIO;
  const [modulos, comentarios, membros, solicitacoes, convites] = await Promise.all([
    prisma.moduloSala.findMany({
      where: { salaId: associacao.sala.id, situacao: SituacaoModuloSala.ATIVO },
      select: {
        id: true, titulo: true, descricao: true, posicao: true,
        vinculos: {
          where: proprietario
            ? { situacao: SituacaoVinculoModuloSala.ATIVO, compartilharDashboard: true }
            : { usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO },
          select: {
            id: true, usuarioId: true, permitirComparacao: true, permitirIa: true,
            moduloPessoal: { select: { id: true, identificador: true, titulo: true } },
            usuario: { select: { nome: true } },
          },
        },
      },
      orderBy: { posicao: "asc" },
    }),
    prisma.comentarioSala.findMany({
      where: {
        salaId: associacao.sala.id,
        ...(proprietario ? {} : {
          OR: [
            { escopo: EscopoComentarioSala.SALA },
            { escopo: EscopoComentarioSala.MEMBRO, destinatarioId: usuarioId },
            { escopo: EscopoComentarioSala.MODULO, moduloSala: { vinculos: { some: { usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO } } } },
          ],
        }),
      },
      select: { id: true, escopo: true, moduloSalaId: true, destinatarioId: true, conteudo: true, criadoEm: true },
      orderBy: { criadoEm: "desc" },
      take: 50,
    }),
    proprietario ? prisma.membroSala.findMany({
      where: { salaId: associacao.sala.id, situacao: SituacaoMembroSala.ATIVO },
      select: { id: true, usuarioId: true, papel: true, usuario: { select: { nome: true, nomeUsuario: true } } },
      orderBy: { entrouEm: "asc" },
    }) : Promise.resolve([]),
    proprietario ? prisma.solicitacaoEntradaSala.findMany({
      where: { salaId: associacao.sala.id, situacao: SituacaoSolicitacaoSala.PENDENTE },
      select: { id: true, solicitadaEm: true, solicitante: { select: { nome: true, nomeUsuario: true } } },
      orderBy: { solicitadaEm: "asc" },
    }) : Promise.resolve([]),
    proprietario ? prisma.conviteSala.findMany({
      where: { salaId: associacao.sala.id, revogadoEm: null, expiraEm: { gt: new Date() } },
      select: { id: true, criadoEm: true, expiraEm: true },
      orderBy: { criadoEm: "desc" },
    }) : Promise.resolve([]),
  ]);
  return { ...associacao.sala, papel: associacao.papel, modulos, comentarios, membros, solicitacoes, convites };
}

export async function gerarConviteSala(usuarioId: string, entrada: unknown) {
  const { salaId } = validar(esquemaReferenciaSala.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, salaId);
  const codigo = criarCodigoConvite();
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
  const convite = await prisma.conviteSala.create({
    data: { salaId, criadoPorId: usuarioId, codigoHash: resumirCodigo(codigo), expiraEm },
    select: { id: true, expiraEm: true },
  });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "CONVITE_SALA_GERADO", alvo: convite.id, metadados: JSON.stringify({ salaId }) } });
  return { ...convite, codigo };
}

export async function revogarConviteSala(usuarioId: string, conviteId: string) {
  const convite = await prisma.conviteSala.findFirst({ where: { id: conviteId, revogadoEm: null, sala: { proprietarioId: usuarioId, situacao: SituacaoSala.ATIVA } } });
  if (!convite) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.conviteSala.update({ where: { id: convite.id }, data: { revogadoEm: new Date() } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "CONVITE_SALA_REVOGADO", alvo: convite.id } });
}

export async function solicitarEntradaSala(usuarioId: string, entrada: unknown) {
  const { codigo } = validar(esquemaCodigo.safeParse(entrada));
  const convite = await prisma.conviteSala.findUnique({
    where: { codigoHash: resumirCodigo(codigo) },
    select: { id: true, salaId: true, revogadoEm: true, expiraEm: true, sala: { select: { proprietarioId: true, identificador: true, situacao: true } } },
  });
  if (!convite || convite.revogadoEm || convite.expiraEm <= new Date() || convite.sala.situacao !== SituacaoSala.ATIVA || convite.sala.proprietarioId === usuarioId) {
    throw new ErroSala("CONVITE_INVALIDO");
  }
  const [membro, pendente] = await Promise.all([
    prisma.membroSala.findUnique({ where: { salaId_usuarioId: { salaId: convite.salaId, usuarioId } } }),
    prisma.solicitacaoEntradaSala.findFirst({ where: { salaId: convite.salaId, solicitanteId: usuarioId, situacao: SituacaoSolicitacaoSala.PENDENTE } }),
  ]);
  if (membro?.situacao === SituacaoMembroSala.ATIVO || pendente) throw new ErroSala("SOLICITACAO_DUPLICADA");
  const solicitacao = await prisma.solicitacaoEntradaSala.create({ data: { salaId: convite.salaId, conviteId: convite.id, solicitanteId: usuarioId } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "ENTRADA_SALA_SOLICITADA", alvo: solicitacao.id, metadados: JSON.stringify({ salaId: convite.salaId }) } });
  return convite.sala.identificador;
}

export async function decidirSolicitacaoSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaDecisao.safeParse(entrada));
  const solicitacao = await prisma.solicitacaoEntradaSala.findFirst({
    where: { id: dados.solicitacaoId, situacao: SituacaoSolicitacaoSala.PENDENTE, sala: { proprietarioId: usuarioId, situacao: SituacaoSala.ATIVA } },
  });
  if (!solicitacao) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.$transaction(async (transacao) => {
    await transacao.solicitacaoEntradaSala.update({
      where: { id: solicitacao.id },
      data: { situacao: dados.aprovar ? SituacaoSolicitacaoSala.APROVADA : SituacaoSolicitacaoSala.REJEITADA, decididaEm: new Date(), decididaPorId: usuarioId },
    });
    if (dados.aprovar) {
      await transacao.membroSala.upsert({
        where: { salaId_usuarioId: { salaId: solicitacao.salaId, usuarioId: solicitacao.solicitanteId } },
        create: { salaId: solicitacao.salaId, usuarioId: solicitacao.solicitanteId, papel: PapelMembroSala.MEMBRO },
        update: { papel: PapelMembroSala.MEMBRO, situacao: SituacaoMembroSala.ATIVO, entrouEm: new Date(), encerrouEm: null },
      });
    }
    await transacao.eventoAuditoria.create({
      data: { atorId: usuarioId, acao: dados.aprovar ? "ENTRADA_SALA_APROVADA" : "ENTRADA_SALA_REJEITADA", alvo: solicitacao.id, metadados: JSON.stringify({ salaId: solicitacao.salaId }) },
    });
  });
}

export async function criarModuloSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaCriacaoModulo.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, dados.salaId);
  const quantidade = await prisma.moduloSala.count({ where: { salaId: dados.salaId, situacao: SituacaoModuloSala.ATIVO } });
  if (quantidade >= 5) throw new ErroSala("LIMITE_MODULOS");
  const modulo = await prisma.moduloSala.create({ data: { salaId: dados.salaId, titulo: dados.titulo, descricao: dados.descricao, posicao: quantidade + 1 } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "MODULO_SALA_CRIADO", alvo: modulo.id, metadados: JSON.stringify({ salaId: dados.salaId }) } });
  return modulo;
}

export async function vincularInstanciaModuloSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaVinculo.safeParse(entrada));
  const moduloSala = await prisma.moduloSala.findFirst({
    where: { id: dados.moduloSalaId, situacao: SituacaoModuloSala.ATIVO, sala: { situacao: SituacaoSala.ATIVA } },
    select: { id: true, salaId: true, titulo: true, descricao: true },
  });
  if (!moduloSala) throw new ErroSala("NAO_ENCONTRADO");
  const membro = await exigirMembroAtivo(usuarioId, moduloSala.salaId);
  const existente = await prisma.vinculoModuloSala.findUnique({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloSala.id, usuarioId } } });
  if (existente?.situacao === SituacaoVinculoModuloSala.ATIVO) throw new ErroSala("VINCULO_DUPLICADO");
  if (dados.moduloPessoalId) {
    const vinculoNaSala = await prisma.vinculoModuloSala.findFirst({
      where: { moduloPessoalId: dados.moduloPessoalId, situacao: SituacaoVinculoModuloSala.ATIVO, moduloSala: { salaId: moduloSala.salaId } },
    });
    if (vinculoNaSala) throw new ErroSala("VINCULO_DUPLICADO");
  }

  return prisma.$transaction(async (transacao) => {
    let moduloPessoalId = dados.moduloPessoalId;
    if (dados.criarInstancia) {
      const novo = await transacao.moduloAprendizagem.create({
        data: { usuarioId, identificador: identificadorModulo(moduloSala.titulo), titulo: moduloSala.titulo, descricao: moduloSala.descricao },
        select: { id: true },
      });
      moduloPessoalId = novo.id;
    } else {
      const pessoal = await transacao.moduloAprendizagem.findFirst({ where: { id: moduloPessoalId, usuarioId, arquivado: false, rascunho: false }, select: { id: true } });
      if (!pessoal) throw new ErroSala("NAO_ENCONTRADO");
    }
    if (!moduloPessoalId) throw new ErroSala("DADOS_INVALIDOS");
    const vinculo = existente
      ? await transacao.vinculoModuloSala.update({
        where: { id: existente.id },
        data: { membroSalaId: membro.id, moduloPessoalId, situacao: SituacaoVinculoModuloSala.ATIVO, compartilharDashboard: true, permitirComparacao: false, permitirIa: false, vinculadoEm: new Date(), dadosDesde: existente.moduloPessoalId === moduloPessoalId ? new Date() : null, desvinculadoEm: null },
      })
      : await transacao.vinculoModuloSala.create({ data: { moduloSalaId: moduloSala.id, membroSalaId: membro.id, usuarioId, moduloPessoalId } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: dados.criarInstancia ? "INSTANCIA_SALA_CRIADA" : "INSTANCIA_SALA_VINCULADA", alvo: vinculo.id, metadados: JSON.stringify({ moduloSalaId: moduloSala.id }) } });
    return vinculo;
  });
}

export async function alterarConsentimentosVinculo(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaConsentimentos.safeParse(entrada));
  const vinculo = await prisma.vinculoModuloSala.findFirst({ where: { id: dados.vinculoId, usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO, membroSala: { situacao: SituacaoMembroSala.ATIVO }, moduloSala: { sala: { situacao: SituacaoSala.ATIVA } } } });
  if (!vinculo) throw new ErroSala("NAO_ENCONTRADO");
  const atualizado = await prisma.vinculoModuloSala.update({ where: { id: vinculo.id }, data: { permitirComparacao: dados.permitirComparacao, permitirIa: dados.permitirIa } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "CONSENTIMENTOS_SALA_ALTERADOS", alvo: vinculo.id, metadados: JSON.stringify({ permitirComparacao: dados.permitirComparacao, permitirIa: dados.permitirIa }) } });
  return atualizado;
}

export async function desvincularInstanciaModuloSala(usuarioId: string, vinculoId: string) {
  const vinculo = await prisma.vinculoModuloSala.findFirst({ where: { id: vinculoId, usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO }, select: { id: true, moduloSalaId: true, moduloPessoalId: true, usuarioId: true, dadosDesde: true, moduloSala: { select: { salaId: true } } } });
  if (!vinculo) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.$transaction(async (transacao) => {
    await preservarEvidenciasHistoricas(transacao, vinculo, vinculo.moduloSala.salaId);
    await transacao.vinculoModuloSala.update({ where: { id: vinculo.id }, data: { situacao: SituacaoVinculoModuloSala.DESVINCULADO, compartilharDashboard: false, permitirComparacao: false, permitirIa: false, desvinculadoEm: new Date() } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "INSTANCIA_SALA_DESVINCULADA", alvo: vinculo.id } });
  });
}

async function encerrarParticipacao(usuarioId: string, membroId: string, situacao: typeof SituacaoMembroSala.SAIU | typeof SituacaoMembroSala.REMOVIDO, atorId: string) {
  await prisma.$transaction(async (transacao) => {
    const vinculos = await transacao.vinculoModuloSala.findMany({ where: { membroSalaId: membroId, situacao: SituacaoVinculoModuloSala.ATIVO }, select: { id: true, moduloSalaId: true, moduloPessoalId: true, usuarioId: true, dadosDesde: true, moduloSala: { select: { salaId: true } } } });
    for (const vinculo of vinculos) await preservarEvidenciasHistoricas(transacao, vinculo, vinculo.moduloSala.salaId);
    await transacao.vinculoModuloSala.updateMany({
      where: { membroSalaId: membroId, situacao: SituacaoVinculoModuloSala.ATIVO },
      data: { situacao: SituacaoVinculoModuloSala.DESVINCULADO, compartilharDashboard: false, permitirComparacao: false, permitirIa: false, desvinculadoEm: new Date() },
    });
    await transacao.membroSala.update({ where: { id: membroId }, data: { situacao, encerrouEm: new Date() } });
    await transacao.eventoAuditoria.create({ data: { atorId, acao: situacao === SituacaoMembroSala.SAIU ? "MEMBRO_SAIU_SALA" : "MEMBRO_REMOVIDO_SALA", alvo: membroId, metadados: JSON.stringify({ usuarioId }) } });
  });
}

export async function sairDaSala(usuarioId: string, entrada: unknown) {
  const { salaId } = validar(esquemaReferenciaSala.safeParse(entrada));
  const membro = await prisma.membroSala.findFirst({ where: { salaId, usuarioId, papel: PapelMembroSala.MEMBRO, situacao: SituacaoMembroSala.ATIVO, sala: { situacao: { not: SituacaoSala.EXCLUIDA } } } });
  if (!membro) throw new ErroSala("NAO_ENCONTRADO");
  await encerrarParticipacao(usuarioId, membro.id, SituacaoMembroSala.SAIU, usuarioId);
}

export async function removerMembroSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaReferenciaMembro.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, dados.salaId);
  const membro = await prisma.membroSala.findFirst({ where: { id: dados.membroId, salaId: dados.salaId, papel: PapelMembroSala.MEMBRO, situacao: SituacaoMembroSala.ATIVO } });
  if (!membro) throw new ErroSala("NAO_ENCONTRADO");
  await encerrarParticipacao(membro.usuarioId, membro.id, SituacaoMembroSala.REMOVIDO, usuarioId);
}

export async function arquivarSala(usuarioId: string, entrada: unknown) {
  const { salaId } = validar(esquemaReferenciaSala.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, salaId);
  await prisma.sala.update({ where: { id: salaId }, data: { situacao: SituacaoSala.ARQUIVADA } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "SALA_ARQUIVADA", alvo: salaId } });
}

export async function excluirSala(usuarioId: string, entrada: unknown) {
  const { salaId } = validar(esquemaReferenciaSala.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, salaId, true);
  await prisma.$transaction(async (transacao) => {
    await transacao.vinculoModuloSala.updateMany({ where: { moduloSala: { salaId }, situacao: SituacaoVinculoModuloSala.ATIVO }, data: { situacao: SituacaoVinculoModuloSala.DESVINCULADO, compartilharDashboard: false, permitirComparacao: false, permitirIa: false, desvinculadoEm: new Date() } });
    await transacao.conviteSala.updateMany({ where: { salaId, revogadoEm: null }, data: { revogadoEm: new Date() } });
    await transacao.sala.update({ where: { id: salaId }, data: { situacao: SituacaoSala.EXCLUIDA } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "SALA_EXCLUIDA", alvo: salaId } });
  });
}

export async function publicarComentarioSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaComentario.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, dados.salaId);
  if (dados.escopo === EscopoComentarioSala.SALA && (dados.moduloSalaId || dados.destinatarioId)) throw new ErroSala("DADOS_INVALIDOS");
  if (dados.escopo === EscopoComentarioSala.MODULO) {
    if (!dados.moduloSalaId || dados.destinatarioId) throw new ErroSala("DADOS_INVALIDOS");
    const modulo = await prisma.moduloSala.findFirst({ where: { id: dados.moduloSalaId, salaId: dados.salaId, situacao: SituacaoModuloSala.ATIVO } });
    if (!modulo) throw new ErroSala("NAO_ENCONTRADO");
  }
  if (dados.escopo === EscopoComentarioSala.MEMBRO) {
    if (!dados.destinatarioId || dados.moduloSalaId) throw new ErroSala("DADOS_INVALIDOS");
    const membro = await prisma.membroSala.findFirst({ where: { salaId: dados.salaId, usuarioId: dados.destinatarioId, situacao: SituacaoMembroSala.ATIVO } });
    if (!membro) throw new ErroSala("NAO_ENCONTRADO");
  }
  const comentario = await prisma.comentarioSala.create({ data: { salaId: dados.salaId, autorId: usuarioId, escopo: dados.escopo, moduloSalaId: dados.moduloSalaId, destinatarioId: dados.destinatarioId, conteudo: dados.conteudo } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "COMENTARIO_SALA_PUBLICADO", alvo: comentario.id, metadados: JSON.stringify({ salaId: dados.salaId, escopo: dados.escopo }) } });
  return comentario;
}
