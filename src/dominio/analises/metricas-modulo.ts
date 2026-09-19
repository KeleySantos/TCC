import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import {
  construirEvidencias,
  obterNivelEvidencia,
  type EvidenciaAprendizagem,
  type SessaoParaEvidencia,
  type TentativaParaEvidencia,
  VERSAO_ALGORITMO,
} from "./evidencias";

export type SessaoParaMetricas = SessaoParaEvidencia & { moduloId: string };
export type TentativaParaMetricas = TentativaParaEvidencia & {
  moduloId: string;
  numeroTentativa: number;
  respostasCorretas: number;
  totalQuestoes: number;
};

export type EvolucaoNotas = {
  amostra: number;
  primeiraNota: number | null;
  ultimaNota: number | null;
  variacao: number | null;
  pontos: Array<{ tentativaId: string; topicoId: string; numeroTentativa: number; concluidaEm: Date; nota: number }>;
};

export type PontoEvolucaoTaxaMediaTopicos = {
  periodoInicio: Date;
  periodoFim: Date;
  mediaTaxasAcertoTopicos: number | null;
  quantidadeTopicosComEvidencia: number;
  quantidadeTentativas: number;
  respostasCorretas: number;
  totalQuestoes: number;
  topicos: Array<{
    topicoId: string;
    taxaAcerto: number;
    quantidadeTentativas: number;
    respostasCorretas: number;
    totalQuestoes: number;
  }>;
};

export type EvolucaoTaxaMediaTopicos = {
  periodicidade: "SEMANAL";
  pontos: PontoEvolucaoTaxaMediaTopicos[];
  quantidadePeriodosComEvidencia: number;
  versaoAlgoritmo: string;
};

export type DificuldadeAtualEstimada = {
  status: "ALTA" | "INTERMEDIARIA" | "BAIXA" | null;
  taxaReferencia: number | null;
  quantidadePeriodos: number;
  amostraReduzida: boolean;
  periodoInicio: Date | null;
  periodoFim: Date | null;
  versaoAlgoritmo: string;
};

export type TempoEstudo = {
  quantidadeSessoesValidas: number;
  minutosTotais: number;
  mediaMinutos: number | null;
};

export type FrequenciaEstudo = {
  diasComEstudo: number;
  maiorSequenciaDias: number;
  primeiraSessaoEm: Date | null;
  ultimaSessaoEm: Date | null;
};

export type DesempenhoContextual = {
  chave: FormatoConteudo | MetodoEstudo;
  quantidadeEvidencias: number;
  mediaNotas: number;
  nivelEvidencia: ReturnType<typeof obterNivelEvidencia>;
};

export type PercepcaoVersusResultado = {
  amostra: number;
  mediaDificuldadePercebida: number | null;
  mediaCompreensaoPercebida: number | null;
  mediaNota: number | null;
  observacoes: Array<{ tentativaId: string; numeroTentativa: number | null; nota: number; dificuldadePercebida: number; compreensaoPercebida: number }>;
};

export type MetricasContexto = {
  moduloId: string;
  topicoId: string | null;
  versaoAlgoritmo: string;
  quantidadeTentativas: number;
  respostasCorretas: number;
  totalQuestoes: number;
  taxaAcerto: number | null;
  mediaNotas: number | null;
  ultimaNota: number | null;
  evolucao: EvolucaoNotas;
  tempoEstudo: TempoEstudo;
  frequencia: FrequenciaEstudo;
  quantidadeExposicoesMistas: number;
  desempenhoPorFormato: DesempenhoContextual[];
  desempenhoPorMetodo: DesempenhoContextual[];
  percepcaoVersusResultado: PercepcaoVersusResultado;
};

export type MetricasModulo = MetricasContexto & {
  metricasPorTopico: MetricasContexto[];
  evolucaoTaxaMediaTopicos: EvolucaoTaxaMediaTopicos;
  dificuldadeAtualEstimada: DificuldadeAtualEstimada;
};

export type RecorrenciaContextual = {
  tipo: "FORMATO" | "METODO";
  chave: FormatoConteudo | MetodoEstudo;
  quantidadeModulos: number;
  moduloIds: string[];
  quantidadeEvidencias: number;
  mediaNotas: number;
  versaoAlgoritmo: string;
};

