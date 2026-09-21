import { formatarFormato } from "@/biblioteca/formatacao";
import type { MetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { gerarRespostaLocal } from "@/dominio/interpretacoes/resposta-local";
import { esquemaConteudoInterpretacao, montarInterpretacao, validarConteudoInterpretacao, type DtoInterpretacao, type TentativaProvedor } from "@/dominio/interpretacoes/esquema";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { EstadoConfiguracaoIa, FormatoConteudo, MetodoEstudo, ProvedorIa } from "@/gerado/prisma/enums";
import type { obterMetricasSessoesPessoais } from "@/servidor/metricas";
import { criarProvedorGemini } from "./gemini";
import { criarProvedorGroq } from "./groq";
import { ErroProvedorInterpretacao, type CodigoErroProvedor, type ProvedorInterpretacoes } from "./provedor-interpretacoes";
import { criarProvedorQwen } from "./qwen";

const LIMITE_POR_HORA = 5;
const JANELA_COTA_MS = 60 * 60 * 1_000;
const LIMITE_ENTRADA_CARACTERES = 50_000;

type SessaoParaDto = {
  id: string;
  moduloId: string;
  descricao: string;
  iniciadaEm: Date;
  encerradaEm: Date | null;
  duracaoMinutos: number | null;
  situacao: string;
  dificuldadePercebida: number | null;
  compreensaoPercebida: number | null;
  metodos: Array<{ metodo: MetodoEstudo }>;
  formatos: Array<{ formato: FormatoConteudo }>;
};

type CredencialFila = { provedor: ProvedorIa; modelo: string; chave: string };
type RegistrarEstado = (usuarioId: string, provedor: ProvedorIa, estado: EstadoConfiguracaoIa, bloqueadaAte?: Date | null) => Promise<void>;

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

export class ErroInterpretacaoSala extends Error {
  constructor() {
    super("NAO_ENCONTRADO");
  }
}

function sessaoValida(sessao: SessaoParaDto) {
  return sessao.situacao === "CONCLUIDA" && sessao.encerradaEm !== null && (sessao.duracaoMinutos ?? 0) >= 5;
}

function mapearResumoModulo(metricas: MetricasSessoes, referencia: string) {
  return {
    referencia,
    quantidadeSessoesValidas: metricas.tempoEstudo.quantidadeSessoesValidas,
    minutosValidos: metricas.tempoEstudo.minutosTotais,
    mediaMinutos: metricas.tempoEstudo.mediaMinutos,
    diasComEstudo: metricas.frequencia.diasComEstudo,
    maiorSequenciaDias: metricas.frequencia.maiorSequenciaDias,
    percepcoes: {
      amostra: metricas.percepcoes.amostra,
      dificuldadeMedia: metricas.percepcoes.mediaDificuldadePercebida,
      compreensaoMedia: metricas.percepcoes.mediaCompreensaoPercebida,
    },
    metodos: metricas.porMetodo.map((item) => ({ contexto: formatarMetodoEstudo(item.chave), quantidadeSessoes: item.quantidadeSessoes, minutosAssociados: item.minutosAssociados })),
    formatos: metricas.porFormato.map((item) => ({ contexto: formatarFormato(item.chave), quantidadeSessoes: item.quantidadeSessoes, minutosAssociados: item.minutosAssociados })),
  };
}

function mapearDescricoes(sessoes: SessaoParaDto[], referenciasModulos: Map<string, string>) {
  return sessoes.filter(sessaoValida).sort((a, b) => a.iniciadaEm.getTime() - b.iniciadaEm.getTime()).map((sessao, indice) => ({
    referencia: `${referenciasModulos.get(sessao.moduloId) ?? "Módulo"}, sessão ${indice + 1}`,
    descricao: `<descricoes_nao_confiaveis>${sessao.descricao}</descricoes_nao_confiaveis>`,
    iniciadaEm: sessao.iniciadaEm.toISOString(),
    duracaoMinutos: sessao.duracaoMinutos!,
    metodos: sessao.metodos.map((item) => formatarMetodoEstudo(item.metodo)),
    formatos: sessao.formatos.map((item) => formatarFormato(item.formato)),
    dificuldadePercebida: sessao.dificuldadePercebida,
    compreensaoPercebida: sessao.compreensaoPercebida,
  }));
}

export function criarDtoInterpretacaoModulo(metricas: MetricasSessoes, sessoes: SessaoParaDto[]): DtoInterpretacao {
  const referencia = new Map([[metricas.moduloId!, "Módulo 1"]]);
  return {
    escopo: "MODULO",
    versaoAlgoritmo: metricas.versaoAlgoritmo,
    quantidadeModulos: 1,
    quantidadeSessoesValidas: metricas.tempoEstudo.quantidadeSessoesValidas,
    minutosValidos: metricas.tempoEstudo.minutosTotais,
    periodo: { inicio: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null, fim: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    modulos: [mapearResumoModulo(metricas, "Módulo 1")],
    evolucaoSemanal: metricas.evolucaoSemanal.pontos.map((ponto) => ({ periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString(), quantidadeSessoes: ponto.quantidadeSessoes, minutosTotais: ponto.minutosTotais, diasComEstudo: ponto.diasComEstudo })),
    descricoesSessoes: mapearDescricoes(sessoes, referencia),
    limitacoes: metricas.limitacoes,
  };
}

export function criarDtoInterpretacaoPessoal(analises: Awaited<ReturnType<typeof obterMetricasSessoesPessoais>>, sessoes: SessaoParaDto[]): DtoInterpretacao {
  const referencias = new Map(analises.metricasPorModulo.map((item, indice) => [item.modulo.id, `Módulo ${indice + 1}`]));
  return {
    escopo: "PESSOAL",
    versaoAlgoritmo: analises.versaoAlgoritmo,
    quantidadeModulos: analises.metricasPorModulo.length,
    quantidadeSessoesValidas: analises.consolidado.tempoEstudo.quantidadeSessoesValidas,
    minutosValidos: analises.consolidado.tempoEstudo.minutosTotais,
    periodo: { inicio: analises.consolidado.frequencia.primeiraSessaoEm?.toISOString() ?? null, fim: analises.consolidado.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    modulos: analises.metricasPorModulo.map((item, indice) => mapearResumoModulo(item.metricas, `Módulo ${indice + 1}`)),
    evolucaoSemanal: analises.consolidado.evolucaoSemanal.pontos.map((ponto) => ({ periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString(), quantidadeSessoes: ponto.quantidadeSessoes, minutosTotais: ponto.minutosTotais, diasComEstudo: ponto.diasComEstudo })),
    descricoesSessoes: mapearDescricoes(sessoes, referencias),
    limitacoes: analises.consolidado.limitacoes,
  };
}

function criarProvedor(credencial: CredencialFila): ProvedorInterpretacoes {
  if (credencial.provedor === "GROQ") return criarProvedorGroq(credencial.chave, credencial.modelo);
  if (credencial.provedor === "GEMINI") return criarProvedorGemini(credencial.chave, credencial.modelo);
  return criarProvedorQwen(credencial.chave, credencial.modelo);
}

function estadoPersistido(codigo: CodigoErroProvedor) {
  if (codigo === "AUTENTICACAO") return "AUTENTICACAO_INVALIDA" as const;
  if (codigo === "COTA") return "LIMITADA" as const;
  return "INDISPONIVEL" as const;
}

function bloqueioParaErro(codigo: CodigoErroProvedor, agora: Date, aguardarSegundos?: number) {
  const segundos = codigo === "AUTENTICACAO" ? 86_400 : codigo === "COTA" ? (aguardarSegundos ?? 900) : codigo === "RESPOSTA_INVALIDA" ? 600 : 120;
  return new Date(agora.getTime() + segundos * 1_000);
}

export async function interpretarComFila(dto: DtoInterpretacao, credenciais: CredencialFila[], opcoes: {
  criar?: (credencial: CredencialFila) => ProvedorInterpretacoes;
  registrarEstado?: RegistrarEstado;
  usuarioId?: string;
  agora?: Date;
} = {}) {
  if (JSON.stringify(dto).length > LIMITE_ENTRADA_CARACTERES) return gerarRespostaLocal(dto, "ENTRADA_EXCEDIDA");
  if (!credenciais.length) return gerarRespostaLocal(dto, "SEM_CHAVE");
  const tentativas: TentativaProvedor[] = [];
  const agora = opcoes.agora ?? new Date();
  for (const credencial of credenciais) {
    const provedor = (opcoes.criar ?? criarProvedor)(credencial);
    try {
      const conteudo = validarConteudoInterpretacao(await provedor.interpretar(dto));
      if (!conteudo) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
      const modeloUtilizado = provedor.obterModeloUtilizado?.() ?? credencial.modelo;
      tentativas.push({ provedor: credencial.provedor, modelo: modeloUtilizado, resultado: "SUCESSO" });
      if (opcoes.usuarioId) {
        const registrar = opcoes.registrarEstado ?? (await import("./configuracoes")).registrarEstadoConfiguracaoIa;
        await registrar(opcoes.usuarioId, credencial.provedor, "FUNCIONANDO", null);
      }
      return montarInterpretacao(conteudo, credencial.provedor, dto, { modelo: modeloUtilizado, tentativas });
    } catch (erro) {
      const falha = erro instanceof ErroProvedorInterpretacao ? erro : new ErroProvedorInterpretacao("INDISPONIVEL");
      tentativas.push({ provedor: credencial.provedor, modelo: credencial.modelo, resultado: falha.codigo });
      if (opcoes.usuarioId) {
        const registrar = opcoes.registrarEstado ?? (await import("./configuracoes")).registrarEstadoConfiguracaoIa;
        await registrar(opcoes.usuarioId, credencial.provedor, estadoPersistido(falha.codigo), bloqueioParaErro(falha.codigo, agora, falha.aguardarSegundos));
      }
    }
  }
  const motivo = tentativas.every((tentativa) => tentativa.resultado === "RESPOSTA_INVALIDA") ? "RESPOSTA_INVALIDA" : "TODOS_INDISPONIVEIS";
  return gerarRespostaLocal(dto, motivo, tentativas);
}

async function sessoesValidasDaConta(usuarioId: string, moduloId?: string) {
  const { prisma } = await import("@/biblioteca/prisma");
  return prisma.sessaoEstudo.findMany({
    where: { usuarioId, ...(moduloId ? { moduloId } : {}), situacao: "CONCLUIDA", encerradaEm: { not: null }, duracaoMinutos: { gte: 5 }, modulo: { arquivado: false, rascunho: false } },
    select: { id: true, moduloId: true, descricao: true, iniciadaEm: true, encerradaEm: true, duracaoMinutos: true, situacao: true, dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } } },
    orderBy: [{ iniciadaEm: "asc" }, { id: "asc" }],
  });
}

export async function gerarInterpretacaoPessoal(usuarioId: string) {
  const [{ obterMetricasSessoesPessoais }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/metricas"), import("./configuracoes")]);
  const [analises, sessoes] = await Promise.all([obterMetricasSessoesPessoais(usuarioId), sessoesValidasDaConta(usuarioId)]);
  const dto = criarDtoInterpretacaoPessoal(analises, sessoes);
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  return interpretarComFila(dto, await listarCredenciaisAtivas(usuarioId), { usuarioId });
}

export async function gerarInterpretacaoModuloPessoal(usuarioId: string, identificadorModulo: string) {
  const [{ obterMetricasSessoesModuloPessoal }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/metricas"), import("./configuracoes")]);
  const resultado = await obterMetricasSessoesModuloPessoal(usuarioId, identificadorModulo);
  if (!resultado) throw new ErroInterpretacaoModulo();
  const sessoes = await sessoesValidasDaConta(usuarioId, resultado.modulo.id);
  const dto = criarDtoInterpretacaoModulo(resultado.metricas, sessoes);
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  return interpretarComFila(dto, await listarCredenciaisAtivas(usuarioId), { usuarioId });
}

export async function gerarInterpretacaoMembroSala(usuarioId: string, identificadorSala: string, vinculoId: string) {
  const [{ obterDashboardIndividualAutorizado }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/paineis-salas"), import("./configuracoes")]);
  const resultado = await obterDashboardIndividualAutorizado(usuarioId, identificadorSala, vinculoId);
  if (!resultado?.individual.permitirIa) throw new ErroInterpretacaoSala();
  const metricas = resultado.individual.metricas;
  const dto: DtoInterpretacao = {
    escopo: "MEMBRO_SALA",
    versaoAlgoritmo: metricas.versaoAlgoritmo,
    quantidadeModulos: 1,
    quantidadeSessoesValidas: metricas.tempoEstudo.quantidadeSessoesValidas,
    minutosValidos: metricas.tempoEstudo.minutosTotais,
    periodo: { inicio: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null, fim: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    modulos: [mapearResumoModulo(metricas, `${resultado.individual.nome} · ${resultado.modulo.titulo}`)],
    evolucaoSemanal: metricas.evolucaoSemanal.pontos.map((ponto) => ({ periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString(), quantidadeSessoes: ponto.quantidadeSessoes, minutosTotais: ponto.minutosTotais, diasComEstudo: ponto.diasComEstudo })),
    descricoesSessoes: [],
    limitacoes: [...metricas.limitacoes, "A interpretação usa somente métricas autorizadas do dashboard; materiais e descrições das sessões não foram enviados."],
  };
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  return interpretarComFila(dto, await listarCredenciaisAtivas(usuarioId), { usuarioId });
}

export async function testarProvedorConfigurado(usuarioId: string, credencial: CredencialFila) {
  const { registrarEstadoConfiguracaoIa } = await import("./configuracoes");
  const dtoTeste: DtoInterpretacao = {
    escopo: "MODULO", versaoAlgoritmo: "teste-conexao-v1", quantidadeModulos: 1, quantidadeSessoesValidas: 0, minutosValidos: 0,
    periodo: { inicio: null, fim: null }, modulos: [], evolucaoSemanal: [], descricoesSessoes: [],
    limitacoes: ["Teste técnico sem dados de estudo."],
  };
  try {
    const provedor = criarProvedor(credencial);
    if (provedor.testarConexao) {
      await provedor.testarConexao();
    } else {
      const estruturaValida = esquemaConteudoInterpretacao.safeParse(await provedor.interpretar(dtoTeste)).success;
      if (!estruturaValida) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
    }
    await registrarEstadoConfiguracaoIa(usuarioId, credencial.provedor, "FUNCIONANDO", null);
    return "FUNCIONANDO" as const;
  } catch (erro) {
    const falha = erro instanceof ErroProvedorInterpretacao ? erro : new ErroProvedorInterpretacao("INDISPONIVEL");
    console.warn("[IA] Teste de provedor falhou.", { provedor: credencial.provedor, codigo: falha.codigo });
    await registrarEstadoConfiguracaoIa(usuarioId, credencial.provedor, estadoPersistido(falha.codigo), bloqueioParaErro(falha.codigo, new Date(), falha.aguardarSegundos));
    return estadoPersistido(falha.codigo);
  }
}
