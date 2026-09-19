import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";

export class ErroAvaliacao extends Error {
  constructor(public readonly codigo: "DADOS_INVALIDOS" | "NAO_ENCONTRADA") {
    super(codigo);
  }
}

const esquemaTentativa = z.object({ avaliacaoId: z.string().min(1), respostas: z.record(z.string(), z.string()) });

function dadosValidos<T>(resultado: z.ZodSafeParseResult<T>) {
  if (!resultado.success) throw new ErroAvaliacao("DADOS_INVALIDOS");
  return resultado.data;
}

function opcoesDaQuestao(questao: { opcoesJson: string }) {
  try {
    const opcoes = JSON.parse(questao.opcoesJson) as unknown;
    return Array.isArray(opcoes) && opcoes.every((opcao) => typeof opcao === "string") ? opcoes : null;
  } catch {
    return null;
  }
}

export async function concluirTentativaPessoal(usuarioId: string, entrada: unknown, concluidaEm = new Date()) {
  const dados = dadosValidos(esquemaTentativa.safeParse(entrada));
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { id: dados.avaliacaoId, ativa: true, topico: { ativo: true, rascunho: false, modulo: { usuarioId, arquivado: false, rascunho: false } } },
    include: { questoes: { orderBy: { posicao: "asc" } }, topico: { select: { moduloId: true } } },
  });
  if (!avaliacao) throw new ErroAvaliacao("NAO_ENCONTRADA");
  const idsQuestoes = new Set(avaliacao.questoes.map((questao) => questao.id));
  const respostasInformadas = Object.keys(dados.respostas);
  const respostasValidas = respostasInformadas.length === avaliacao.questoes.length
    && respostasInformadas.every((id) => idsQuestoes.has(id))
    && avaliacao.questoes.every((questao) => {
      const opcoes = opcoesDaQuestao(questao);
      return opcoes?.includes(dados.respostas[questao.id]) ?? false;
    });
  if (!respostasValidas) throw new ErroAvaliacao("DADOS_INVALIDOS");

  const respostas = avaliacao.questoes.map((questao) => {
    const correta = dados.respostas[questao.id] === questao.opcaoCorreta;
    return { questaoId: questao.id, resposta: dados.respostas[questao.id], correta, pontos: correta ? questao.peso : 0 };
  });
  const pontosObtidos = respostas.reduce((soma, resposta) => soma + resposta.pontos, 0);
  const pontosTotais = avaliacao.questoes.reduce((soma, questao) => soma + questao.peso, 0);
  const notaNormalizada = pontosTotais ? (pontosObtidos / pontosTotais) * 100 : 0;

  return prisma.$transaction(async (transacao) => {
    const ultima = await transacao.tentativaAvaliacao.findFirst({
      where: { usuarioId, avaliacaoId: avaliacao.id },
      select: { numeroTentativa: true },
      orderBy: { numeroTentativa: "desc" },
    });
    return transacao.tentativaAvaliacao.create({
      data: {
        usuarioId,
        moduloId: avaliacao.topico.moduloId,
        avaliacaoId: avaliacao.id,
        topicoId: avaliacao.topicoId,
        numeroTentativa: (ultima?.numeroTentativa ?? 0) + 1,
        iniciadaEm: concluidaEm,
        concluidaEm,
        respostasCorretas: respostas.filter((resposta) => resposta.correta).length,
        totalQuestoes: avaliacao.questoes.length,
        notaNormalizada,
        respostas: { create: respostas },
      },
    });
  });
}