export type TaxaAcertoGeral = {
  respostasCorretas: number;
  totalQuestoes: number;
  quantidadeTentativas: number;
  quantidadeModulosComEvidencia: number;
  taxaAcerto: number | null;
  versaoAlgoritmo: string;
};

export type MetodoComMaiorMediaObservada = {
  chave: MetodoEstudo;
  mediaNotas: number;
  quantidadeEvidencias: number;
  quantidadeModulos: number;
  moduloIds: string[];
  versaoAlgoritmo: string;
};

function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null;
}

function sessaoValidaParaTempo(sessao: SessaoParaMetricas) {
  return sessao.situacao === "CONCLUIDA" && (sessao.duracaoMinutos ?? 0) >= 5;
}

function tentativasOrdenadas(tentativas: TentativaParaMetricas[]) {
  return tentativas
    .filter((tentativa): tentativa is TentativaParaMetricas & { concluidaEm: Date; notaNormalizada: number } => tentativa.concluidaEm !== null && tentativa.notaNormalizada !== null && tentativa.notaNormalizada >= 0 && tentativa.notaNormalizada <= 100)
    .sort((a, b) => a.concluidaEm.getTime() - b.concluidaEm.getTime() || a.numeroTentativa - b.numeroTentativa || a.id.localeCompare(b.id));
}

function resumirTempo(sessoes: SessaoParaMetricas[]): TempoEstudo {
  const validas = sessoes.filter(sessaoValidaParaTempo);
  const minutosTotais = validas.reduce((soma, sessao) => soma + (sessao.duracaoMinutos ?? 0), 0);
  return { quantidadeSessoesValidas: validas.length, minutosTotais, mediaMinutos: validas.length ? minutosTotais / validas.length : null };
}

export function calcularFrequenciaEstudo(sessoes: SessaoParaMetricas[]): FrequenciaEstudo {
  const datas = sessoes.filter(sessaoValidaParaTempo).map((sessao) => sessao.encerradaEm!).sort((a, b) => a.getTime() - b.getTime());
  const dias = [...new Set(datas.map((data) => data.toISOString().slice(0, 10)))];
  let maiorSequenciaDias = 0;
  let sequenciaAtual = 0;
  let diaAnterior: number | null = null;
  for (const dia of dias) {
    const valorDia = Date.parse(`${dia}T00:00:00.000Z`);
    sequenciaAtual = diaAnterior !== null && valorDia - diaAnterior === 86_400_000 ? sequenciaAtual + 1 : 1;
    maiorSequenciaDias = Math.max(maiorSequenciaDias, sequenciaAtual);
    diaAnterior = valorDia;
  }
  return { diasComEstudo: dias.length, maiorSequenciaDias, primeiraSessaoEm: datas[0] ?? null, ultimaSessaoEm: datas.at(-1) ?? null };
}

function resumirEvolucao(tentativas: TentativaParaMetricas[]): EvolucaoNotas {
  const ordenadas = tentativasOrdenadas(tentativas);
  const primeira = ordenadas[0]?.notaNormalizada ?? null;
  const ultima = ordenadas.at(-1)?.notaNormalizada ?? null;
  return {
    amostra: ordenadas.length,
    primeiraNota: primeira,
    ultimaNota: ultima,
    variacao: ordenadas.length >= 2 && primeira !== null && ultima !== null ? ultima - primeira : null,
    pontos: ordenadas.map((tentativa) => ({ tentativaId: tentativa.id, topicoId: tentativa.topicoId, numeroTentativa: tentativa.numeroTentativa, concluidaEm: tentativa.concluidaEm, nota: tentativa.notaNormalizada })),
  };
}

function inicioSemanaUtc(data: Date) {
  const inicio = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
  return inicio;
}

