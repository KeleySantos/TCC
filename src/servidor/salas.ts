import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  PapelParticipacaoModuloSala,
  PapelMembroSala,
  SituacaoParticipacaoModuloSala,
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
const esquemaReferenciaModuloSala = z.object({ moduloSalaId: z.string().min(1) });
const esquemaReferenciaMembro = esquemaReferenciaSala.extend({ membroId: z.string().min(1) });
const esquemaReferenciaParticipacao = esquemaReferenciaModuloSala.extend({ participacaoId: z.string().min(1) });
const esquemaCodigo = z.object({ codigo: z.string().trim().min(8).max(80) });
const esquemaVinculo = z.object({
  moduloSalaId: z.string().min(1),
  moduloPessoalId: z.string().min(1).optional(),
  criarInstancia: z.boolean().default(false),
}).refine((dados) => dados.criarInstancia !== Boolean(dados.moduloPessoalId), "Escolha uma forma de vínculo.");

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

export async function prepararExclusaoContaNasSalas(transacao: Prisma.TransactionClient, usuarioId: string) {
  const vinculos = await transacao.vinculoModuloSala.findMany({
    where: { usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO, moduloSala: { sala: { proprietarioId: { not: usuarioId } } } },
    select: { moduloSalaId: true, moduloPessoalId: true, usuarioId: true, dadosDesde: true, moduloSala: { select: { salaId: true } } },
  });
  for (const vinculo of vinculos) await preservarEvidenciasHistoricas(transacao, vinculo, vinculo.moduloSala.salaId);
  await transacao.vinculoModuloSala.deleteMany({ where: { usuarioId } });
  await transacao.solicitacaoEntradaSala.deleteMany({ where: { OR: [{ solicitanteId: usuarioId }, { convite: { criadoPorId: usuarioId } }] } });
  await transacao.conviteSala.deleteMany({ where: { criadoPorId: usuarioId } });
  await transacao.sala.deleteMany({ where: { proprietarioId: usuarioId } });
  await transacao.membroSala.deleteMany({ where: { usuarioId } });
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
    const modulo = await transacao.moduloSala.create({
      data: { salaId: sala.id, titulo: dados.tituloModuloInicial, descricao: dados.descricaoModuloInicial, posicao: 1 },
    });
    await transacao.participacaoModuloSala.create({
      data: { moduloSalaId: modulo.id, usuarioId, papel: PapelParticipacaoModuloSala.ADMINISTRADOR },
    });
    await transacao.eventoAuditoria.create({
      data: { atorId: usuarioId, acao: "SALA_CRIADA", alvo: sala.id, metadados: JSON.stringify({ quantidadeModulos: 1 }) },
    });
    return sala;
  });
}

export async function listarSalasDaConta(usuarioId: string) {
  const salas = await prisma.sala.findMany({
    where: {
      situacao: { not: SituacaoSala.EXCLUIDA },
      OR: [
        { proprietarioId: usuarioId },
        { modulos: { some: { participacoes: { some: { usuarioId, situacao: SituacaoParticipacaoModuloSala.ATIVA } } } } },
      ],
    },
    select: {
      id: true, identificador: true, nome: true, descricao: true, situacao: true, atualizadaEm: true, proprietarioId: true,
      _count: { select: { modulos: { where: { situacao: SituacaoModuloSala.ATIVO } }, membros: { where: { situacao: SituacaoMembroSala.ATIVO } } } },
    },
    orderBy: { atualizadaEm: "desc" },
  });
  return salas.map(({ proprietarioId, ...sala }) => ({
    ...sala,
    papel: proprietarioId === usuarioId ? PapelMembroSala.PROPRIETARIO : PapelMembroSala.MEMBRO,
  }));
}

