"use server";

import { revalidatePath } from "next/cache";
import { SituacaoAprovacao, PapelUsuario } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { exigirUsuario } from "@/servidor/autenticacao";

export async function atualizarCuradoria(formulario: FormData) {
  const usuario = await exigirUsuario(PapelUsuario.PROFESSOR);
  const recursoId = formulario.get("recursoId");
  const situacao = formulario.get("situacao");
  if (typeof recursoId !== "string" || (situacao !== SituacaoAprovacao.APROVADO && situacao !== SituacaoAprovacao.REJEITADO)) return;
  await prisma.aprovacaoRecurso.upsert({ where: { recursoId_professorId: { recursoId, professorId: usuario.perfilProfessorId! } }, create: { recursoId, professorId: usuario.perfilProfessorId!, situacao }, update: { situacao } });
  await prisma.eventoAuditoria.create({ data: { atorId: usuario.id, acao: "CURADORIA_ATUALIZADA", alvo: recursoId, metadados: JSON.stringify({ situacao }) } });
  revalidatePath("/professor");
}
