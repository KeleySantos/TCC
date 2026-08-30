import { NextResponse } from "next/server";
import { SituacaoSessao } from "@/gerado/prisma/enums";
import { MINUTOS_MINIMOS_SESSAO_VALIDA } from "@/dominio/analises/evidencias";
import { prisma } from "@/biblioteca/prisma";
import { autorizarAlunoNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";

export async function POST(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const acesso = autorizarAlunoNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { id } = await contexto.params;
  const sessao = await prisma.sessaoEstudo.findFirst({ where: { id, alunoId: acesso.usuario.perfilAlunoId, situacao: SituacaoSessao.ATIVA } });
  if (!sessao) return NextResponse.json({ erro: "Sessão ativa não encontrada." }, { status: 404 });
  const encerradaEm = new Date();
  const duracaoMinutos = Math.floor((encerradaEm.getTime() - sessao.iniciadaEm.getTime()) / 60000);
  const situacao = duracaoMinutos >= MINUTOS_MINIMOS_SESSAO_VALIDA ? SituacaoSessao.CONCLUIDA : SituacaoSessao.INVALIDADA;
  await prisma.sessaoEstudo.update({ where: { id }, data: { encerradaEm, duracaoMinutos, situacao } });
  return NextResponse.json({ situacao, duracaoMinutos });
}
