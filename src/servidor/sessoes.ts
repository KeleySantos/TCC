import { z } from "zod";
import { FormatoConteudo, MetodoEstudo, ModoRegistroSessao, SituacaoSessao } from "@/gerado/prisma/enums";
import type { Prisma } from "@/gerado/prisma/client";
import { metodoDisponivelParaNovoRegistro } from "@/dominio/sessoes/metodos";
import { prisma } from "@/biblioteca/prisma";
import { obterDesafioAtivoParaSessao } from "@/servidor/desafios";

export type CodigoErroSessao = "DADOS_INVALIDOS" | "NAO_ENCONTRADA" | "SOBREPOSICAO" | "ESTADO_INVALIDO";

export class ErroSessao extends Error {
  constructor(public readonly codigo: CodigoErroSessao) {
    super(codigo);
  }
}

const MINUTOS_MINIMOS_SESSAO_VALIDA = 5;

const campoDescricao = z.string().trim().min(3).max(2_000);
const campoPercepcao = z.coerce.number().int().min(1).max(5);
const campoMetodos = z.array(z.nativeEnum(MetodoEstudo)).min(1).max(6);
const campoFormatos = z.array(z.nativeEnum(FormatoConteudo)).min(1).max(12);
const campoMateriais = z.array(z.string().min(1)).max(50).default([]);
const campoData = z.union([z.date(), z.iso.datetime({ offset: true }).transform((valor) => new Date(valor))]);

const esquemaContexto = z.object({
  moduloId: z.string().min(1),
  descricao: campoDescricao,
  metodos: campoMetodos,
  formatos: campoFormatos,
  materialIds: campoMateriais,
  desafioId: z.string().min(1).optional(),
});

const esquemaRegistroManual = esquemaContexto.extend({
  iniciadaEm: campoData,
  encerradaEm: campoData,
  dificuldadePercebida: campoPercepcao.optional(),
  compreensaoPercebida: campoPercepcao.optional(),
});

const esquemaConclusao = z.object({
  dificuldadePercebida: campoPercepcao,
  compreensaoPercebida: campoPercepcao,
  observacao: z.string().trim().max(500).optional().default(""),
});

const esquemaEdicao = esquemaRegistroManual.omit({ moduloId: true, desafioId: true });
const esquemaInicioLegado = z.object({ recursoId: z.string().min(1), metodo: z.nativeEnum(MetodoEstudo), desafioId: z.string().min(1).optional() });

const inclusaoSessao = {
  modulo: { select: { id: true, identificador: true, titulo: true } },
  metodos: { orderBy: { metodo: "asc" as const } },
  formatos: { orderBy: { formato: "asc" as const } },
  materiais: {
    orderBy: { recursoId: "asc" as const },
    include: { recurso: { select: { id: true, titulo: true, formato: true, ativo: true } } },
  },
  desafio: { select: { id: true, meta: true, metodo: true, situacao: true } },
} satisfies Prisma.SessaoEstudoInclude;

type ClienteTransacao = Prisma.TransactionClient;

function dadosValidos<T>(resultado: z.ZodSafeParseResult<T>) {
  if (!resultado.success) throw new ErroSessao("DADOS_INVALIDOS");
  return resultado.data;
}

function validarContextoBasico<T extends z.infer<typeof esquemaContexto>>(dados: T): T {
  const metodos = [...new Set(dados.metodos)];
  const formatos = [...new Set(dados.formatos)];
  const materialIds = [...new Set(dados.materialIds)];
  if (!metodos.every(metodoDisponivelParaNovoRegistro)) throw new ErroSessao("DADOS_INVALIDOS");
  return { ...dados, metodos, formatos, materialIds };
}

function calcularDuracao(iniciadaEm: Date, encerradaEm: Date) {
  if (encerradaEm.getTime() <= iniciadaEm.getTime()) throw new ErroSessao("DADOS_INVALIDOS");
  return Math.floor((encerradaEm.getTime() - iniciadaEm.getTime()) / 60_000);
}

function situacaoDaSessaoConcluida(duracaoMinutos: number) {
  return duracaoMinutos >= MINUTOS_MINIMOS_SESSAO_VALIDA ? SituacaoSessao.CONCLUIDA : SituacaoSessao.INVALIDADA;
}

async function exigirModuloDisponivel(cliente: ClienteTransacao, usuarioId: string, moduloId: string) {
  const modulo = await cliente.moduloAprendizagem.findFirst({
    where: { id: moduloId, usuarioId, arquivado: false, rascunho: false },
    select: { id: true },
  });
  if (!modulo) throw new ErroSessao("NAO_ENCONTRADA");
}

