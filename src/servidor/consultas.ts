import { prisma } from "@/biblioteca/prisma";

export async function obterResumoPessoal(usuarioId: string) {
  const [modulos, quantidadeSessoesValidas] = await Promise.all([
    prisma.moduloAprendizagem.findMany({
      where: { usuarioId, arquivado: false, rascunho: false },
      select: {
        id: true,
        identificador: true,
        titulo: true,
        descricao: true,
      },
      orderBy: { titulo: "asc" },
    }),
    prisma.sessaoEstudo.count({ where: { usuarioId, situacao: "CONCLUIDA", modulo: { arquivado: false, rascunho: false } } }),
  ]);
  return { modulos, quantidadeSessoesValidas };
}