export async function obterSalaDaConta(usuarioId: string, identificador: string) {
  const sala = await prisma.sala.findFirst({
    where: {
      identificador,
      situacao: { not: SituacaoSala.EXCLUIDA },
      OR: [
        { proprietarioId: usuarioId },
        { modulos: { some: { participacoes: { some: { usuarioId, situacao: SituacaoParticipacaoModuloSala.ATIVA } } } } },
      ],
    },
    select: { id: true, identificador: true, nome: true, descricao: true, situacao: true, proprietarioId: true },
  });
  if (!sala) return null;
  const proprietario = sala.proprietarioId === usuarioId;
  const [modulos, membros, convites, participacoes] = await Promise.all([
    prisma.moduloSala.findMany({
      where: {
        salaId: sala.id,
        situacao: SituacaoModuloSala.ATIVO,
        ...(!proprietario ? { participacoes: { some: { usuarioId, situacao: SituacaoParticipacaoModuloSala.ATIVA } } } : {}),
      },
      select: {
        id: true, titulo: true, descricao: true, posicao: true,
        vinculos: {
          where: proprietario
            ? { situacao: SituacaoVinculoModuloSala.ATIVO, compartilharDashboard: true }
            : { usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO },
          select: {
            id: true, usuarioId: true,
            moduloPessoal: { select: { id: true, identificador: true, titulo: true } },
            usuario: { select: { nome: true } },
          },
        },
      },
      orderBy: { posicao: "asc" },
    }),
    proprietario ? prisma.membroSala.findMany({
      where: { salaId: sala.id, situacao: SituacaoMembroSala.ATIVO },
      select: { id: true, usuarioId: true, papel: true, usuario: { select: { nome: true, nomeUsuario: true } } },
      orderBy: { entrouEm: "asc" },
    }) : Promise.resolve([]),
    proprietario ? prisma.conviteSala.findMany({
      where: { salaId: sala.id, revogadoEm: null, expiraEm: { gt: new Date() } },
      select: { id: true, criadoEm: true, expiraEm: true },
      orderBy: { criadoEm: "desc" },
    }) : Promise.resolve([]),
    proprietario ? prisma.participacaoModuloSala.findMany({
      where: {
        moduloSala: { salaId: sala.id, situacao: SituacaoModuloSala.ATIVO },
        papel: PapelParticipacaoModuloSala.PARTICIPANTE,
        situacao: SituacaoParticipacaoModuloSala.ATIVA,
      },
      select: {
        usuarioId: true,
        usuario: { select: { nome: true, nomeUsuario: true } },
        moduloSala: { select: { id: true, titulo: true, posicao: true } },
      },
      orderBy: [{ usuario: { nome: "asc" } }, { moduloSala: { posicao: "asc" } }],
    }) : Promise.resolve([]),
  ]);
  if (!proprietario) return { ...sala, papel: PapelMembroSala.MEMBRO, modulos, membros, convites };

  const participantes = Array.from(participacoes.reduce((agrupados, participacao) => {
    const existente = agrupados.get(participacao.usuarioId);
    const modulo = { id: participacao.moduloSala.id, titulo: participacao.moduloSala.titulo };
    if (existente) existente.modulos.push(modulo);
    else agrupados.set(participacao.usuarioId, {
      usuarioId: participacao.usuarioId,
      nome: participacao.usuario.nome,
      nomeUsuario: participacao.usuario.nomeUsuario,
      modulos: [modulo],
    });
    return agrupados;
  }, new Map<string, { usuarioId: string; nome: string; nomeUsuario: string; modulos: Array<{ id: string; titulo: string }> }>()).values());

  return { ...sala, papel: PapelMembroSala.PROPRIETARIO, modulos, membros, convites, participantes };
}