export function calcularEvolucaoTaxaMediaTopicos(moduloId: string, tentativas: TentativaParaMetricas[]): EvolucaoTaxaMediaTopicos {
  const periodos = new Map<string, { periodoInicio: Date; topicos: Map<string, TentativaParaMetricas[]> }>();
  for (const tentativa of tentativasOrdenadas(tentativas.filter((tentativa) => tentativa.moduloId === moduloId))) {
    if (!Number.isInteger(tentativa.totalQuestoes) || tentativa.totalQuestoes <= 0) continue;
    const periodoInicio = inicioSemanaUtc(tentativa.concluidaEm);
    const chave = periodoInicio.toISOString();
    const periodo = periodos.get(chave) ?? { periodoInicio, topicos: new Map<string, TentativaParaMetricas[]>() };
    periodo.topicos.set(tentativa.topicoId, [...(periodo.topicos.get(tentativa.topicoId) ?? []), tentativa]);
    periodos.set(chave, periodo);
  }
  const pontos = [...periodos.values()].sort((a, b) => a.periodoInicio.getTime() - b.periodoInicio.getTime()).map((periodo) => {
    const topicos = [...periodo.topicos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([topicoId, tentativasTopico]) => {
      const totalQuestoes = tentativasTopico.reduce((soma, tentativa) => soma + tentativa.totalQuestoes, 0);
      const respostasCorretas = tentativasTopico.reduce((soma, tentativa) => soma + Math.max(0, Math.min(tentativa.respostasCorretas, tentativa.totalQuestoes)), 0);
      return { topicoId, taxaAcerto: respostasCorretas / totalQuestoes, quantidadeTentativas: tentativasTopico.length, respostasCorretas, totalQuestoes };
    });
    const respostasCorretas = topicos.reduce((soma, topico) => soma + topico.respostasCorretas, 0);
    const totalQuestoes = topicos.reduce((soma, topico) => soma + topico.totalQuestoes, 0);
    return {
      periodoInicio: periodo.periodoInicio,
      periodoFim: new Date(periodo.periodoInicio.getTime() + 7 * 86_400_000 - 1),
      mediaTaxasAcertoTopicos: media(topicos.map((topico) => topico.taxaAcerto)),
      quantidadeTopicosComEvidencia: topicos.length,
      quantidadeTentativas: topicos.reduce((soma, topico) => soma + topico.quantidadeTentativas, 0),
      respostasCorretas,
      totalQuestoes,
      topicos,
    };
  });
  return { periodicidade: "SEMANAL", pontos, quantidadePeriodosComEvidencia: pontos.length, versaoAlgoritmo: VERSAO_ALGORITMO };
}

export function calcularDificuldadeAtualEstimada(evolucao: EvolucaoTaxaMediaTopicos): DificuldadeAtualEstimada {
  const recentes = evolucao.pontos.filter((ponto) => ponto.mediaTaxasAcertoTopicos !== null).slice(-3);
  if (!recentes.length) return { status: null, taxaReferencia: null, quantidadePeriodos: 0, amostraReduzida: false, periodoInicio: null, periodoFim: null, versaoAlgoritmo: evolucao.versaoAlgoritmo };
  const taxaReferencia = media(recentes.map((ponto) => ponto.mediaTaxasAcertoTopicos!))!;
  return {
    status: taxaReferencia < 0.6 ? "ALTA" : taxaReferencia < 0.8 ? "INTERMEDIARIA" : "BAIXA",
    taxaReferencia,
    quantidadePeriodos: recentes.length,
    amostraReduzida: recentes.length < 3,
    periodoInicio: recentes[0].periodoInicio,
    periodoFim: recentes.at(-1)!.periodoFim,
    versaoAlgoritmo: evolucao.versaoAlgoritmo,
  };
}

function resumirDesempenho<T extends FormatoConteudo | MetodoEstudo>(evidencias: EvidenciaAprendizagem[], valor: (evidencia: EvidenciaAprendizagem) => T | null): DesempenhoContextual[] {
  const grupos = new Map<T, EvidenciaAprendizagem[]>();
  for (const evidencia of evidencias) {
    const chave = valor(evidencia);
    if (chave === null) continue;
    grupos.set(chave, [...(grupos.get(chave) ?? []), evidencia]);
  }
  return [...grupos.entries()].map(([chave, itens]) => {
    const notas = itens.map((item) => item.nota);
    return { chave, quantidadeEvidencias: itens.length, mediaNotas: media(notas)!, nivelEvidencia: obterNivelEvidencia(itens.length, notas) };
  }).sort((a, b) => b.mediaNotas - a.mediaNotas || b.quantidadeEvidencias - a.quantidadeEvidencias || a.chave.localeCompare(b.chave));
}

