import { z } from "zod";
import { SituacaoDesafioExperimentacao } from "@/gerado/prisma/enums";
import { metodoDisponivelParaNovoRegistro, type MetodoEstudoPessoal } from "@/dominio/sessoes/metodos";
import { prisma } from "@/biblioteca/prisma";

export class ErroDesafio extends Error {
  constructor(public readonly codigo: "DADOS_INVALIDOS" | "NAO_ENCONTRADO") {
    super(codigo);
  }
}

const esquemaCriarDesafio = z.object({
  moduloId: z.string().min(1),
  metodo: z.string().min(1),
  meta: z.string().trim().min(3).max(280),
});

function validarEntrada(entrada: unknown) {
  const resultado = esquemaCriarDesafio.safeParse(entrada);
  if (!resultado.success || !metodoDisponivelParaNovoRegistro(resultado.data.metodo)) throw new ErroDesafio("DADOS_INVALIDOS");
  return { ...resultado.data, metodo: resultado.data.metodo as MetodoEstudoPessoal };
}

export async function criarDesafioPessoal(usuarioId: string, entrada: unknown) {
  const dados = validarEntrada(entrada);
  const modulo = await prisma.moduloAprendizagem.findFirst({
    where: { id: dados.moduloId, usuarioId, arquivado: false, rascunho: false },
    select: { id: true },
  });
  if (!modulo) throw new ErroDesafio("NAO_ENCONTRADO");
  return prisma.desafioExperimentacao.create({
    data: { usuarioId, moduloId: modulo.id, metodo: dados.metodo, meta: dados.meta, situacao: SituacaoDesafioExperimentacao.ATIVO },
    select: { id: true, moduloId: true, metodo: true, meta: true, situacao: true, criadoEm: true, canceladoEm: true },
  });
}

export async function listarDesafiosPessoais(usuarioId: string) {
  return prisma.desafioExperimentacao.findMany({
    where: { usuarioId, modulo: { arquivado: false, rascunho: false } },
    orderBy: [{ situacao: "asc" }, { criadoEm: "desc" }, { id: "desc" }],
    select: {
      id: true,
      moduloId: true,
      metodo: true,
      meta: true,
      situacao: true,
      criadoEm: true,
      canceladoEm: true,
      modulo: { select: { titulo: true, identificador: true } },
      _count: { select: { sessoes: true } },
    },
  });
}

export async function listarDesafiosAtivosDoModuloPessoal(usuarioId: string, moduloId: string) {
  return prisma.desafioExperimentacao.findMany({
    where: { usuarioId, moduloId, situacao: SituacaoDesafioExperimentacao.ATIVO, modulo: { arquivado: false, rascunho: false } },
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    select: { id: true, metodo: true, meta: true },
  });
}

export async function cancelarDesafioPessoal(usuarioId: string, desafioId: string, canceladoEm = new Date()) {
  const desafio = await prisma.desafioExperimentacao.findFirst({
    where: { id: desafioId, usuarioId, situacao: SituacaoDesafioExperimentacao.ATIVO },
    select: { id: true },
  });
  if (!desafio) throw new ErroDesafio("NAO_ENCONTRADO");
  return prisma.desafioExperimentacao.update({
    where: { id: desafio.id },
    data: { situacao: SituacaoDesafioExperimentacao.CANCELADO, canceladoEm },
    select: { id: true, situacao: true, canceladoEm: true },
  });
}

export async function obterDesafioAtivoParaSessao(usuarioId: string, desafioId: string) {
  return prisma.desafioExperimentacao.findFirst({
    where: {
      id: desafioId,
      usuarioId,
      situacao: SituacaoDesafioExperimentacao.ATIVO,
      modulo: { arquivado: false, rascunho: false },
    },
    select: { id: true, moduloId: true, metodo: true },
  });
}