export async function obterModuloSalaDaConta(usuarioId: string, identificadorSala: string, moduloSalaId: string) {
  const modulo = await prisma.moduloSala.findFirst({
    where: {
      id: moduloSalaId,
      situacao: SituacaoModuloSala.ATIVO,
      sala: { identificador: identificadorSala, situacao: { not: SituacaoSala.EXCLUIDA } },
      OR: [
        { sala: { proprietarioId: usuarioId } },
        { participacoes: { some: { usuarioId, situacao: SituacaoParticipacaoModuloSala.ATIVA } } },
      ],
    },
    select: {
      id: true, titulo: true, descricao: true, posicao: true, salaId: true,
      sala: { select: { identificador: true, nome: true, proprietarioId: true, situacao: true } },
      participacoes: {
        where: { situacao: SituacaoParticipacaoModuloSala.ATIVA },
        select: {
          id: true, usuarioId: true, papel: true,
          usuario: { select: { nome: true, nomeUsuario: true } },
          vinculo: {
            where: { situacao: SituacaoVinculoModuloSala.ATIVO },
            select: { id: true, moduloPessoal: { select: { id: true, identificador: true, titulo: true } } },
          },
        },
        orderBy: { entrouEm: "asc" },
      },
    },
  });
  if (!modulo) return null;
  const proprietario = modulo.sala.proprietarioId === usuarioId;
  const convites = proprietario ? await prisma.conviteModuloSala.findMany({
    where: { moduloSalaId: modulo.id, revogadoEm: null, expiraEm: { gt: new Date() } },
    select: { id: true, criadoEm: true, expiraEm: true },
    orderBy: { criadoEm: "desc" },
  }) : [];
  return {
    ...modulo,
    papel: proprietario ? PapelParticipacaoModuloSala.ADMINISTRADOR : PapelParticipacaoModuloSala.PARTICIPANTE,
    participacoes: proprietario ? modulo.participacoes : modulo.participacoes.filter((participacao) => participacao.usuarioId === usuarioId),
    convites,
  };
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

export async function entrarSalaComCodigo(usuarioId: string, entrada: unknown) {
  const { codigo } = validar(esquemaCodigo.safeParse(entrada));
  const convite = await prisma.conviteSala.findUnique({
    where: { codigoHash: resumirCodigo(codigo) },
    select: { id: true, salaId: true, revogadoEm: true, expiraEm: true, sala: { select: { proprietarioId: true, identificador: true, situacao: true } } },
  });
  if (!convite || convite.revogadoEm || convite.expiraEm <= new Date() || convite.sala.situacao !== SituacaoSala.ATIVA || convite.sala.proprietarioId === usuarioId) {
    throw new ErroSala("CONVITE_INVALIDO");
  }
  await prisma.$transaction(async (transacao) => {
    const membro = await transacao.membroSala.findUnique({ where: { salaId_usuarioId: { salaId: convite.salaId, usuarioId } } });
    if (membro?.situacao === SituacaoMembroSala.ATIVO) throw new ErroSala("SOLICITACAO_DUPLICADA");

    const associado = await transacao.membroSala.upsert({
      where: { salaId_usuarioId: { salaId: convite.salaId, usuarioId } },
      create: { salaId: convite.salaId, usuarioId, papel: PapelMembroSala.MEMBRO },
      update: { papel: PapelMembroSala.MEMBRO, situacao: SituacaoMembroSala.ATIVO, entrouEm: new Date(), encerrouEm: null },
    });

    const pendente = await transacao.solicitacaoEntradaSala.findFirst({
      where: { salaId: convite.salaId, solicitanteId: usuarioId, situacao: SituacaoSolicitacaoSala.PENDENTE },
      orderBy: { solicitadaEm: "desc" },
    });
    const decididaEm = new Date();
    const solicitacao = pendente
      ? await transacao.solicitacaoEntradaSala.update({
        where: { id: pendente.id },
        data: { situacao: SituacaoSolicitacaoSala.APROVADA, decididaEm, decididaPorId: null },
      })
      : await transacao.solicitacaoEntradaSala.create({
        data: { salaId: convite.salaId, conviteId: convite.id, solicitanteId: usuarioId, situacao: SituacaoSolicitacaoSala.APROVADA, decididaEm },
      });
    await transacao.eventoAuditoria.create({
      data: { atorId: usuarioId, acao: "ENTRADA_SALA_POR_CODIGO", alvo: associado.id, metadados: JSON.stringify({ salaId: convite.salaId, solicitacaoId: solicitacao.id }) },
    });
  });
  return convite.sala.identificador;
}

export async function gerarConviteModuloSala(usuarioId: string, entrada: unknown) {
  const { moduloSalaId } = validar(esquemaReferenciaModuloSala.safeParse(entrada));
  const modulo = await prisma.moduloSala.findFirst({
    where: { id: moduloSalaId, situacao: SituacaoModuloSala.ATIVO, sala: { proprietarioId: usuarioId, situacao: SituacaoSala.ATIVA } },
    select: { id: true, salaId: true },
  });
  if (!modulo) throw new ErroSala("NAO_ENCONTRADO");
  const codigo = criarCodigoConvite();
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
  const convite = await prisma.conviteModuloSala.create({
    data: { moduloSalaId: modulo.id, criadoPorId: usuarioId, codigoHash: resumirCodigo(codigo), expiraEm },
    select: { id: true, expiraEm: true },
  });
  await prisma.eventoAuditoria.create({
    data: { atorId: usuarioId, acao: "CONVITE_MODULO_SALA_GERADO", alvo: convite.id, metadados: JSON.stringify({ salaId: modulo.salaId, moduloSalaId: modulo.id }) },
  });
  return { ...convite, codigo };
}

export async function revogarConviteModuloSala(usuarioId: string, conviteId: string) {
  const convite = await prisma.conviteModuloSala.findFirst({
    where: { id: conviteId, revogadoEm: null, moduloSala: { sala: { proprietarioId: usuarioId, situacao: SituacaoSala.ATIVA } } },
    select: { id: true, moduloSalaId: true },
  });
  if (!convite) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.conviteModuloSala.update({ where: { id: convite.id }, data: { revogadoEm: new Date() } });
  await prisma.eventoAuditoria.create({
    data: { atorId: usuarioId, acao: "CONVITE_MODULO_SALA_REVOGADO", alvo: convite.id, metadados: JSON.stringify({ moduloSalaId: convite.moduloSalaId }) },
  });
}

export async function obterContextoConviteModuloSala(codigo: string) {
  const resultado = esquemaCodigo.safeParse({ codigo });
  if (!resultado.success) return null;
  const convite = await prisma.conviteModuloSala.findUnique({
    where: { codigoHash: resumirCodigo(resultado.data.codigo) },
    select: {
      revogadoEm: true, expiraEm: true,
      moduloSala: { select: { titulo: true, situacao: true, sala: { select: { nome: true, situacao: true } } } },
    },
  });
  if (!convite || convite.revogadoEm || convite.expiraEm <= new Date()
    || convite.moduloSala.situacao !== SituacaoModuloSala.ATIVO
    || convite.moduloSala.sala.situacao !== SituacaoSala.ATIVA) return null;
  return { nomeSala: convite.moduloSala.sala.nome, tituloModulo: convite.moduloSala.titulo };
}

export async function entrarModuloSalaComCodigo(usuarioId: string, entrada: unknown) {
  const { codigo } = validar(esquemaCodigo.safeParse(entrada));
  const convite = await prisma.conviteModuloSala.findUnique({
    where: { codigoHash: resumirCodigo(codigo) },
    select: {
      id: true, moduloSalaId: true, revogadoEm: true, expiraEm: true,
      moduloSala: { select: { situacao: true, sala: { select: { id: true, identificador: true, proprietarioId: true, situacao: true } } } },
    },
  });
  if (!convite || convite.revogadoEm || convite.expiraEm <= new Date()
    || convite.moduloSala.situacao !== SituacaoModuloSala.ATIVO
    || convite.moduloSala.sala.situacao !== SituacaoSala.ATIVA
    || convite.moduloSala.sala.proprietarioId === usuarioId) throw new ErroSala("CONVITE_INVALIDO");

  await prisma.$transaction(async (transacao) => {
    const existente = await transacao.participacaoModuloSala.findUnique({
      where: { moduloSalaId_usuarioId: { moduloSalaId: convite.moduloSalaId, usuarioId } },
    });
    if (existente?.situacao === SituacaoParticipacaoModuloSala.ATIVA) throw new ErroSala("SOLICITACAO_DUPLICADA");
    const participacao = existente
      ? await transacao.participacaoModuloSala.update({
        where: { id: existente.id },
        data: { papel: PapelParticipacaoModuloSala.PARTICIPANTE, situacao: SituacaoParticipacaoModuloSala.ATIVA, entrouEm: new Date(), encerrouEm: null },
      })
      : await transacao.participacaoModuloSala.create({
        data: { moduloSalaId: convite.moduloSalaId, usuarioId, papel: PapelParticipacaoModuloSala.PARTICIPANTE },
      });
    await transacao.eventoAuditoria.create({
      data: {
        atorId: usuarioId,
        acao: "ENTRADA_MODULO_SALA_POR_CODIGO",
        alvo: participacao.id,
        metadados: JSON.stringify({ salaId: convite.moduloSala.sala.id, moduloSalaId: convite.moduloSalaId, conviteId: convite.id }),
      },
    });
  });
  return { identificadorSala: convite.moduloSala.sala.identificador, moduloSalaId: convite.moduloSalaId };
}

export async function criarModuloSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaCriacaoModulo.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, dados.salaId);
  const quantidade = await prisma.moduloSala.count({ where: { salaId: dados.salaId, situacao: SituacaoModuloSala.ATIVO } });
  if (quantidade >= 5) throw new ErroSala("LIMITE_MODULOS");
  return prisma.$transaction(async (transacao) => {
    const modulo = await transacao.moduloSala.create({ data: { salaId: dados.salaId, titulo: dados.titulo, descricao: dados.descricao, posicao: quantidade + 1 } });
    await transacao.participacaoModuloSala.create({ data: { moduloSalaId: modulo.id, usuarioId, papel: PapelParticipacaoModuloSala.ADMINISTRADOR } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "MODULO_SALA_CRIADO", alvo: modulo.id, metadados: JSON.stringify({ salaId: dados.salaId }) } });
    return modulo;
  });
}

