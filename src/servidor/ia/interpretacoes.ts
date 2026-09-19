import { gerarRespostaLocal } from "@/dominio/interpretacoes/resposta-local";
import { montarInterpretacao, validarConteudoInterpretacao, type DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import type { MetricasModulo } from "@/dominio/analises/metricas-modulo";
import type { obterMetricasPessoais } from "@/servidor/metricas";
import { criarProvedorGemini } from "./gemini";
import { ErroProvedorInterpretacao, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

const LIMITE_POR_HORA = 5;
const JANELA_COTA_MS = 60 * 60 * 1_000;

export class ControleCotaInterpretacoes {
  private readonly usos = new Map<string, number[]>();

  consumir(usuarioId: string, agora = Date.now()) {
    const recentes = (this.usos.get(usuarioId) ?? []).filter((instante) => agora - instante < JANELA_COTA_MS);
    if (recentes.length >= LIMITE_POR_HORA) return false;
    recentes.push(agora);
    this.usos.set(usuarioId, recentes);
    return true;
  }
}

const controleCotaPadrao = new ControleCotaInterpretacoes();

export class ErroInterpretacaoModulo extends Error {
  constructor() {
    super("NAO_ENCONTRADO");
  }
}

export function criarDtoInterpretacao(analises: Awaited<ReturnType<typeof obterMetricasPessoais>>): DtoInterpretacao {
  return {
    escopo: "PESSOAL",
    versaoAlgoritmo: analises.metricasPorModulo[0]?.metricas.versaoAlgoritmo ?? "metricas-oficiais-v2",
    quantidadeModulos: analises.metricasPorModulo.length,
    quantidadeTentativas: analises.metricasPorModulo.reduce((soma, item) => soma + item.metricas.quantidadeTentativas, 0),
    minutosValidos: analises.metricasPorModulo.reduce((soma, item) => soma + item.metricas.tempoEstudo.minutosTotais, 0),
    periodo: { inicio: analises.frequencia.primeiraSessaoEm?.toISOString() ?? null, fim: analises.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    modulos: analises.metricasPorModulo.map((item, indice) => ({
      referencia: `Módulo ${indice + 1}`,
      quantidadeTentativas: item.metricas.quantidadeTentativas,
      taxaAcerto: item.metricas.taxaAcerto,
      mediaNotas: item.metricas.mediaNotas,
      minutosValidos: item.metricas.tempoEstudo.minutosTotais,
      exposicoesMistas: item.metricas.quantidadeExposicoesMistas,
      observacoesPercepcao: item.metricas.percepcaoVersusResultado.amostra,
    })),
    recorrencias: analises.recorrencias.map((item) => ({ tipo: item.tipo, contexto: item.chave, quantidadeModulos: item.quantidadeModulos, quantidadeEvidencias: item.quantidadeEvidencias, mediaNotas: item.mediaNotas })),
    quantidadeTopicosComEvidencia: analises.metricasPorModulo.reduce((soma, item) => soma + item.metricas.metricasPorTopico.filter((topico) => topico.totalQuestoes > 0).length, 0),
    evolucaoTaxaMediaTopicos: [],
    dificuldadeAtualEstimada: null,
    limitacoes: ["Métricas descrevem registros observados e não comprovam causalidade.", "Exposições mistas não são atribuídas a formato ou método.", "Ausência ou amostra pequena não deve ser interpretada como resultado zero."],
  };
}

export function criarDtoInterpretacaoModulo(metricas: MetricasModulo): DtoInterpretacao {
  const pontos = metricas.evolucaoTaxaMediaTopicos.pontos;
  const periodoInicio = pontos[0]?.periodoInicio ?? metricas.frequencia.primeiraSessaoEm;
  const periodoFim = pontos.at(-1)?.periodoFim ?? metricas.frequencia.ultimaSessaoEm;
  return {
    escopo: "MODULO",
    versaoAlgoritmo: metricas.versaoAlgoritmo,
    quantidadeModulos: 1,
    quantidadeTentativas: metricas.quantidadeTentativas,
    minutosValidos: metricas.tempoEstudo.minutosTotais,
    periodo: { inicio: periodoInicio?.toISOString() ?? null, fim: periodoFim?.toISOString() ?? null },
    modulos: [{
      referencia: "Módulo 1",
      quantidadeTentativas: metricas.quantidadeTentativas,
      taxaAcerto: metricas.taxaAcerto,
      mediaNotas: metricas.mediaNotas,
      minutosValidos: metricas.tempoEstudo.minutosTotais,
      exposicoesMistas: metricas.quantidadeExposicoesMistas,
      observacoesPercepcao: metricas.percepcaoVersusResultado.amostra,
    }],
    recorrencias: [],
    quantidadeTopicosComEvidencia: new Set(pontos.flatMap((ponto) => ponto.topicos.map((topico) => topico.topicoId))).size,
    evolucaoTaxaMediaTopicos: pontos.map((ponto) => ({
      periodoInicio: ponto.periodoInicio.toISOString(),
      periodoFim: ponto.periodoFim.toISOString(),
      mediaTaxasAcertoTopicos: ponto.mediaTaxasAcertoTopicos!,
      quantidadeTopicosComEvidencia: ponto.quantidadeTopicosComEvidencia,
      quantidadeTentativas: ponto.quantidadeTentativas,
      respostasCorretas: ponto.respostasCorretas,
      totalQuestoes: ponto.totalQuestoes,
    })),
    dificuldadeAtualEstimada: {
      status: metricas.dificuldadeAtualEstimada.status,
      taxaReferencia: metricas.dificuldadeAtualEstimada.taxaReferencia,
      quantidadePeriodos: metricas.dificuldadeAtualEstimada.quantidadePeriodos,
      amostraReduzida: metricas.dificuldadeAtualEstimada.amostraReduzida,
    },
    limitacoes: ["Métricas descrevem registros observados e não comprovam causalidade.", "A dificuldade atual é estimada por períodos com evidência e não é diagnóstico.", "Ausência ou amostra pequena não deve ser interpretada como resultado zero."],
  };
}

export async function interpretarDto(dto: DtoInterpretacao, opcoes: { apiKey?: string; provedor?: ProvedorInterpretacoes } = {}) {
  if (!opcoes.apiKey) return gerarRespostaLocal(dto, "SEM_CHAVE");
  try {
    const conteudo = validarConteudoInterpretacao(await (opcoes.provedor ?? criarProvedorGemini(opcoes.apiKey)).interpretar(dto));
    return conteudo ? montarInterpretacao(conteudo, "GEMINI", dto, null) : gerarRespostaLocal(dto, "RESPOSTA_INVALIDA");
  } catch (erro) {
    if (erro instanceof ErroProvedorInterpretacao) return gerarRespostaLocal(dto, erro.codigo);
    return gerarRespostaLocal(dto, "FALHA_EXTERNA");
  }
}

export async function gerarInterpretacaoPessoal(usuarioId: string) {
  const { obterMetricasPessoais } = await import("@/servidor/metricas");
  const analises = await obterMetricasPessoais(usuarioId);
  const dto = criarDtoInterpretacao(analises);
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA");
  return interpretarDto(dto, { apiKey: process.env.GEMINI_API_KEY });
}

export async function gerarInterpretacaoModuloPessoal(usuarioId: string, identificadorModulo: string) {
  const { obterMetricasModuloPessoal } = await import("@/servidor/metricas");
  const metricas = await obterMetricasModuloPessoal(usuarioId, identificadorModulo);
  if (!metricas) throw new ErroInterpretacaoModulo();
  const dto = criarDtoInterpretacaoModulo(metricas);
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA");
  return interpretarDto(dto, { apiKey: process.env.GEMINI_API_KEY });
}
