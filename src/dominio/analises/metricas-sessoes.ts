import type { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";

export const VERSAO_METRICAS_SESSOES = "metricas-sessoes-v1";
export const MINIMO_SESSOES_PARA_MEDIA_PERCEPCAO = 2;

export type SessaoParaMetricasSessoes = {
  id: string;
  moduloId: string;
  descricao: string;
  iniciadaEm: Date;
  encerradaEm: Date | null;
  duracaoMinutos: number | null;
  situacao: SituacaoSessao;
  arquivada: boolean;
  dificuldadePercebida: number | null;
  compreensaoPercebida: number | null;
  metodos: MetodoEstudo[];
  formatos: FormatoConteudo[];
};

export type NivelAmostraSessao = "AUSENTE" | "INSUFICIENTE" | "INICIAL" | "RECORRENTE";

export type ResumoContextualSessao<T extends string> = {
  chave: T;
  quantidadeSessoes: number;
  minutosAssociados: number;
  percentualSessoes: number;
  nivelAmostra: NivelAmostraSessao;
};

export type PontoEvolucaoSessoes = {
  periodoInicio: Date;
  periodoFim: Date;
  quantidadeSessoes: number;
  minutosTotais: number;
  mediaMinutos: number;
  diasComEstudo: number;
  quantidadePercepcoes: number;
  mediaDificuldadePercebida: number | null;
  mediaCompreensaoPercebida: number | null;
  metodos: Array<{ chave: MetodoEstudo; quantidadeSessoes: number }>;
  formatos: Array<{ chave: FormatoConteudo; quantidadeSessoes: number }>;
};

export type MetricasSessoes = {
  moduloId: string | null;
  versaoAlgoritmo: string;
  tempoEstudo: {
    quantidadeSessoesValidas: number;
    minutosTotais: number;
    mediaMinutos: number | null;
  };
  frequencia: {
    diasComEstudo: number;
    maiorSequenciaDias: number;
    primeiraSessaoEm: Date | null;
    ultimaSessaoEm: Date | null;
  };
  percepcoes: {
    amostra: number;
    mediaDificuldadePercebida: number | null;
    mediaCompreensaoPercebida: number | null;
    nivelAmostra: NivelAmostraSessao;
  };
  porMetodo: ResumoContextualSessao<MetodoEstudo>[];
  porFormato: ResumoContextualSessao<FormatoConteudo>[];
  evolucaoSemanal: {
    periodicidade: "SEMANAL_UTC";
    pontos: PontoEvolucaoSessoes[];
  };
  criterios: {
    situacoesIncluidas: ["CONCLUIDA"];
    planejadasExcluidas: true;
    ativasExcluidas: true;
    invalidadasExcluidas: true;
    arquivadasIncluidas: true;
    contextosMultiplosNaoExclusivos: true;
    minimoPercepcoesParaMedia: number;
  };
  limitacoes: string[];
};

function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null;
}

export function classificarAmostraSessoes(quantidade: number): NivelAmostraSessao {
  if (quantidade === 0) return "AUSENTE";
  if (quantidade === 1) return "INSUFICIENTE";
  if (quantidade < 5) return "INICIAL";
  return "RECORRENTE";
}

function sessaoValida(sessao: SessaoParaMetricasSessoes): sessao is SessaoParaMetricasSessoes & { encerradaEm: Date; duracaoMinutos: number } {
  return sessao.situacao === "CONCLUIDA"
    && sessao.encerradaEm !== null
    && Number.isInteger(sessao.duracaoMinutos)
    && (sessao.duracaoMinutos ?? 0) >= 5;
}

function inicioSemanaUtc(data: Date) {
  const inicio = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
  return inicio;
}