export async function vincularInstanciaModuloSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaVinculo.safeParse(entrada));
  const participacao = await prisma.participacaoModuloSala.findFirst({
    where: {
      moduloSalaId: dados.moduloSalaId,
      usuarioId,
      situacao: SituacaoParticipacaoModuloSala.ATIVA,
      moduloSala: { situacao: SituacaoModuloSala.ATIVO, sala: { situacao: SituacaoSala.ATIVA } },
    },
    select: { id: true, moduloSala: { select: { id: true, salaId: true, titulo: true, descricao: true } } },
  });
  if (!participacao) throw new ErroSala("NAO_ENCONTRADO");
  const moduloSala = participacao.moduloSala;
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
        data: { participacaoModuloSalaId: participacao.id, moduloPessoalId, situacao: SituacaoVinculoModuloSala.ATIVO, compartilharDashboard: true, vinculadoEm: new Date(), dadosDesde: existente.moduloPessoalId === moduloPessoalId ? new Date() : null, desvinculadoEm: null },
      })
      : await transacao.vinculoModuloSala.create({ data: { moduloSalaId: moduloSala.id, participacaoModuloSalaId: participacao.id, usuarioId, moduloPessoalId } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: dados.criarInstancia ? "INSTANCIA_SALA_CRIADA" : "INSTANCIA_SALA_VINCULADA", alvo: vinculo.id, metadados: JSON.stringify({ moduloSalaId: moduloSala.id }) } });
    return vinculo;
  });
}