function resumirPercepcao(evidencias: EvidenciaAprendizagem[]): PercepcaoVersusResultado {
  const observacoes = evidencias
    .filter((evidencia): evidencia is EvidenciaAprendizagem & { dificuldadePercebida: number; compreensaoPercebida: number } => evidencia.dificuldadePercebida !== null && evidencia.compreensaoPercebida !== null)
    .map((evidencia) => ({ tentativaId: evidencia.tentativaId, numeroTentativa: evidencia.numeroTentativa, nota: evidencia.nota, dificuldadePercebida: evidencia.dificuldadePercebida, compreensaoPercebida: evidencia.compreensaoPercebida }));
  return {
    amostra: observacoes.length,
    mediaDificuldadePercebida: media(observacoes.map((observacao) => observacao.dificuldadePercebida)),
    mediaCompreensaoPercebida: media(observacoes.map((observacao) => observacao.compreensaoPercebida)),
    mediaNota: media(observacoes.map((observacao) => observacao.nota)),
    observacoes,
  };
}

export function calcularMetricasContexto(moduloId: string, topicoId: string | null, sessoes: SessaoParaMetricas[], tentativas: TentativaParaMetricas[]): MetricasContexto {
  const sessoesContexto = sessoes.filter((sessao) => sessao.moduloId === moduloId && (topicoId === null || sessao.topicoId === topicoId));
  const tentativasContexto = tentativas.filter((tentativa) => tentativa.moduloId === moduloId && (topicoId === null || tentativa.topicoId === topicoId));
  const tentativasValidas = tentativasOrdenadas(tentativasContexto);
  const { evidencias, quantidadeExposicoesMistas } = construirEvidencias(sessoesContexto, tentativasValidas);
  const totalQuestoes = tentativasValidas.reduce((soma, tentativa) => soma + Math.max(0, tentativa.totalQuestoes), 0);
  const respostasCorretas = tentativasValidas.reduce((soma, tentativa) => soma + Math.max(0, Math.min(tentativa.respostasCorretas, tentativa.totalQuestoes)), 0);
  return {
    moduloId,
    topicoId,
    versaoAlgoritmo: VERSAO_ALGORITMO,
    quantidadeTentativas: tentativasValidas.length,
    respostasCorretas,
    totalQuestoes,
    taxaAcerto: totalQuestoes ? respostasCorretas / totalQuestoes : null,
    mediaNotas: media(tentativasValidas.map((tentativa) => tentativa.notaNormalizada)),
    ultimaNota: tentativasValidas.at(-1)?.notaNormalizada ?? null,
    evolucao: resumirEvolucao(tentativasValidas),
    tempoEstudo: resumirTempo(sessoesContexto),
    frequencia: calcularFrequenciaEstudo(sessoesContexto),
    quantidadeExposicoesMistas,
    desempenhoPorFormato: resumirDesempenho(evidencias, (evidencia) => evidencia.formato),
    desempenhoPorMetodo: resumirDesempenho(evidencias, (evidencia) => evidencia.metodo),
    percepcaoVersusResultado: resumirPercepcao(evidencias),
  };
}

export function calcularMetricasModulo(moduloId: string, sessoes: SessaoParaMetricas[], tentativas: TentativaParaMetricas[]): MetricasModulo {
  const base = calcularMetricasContexto(moduloId, null, sessoes, tentativas);
  const topicos = new Set([
    ...sessoes.filter((sessao) => sessao.moduloId === moduloId).map((sessao) => sessao.topicoId),
    ...tentativas.filter((tentativa) => tentativa.moduloId === moduloId).map((tentativa) => tentativa.topicoId),
  ]);
  const evolucaoTaxaMediaTopicos = calcularEvolucaoTaxaMediaTopicos(moduloId, tentativas);
  return {
    ...base,
    metricasPorTopico: [...topicos].sort((a, b) => a.localeCompare(b)).map((topicoId) => calcularMetricasContexto(moduloId, topicoId, sessoes, tentativas)),
    evolucaoTaxaMediaTopicos,
    dificuldadeAtualEstimada: calcularDificuldadeAtualEstimada(evolucaoTaxaMediaTopicos),
  };
}