async function validarMateriaisDoModulo(cliente: ClienteTransacao, usuarioId: string, moduloId: string, materialIds: string[]) {
  if (materialIds.length === 0) return;
  const quantidade = await cliente.recursoConteudo.count({
    where: { id: { in: materialIds }, moduloId, ativo: true, modulo: { usuarioId, arquivado: false, rascunho: false } },
  });
  if (quantidade !== materialIds.length) throw new ErroSessao("NAO_ENCONTRADA");
}

async function validarDesafio(usuarioId: string, moduloId: string, metodos: MetodoEstudo[], desafioId?: string) {
  if (!desafioId) return null;
  const desafio = await obterDesafioAtivoParaSessao(usuarioId, desafioId);
  if (!desafio) throw new ErroSessao("NAO_ENCONTRADA");
  if (desafio.moduloId !== moduloId || !metodos.includes(desafio.metodo)) throw new ErroSessao("DADOS_INVALIDOS");
  return desafio.id;
}

async function impedirSobreposicao(cliente: ClienteTransacao, usuarioId: string, iniciadaEm: Date, encerradaEm: Date, ignorarSessaoId?: string) {
  const conflito = await cliente.sessaoEstudo.findFirst({
    where: {
      usuarioId,
      ...(ignorarSessaoId ? { id: { not: ignorarSessaoId } } : {}),
      situacao: { in: [SituacaoSessao.PLANEJADA, SituacaoSessao.ATIVA, SituacaoSessao.CONCLUIDA, SituacaoSessao.INVALIDADA] },
      iniciadaEm: { lt: encerradaEm },
      OR: [{ encerradaEm: null }, { encerradaEm: { gt: iniciadaEm } }],
    },
    select: { id: true },
  });
  if (conflito) throw new ErroSessao("SOBREPOSICAO");
}

function relacoesContextuais(metodos: MetodoEstudo[], formatos: FormatoConteudo[], materialIds: string[]) {
  return {
    metodos: { create: metodos.map((metodo) => ({ metodo })) },
    formatos: { create: formatos.map((formato) => ({ formato })) },
    materiais: { create: materialIds.map((recursoId) => ({ recursoId })) },
  };
}

export async function registrarSessaoManualPessoal(usuarioId: string, entrada: unknown, agora = new Date()) {
  const dados = validarContextoBasico(dadosValidos(esquemaRegistroManual.safeParse(entrada)));
  const duracaoMinutos = calcularDuracao(dados.iniciadaEm, dados.encerradaEm);
  const planejada = dados.iniciadaEm.getTime() > agora.getTime() || dados.encerradaEm.getTime() > agora.getTime();
  if (planejada && (dados.iniciadaEm.getTime() <= agora.getTime() || dados.encerradaEm.getTime() <= agora.getTime())) throw new ErroSessao("DADOS_INVALIDOS");
  if (!planejada && (dados.dificuldadePercebida === undefined || dados.compreensaoPercebida === undefined)) throw new ErroSessao("DADOS_INVALIDOS");

  const desafioId = await validarDesafio(usuarioId, dados.moduloId, dados.metodos, dados.desafioId);
  return prisma.$transaction(async (transacao) => {
    await exigirModuloDisponivel(transacao, usuarioId, dados.moduloId);
    await validarMateriaisDoModulo(transacao, usuarioId, dados.moduloId, dados.materialIds);
    await impedirSobreposicao(transacao, usuarioId, dados.iniciadaEm, dados.encerradaEm);
    return transacao.sessaoEstudo.create({
      data: {
        usuarioId, moduloId: dados.moduloId, descricao: dados.descricao, modoRegistro: ModoRegistroSessao.MANUAL,
        iniciadaEm: dados.iniciadaEm, encerradaEm: dados.encerradaEm, duracaoMinutos,
        situacao: planejada ? SituacaoSessao.PLANEJADA : situacaoDaSessaoConcluida(duracaoMinutos),
        dificuldadePercebida: planejada ? null : dados.dificuldadePercebida,
        compreensaoPercebida: planejada ? null : dados.compreensaoPercebida,
        desafioId,
        ...relacoesContextuais(dados.metodos, dados.formatos, dados.materialIds),
      },
      include: inclusaoSessao,
    });
  });
}

export const planejarSessaoPessoal = registrarSessaoManualPessoal;