export async function desvincularInstanciaModuloSala(usuarioId: string, vinculoId: string) {
  const vinculo = await prisma.vinculoModuloSala.findFirst({ where: { id: vinculoId, usuarioId, situacao: SituacaoVinculoModuloSala.ATIVO }, select: { moduloSalaId: true } });
  if (!vinculo) throw new ErroSala("NAO_ENCONTRADO");
  await sairDoModuloSala(usuarioId, { moduloSalaId: vinculo.moduloSalaId });
}

async function encerrarParticipacaoModulo(
  transacao: Prisma.TransactionClient,
  participacao: { id: string; usuarioId: string; moduloSalaId: string; moduloSala: { salaId: string } },
  situacao: typeof SituacaoParticipacaoModuloSala.SAIU | typeof SituacaoParticipacaoModuloSala.REMOVIDA,
  atorId: string,
) {
  const vinculo = await transacao.vinculoModuloSala.findFirst({
    where: { participacaoModuloSalaId: participacao.id, situacao: SituacaoVinculoModuloSala.ATIVO },
    select: { id: true, moduloSalaId: true, moduloPessoalId: true, usuarioId: true, dadosDesde: true },
  });
  if (vinculo) {
    await preservarEvidenciasHistoricas(transacao, vinculo, participacao.moduloSala.salaId);
    await transacao.vinculoModuloSala.update({
      where: { id: vinculo.id },
      data: { situacao: SituacaoVinculoModuloSala.DESVINCULADO, compartilharDashboard: false, desvinculadoEm: new Date() },
    });
  }
  await transacao.participacaoModuloSala.update({ where: { id: participacao.id }, data: { situacao, encerrouEm: new Date() } });
  await transacao.eventoAuditoria.create({
    data: {
      atorId,
      acao: situacao === SituacaoParticipacaoModuloSala.SAIU ? "SAIDA_MODULO_SALA" : "PARTICIPANTE_MODULO_SALA_REMOVIDO",
      alvo: participacao.id,
      metadados: JSON.stringify({ usuarioId: participacao.usuarioId, moduloSalaId: participacao.moduloSalaId }),
    },
  });
}

