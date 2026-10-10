import { prisma } from "@/biblioteca/prisma";
import { lerListaJson } from "@/dominio/analises/analise-material";
import { calcularDashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { mapearSessaoOficial, selecaoSessaoOficial } from "@/servidor/metricas";
import { obterAprendizagemModuloPessoal } from "@/servidor/aprendizagem-modulo";

/** Consulta somente a conta solicitada; o chamador obtém seu identificador da sessão autenticada. */
export async function obterDashboardObservacionalPessoal(usuarioId: string, periodo: Date | { inicio?: Date | null; fim?: Date } = {}) {
  const referencia = periodo instanceof Date ? periodo : periodo.fim ?? new Date();
  const inicio = periodo instanceof Date ? null : periodo.inicio ?? null;
  const modulos = await prisma.moduloAprendizagem.findMany({
    where: { usuarioId, arquivado: false, rascunho: false },
    select: { id: true, identificador: true, titulo: true },
    orderBy: { titulo: "asc" },
  });
  const idsModulos = modulos.map((modulo) => modulo.id);
  if (!idsModulos.length) return calcularDashboardObservacional([], [], [], referencia, inicio);

  const [sessoes, materiais, aprendizagens] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId, moduloId: { in: idsModulos }, iniciadaEm: { ...(inicio ? { gte: inicio } : {}), lte: referencia } }, select: selecaoSessaoOficial }),
    prisma.recursoConteudo.findMany({
      where: { moduloId: { in: idsModulos }, ativo: true, origem: "ARQUIVO", analise: { is: { situacao: "CONCLUIDA" } } },
      select: { id: true, moduloId: true, titulo: true, criadoEm: true, dataEvento: true, analise: { select: { conceitosJson: true } } },
    }),
    Promise.all(modulos.map((modulo) => obterAprendizagemModuloPessoal(usuarioId, modulo.id, { inicio, fim: referencia }))),
  ]);
  return calcularDashboardObservacional(
    modulos,
    sessoes.map(mapearSessaoOficial),
    materiais.map((material) => ({ id: material.id, moduloId: material.moduloId, titulo: material.titulo, conceitos: lerListaJson(material.analise?.conceitosJson), data: material.dataEvento ?? material.criadoEm })),
    referencia,
    inicio,
    aprendizagens.flatMap((item, indice) => item ? [{ ...item.analises, moduloId: modulos[indice].id }] : []),
  );
}
