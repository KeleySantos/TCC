import { prisma } from "@/biblioteca/prisma";

export async function obterResumoPessoal(usuarioId: string) {
  const [modulos, quantidadeSessoesValidas, quantidadeTentativas] = await Promise.all([
    prisma.moduloAprendizagem.findMany({
      where: { usuarioId, arquivado: false, rascunho: false },
      select: {
        id: true,
        identificador: true,
        titulo: true,
        descricao: true,
        _count: { select: { topicos: { where: { ativo: true, rascunho: false } } } },
      },
      orderBy: { titulo: "asc" },
    }),
    prisma.sessaoEstudo.count({ where: { usuarioId, situacao: "CONCLUIDA", modulo: { arquivado: false, rascunho: false }, topico: { ativo: true, rascunho: false } } }),
    prisma.tentativaAvaliacao.count({ where: { usuarioId, concluidaEm: { not: null }, modulo: { arquivado: false, rascunho: false }, topico: { ativo: true, rascunho: false } } }),
  ]);
  return { modulos, quantidadeSessoesValidas, quantidadeTentativas };
}