export async function sairDoModuloSala(usuarioId: string, entrada: unknown) {
  const { moduloSalaId } = validar(esquemaReferenciaModuloSala.safeParse(entrada));
  const participacao = await prisma.participacaoModuloSala.findFirst({
    where: { moduloSalaId, usuarioId, papel: PapelParticipacaoModuloSala.PARTICIPANTE, situacao: SituacaoParticipacaoModuloSala.ATIVA, moduloSala: { sala: { situacao: { not: SituacaoSala.EXCLUIDA } } } },
    select: { id: true, usuarioId: true, moduloSalaId: true, moduloSala: { select: { salaId: true } } },
  });
  if (!participacao) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.$transaction((transacao) => encerrarParticipacaoModulo(transacao, participacao, SituacaoParticipacaoModuloSala.SAIU, usuarioId));
}

export async function removerParticipanteModuloSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaReferenciaParticipacao.safeParse(entrada));
  const participacao = await prisma.participacaoModuloSala.findFirst({
    where: {
      id: dados.participacaoId,
      moduloSalaId: dados.moduloSalaId,
      papel: PapelParticipacaoModuloSala.PARTICIPANTE,
      situacao: SituacaoParticipacaoModuloSala.ATIVA,
      moduloSala: { sala: { proprietarioId: usuarioId, situacao: { not: SituacaoSala.EXCLUIDA } } },
    },
    select: { id: true, usuarioId: true, moduloSalaId: true, moduloSala: { select: { salaId: true } } },
  });
  if (!participacao) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.$transaction((transacao) => encerrarParticipacaoModulo(transacao, participacao, SituacaoParticipacaoModuloSala.REMOVIDA, usuarioId));
}

export async function sairDaSala(usuarioId: string, entrada: unknown) {
  const { salaId } = validar(esquemaReferenciaSala.safeParse(entrada));
  const participacoes = await prisma.participacaoModuloSala.findMany({
    where: { usuarioId, papel: PapelParticipacaoModuloSala.PARTICIPANTE, situacao: SituacaoParticipacaoModuloSala.ATIVA, moduloSala: { salaId, sala: { situacao: { not: SituacaoSala.EXCLUIDA } } } },
    select: { id: true, usuarioId: true, moduloSalaId: true, moduloSala: { select: { salaId: true } } },
  });
  if (!participacoes.length) throw new ErroSala("NAO_ENCONTRADO");
  await prisma.$transaction(async (transacao) => {
    for (const participacao of participacoes) await encerrarParticipacaoModulo(transacao, participacao, SituacaoParticipacaoModuloSala.SAIU, usuarioId);
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "SAIDA_SALA", alvo: salaId } });
  });
}

export async function removerMembroSala(usuarioId: string, entrada: unknown) {
  const dados = validar(esquemaReferenciaMembro.safeParse(entrada));
  await exigirSalaDoProprietario(usuarioId, dados.salaId);
  const membro = await prisma.membroSala.findFirst({ where: { id: dados.membroId, salaId: dados.salaId, papel: PapelMembroSala.MEMBRO, situacao: SituacaoMembroSala.ATIVO } });
  if (!membro) throw new ErroSala("NAO_ENCONTRADO");
  const participacoes = await prisma.participacaoModuloSala.findMany({
    where: { usuarioId: membro.usuarioId, papel: PapelParticipacaoModuloSala.PARTICIPANTE, situacao: SituacaoParticipacaoModuloSala.ATIVA, moduloSala: { salaId: dados.salaId } },
    select: { id: true, usuarioId: true, moduloSalaId: true, moduloSala: { select: { salaId: true } } },
  });
  await prisma.$transaction(async (transacao) => {
    for (const participacao of participacoes) await encerrarParticipacaoModulo(transacao, participacao, SituacaoParticipacaoModuloSala.REMOVIDA, usuarioId);
    await transacao.membroSala.update({ where: { id: membro.id }, data: { situacao: SituacaoMembroSala.REMOVIDO, encerrouEm: new Date() } });
  });
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
    await transacao.vinculoModuloSala.updateMany({ where: { moduloSala: { salaId }, situacao: SituacaoVinculoModuloSala.ATIVO }, data: { situacao: SituacaoVinculoModuloSala.DESVINCULADO, compartilharDashboard: false, desvinculadoEm: new Date() } });
    await transacao.conviteSala.updateMany({ where: { salaId, revogadoEm: null }, data: { revogadoEm: new Date() } });
    await transacao.sala.update({ where: { id: salaId }, data: { situacao: SituacaoSala.EXCLUIDA } });
    await transacao.eventoAuditoria.create({ data: { atorId: usuarioId, acao: "SALA_EXCLUIDA", alvo: salaId } });
  });
}