function calcularFrequencia(sessoes: Array<SessaoParaMetricasSessoes & { encerradaEm: Date; duracaoMinutos: number }>) {
  const datas = sessoes.map((sessao) => sessao.encerradaEm).sort((a, b) => a.getTime() - b.getTime());
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

function agruparContextos<T extends string>(
  sessoes: Array<SessaoParaMetricasSessoes & { encerradaEm: Date; duracaoMinutos: number }>,
  selecionar: (sessao: SessaoParaMetricasSessoes) => T[],
): ResumoContextualSessao<T>[] {
  const grupos = new Map<T, { ids: Set<string>; minutos: number }>();
  for (const sessao of sessoes) {
    for (const chave of new Set(selecionar(sessao))) {
      const grupo = grupos.get(chave) ?? { ids: new Set<string>(), minutos: 0 };
      grupo.ids.add(sessao.id);
      grupo.minutos += sessao.duracaoMinutos;
      grupos.set(chave, grupo);
    }
  }
  return [...grupos.entries()].map(([chave, grupo]) => ({
    chave,
    quantidadeSessoes: grupo.ids.size,
    minutosAssociados: grupo.minutos,
    percentualSessoes: sessoes.length ? grupo.ids.size / sessoes.length : 0,
    nivelAmostra: classificarAmostraSessoes(grupo.ids.size),
  })).sort((a, b) => b.quantidadeSessoes - a.quantidadeSessoes || b.minutosAssociados - a.minutosAssociados || a.chave.localeCompare(b.chave));
}

function contagensContextuais<T extends string>(sessoes: SessaoParaMetricasSessoes[], selecionar: (sessao: SessaoParaMetricasSessoes) => T[]) {
  const grupos = new Map<T, Set<string>>();
  for (const sessao of sessoes) for (const chave of new Set(selecionar(sessao))) grupos.set(chave, new Set([...(grupos.get(chave) ?? []), sessao.id]));
  return [...grupos.entries()].map(([chave, ids]) => ({ chave, quantidadeSessoes: ids.size })).sort((a, b) => b.quantidadeSessoes - a.quantidadeSessoes || a.chave.localeCompare(b.chave));
}

function calcularEvolucaoSemanal(sessoes: Array<SessaoParaMetricasSessoes & { encerradaEm: Date; duracaoMinutos: number }>): PontoEvolucaoSessoes[] {
  const periodos = new Map<string, typeof sessoes>();
  for (const sessao of sessoes) {
    const chave = inicioSemanaUtc(sessao.encerradaEm).toISOString();
    periodos.set(chave, [...(periodos.get(chave) ?? []), sessao]);
  }
  return [...periodos.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([chave, itens]) => {
    const periodoInicio = new Date(chave);
    const minutosTotais = itens.reduce((soma, sessao) => soma + sessao.duracaoMinutos, 0);
    const percepcoes = itens.filter((sessao): sessao is typeof sessao & { dificuldadePercebida: number; compreensaoPercebida: number } => sessao.dificuldadePercebida !== null && sessao.compreensaoPercebida !== null);
    const publicarPercepcoes = percepcoes.length >= MINIMO_SESSOES_PARA_MEDIA_PERCEPCAO;
    return {
      periodoInicio,
      periodoFim: new Date(periodoInicio.getTime() + 7 * 86_400_000 - 1),
      quantidadeSessoes: itens.length,
      minutosTotais,
      mediaMinutos: minutosTotais / itens.length,
      diasComEstudo: new Set(itens.map((sessao) => sessao.encerradaEm.toISOString().slice(0, 10))).size,
      quantidadePercepcoes: percepcoes.length,
      mediaDificuldadePercebida: publicarPercepcoes ? media(percepcoes.map((sessao) => sessao.dificuldadePercebida)) : null,
      mediaCompreensaoPercebida: publicarPercepcoes ? media(percepcoes.map((sessao) => sessao.compreensaoPercebida)) : null,
      metodos: contagensContextuais(itens, (sessao) => sessao.metodos),
      formatos: contagensContextuais(itens, (sessao) => sessao.formatos),
    };
  });
}

export function calcularMetricasSessoes(sessoes: SessaoParaMetricasSessoes[], moduloId: string | null = null): MetricasSessoes {
  const validas = sessoes
    .filter((sessao) => moduloId === null || sessao.moduloId === moduloId)
    .filter(sessaoValida)
    .sort((a, b) => a.encerradaEm.getTime() - b.encerradaEm.getTime() || a.id.localeCompare(b.id));
  const minutosTotais = validas.reduce((soma, sessao) => soma + sessao.duracaoMinutos, 0);
  const percepcoes = validas.filter((sessao): sessao is typeof sessao & { dificuldadePercebida: number; compreensaoPercebida: number } => sessao.dificuldadePercebida !== null && sessao.compreensaoPercebida !== null);
  const publicarPercepcoes = percepcoes.length >= MINIMO_SESSOES_PARA_MEDIA_PERCEPCAO;
  return {
    moduloId,
    versaoAlgoritmo: VERSAO_METRICAS_SESSOES,
    tempoEstudo: { quantidadeSessoesValidas: validas.length, minutosTotais, mediaMinutos: validas.length ? minutosTotais / validas.length : null },
    frequencia: calcularFrequencia(validas),
    percepcoes: {
      amostra: percepcoes.length,
      mediaDificuldadePercebida: publicarPercepcoes ? media(percepcoes.map((sessao) => sessao.dificuldadePercebida)) : null,
      mediaCompreensaoPercebida: publicarPercepcoes ? media(percepcoes.map((sessao) => sessao.compreensaoPercebida)) : null,
      nivelAmostra: classificarAmostraSessoes(percepcoes.length),
    },
    porMetodo: agruparContextos(validas, (sessao) => sessao.metodos),
    porFormato: agruparContextos(validas, (sessao) => sessao.formatos),
    evolucaoSemanal: { periodicidade: "SEMANAL_UTC", pontos: calcularEvolucaoSemanal(validas) },
    criterios: {
      situacoesIncluidas: ["CONCLUIDA"],
      planejadasExcluidas: true,
      ativasExcluidas: true,
      invalidadasExcluidas: true,
      arquivadasIncluidas: true,
      contextosMultiplosNaoExclusivos: true,
      minimoPercepcoesParaMedia: MINIMO_SESSOES_PARA_MEDIA_PERCEPCAO,
    },
    limitacoes: [
      "As métricas são descritivas e não demonstram causalidade.",
      "Métodos e formatos múltiplos são contextos não exclusivos; seus percentuais podem somar mais de 100%.",
      "Sessões planejadas, ativas e invalidadas não entram nos resultados.",
      "Sessões arquivadas permanecem incluídas para preservar o histórico estudado.",
    ],
  };
}