export function calcularTaxaAcertoGeral(metricas: MetricasModulo[]): TaxaAcertoGeral {
  const respostasCorretas = metricas.reduce((soma, metrica) => soma + metrica.respostasCorretas, 0);
  const totalQuestoes = metricas.reduce((soma, metrica) => soma + metrica.totalQuestoes, 0);
  return {
    respostasCorretas,
    totalQuestoes,
    quantidadeTentativas: metricas.reduce((soma, metrica) => soma + metrica.quantidadeTentativas, 0),
    quantidadeModulosComEvidencia: metricas.filter((metrica) => metrica.totalQuestoes > 0).length,
    taxaAcerto: totalQuestoes > 0 ? respostasCorretas / totalQuestoes : null,
    versaoAlgoritmo: VERSAO_ALGORITMO,
  };
}

export function calcularRecorrenciasEntreModulos(metricas: MetricasModulo[]): RecorrenciaContextual[] {
  const recorrencias: RecorrenciaContextual[] = [];
  for (const [tipo, seletor] of [["FORMATO", (item: MetricasModulo) => item.desempenhoPorFormato], ["METODO", (item: MetricasModulo) => item.desempenhoPorMetodo]] as const) {
    const grupos = new Map<string, Array<{ moduloId: string; quantidadeEvidencias: number; mediaNotas: number }>>();
    for (const metrica of metricas) for (const desempenho of seletor(metrica)) grupos.set(desempenho.chave, [...(grupos.get(desempenho.chave) ?? []), { moduloId: metrica.moduloId, quantidadeEvidencias: desempenho.quantidadeEvidencias, mediaNotas: desempenho.mediaNotas }]);
    for (const [chave, ocorrencias] of grupos) {
      const moduloIds = [...new Set(ocorrencias.map((ocorrencia) => ocorrencia.moduloId))].sort((a, b) => a.localeCompare(b));
      if (moduloIds.length < 2) continue;
      const quantidadeEvidencias = ocorrencias.reduce((soma, ocorrencia) => soma + ocorrencia.quantidadeEvidencias, 0);
      recorrencias.push({ tipo, chave: chave as FormatoConteudo | MetodoEstudo, quantidadeModulos: moduloIds.length, moduloIds, quantidadeEvidencias, mediaNotas: ocorrencias.reduce((soma, ocorrencia) => soma + ocorrencia.mediaNotas * ocorrencia.quantidadeEvidencias, 0) / quantidadeEvidencias, versaoAlgoritmo: VERSAO_ALGORITMO });
    }
  }
  return recorrencias.sort((a, b) => b.quantidadeModulos - a.quantidadeModulos || b.quantidadeEvidencias - a.quantidadeEvidencias || a.tipo.localeCompare(b.tipo) || a.chave.localeCompare(b.chave));
}

export function selecionarMetodoComMaiorMediaObservada(recorrencias: RecorrenciaContextual[]): MetodoComMaiorMediaObservada | null {
  const recorrencia = recorrencias
    .filter((item) => item.tipo === "METODO" && item.quantidadeModulos >= 2)
    .sort((a, b) => b.mediaNotas - a.mediaNotas || b.quantidadeEvidencias - a.quantidadeEvidencias || b.quantidadeModulos - a.quantidadeModulos || a.chave.localeCompare(b.chave))[0];
  if (!recorrencia) return null;
  return {
    chave: recorrencia.chave as MetodoEstudo,
    mediaNotas: recorrencia.mediaNotas,
    quantidadeEvidencias: recorrencia.quantidadeEvidencias,
    quantidadeModulos: recorrencia.quantidadeModulos,
    moduloIds: [...recorrencia.moduloIds],
    versaoAlgoritmo: recorrencia.versaoAlgoritmo,
  };
}
