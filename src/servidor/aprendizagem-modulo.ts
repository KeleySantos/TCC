import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { analisarAprendizagemModulo, normalizarChaveConceito, saoVariacoesDoMesmoConceito, textoMencionaConceito } from "@/dominio/analises/aprendizagem-modulo";
import { sessaoValida } from "@/dominio/analises/metricas-sessoes";
import { SituacaoConfirmacao } from "@/gerado/prisma/enums";

const esquemaConfirmacao = z.object({
  evidenciaId: z.string().min(1),
  desempenhoPercentual: z.coerce.number().min(0).max(100).nullable(),
  dataEvento: z.coerce.date(),
  questoes: z.array(z.object({
    id: z.string().min(1),
    resultado: z.enum(["ACERTO", "PARCIAL", "ERRO", "NAO_INFORMADO"]),
    tipo: z.enum(["MULTIPLA_ESCOLHA", "VERDADEIRO_FALSO", "DISCURSIVA", "PRATICA", "APLICACAO", "OUTRA"]),
    pontuacaoObtida: z.coerce.number().min(0).nullable(),
    pontuacaoMaxima: z.coerce.number().positive().nullable(),
    conceitoIds: z.array(z.string().min(1)).default([]),
  }).refine((questao) => questao.pontuacaoObtida === null || questao.pontuacaoMaxima === null || questao.pontuacaoObtida <= questao.pontuacaoMaxima)).default([]),
  conceitoIds: z.array(z.string().min(1)).default([]),
});