export async function iniciarCronometroPessoal(usuarioId: string, entrada: unknown, iniciadaEm = new Date()) {
  const dados = validarContextoBasico(dadosValidos(esquemaContexto.safeParse(entrada)));
  const desafioId = await validarDesafio(usuarioId, dados.moduloId, dados.metodos, dados.desafioId);
  return prisma.$transaction(async (transacao) => {
    await exigirModuloDisponivel(transacao, usuarioId, dados.moduloId);
    await validarMateriaisDoModulo(transacao, usuarioId, dados.moduloId, dados.materialIds);
    const ativa = await transacao.sessaoEstudo.findFirst({ where: { usuarioId, situacao: SituacaoSessao.ATIVA }, select: { id: true } });
    if (ativa) throw new ErroSessao("SOBREPOSICAO");
    const conflitoAtual = await transacao.sessaoEstudo.findFirst({
      where: {
        usuarioId,
        situacao: { in: [SituacaoSessao.PLANEJADA, SituacaoSessao.CONCLUIDA, SituacaoSessao.INVALIDADA] },
        iniciadaEm: { lte: iniciadaEm }, encerradaEm: { gt: iniciadaEm },
      },
      select: { id: true },
    });
    if (conflitoAtual) throw new ErroSessao("SOBREPOSICAO");
    return transacao.sessaoEstudo.create({
      data: {
        usuarioId, moduloId: dados.moduloId, descricao: dados.descricao, modoRegistro: ModoRegistroSessao.CRONOMETRO,
        iniciadaEm, situacao: SituacaoSessao.ATIVA, desafioId,
        ...relacoesContextuais(dados.metodos, dados.formatos, dados.materialIds),
      },
      include: inclusaoSessao,
    });
  });
}

export async function concluirSessaoPessoal(usuarioId: string, id: string, entrada: unknown, encerradaEm = new Date()) {
  const dados = dadosValidos(esquemaConclusao.safeParse(entrada));
  return prisma.$transaction(async (transacao) => {
    const sessao = await transacao.sessaoEstudo.findFirst({ where: { id, usuarioId, situacao: { in: [SituacaoSessao.ATIVA, SituacaoSessao.PLANEJADA] } } });
    if (!sessao) throw new ErroSessao("NAO_ENCONTRADA");
    const fim = sessao.situacao === SituacaoSessao.ATIVA ? encerradaEm : sessao.encerradaEm;
    if (!fim) throw new ErroSessao("ESTADO_INVALIDO");
    if (sessao.situacao === SituacaoSessao.PLANEJADA && fim.getTime() > encerradaEm.getTime()) throw new ErroSessao("ESTADO_INVALIDO");
    const duracaoMinutos = calcularDuracao(sessao.iniciadaEm, fim);
    await impedirSobreposicao(transacao, usuarioId, sessao.iniciadaEm, fim, sessao.id);
    return transacao.sessaoEstudo.update({
      where: { id: sessao.id },
      data: {
        encerradaEm: fim, duracaoMinutos, situacao: situacaoDaSessaoConcluida(duracaoMinutos),
        dificuldadePercebida: dados.dificuldadePercebida, compreensaoPercebida: dados.compreensaoPercebida,
        observacao: dados.observacao || null,
      },
      include: inclusaoSessao,
    });
  });
}

export async function editarSessaoPessoal(usuarioId: string, id: string, entrada: unknown, agora = new Date()) {
  const objeto = entrada && typeof entrada === "object" ? entrada : {};
  const dados = validarContextoBasico(dadosValidos(esquemaEdicao.extend({ moduloId: z.string() }).safeParse({ ...objeto, moduloId: "temporario" })));
  const duracaoMinutos = calcularDuracao(dados.iniciadaEm, dados.encerradaEm);
  const planejada = dados.iniciadaEm.getTime() > agora.getTime() || dados.encerradaEm.getTime() > agora.getTime();
  if (planejada && (dados.iniciadaEm.getTime() <= agora.getTime() || dados.encerradaEm.getTime() <= agora.getTime())) throw new ErroSessao("DADOS_INVALIDOS");
  if (!planejada && (dados.dificuldadePercebida === undefined || dados.compreensaoPercebida === undefined)) throw new ErroSessao("DADOS_INVALIDOS");

  return prisma.$transaction(async (transacao) => {
    const sessao = await transacao.sessaoEstudo.findFirst({
      where: { id, usuarioId, situacao: { in: [SituacaoSessao.PLANEJADA, SituacaoSessao.CONCLUIDA, SituacaoSessao.INVALIDADA] } },
      select: { id: true, moduloId: true, desafio: { select: { metodo: true } } },
    });
    if (!sessao) throw new ErroSessao("NAO_ENCONTRADA");
    if (sessao.desafio && !dados.metodos.includes(sessao.desafio.metodo)) throw new ErroSessao("DADOS_INVALIDOS");
    await validarMateriaisDoModulo(transacao, usuarioId, sessao.moduloId, dados.materialIds);
    await impedirSobreposicao(transacao, usuarioId, dados.iniciadaEm, dados.encerradaEm, sessao.id);
    await transacao.metodoSessaoEstudo.deleteMany({ where: { sessaoId: sessao.id } });
    await transacao.formatoSessaoEstudo.deleteMany({ where: { sessaoId: sessao.id } });
    await transacao.materialSessaoEstudo.deleteMany({ where: { sessaoId: sessao.id } });
    return transacao.sessaoEstudo.update({
      where: { id: sessao.id },
      data: {
        descricao: dados.descricao, iniciadaEm: dados.iniciadaEm, encerradaEm: dados.encerradaEm, duracaoMinutos,
        situacao: planejada ? SituacaoSessao.PLANEJADA : situacaoDaSessaoConcluida(duracaoMinutos),
        dificuldadePercebida: planejada ? null : dados.dificuldadePercebida,
        compreensaoPercebida: planejada ? null : dados.compreensaoPercebida,
        ...relacoesContextuais(dados.metodos, dados.formatos, dados.materialIds),
      },
      include: inclusaoSessao,
    });
  });
}

