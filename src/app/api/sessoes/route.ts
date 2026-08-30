import { NextResponse } from "next/server";
import { z } from "zod";
import { SituacaoSessao } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { autorizarAlunoNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";

const esquemaInicio = z.object({ recursoId: z.string().min(1) });

export async function POST(requisicao: Request) {
  const acesso = autorizarAlunoNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const corpo = esquemaInicio.safeParse(await requisicao.json());
  if (!corpo.success) return NextResponse.json({ erro: "Recurso inválido." }, { status: 400 });
  const recurso = await prisma.recursoConteudo.findFirst({ where: { id: corpo.data.recursoId, ativo: true } });
  if (!recurso) return NextResponse.json({ erro: "Recurso não encontrado." }, { status: 404 });
  const sessao = await prisma.sessaoEstudo.create({ data: { alunoId: acesso.usuario.perfilAlunoId, topicoId: recurso.topicoId, recursoId: recurso.id, iniciadaEm: new Date(), situacao: SituacaoSessao.ATIVA } });
  return NextResponse.json({ sessaoId: sessao.id });
}
