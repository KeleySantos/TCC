import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { autorizarAlunoNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";

const esquemaTentativa = z.object({ avaliacaoId: z.string().min(1), respostas: z.record(z.string(), z.string()) });

export async function POST(requisicao: Request) {
  const acesso = autorizarAlunoNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const corpo = esquemaTentativa.safeParse(await requisicao.json());
  if (!corpo.success) return NextResponse.json({ erro: "Respostas inválidas." }, { status: 400 });
  const avaliacao = await prisma.avaliacao.findFirst({ where: { id: corpo.data.avaliacaoId, ativa: true }, include: { questoes: { orderBy: { posicao: "asc" } } } });
  if (!avaliacao) return NextResponse.json({ erro: "Avaliação não encontrada." }, { status: 404 });
  const respostas = avaliacao.questoes.map((questao) => ({ questaoId: questao.id, resposta: corpo.data.respostas[questao.id] ?? "", correta: corpo.data.respostas[questao.id] === questao.opcaoCorreta, pontos: corpo.data.respostas[questao.id] === questao.opcaoCorreta ? questao.peso : 0 }));
  const pontosObtidos = respostas.reduce((soma, resposta) => soma + resposta.pontos, 0);
  const pontosTotais = avaliacao.questoes.reduce((soma, questao) => soma + questao.peso, 0);
  const notaNormalizada = pontosTotais ? (pontosObtidos / pontosTotais) * 100 : 0;
  const tentativa = await prisma.tentativaAvaliacao.create({ data: { alunoId: acesso.usuario.perfilAlunoId, avaliacaoId: avaliacao.id, topicoId: avaliacao.topicoId, concluidaEm: new Date(), respostasCorretas: respostas.filter((resposta) => resposta.correta).length, totalQuestoes: avaliacao.questoes.length, notaNormalizada, respostas: { create: respostas } } });
  return NextResponse.json({ tentativaId: tentativa.id, notaNormalizada, respostasCorretas: tentativa.respostasCorretas, totalQuestoes: tentativa.totalQuestoes });
}