function lerLista(valor: string | null | undefined) {
  if (!valor) return [];
  try {
    const dados: unknown = JSON.parse(valor);
    return Array.isArray(dados) ? dados.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

function siglaExplicita(valor: string) {
  const texto = valor.trim();
  return /^[A-ZÀ-ÖØ-Þ0-9]{2,8}$/.test(texto) && texto === texto.toLocaleUpperCase("pt-BR");
}

function podeConsolidarVariacao(item: { nome: string; aliasesJson: string }, nome: string) {
  const termos = [item.nome, ...lerLista(item.aliasesJson)];
  if (!termos.some((termo) => saoVariacoesDoMesmoConceito(termo, nome))) return false;
  if (siglaExplicita(nome)) return true;
  const nomeNormalizado = normalizarChaveConceito(nome);
  const nomesExtensosDiferentes = termos.filter((termo) => !siglaExplicita(termo) && normalizarChaveConceito(termo) !== nomeNormalizado);
  return nomesExtensosDiferentes.length === 0;
}

export async function sincronizarConceitosMaterial(usuarioId: string, recursoId: string, nomes: string[]) {
  const recurso = await prisma.recursoConteudo.findFirst({ where: { id: recursoId, modulo: { usuarioId } }, select: { id: true, moduloId: true } });
  if (!recurso) return [];
  const unicos = [...new Map(nomes.map((nome) => [normalizarChaveConceito(nome), nome.trim()])).entries()].filter(([chave]) => chave);
  return prisma.$transaction(async (transacao) => {
    const conceitos = [];
    const catalogoExistente = await transacao.conceitoAprendizagem.findMany({ where: { moduloId: recurso.moduloId }, select: { id: true, chave: true, nome: true, aliasesJson: true } });
    for (const [chave, nome] of unicos) {
      const correspondenteExato = catalogoExistente.find((item) => [item.nome, ...lerLista(item.aliasesJson)].some((termo) => normalizarChaveConceito(termo) === chave));
      const candidatosVariacao = catalogoExistente.filter((item) => podeConsolidarVariacao(item, nome));
      const correspondente = correspondenteExato ?? (candidatosVariacao.length === 1 ? candidatosVariacao[0] : undefined);
      const conceito = correspondente
        ? await transacao.conceitoAprendizagem.update({ where: { id: correspondente.id }, data: {
          nome: nome.length > correspondente.nome.length ? nome : correspondente.nome,
          aliasesJson: JSON.stringify([...new Set([correspondente.nome, nome, ...lerLista(correspondente.aliasesJson)])].filter((alias) => alias !== (nome.length > correspondente.nome.length ? nome : correspondente.nome))),
          ativo: true,
        } })
        : await transacao.conceitoAprendizagem.upsert({
          where: { moduloId_chave: { moduloId: recurso.moduloId, chave } },
          create: { moduloId: recurso.moduloId, chave, nome },
          update: { ativo: true },
        });
      const indiceCatalogo = catalogoExistente.findIndex((item) => item.id === conceito.id);
      const itemCatalogo = { id: conceito.id, chave: conceito.chave, nome: conceito.nome, aliasesJson: conceito.aliasesJson };
      if (indiceCatalogo < 0) catalogoExistente.push(itemCatalogo);
      else catalogoExistente[indiceCatalogo] = itemCatalogo;
      await transacao.conceitoMaterial.upsert({ where: { conceitoId_recursoId: { conceitoId: conceito.id, recursoId } }, create: { conceitoId: conceito.id, recursoId }, update: {} });
      conceitos.push(conceito);
    }
    await transacao.conceitoMaterial.deleteMany({
      where: { recursoId, ...(conceitos.length ? { conceitoId: { notIn: conceitos.map((conceito) => conceito.id) } } : {}) },
    });
    return conceitos;
  });
}

function extrairQuestoes(texto: string) {
  const questoes: Array<{ identificador: string; resumo: string; resultado: "ACERTO" | "ERRO" | "NAO_INFORMADO" }> = [];
  for (const linha of texto.split(/\r?\n/)) {
    const identificacao = linha.match(/(?:quest(?:ão|ao)|q\.)\s*(\d+)/i);
    if (!identificacao) continue;
    const resultado = /(?:acerto|corret[ao])/i.test(linha) ? "ACERTO" : /(?:erro|incorret[ao])/i.test(linha) ? "ERRO" : "NAO_INFORMADO";
    questoes.push({ identificador: identificacao[1], resumo: linha.trim().slice(0, 500), resultado });
  }
  const unicas = new Map<string, (typeof questoes)[number]>();
  for (const questao of questoes) {
    const anterior = unicas.get(questao.identificador);
    if (!anterior || (anterior.resultado === "NAO_INFORMADO" && questao.resultado !== "NAO_INFORMADO")) {
      unicas.set(questao.identificador, questao);
    }
  }
  return [...unicas.values()];
}

export function extrairRascunhoEvidencia(texto: string) {
  const porcentagem = texto.match(/(?:nota|resultado|desempenho)?\s*[:=-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*%/i);
  return {
    desempenhoPercentual: porcentagem ? Math.min(100, Number(porcentagem[1].replace(",", "."))) : null,
    questoes: extrairQuestoes(texto),
  };
}

export async function criarRascunhoEvidenciaDoMaterial(usuarioId: string, recursoId: string, textoExtraido: string, conceitos: string[]) {
  const recurso = await prisma.recursoConteudo.findFirst({
    where: { id: recursoId, funcao: "AVALIACAO", modulo: { usuarioId } },
    select: { id: true, moduloId: true, titulo: true, dataEvento: true, criadoEm: true },
  });
  if (!recurso) return null;
  const evidenciaConfirmada = await prisma.evidenciaAprendizagem.findUnique({ where: { recursoId }, select: { id: true, situacaoConfirmacao: true } });
  if (evidenciaConfirmada?.situacaoConfirmacao === "CONFIRMADA") return evidenciaConfirmada;
  const { desempenhoPercentual: desempenho, questoes } = extrairRascunhoEvidencia(textoExtraido);
  const conceitosPersistidos = await sincronizarConceitosMaterial(usuarioId, recursoId, conceitos);
  return prisma.$transaction(async (transacao) => {
    const evidencia = await transacao.evidenciaAprendizagem.upsert({
      where: { recursoId },
      create: { moduloId: recurso.moduloId, recursoId, titulo: recurso.titulo, tipo: "AVALIACAO", dataEvento: recurso.dataEvento ?? recurso.criadoEm, desempenhoPercentual: desempenho, resumo: "Rascunho extraído automaticamente; confirme antes de usar nas análises." },
      update: { titulo: recurso.titulo, dataEvento: recurso.dataEvento ?? recurso.criadoEm, desempenhoPercentual: desempenho, situacaoConfirmacao: "PENDENTE", confirmadaEm: null },
    });
    await transacao.questaoEvidencia.deleteMany({ where: { evidenciaId: evidencia.id } });
    if (questoes.length) await transacao.questaoEvidencia.createMany({ data: questoes.map((questao) => ({ ...questao, evidenciaId: evidencia.id })) });
    await transacao.conceitoEvidencia.deleteMany({ where: { evidenciaId: evidencia.id, ...(conceitosPersistidos.length ? { conceitoId: { notIn: conceitosPersistidos.map((conceito) => conceito.id) } } : {}) } });
    for (const conceito of conceitosPersistidos) await transacao.conceitoEvidencia.upsert({ where: { conceitoId_evidenciaId: { conceitoId: conceito.id, evidenciaId: evidencia.id } }, create: { conceitoId: conceito.id, evidenciaId: evidencia.id }, update: {} });
    const questoesPersistidas = await transacao.questaoEvidencia.findMany({ where: { evidenciaId: evidencia.id }, select: { id: true } });
    for (const questao of questoesPersistidas) for (const conceito of conceitosPersistidos) await transacao.conceitoQuestaoEvidencia.upsert({ where: { conceitoId_questaoId: { conceitoId: conceito.id, questaoId: questao.id } }, create: { conceitoId: conceito.id, questaoId: questao.id }, update: {} });
    return evidencia;
  });
}

export async function confirmarEvidenciaPessoal(usuarioId: string, entrada: unknown) {
  const validado = esquemaConfirmacao.safeParse(entrada);
  if (!validado.success) throw new Error("DADOS_INVALIDOS");
  if (validado.data.dataEvento.getTime() > Date.now()) throw new Error("DADOS_INVALIDOS");
  const evidencia = await prisma.evidenciaAprendizagem.findFirst({ where: { id: validado.data.evidenciaId, modulo: { usuarioId } }, select: { id: true, moduloId: true } });
  if (!evidencia) throw new Error("NAO_ENCONTRADO");
  const todosConceitoIds = [...new Set([
    ...validado.data.conceitoIds,
    ...validado.data.questoes.flatMap((questao) => questao.conceitoIds),
  ])];
  const conceitos = await prisma.conceitoAprendizagem.findMany({ where: { id: { in: todosConceitoIds }, moduloId: evidencia.moduloId, ativo: true }, select: { id: true } });
  if (conceitos.length !== todosConceitoIds.length) throw new Error("DADOS_INVALIDOS");
  const conceitoIdsValidos = new Set(conceitos.map((conceito) => conceito.id));
  return prisma.$transaction(async (transacao) => {
    for (const questao of validado.data.questoes) {
      const atualizada = await transacao.questaoEvidencia.updateMany({ where: { id: questao.id, evidenciaId: evidencia.id }, data: { resultado: questao.resultado, tipo: questao.tipo, pontuacaoObtida: questao.pontuacaoObtida, pontuacaoMaxima: questao.pontuacaoMaxima } });
      if (atualizada.count !== 1) throw new Error("DADOS_INVALIDOS");
      await transacao.conceitoQuestaoEvidencia.deleteMany({ where: { questaoId: questao.id } });
      const idsDaQuestao = [...new Set(questao.conceitoIds)].filter((id) => conceitoIdsValidos.has(id));
      if (idsDaQuestao.length) await transacao.conceitoQuestaoEvidencia.createMany({ data: idsDaQuestao.map((conceitoId) => ({ conceitoId, questaoId: questao.id })) });
    }
    await transacao.conceitoEvidencia.deleteMany({ where: { evidenciaId: evidencia.id } });
    if (validado.data.conceitoIds.length) await transacao.conceitoEvidencia.createMany({ data: [...new Set(validado.data.conceitoIds)].map((conceitoId) => ({ conceitoId, evidenciaId: evidencia.id })) });
    return transacao.evidenciaAprendizagem.update({ where: { id: evidencia.id }, data: { dataEvento: validado.data.dataEvento, desempenhoPercentual: validado.data.desempenhoPercentual, situacaoConfirmacao: SituacaoConfirmacao.CONFIRMADA, confirmadaEm: new Date() } });
  });
}

export async function rejeitarEvidenciaPessoal(usuarioId: string, evidenciaId: string) {
  const evidencia = await prisma.evidenciaAprendizagem.findFirst({ where: { id: evidenciaId, modulo: { usuarioId } }, select: { id: true } });
  if (!evidencia) throw new Error("NAO_ENCONTRADO");
  return prisma.evidenciaAprendizagem.update({ where: { id: evidencia.id }, data: { situacaoConfirmacao: SituacaoConfirmacao.REJEITADA, confirmadaEm: null } });
}

export type PeriodoConsultaAprendizagemModulo = { inicio?: Date | null; fim?: Date };

export async function obterAprendizagemModuloPessoal(usuarioId: string, moduloId: string, periodo: Date | PeriodoConsultaAprendizagemModulo = {}) {
  const referencia = periodo instanceof Date ? periodo : periodo.fim ?? new Date();
  const inicio = periodo instanceof Date ? null : periodo.inicio ?? null;
  const modulo = await prisma.moduloAprendizagem.findFirst({
    where: { id: moduloId, usuarioId, arquivado: false, rascunho: false },
    select: {
      id: true,
      conceitos: { where: { ativo: true }, select: { id: true, chave: true, nome: true, aliasesJson: true } },
      materiais: { where: { ativo: true }, select: { id: true, titulo: true, funcao: true, criadoEm: true, dataEvento: true, conceitos: { select: { conceitoId: true } }, evidencia: { select: { id: true } } } },
      sessoesEstudo: { select: { id: true, moduloId: true, descricao: true, iniciadaEm: true, encerradaEm: true, duracaoMinutos: true, situacao: true, arquivada: true, dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } }, conceitos: { select: { conceitoId: true } }, materiais: { select: { recurso: { select: { conceitos: { select: { conceitoId: true } } } } } } } },
      evidencias: { orderBy: { dataEvento: "desc" }, select: { id: true, titulo: true, tipo: true, dataEvento: true, situacaoConfirmacao: true, desempenhoPercentual: true, resumo: true, conceitos: { select: { conceitoId: true } }, vinculosSessoes: { select: { sessaoId: true, confirmado: true } }, questoes: { orderBy: { identificador: "asc" }, select: { id: true, identificador: true, resumo: true, tipo: true, resultado: true, pontuacaoObtida: true, pontuacaoMaxima: true, conceitos: { select: { conceitoId: true } } } } } },
    },
  });
  if (!modulo) return null;
  const porId = new Map(modulo.conceitos.map((conceito) => [conceito.id, conceito]));
  const catalogo = modulo.conceitos.map((conceito) => ({ id: conceito.id, chave: conceito.chave, nome: conceito.nome, aliases: lerLista(conceito.aliasesJson) }));
  const sessoesValidas = modulo.sessoesEstudo.filter((sessao) => sessaoValida({ ...sessao, metodos: sessao.metodos.map((item) => item.metodo), formatos: sessao.formatos.map((item) => item.formato) }) && sessao.iniciadaEm.getTime() <= referencia.getTime() && (inicio === null || sessao.iniciadaEm.getTime() >= inicio.getTime()));
  const sessoes = sessoesValidas.map((sessao) => {
    const ids = new Set([...(sessao.conceitos.map((item) => item.conceitoId)), ...sessao.materiais.flatMap((item) => item.recurso.conceitos.map((conceito) => conceito.conceitoId))]);
    for (const conceito of catalogo) if ([conceito.nome, ...conceito.aliases].some((termo) => textoMencionaConceito(sessao.descricao, termo))) {
      const persistido = modulo.conceitos.find((item) => item.chave === conceito.chave);
      if (persistido) ids.add(persistido.id);
    }
    return { id: sessao.id, encerradaEm: sessao.encerradaEm!, duracaoMinutos: sessao.duracaoMinutos!, dificuldadePercebida: sessao.dificuldadePercebida, compreensaoPercebida: sessao.compreensaoPercebida, metodos: sessao.metodos.map((item) => item.metodo), formatos: sessao.formatos.map((item) => item.formato), conceitos: [...ids].flatMap((id) => porId.get(id)?.nome ?? []) };
  });
  const conceitosDaEvidencia = (evidencia: typeof modulo.evidencias[number]) => [...new Set([
    ...evidencia.conceitos.map((item) => item.conceitoId),
    ...evidencia.questoes.flatMap((questao) => questao.conceitos.map((item) => item.conceitoId)),
  ])].flatMap((id) => porId.get(id)?.nome ?? []);
  const evidenciasNoPeriodo = modulo.evidencias.filter((evidencia) => evidencia.dataEvento.getTime() <= referencia.getTime() && (inicio === null || evidencia.dataEvento.getTime() >= inicio.getTime()));
  const materiaisNoPeriodo = modulo.materiais.filter((material) => {
    const data = material.dataEvento ?? material.criadoEm;
    return data.getTime() <= referencia.getTime() && (inicio === null || data.getTime() >= inicio.getTime());
  });
  const evidencias = evidenciasNoPeriodo.map((evidencia) => ({ id: evidencia.id, dataEvento: evidencia.dataEvento, confirmada: evidencia.situacaoConfirmacao === "CONFIRMADA", desempenhoPercentual: evidencia.desempenhoPercentual, conceitos: conceitosDaEvidencia(evidencia), sessaoIdsExplicitos: evidencia.vinculosSessoes.filter((item) => item.confirmado).map((item) => item.sessaoId) }));
  const analises = analisarAprendizagemModulo({ referencia, sessoes, evidencias, conceitos: catalogo });
  const linhaDoTempo = [
    ...sessoes.map((sessao) => ({ id: sessao.id, tipo: "SESSAO" as const, data: sessao.encerradaEm, titulo: "Sessão de estudo", resumo: `${sessao.duracaoMinutos} min · compreensão ${sessao.compreensaoPercebida ?? "—"}/5`, conceitos: sessao.conceitos })),
    ...materiaisNoPeriodo.filter((material) => !material.evidencia).map((material) => ({ id: material.id, tipo: material.funcao as "REFERENCIA" | "ANOTACAO" | "EVIDENCIA_VISUAL", data: material.dataEvento ?? material.criadoEm, titulo: material.titulo, resumo: material.funcao === "REFERENCIA" ? "Material de referência" : material.funcao === "ANOTACAO" ? "Anotação" : "Evidência visual", conceitos: material.conceitos.flatMap((item) => porId.get(item.conceitoId)?.nome ?? []) })),
    ...evidenciasNoPeriodo.map((evidencia) => ({ id: evidencia.id, tipo: evidencia.tipo, data: evidencia.dataEvento, titulo: evidencia.titulo, resumo: `${evidencia.situacaoConfirmacao === "CONFIRMADA" ? "Confirmada" : evidencia.situacaoConfirmacao === "REJEITADA" ? "Rejeitada" : "Aguardando confirmação"}${evidencia.desempenhoPercentual === null ? "" : ` · ${evidencia.desempenhoPercentual.toFixed(0)}%`}`, conceitos: conceitosDaEvidencia(evidencia) })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime() || a.id.localeCompare(b.id));
  return { conceitos: catalogo, evidencias: evidenciasNoPeriodo, analises, linhaDoTempo, base: { sessoes: sessoes.length, evidenciasConfirmadas: evidenciasNoPeriodo.filter((item) => item.situacaoConfirmacao === "CONFIRMADA").length, evidenciasPendentes: evidenciasNoPeriodo.filter((item) => item.situacaoConfirmacao === "PENDENTE").length, conceitos: catalogo.length } };
}
