import { z } from "zod";
import { MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { MINUTOS_MINIMOS_SESSAO_VALIDA } from "@/dominio/analises/evidencias";
import { metodoDisponivelParaNovoRegistro } from "@/dominio/sessoes/metodos";
import { prisma } from "@/biblioteca/prisma";
import { obterDesafioAtivoParaSessao } from "@/servidor/desafios";

export class ErroSessao extends Error {
  constructor(public readonly codigo: "DADOS_INVALIDOS" | "NAO_ENCONTRADA") {
    super(codigo);
  }
}

const esquemaInicio = z.object({ recursoId: z.string().min(1), metodo: z.nativeEnum(MetodoEstudo), desafioId: z.string().min(1).optional() });
const esquemaConclusao = z.object({
  dificuldadePercebida: z.coerce.number().int().min(1).max(5),
  compreensaoPercebida: z.coerce.number().int().min(1).max(5),
  observacao: z.string().trim().max(500),
});

function dadosValidos<T>(resultado: z.ZodSafeParseResult<T>) {
  if (!resultado.success) throw new ErroSessao("DADOS_INVALIDOS");
  return resultado.data;
}

export async function iniciarSessaoPessoal(usuarioId: string, entrada: unknown, iniciadaEm = new Date()) {
  const dados = dadosValidos(esquemaInicio.safeParse(entrada));
  if (!metodoDisponivelParaNovoRegistro(dados.metodo)) throw new ErroSessao("DADOS_INVALIDOS");
  const recurso = await prisma.recursoConteudo.findFirst({
    where: { id: dados.recursoId, ativo: true, topico: { ativo: true, rascunho: false, modulo: { usuarioId, arquivado: false, rascunho: false } } },
    include: { topico: { select: { moduloId: true } } },
  });
  if (!recurso) throw new ErroSessao("NAO_ENCONTRADA");
  let desafioId: string | null = null;
  if (dados.desafioId) {
    const desafio = await obterDesafioAtivoParaSessao(usuarioId, dados.desafioId);
    if (!desafio) throw new ErroSessao("NAO_ENCONTRADA");
    if (desafio.moduloId !== recurso.topico.moduloId || desafio.metodo !== dados.metodo) throw new ErroSessao("DADOS_INVALIDOS");
    desafioId = desafio.id;
  }
  return prisma.sessaoEstudo.create({
    data: {
      usuarioId,
      moduloId: recurso.topico.moduloId,
      topicoId: recurso.topicoId,
      recursoId: recurso.id,
      metodo: dados.metodo,
      desafioId,
      iniciadaEm,
      situacao: SituacaoSessao.ATIVA,
    },
  });
}

export async function concluirSessaoPessoal(usuarioId: string, id: string, entrada: unknown, encerradaEm = new Date()) {
  const dados = dadosValidos(esquemaConclusao.safeParse(entrada));
  const sessao = await prisma.sessaoEstudo.findFirst({ where: { id, usuarioId, situacao: SituacaoSessao.ATIVA } });
  if (!sessao) throw new ErroSessao("NAO_ENCONTRADA");
  const duracaoMinutos = Math.max(0, Math.floor((encerradaEm.getTime() - sessao.iniciadaEm.getTime()) / 60_000));
  const situacao = duracaoMinutos >= MINUTOS_MINIMOS_SESSAO_VALIDA ? SituacaoSessao.CONCLUIDA : SituacaoSessao.INVALIDADA;
  return prisma.sessaoEstudo.update({
    where: { id: sessao.id },
    data: {
      encerradaEm,
      duracaoMinutos,
      situacao,
      dificuldadePercebida: dados.dificuldadePercebida,
      compreensaoPercebida: dados.compreensaoPercebida,
      observacao: dados.observacao || null,
    },
  });
}

export async function listarHistoricoPessoal(usuarioId: string) {
  return prisma.sessaoEstudo.findMany({
    where: { usuarioId },
    orderBy: [{ iniciadaEm: "desc" }, { id: "desc" }],
    include: {
      modulo: { select: { titulo: true } },
      topico: { select: { nome: true } },
      recurso: { select: { titulo: true, formato: true } },
      desafio: { select: { meta: true } },
    },
  });
}

export async function listarHistoricoDeAtividadesPessoal(usuarioId: string) {
  const [sessoes, tentativas] = await Promise.all([
    listarHistoricoPessoal(usuarioId),
    prisma.tentativaAvaliacao.findMany({
      where: { usuarioId, concluidaEm: { not: null } },
      orderBy: [{ concluidaEm: "desc" }, { id: "desc" }],
      include: { modulo: { select: { titulo: true } }, topico: { select: { nome: true } }, avaliacao: { select: { titulo: true } } },
    }),
  ]);
  return [
    ...sessoes.map((sessao) => ({ tipo: "SESSAO" as const, id: sessao.id, ocorridaEm: sessao.encerradaEm ?? sessao.iniciadaEm, sessao })),
    ...tentativas.map((tentativa) => ({ tipo: "TENTATIVA" as const, id: tentativa.id, ocorridaEm: tentativa.concluidaEm!, tentativa })),
  ].sort((a, b) => b.ocorridaEm.getTime() - a.ocorridaEm.getTime() || b.id.localeCompare(a.id));
}