export async function definirArquivamentoSessaoPessoal(usuarioId: string, id: string, arquivada: boolean) {
  const sessao = await prisma.sessaoEstudo.findFirst({ where: { id, usuarioId }, select: { id: true, situacao: true } });
  if (!sessao) throw new ErroSessao("NAO_ENCONTRADA");
  if (arquivada && sessao.situacao === SituacaoSessao.ATIVA) throw new ErroSessao("ESTADO_INVALIDO");
  return prisma.sessaoEstudo.update({ where: { id: sessao.id }, data: { arquivada }, include: inclusaoSessao });
}

export const arquivarSessaoPessoal = (usuarioId: string, id: string) => definirArquivamentoSessaoPessoal(usuarioId, id, true);
export const desarquivarSessaoPessoal = (usuarioId: string, id: string) => definirArquivamentoSessaoPessoal(usuarioId, id, false);

export async function obterSessaoPessoal(usuarioId: string, id: string) {
  const sessao = await prisma.sessaoEstudo.findFirst({ where: { id, usuarioId }, include: inclusaoSessao });
  if (!sessao) throw new ErroSessao("NAO_ENCONTRADA");
  return sessao;
}

export async function listarSessoesModuloPessoal(usuarioId: string, moduloId: string, opcoes: { incluirArquivadas?: boolean } = {}) {
  const modulo = await prisma.moduloAprendizagem.findFirst({ where: { id: moduloId, usuarioId }, select: { id: true } });
  if (!modulo) throw new ErroSessao("NAO_ENCONTRADA");
  return prisma.sessaoEstudo.findMany({
    where: { usuarioId, moduloId: modulo.id, ...(opcoes.incluirArquivadas ? {} : { arquivada: false }) },
    orderBy: [{ iniciadaEm: "desc" }, { id: "desc" }], include: inclusaoSessao,
  });
}

/** Ponte temporária para o fluxo anterior baseado em material. */
export async function iniciarSessaoPessoal(usuarioId: string, entrada: unknown, iniciadaEm = new Date()) {
  const dados = dadosValidos(esquemaInicioLegado.safeParse(entrada));
  if (!metodoDisponivelParaNovoRegistro(dados.metodo)) throw new ErroSessao("DADOS_INVALIDOS");
  const recurso = await prisma.recursoConteudo.findFirst({
    where: { id: dados.recursoId, ativo: true, modulo: { usuarioId, arquivado: false, rascunho: false } },
    include: { modulo: { select: { id: true } } },
  });
  if (!recurso) throw new ErroSessao("NAO_ENCONTRADA");
  return iniciarCronometroPessoal(usuarioId, {
    moduloId: recurso.modulo.id,
    descricao: `Estudo com o material ${recurso.titulo}.`,
    metodos: [dados.metodo], formatos: [recurso.formato], materialIds: [recurso.id], desafioId: dados.desafioId,
  }, iniciadaEm);
}

export async function listarHistoricoPessoal(usuarioId: string) {
  return prisma.sessaoEstudo.findMany({
    where: { usuarioId }, orderBy: [{ iniciadaEm: "desc" }, { id: "desc" }],
    include: {
      modulo: { select: { titulo: true, identificador: true } }, desafio: { select: { meta: true } },
      metodos: { orderBy: { metodo: "asc" } }, formatos: { orderBy: { formato: "asc" } },
      materiais: { include: { recurso: { select: { titulo: true, formato: true } } } },
    },
  });
}
