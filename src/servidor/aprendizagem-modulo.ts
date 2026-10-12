import { recomendarMateriais } from "@/dominio/analises/recomendacoes-materiais";
import { prisma } from "@/biblioteca/prisma";
import { analisarAprendizagemModulo, evidenciaValida, normalizarChaveConceito, saoVariacoesDoMesmoConceito, textoMencionaConceito } from "@/dominio/analises/aprendizagem-modulo";
import { sessaoValida } from "@/dominio/analises/metricas-sessoes";
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
    const resultado = /(?:erro|incorret[ao])/i.test(linha) ? "ERRO" : /(?:acerto|corret[ao])/i.test(linha) ? "ACERTO" : "NAO_INFORMADO";
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

export function extrairEvidenciaMaterial(texto: string) {
  const porcentagem = texto.match(/(?:nota|resultado|desempenho)\s*[:=]?\s*(-?\d{1,3}(?:[.,]\d+)?)\s*%/i);
  return {
    desempenhoPercentual: porcentagem ? (Number(porcentagem[1].replace(",", ".")) >= 0 && Number(porcentagem[1].replace(",", ".")) <= 100 ? Number(porcentagem[1].replace(",", ".")) : null) : null,
    questoes: extrairQuestoes(texto),
  };
}

export async function registrarEvidenciaDoMaterial(usuarioId: string, recursoId: string, textoExtraido: string, conceitos: string[]) {
  const recurso = await prisma.recursoConteudo.findFirst({
    where: { id: recursoId, ativo: true, funcao: "AVALIACAO", modulo: { usuarioId } },
    select: { id: true, moduloId: true, titulo: true, dataEvento: true, criadoEm: true },
  });
  if (!recurso) return null;
  const { desempenhoPercentual: desempenho, questoes } = extrairEvidenciaMaterial(textoExtraido);
  const conceitosPersistidos = await sincronizarConceitosMaterial(usuarioId, recursoId, conceitos);
  return prisma.$transaction(async (transacao) => {
    const evidencia = await transacao.evidenciaAprendizagem.upsert({
      where: { recursoId },
      create: { moduloId: recurso.moduloId, recursoId, titulo: recurso.titulo, tipo: "AVALIACAO", dataEvento: recurso.dataEvento ?? recurso.criadoEm, desempenhoPercentual: desempenho, resumo: "Evidência extraída automaticamente do material; dados incompletos ficam fora das métricas.", dadosOrigemJson: JSON.stringify({ origem: "EXTRACAO_MATERIAL", recursoId }) },
      update: { titulo: recurso.titulo, dataEvento: recurso.dataEvento ?? recurso.criadoEm, desempenhoPercentual: desempenho },
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
      evidencias: { where: { OR: [{ recursoId: null }, { recurso: { ativo: true, funcao: "AVALIACAO" } }] }, orderBy: { dataEvento: "desc" }, select: { id: true, titulo: true, tipo: true, dataEvento: true, desempenhoPercentual: true, resumo: true, conceitos: { select: { conceitoId: true } }, vinculosSessoes: { select: { sessaoId: true } }, questoes: { orderBy: { identificador: "asc" }, select: { id: true, identificador: true, resumo: true, tipo: true, resultado: true, pontuacaoObtida: true, pontuacaoMaxima: true, conceitos: { select: { conceitoId: true } } } } } },
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
  const evidencias = evidenciasNoPeriodo.map((evidencia) => ({ id: evidencia.id, dataEvento: evidencia.dataEvento, desempenhoPercentual: evidencia.desempenhoPercentual, conceitos: conceitosDaEvidencia(evidencia), sessaoIdsExplicitos: evidencia.vinculosSessoes.map((item) => item.sessaoId) }));
  const analises = analisarAprendizagemModulo({ referencia, sessoes, evidencias, conceitos: catalogo });
  const recomendacoes = recomendarMateriais({
    usuarioId, moduloId,
    conceitos: analises.conceitos.flatMap((item) => {
      const conceito = catalogo.find((candidato) => candidato.chave === item.chave);
      return conceito ? [{ id: conceito.id, nome: item.nome, desempenhoMedio: item.desempenhoMedio, compreensaoMedia: item.compreensaoMedia, dificuldadeMedia: item.dificuldadeMedia, evidencias: item.evidencias }] : [];
    }),
    materiais: modulo.materiais.filter((item) => item.funcao === "REFERENCIA").map((item) => ({ id: item.id, titulo: item.titulo, usuarioId, moduloId, disponivel: true, conceitoIds: item.conceitos.map((conceito) => conceito.conceitoId) })),
  });
  const linhaDoTempo = [
    ...sessoes.map((sessao) => ({ id: sessao.id, tipo: "SESSAO" as const, data: sessao.encerradaEm, titulo: "Sessão de estudo", resumo: `${sessao.duracaoMinutos} min · compreensão ${sessao.compreensaoPercebida ?? "—"}/5`, conceitos: sessao.conceitos })),
    ...materiaisNoPeriodo.filter((material) => !material.evidencia).map((material) => ({ id: material.id, tipo: material.funcao as "REFERENCIA" | "ANOTACAO" | "EVIDENCIA_VISUAL", data: material.dataEvento ?? material.criadoEm, titulo: material.titulo, resumo: material.funcao === "REFERENCIA" ? "Material de referência" : material.funcao === "ANOTACAO" ? "Anotação" : "Evidência visual", conceitos: material.conceitos.flatMap((item) => porId.get(item.conceitoId)?.nome ?? []) })),
    ...evidenciasNoPeriodo.map((evidencia) => ({ id: evidencia.id, tipo: evidencia.tipo, data: evidencia.dataEvento, titulo: evidencia.titulo, resumo: `${evidenciaValida(evidencia) ? "Evidência válida" : "Sem desempenho utilizável"}${evidencia.desempenhoPercentual === null ? "" : ` · ${evidencia.desempenhoPercentual.toFixed(0)}%`}`, conceitos: conceitosDaEvidencia(evidencia) })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime() || a.id.localeCompare(b.id));
  return { recomendacoes, conceitos: catalogo, evidencias: evidenciasNoPeriodo, analises, linhaDoTempo, base: { sessoes: sessoes.length, evidenciasValidas: evidenciasNoPeriodo.filter(evidenciaValida).length, conceitos: catalogo.length } };
}
