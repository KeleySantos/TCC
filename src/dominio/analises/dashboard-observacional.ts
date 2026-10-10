import { compararConceitosComSessoes, normalizarConceito } from "@/dominio/analises/analise-material";
import { calcularMetricasSessoes, classificarAmostraSessoes, sessaoValida, type SessaoParaMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { formatarMetodoEstudo, METODOS_ESTUDO } from "@/dominio/sessoes/metodos";
import { COMPREENSAO_MINIMA_MELHOR_RESULTADO, DESEMPENHO_MINIMO_MELHOR_RESULTADO, MINIMO_COMPREENSOES_PARA_DESTAQUE_CONTEXTO, MINIMO_EVIDENCIAS_PARA_ASSOCIACAO, type ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import type { MetodoEstudo } from "@/gerado/prisma/enums";

export const VERSAO_DASHBOARD_OBSERVACIONAL = "dashboard-observacional-v1";
export const MINIMO_SESSOES_METODO_DESTAQUE = 3;
export const MINIMO_SESSOES_FORMATO_DESTAQUE = 3;
export const MINIMO_MODULOS_CONSISTENCIA_CONFIAVEL = 2;
export const MINIMO_EVIDENCIAS_CONSISTENCIA_CONFIAVEL = 4;
const JANELA_RECENTE_DIAS = 90;

export type ModuloParaDashboard = { id: string; identificador: string; titulo: string };
export type MaterialParaDashboard = { id: string; moduloId: string; titulo: string; conceitos: string[]; data?: Date };

type ResultadoMetodoCandidato = {
  chave: MetodoEstudo;
  quantidadeSessoes: number;
  quantidadeCompreensoes: number;
  mediaCompreensaoPercebida: number | null;
  quantidadeModulos: number;
};

export type AnaliseAprendizagemParaDashboard = {
  moduloId?: string;
  metodosResultados: ResultadoContextoAprendizagem[];
  formatosResultados: ResultadoContextoAprendizagem[];
  resumoResultados: {
    duracaoSessoesComMelhorResultado: {
      mediaMinutos: number | null;
      quantidadeSessoes: number;
      compreensaoMinima: number;
      desempenhoMinimo: number;
    };
  };
};

function calcularConsistenciaMetodos(analises: AnaliseAprendizagemParaDashboard[]) {
  const grupos = new Map<string, Map<string, ResultadoContextoAprendizagem>>();
  analises.forEach((analise, indice) => {
    const moduloId = analise.moduloId ?? `modulo-${indice}`;
    for (const metodo of analise.metodosResultados) {
      const analisavel = metodo.compreensaoMedia !== null
        && metodo.desempenhoMedioPosterior !== null
        && metodo.quantidadeCompreensoes >= MINIMO_COMPREENSOES_PARA_DESTAQUE_CONTEXTO
        && metodo.quantidadeEvidenciasPosteriores >= MINIMO_EVIDENCIAS_PARA_ASSOCIACAO;
      if (!analisavel) continue;
      const modulos = grupos.get(metodo.chave) ?? new Map<string, ResultadoContextoAprendizagem>();
      modulos.set(moduloId, metodo);
      grupos.set(metodo.chave, modulos);
    }
  });
  return [...grupos.entries()].map(([chave, modulos]) => {
    const resultados = [...modulos.values()];
    const modulosPositivos = resultados.filter((item) => (item.compreensaoMedia ?? 0) >= COMPREENSAO_MINIMA_MELHOR_RESULTADO
      && (item.desempenhoMedioPosterior ?? 0) >= DESEMPENHO_MINIMO_MELHOR_RESULTADO).length;
    const modulosAnalisaveis = resultados.length;
    const quantidadeEvidencias = resultados.reduce((soma, item) => soma + item.quantidadeEvidenciasPosteriores, 0);
    return {
      chave,
      modulosPositivos,
      modulosAnalisaveis,
      quantidadeEvidencias,
      proporcaoConsistencia: modulosPositivos / modulosAnalisaveis,
      poucosDados: modulosAnalisaveis < MINIMO_MODULOS_CONSISTENCIA_CONFIAVEL || quantidadeEvidencias < MINIMO_EVIDENCIAS_CONSISTENCIA_CONFIAVEL,
    };
  }).sort((a, b) => b.proporcaoConsistencia - a.proporcaoConsistencia
    || b.modulosPositivos - a.modulosPositivos
    || b.quantidadeEvidencias - a.quantidadeEvidencias
    || a.chave.localeCompare(b.chave, "pt-BR"));
}

function consolidarResultadosContextuais<T extends string>(grupos: ResultadoContextoAprendizagem<T>[][]) {
  const acumulados = new Map<T, { quantidadeSessoes: number; quantidadeCompreensoes: number; somaCompreensao: number; quantidadeEvidencias: number; somaEvidencias: number }>();
  for (const grupo of grupos) for (const item of grupo) {
    const atual = acumulados.get(item.chave) ?? { quantidadeSessoes: 0, quantidadeCompreensoes: 0, somaCompreensao: 0, quantidadeEvidencias: 0, somaEvidencias: 0 };
    atual.quantidadeSessoes += item.quantidadeSessoes;
    atual.quantidadeCompreensoes += item.quantidadeCompreensoes;
    if (item.compreensaoMedia !== null) atual.somaCompreensao += item.compreensaoMedia * item.quantidadeCompreensoes;
    atual.quantidadeEvidencias += item.quantidadeEvidenciasPosteriores;
    if (item.desempenhoMedioPosterior !== null) atual.somaEvidencias += item.desempenhoMedioPosterior * item.quantidadeEvidenciasPosteriores;
    acumulados.set(item.chave, atual);
  }
  return [...acumulados.entries()].map(([chave, item]): ResultadoContextoAprendizagem<T> => ({
    chave,
    quantidadeSessoes: item.quantidadeSessoes,
    quantidadeCompreensoes: item.quantidadeCompreensoes,
    compreensaoMedia: item.quantidadeCompreensoes ? item.somaCompreensao / item.quantidadeCompreensoes : null,
    quantidadeEvidenciasPosteriores: item.quantidadeEvidencias,
    desempenhoMedioPosterior: item.quantidadeEvidencias ? item.somaEvidencias / item.quantidadeEvidencias : null,
    amostraEvidenciasSuficiente: item.quantidadeEvidencias >= MINIMO_EVIDENCIAS_PARA_ASSOCIACAO,
  })).sort((a, b) => (b.desempenhoMedioPosterior ?? -1) - (a.desempenhoMedioPosterior ?? -1) || b.quantidadeEvidenciasPosteriores - a.quantidadeEvidenciasPosteriores || a.chave.localeCompare(b.chave, "pt-BR"));
}

function selecionarFormatoMaiorCompreensao(itens: ResultadoContextoAprendizagem[]) {
  return [...itens].filter((item) => item.compreensaoMedia !== null && item.quantidadeCompreensoes >= MINIMO_SESSOES_FORMATO_DESTAQUE)
    .sort((a, b) => (b.compreensaoMedia ?? 0) - (a.compreensaoMedia ?? 0) || b.quantidadeCompreensoes - a.quantidadeCompreensoes || a.chave.localeCompare(b.chave, "pt-BR"))[0] ?? null;
}

function consolidarDuracaoMelhoresResultados(analises: AnaliseAprendizagemParaDashboard[]) {
  const resumos = analises.map((item) => item.resumoResultados.duracaoSessoesComMelhorResultado);
  const quantidadeSessoes = resumos.reduce((soma, item) => soma + item.quantidadeSessoes, 0);
  const referencia = resumos[0];
  return {
    mediaMinutos: quantidadeSessoes ? resumos.reduce((soma, item) => soma + (item.mediaMinutos ?? 0) * item.quantidadeSessoes, 0) / quantidadeSessoes : null,
    quantidadeSessoes,
    compreensaoMinima: referencia?.compreensaoMinima ?? 4,
    desempenhoMinimo: referencia?.desempenhoMinimo ?? 70,
  };
}

export function selecionarMetodoMaiorCompreensao<T extends ResultadoMetodoCandidato>(resultados: T[]): T | null {
  return resultados
    .filter((item) => item.quantidadeCompreensoes >= MINIMO_SESSOES_METODO_DESTAQUE && item.mediaCompreensaoPercebida !== null)
    .sort((a, b) => (b.mediaCompreensaoPercebida ?? 0) - (a.mediaCompreensaoPercebida ?? 0)
      || b.quantidadeCompreensoes - a.quantidadeCompreensoes
      || a.chave.localeCompare(b.chave, "pt-BR"))[0] ?? null;
}

export function calcularDashboardObservacional(
  modulos: ModuloParaDashboard[],
  sessoes: SessaoParaMetricasSessoes[],
  materiais: MaterialParaDashboard[],
  referencia: Date,
  inicioPeriodo: Date | null = null,
  analisesAprendizagem: AnaliseAprendizagemParaDashboard[] = [],
) {
  const fim = new Date(referencia);
  const inicio = inicioPeriodo ? new Date(inicioPeriodo) : new Date(fim.getTime() - JANELA_RECENTE_DIAS * 86_400_000);
  const idsModulos = new Set(modulos.map((modulo) => modulo.id));
  const validas = sessoes.filter(sessaoValida).filter((sessao) => idsModulos.has(sessao.moduloId) && sessao.encerradaEm <= fim && (inicioPeriodo === null || sessao.iniciadaEm >= inicio));
  const recentes = validas.filter((sessao) => sessao.encerradaEm >= inicio);
  const metricasRecentes = calcularMetricasSessoes(recentes);
  const metricasHistoricas = calcularMetricasSessoes(validas);

  const metodosRecentes = metricasRecentes.porMetodo.map((metodo) => ({
    ...metodo,
    quantidadeModulos: new Set(recentes.filter((sessao) => sessao.metodos.includes(metodo.chave)).map((sessao) => sessao.moduloId)).size,
  }));
  const resultadosMetodos = metricasHistoricas.porMetodo.map((metodo) => ({
    ...metodo,
    nivelAmostra: classificarAmostraSessoes(metodo.quantidadeCompreensoes),
    quantidadeModulos: new Set(validas.filter((sessao) => sessao.metodos.includes(metodo.chave)).map((sessao) => sessao.moduloId)).size,
  }));
  const metodoMaiorCompreensao = selecionarMetodoMaiorCompreensao(resultadosMetodos);
  const resultadosMetodosEvidencias = consolidarResultadosContextuais(analisesAprendizagem.map((item) => item.metodosResultados));
  const resultadosFormatosEvidencias = consolidarResultadosContextuais(analisesAprendizagem.map((item) => item.formatosResultados));
  const formatoMaiorCompreensao = selecionarFormatoMaiorCompreensao(resultadosFormatosEvidencias);
  const duracaoSessoesMelhoresResultados = consolidarDuracaoMelhoresResultados(analisesAprendizagem);
  const consistenciaMetodos = calcularConsistenciaMetodos(analisesAprendizagem);
  const coberturaMetodos = METODOS_ESTUDO.map(({ valor, rotulo }) => {
    const quantidadeSessoes = metricasHistoricas.porMetodo.find((item) => item.chave === valor)?.quantidadeSessoes ?? 0;
    return { metodo: valor, rotulo, quantidadeSessoes, nivelAmostra: classificarAmostraSessoes(quantidadeSessoes) };
  });
  const proximoExperimento = validas.length > 0 && modulos.length > 0
    ? coberturaMetodos.reduce((menor, item) => item.quantidadeSessoes < menor.quantidadeSessoes ? item : menor)
    : null;
  const pontoAtencao = modulos.map((modulo) => {
    const percepcoes = calcularMetricasSessoes(recentes, modulo.id).percepcoes;
    return { moduloId: modulo.id, tituloModulo: modulo.titulo, mediaDificuldadePercebida: percepcoes.mediaDificuldadePercebida, amostra: percepcoes.amostra };
  }).filter((item): item is typeof item & { mediaDificuldadePercebida: number } => item.mediaDificuldadePercebida !== null && item.mediaDificuldadePercebida >= 3)
    .sort((a, b) => b.mediaDificuldadePercebida - a.mediaDificuldadePercebida || b.amostra - a.amostra || a.tituloModulo.localeCompare(b.tituloModulo, "pt-BR"))[0] ?? null;
  const descobertasRecentes: Array<{ chave: string; titulo: string; descricao: string; amostra: number; periodoInicio: Date; periodoFim: Date }> = [];
  if (recentes.length >= 2) {
    const metodoFrequente = metodosRecentes.find((item) => item.quantidadeSessoes >= 2);
    if (metodoFrequente) descobertasRecentes.push({
      chave: "metodo-frequente", titulo: "Método recorrente",
      descricao: `${formatarMetodoEstudo(metodoFrequente.chave)} aparece em ${metodoFrequente.quantidadeSessoes} de ${recentes.length} sessões recentes. O registro não mede o resultado desse método.`,
      amostra: recentes.length, periodoInicio: inicio, periodoFim: fim,
    });
    const multiplos = recentes.filter((sessao) => new Set(sessao.metodos).size > 1).length;
    if (multiplos) descobertasRecentes.push({
      chave: "metodos-simultaneos", titulo: "Métodos combinados",
      descricao: `${multiplos} de ${recentes.length} sessões recentes registraram mais de um método; não é possível atribuir a experiência a um deles isoladamente.`,
      amostra: recentes.length, periodoInicio: inicio, periodoFim: fim,
    });
    if (metricasRecentes.percepcoes.mediaCompreensaoPercebida !== null) descobertasRecentes.push({
      chave: "compreensao-percebida", titulo: "Compreensão percebida",
      descricao: `A compreensão informada foi, em média, ${metricasRecentes.percepcoes.mediaCompreensaoPercebida.toFixed(1).replace(".", ",")}/5 em ${metricasRecentes.percepcoes.amostra} sessões recentes. Trata-se de autorrelato.`,
      amostra: metricasRecentes.percepcoes.amostra, periodoInicio: inicio, periodoFim: fim,
    });
    if (metodosRecentes.length >= 2) descobertasRecentes.push({
      chave: "variedade-metodos", titulo: "Variedade registrada",
      descricao: `${metodosRecentes.length} métodos diferentes apareceram nas ${recentes.length} sessões recentes, inclusive em sessões com métodos simultâneos.`,
      amostra: recentes.length, periodoInicio: inicio, periodoFim: fim,
    });
  }

  const sessoesPorModulo = new Map<string, typeof validas>();
  for (const sessao of validas) {
    const grupo = sessoesPorModulo.get(sessao.moduloId) ?? [];
    grupo.push(sessao);
    sessoesPorModulo.set(sessao.moduloId, grupo);
  }
  const grupos = new Map<string, {
    chave: string;
    nome: string;
    materiais: Array<{ id: string; moduloId: string; titulo: string }>;
    modulos: Set<string>;
  }>();
  for (const material of materiais) {
    if (!idsModulos.has(material.moduloId)) continue;
    if (inicioPeriodo !== null && (!material.data || material.data < inicio || material.data > fim)) continue;
    for (const nome of material.conceitos) {
      const chave = normalizarConceito(nome);
      if (!chave) continue;
      const grupo = grupos.get(chave) ?? { chave, nome, materiais: [], modulos: new Set<string>() };
      if (!grupo.materiais.some((item) => item.id === material.id)) grupo.materiais.push({ id: material.id, moduloId: material.moduloId, titulo: material.titulo });
      grupo.modulos.add(material.moduloId);
      grupos.set(chave, grupo);
    }
  }
  const conceitos = [...grupos.values()].map((grupo) => {
    const sessoesRelacionadas = new Map<string, { id: string; moduloId: string; encerradaEm: Date; metodos: MetodoEstudo[] }>();
    for (const moduloId of grupo.modulos) {
      const candidatas = sessoesPorModulo.get(moduloId) ?? [];
      const ids = new Set(compararConceitosComSessoes([grupo.chave], candidatas).at(0)?.sessoes ?? []);
      for (const sessao of candidatas) if (ids.has(sessao.id)) sessoesRelacionadas.set(sessao.id, {
        id: sessao.id, moduloId, encerradaEm: sessao.encerradaEm, metodos: [...new Set(sessao.metodos)],
      });
    }
    return {
      chave: grupo.chave,
      nome: grupo.nome,
      quantidadeMateriais: grupo.materiais.length,
      quantidadeSessoesMencionadas: sessoesRelacionadas.size,
      materiais: grupo.materiais,
      sessoesMencionadas: [...sessoesRelacionadas.values()].sort((a, b) => b.encerradaEm.getTime() - a.encerradaEm.getTime() || a.id.localeCompare(b.id)),
    };
  }).sort((a, b) => b.quantidadeSessoesMencionadas - a.quantidadeSessoesMencionadas || b.quantidadeMateriais - a.quantidadeMateriais || a.chave.localeCompare(b.chave, "pt-BR"));

  return {
    versaoAlgoritmo: VERSAO_DASHBOARD_OBSERVACIONAL,
    periodoFiltrado: inicioPeriodo !== null,
    modulos,
    periodoRecente: { inicio, fim, quantidadeSessoes: recentes.length, nivelAmostra: classificarAmostraSessoes(recentes.length) },
    baseHistorica: {
      primeiraSessaoEm: metricasHistoricas.frequencia.primeiraSessaoEm,
      ultimaSessaoEm: metricasHistoricas.frequencia.ultimaSessaoEm,
      quantidadeSessoes: validas.length,
      quantidadeModulosComSessoes: sessoesPorModulo.size,
      quantidadeMetodosRegistrados: metricasHistoricas.porMetodo.length,
      quantidadeMateriaisAnalisados: new Set(conceitos.flatMap((conceito) => conceito.materiais.map((material) => material.id))).size,
    },
    metodosRecentes,
    resultadosMetodos,
    resultadosMetodosEvidencias,
    resultadosFormatosEvidencias,
    metodoMaiorCompreensao,
    formatoMaiorCompreensao,
    duracaoSessoesMelhoresResultados,
    consistenciaMetodos,
    coberturaMetodos,
    pontoAtencao,
    proximoExperimento,
    descobertasRecentes: descobertasRecentes.slice(0, 4),
    metricasSecundarias: {
      minutosTotais: metricasHistoricas.tempoEstudo.minutosTotais,
      quantidadeSessoes: validas.length,
      diasComEstudo: metricasHistoricas.frequencia.diasComEstudo,
      mediaMinutos: metricasHistoricas.tempoEstudo.mediaMinutos,
    },
    percepcoesRecentes: metricasRecentes.percepcoes,
    evolucaoPercepcoes: metricasRecentes.evolucaoSemanal.pontos.map((ponto) => ({
      periodoInicio: ponto.periodoInicio, periodoFim: ponto.periodoFim,
      quantidadeSessoes: ponto.quantidadeSessoes, quantidadePercepcoes: ponto.quantidadePercepcoes,
      mediaDificuldadePercebida: ponto.mediaDificuldadePercebida,
      mediaCompreensaoPercebida: ponto.mediaCompreensaoPercebida,
    })),
    conceitos,
    estados: {
      semSessoesRecentes: recentes.length === 0,
      percepcaoRecenteInsuficiente: metricasRecentes.percepcoes.mediaCompreensaoPercebida === null,
      semConceitosAnalisados: conceitos.length === 0,
    },
    limitacoes: [
      "Duração, métodos e percepções descrevem contextos; evidências confirmadas registram desempenho posterior, sem demonstrar eficácia ou causalidade.",
      "Métodos simultâneos são contextos não exclusivos; os percentuais de uso podem somar mais de 100%.",
      "Conceitos extraídos de arquivos e mencionados em sessões não demonstram domínio ou dificuldade.",
      "No resultado por método, o nível da amostra informa a quantidade de compreensões preenchidas; nos demais indicadores, informa a quantidade de sessões. Nenhum nível representa significância estatística.",
      "As evidências posteriores são associadas por vínculo explícito ou por conceito comum no mesmo módulo e em até 30 dias; a relação não demonstra causalidade.",
    ],
  };
}

export type DashboardObservacional = ReturnType<typeof calcularDashboardObservacional>;
