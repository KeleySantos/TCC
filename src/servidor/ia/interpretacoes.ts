import { evidenciaValida } from "@/dominio/analises/aprendizagem-modulo";
import { formatarFormato } from "@/biblioteca/formatacao";
import type { MetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { gerarRespostaLocal } from "@/dominio/interpretacoes/resposta-local";
import { montarInterpretacao, validarConteudoInterpretacao, type DtoInterpretacao, type TentativaProvedor } from "@/dominio/interpretacoes/esquema";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { EstadoConfiguracaoIa, FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import type { obterMetricasSessoesPessoais } from "@/servidor/metricas";
import type { obterAprendizagemModuloPessoal } from "@/servidor/aprendizagem-modulo";
import type { ProvedorIaAtivo } from "./catalogo-provedores";
import { criarProvedorGroq } from "./groq";
import { ErroProvedorInterpretacao, type CodigoErroProvedor, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

const LIMITE_POR_HORA = 5;
const JANELA_COTA_MS = 60 * 60 * 1_000;
const LIMITE_ENTRADA_CARACTERES = 50_000;
const LIMITE_DESCRICOES_PROVEDOR = 10;
const LIMITE_CARACTERES_DESCRICAO = 360;

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

type CredencialFila = { provedor: ProvedorIaAtivo; modelo: string; chave: string };
type RegistrarEstado = (usuarioId: string, provedor: ProvedorIaAtivo, estado: EstadoConfiguracaoIa, bloqueadaAte?: Date | null) => Promise<void>;

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

/** Executa um DTO já autorizado, sem assumir a identidade do proprietário dos dados. */
export async function interpretarDtoAutorizado(solicitanteId: string, dto: DtoInterpretacao) {
  if (dto.quantidadeSessoesValidas === 0) return gerarRespostaLocal(dto, "DADOS_INSUFICIENTES");
  if (!controleCotaPadrao.consumir(solicitanteId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  try {
    const { listarCredenciaisAtivas } = await import("./configuracoes");
    return await interpretarComFila(dto, await listarCredenciaisAtivas(), { usuarioId: solicitanteId });
  } catch {
    return gerarRespostaLocal(dto, "TODOS_INDISPONIVEIS");
  }
}

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
    metodos: metricas.porMetodo.map((item) => ({ contexto: formatarMetodoEstudo(item.chave), quantidadeSessoes: item.quantidadeSessoes, quantidadeCompreensoes: item.quantidadeCompreensoes, compreensaoMedia: item.mediaCompreensaoPercebida, minutosAssociados: item.minutosAssociados, nivelAmostra: item.nivelAmostra })),
    formatos: metricas.porFormato.map((item) => ({ contexto: formatarFormato(item.chave), quantidadeSessoes: item.quantidadeSessoes, quantidadeCompreensoes: item.quantidadeCompreensoes, compreensaoMedia: item.mediaCompreensaoPercebida, minutosAssociados: item.minutosAssociados, nivelAmostra: item.nivelAmostra })),
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

type AprendizagemModuloParaDto = NonNullable<Awaited<ReturnType<typeof obterAprendizagemModuloPessoal>>>;

function mapearAprendizagemModulo(aprendizagem: AprendizagemModuloParaDto): NonNullable<DtoInterpretacao["aprendizagemModulo"]> {
  return {
    base: {
      sessoes: aprendizagem.base.sessoes,
      evidenciasValidas: aprendizagem.base.evidenciasValidas,
      conceitos: aprendizagem.base.conceitos,
    },
    conceitos: aprendizagem.analises.conceitos.map((conceito) => ({
      conceito: conceito.nome,
      sessoes: conceito.sessoes,
      evidencias: conceito.evidencias,
      compreensaoMedia: conceito.compreensaoMedia,
      desempenhoMedio: conceito.desempenhoMedio,
      relacaoPercepcaoEvidencia: conceito.estadoPercepcaoEvidencia,
      tendencia: conceito.tendencia,
    })),
    associacoes: [
      ...aprendizagem.analises.metodosResultados.map((item) => ({ tipo: "METODO" as const, contexto: item.chave, sessoes: item.quantidadeSessoes, compreensoes: item.quantidadeCompreensoes, compreensaoMedia: item.compreensaoMedia, evidenciasPosteriores: item.quantidadeEvidenciasPosteriores, desempenhoMedioPosterior: item.desempenhoMedioPosterior, amostraSuficiente: item.amostraEvidenciasSuficiente })),
      ...aprendizagem.analises.formatosResultados.map((item) => ({ tipo: "FORMATO" as const, contexto: item.chave, sessoes: item.quantidadeSessoes, compreensoes: item.quantidadeCompreensoes, compreensaoMedia: item.compreensaoMedia, evidenciasPosteriores: item.quantidadeEvidenciasPosteriores, desempenhoMedioPosterior: item.desempenhoMedioPosterior, amostraSuficiente: item.amostraEvidenciasSuficiente })),
    ],
    padroesObjetivos: aprendizagem.analises.padroes,
    eventosRecentes: aprendizagem.linhaDoTempo
      .filter((evento) => !aprendizagem.evidencias.some((evidencia) => evidencia.id === evento.id) || aprendizagem.evidencias.some((evidencia) => evidencia.id === evento.id && evidenciaValida(evidencia)))
      .slice(0, 20)
      .map((evento) => ({ tipo: evento.tipo, data: evento.data.toISOString(), titulo: evento.titulo, conceitos: evento.conceitos })),
    evolucaoPercepcaoEvidencia: aprendizagem.analises.evolucaoPercepcaoEvidencia.map((item) => ({ periodoInicio: item.periodoInicio.toISOString(), quantidadePercepcoes: item.quantidadePercepcoes, compreensaoMedia: item.mediaCompreensaoPercebida, quantidadeEvidencias: item.quantidadeEvidencias, desempenhoMedio: item.desempenhoMedioEvidencias })),
  };
}

export function criarDtoInterpretacaoModulo(metricas: MetricasSessoes, sessoes: SessaoParaDto[], aprendizagem?: AprendizagemModuloParaDto | null): DtoInterpretacao {
  const referencia = new Map([[metricas.moduloId!, "Módulo 1"]]);
  return {
    escopo: "MODULO",
    versaoAlgoritmo: metricas.versaoAlgoritmo,
    quantidadeModulos: 1,
    quantidadeSessoesValidas: metricas.tempoEstudo.quantidadeSessoesValidas,
    minutosValidos: metricas.tempoEstudo.minutosTotais,
    periodo: { inicio: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null, fim: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    modulos: [mapearResumoModulo(metricas, "Módulo 1")],
    evolucaoSemanal: metricas.evolucaoSemanal.pontos.map((ponto) => ({ periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString(), quantidadeSessoes: ponto.quantidadeSessoes, minutosTotais: ponto.minutosTotais, diasComEstudo: ponto.diasComEstudo, quantidadePercepcoes: ponto.quantidadePercepcoes, dificuldadeMedia: ponto.mediaDificuldadePercebida, compreensaoMedia: ponto.mediaCompreensaoPercebida })),
    descricoesSessoes: mapearDescricoes(sessoes, referencia),
    ...(aprendizagem ? { aprendizagemModulo: mapearAprendizagemModulo(aprendizagem), recomendacoes: aprendizagem.recomendacoes } : {}),
    limitacoes: [...metricas.limitacoes, "Evidências extraídas automaticamente participam quando têm desempenho válido; associações temporais não comprovam causalidade."],
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
    evolucaoSemanal: analises.consolidado.evolucaoSemanal.pontos.map((ponto) => ({ periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString(), quantidadeSessoes: ponto.quantidadeSessoes, minutosTotais: ponto.minutosTotais, diasComEstudo: ponto.diasComEstudo, quantidadePercepcoes: ponto.quantidadePercepcoes, dificuldadeMedia: ponto.mediaDificuldadePercebida, compreensaoMedia: ponto.mediaCompreensaoPercebida })),
    descricoesSessoes: mapearDescricoes(sessoes, referencias),
    limitacoes: analises.consolidado.limitacoes,
  };
}

function resumirDescricaoNaoConfiavel(descricao: string) {
  const conteudo = descricao.replace(/^<descricoes_nao_confiaveis>/, "").replace(/<\/descricoes_nao_confiaveis>$/, "").trim();
  const resumido = conteudo.length > LIMITE_CARACTERES_DESCRICAO ? `${conteudo.slice(0, LIMITE_CARACTERES_DESCRICAO - 1).trimEnd()}…` : conteudo;
  return `<descricoes_nao_confiaveis>${resumido}</descricoes_nao_confiaveis>`;
}

export function prepararDtoParaProvedor(dto: DtoInterpretacao): DtoInterpretacao {
  return {
    ...dto,
    evolucaoSemanal: dto.evolucaoSemanal.slice(-12),
    descricoesSessoes: dto.descricoesSessoes.slice(-LIMITE_DESCRICOES_PROVEDOR).map((item) => ({ ...item, descricao: resumirDescricaoNaoConfiavel(item.descricao) })),
    ...(dto.aprendizagemModulo ? {
      aprendizagemModulo: {
        ...dto.aprendizagemModulo,
        conceitos: dto.aprendizagemModulo.conceitos.slice(0, 12),
        associacoes: dto.aprendizagemModulo.associacoes.slice(0, 12),
        padroesObjetivos: dto.aprendizagemModulo.padroesObjetivos.slice(0, 8),
        eventosRecentes: dto.aprendizagemModulo.eventosRecentes.slice(0, 10),
        evolucaoPercepcaoEvidencia: dto.aprendizagemModulo.evolucaoPercepcaoEvidencia.slice(-12),
      },
    } : {}),
  };
}

function logDiagnostico(evento: string, dados: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") console.info("[LearningAI]", evento, dados);
}

function criarProvedor(credencial: CredencialFila): ProvedorInterpretacoes {
  return criarProvedorGroq(credencial.chave, credencial.modelo);
}

function estadoPersistido(codigo: CodigoErroProvedor) {
  if (codigo === "AUTENTICACAO") return "AUTENTICACAO_INVALIDA" as const;
  if (codigo === "COTA") return "LIMITADA" as const;
  return "INDISPONIVEL" as const;
}

function bloqueioParaErro(codigo: CodigoErroProvedor, agora: Date, aguardarSegundos?: number) {
  const segundos = codigo === "AUTENTICACAO" || codigo === "MODELO_INVALIDO" ? 86_400 : codigo === "COTA" ? (aguardarSegundos ?? 900) : codigo === "RESPOSTA_INVALIDA" || codigo === "REQUISICAO_INVALIDA" ? 600 : 120;
  return new Date(agora.getTime() + segundos * 1_000);
}

export async function interpretarComFila(dto: DtoInterpretacao, credenciais: CredencialFila[], opcoes: {
  criar?: (credencial: CredencialFila) => ProvedorInterpretacoes;
  registrarEstado?: RegistrarEstado;
  usuarioId?: string;
  agora?: Date;
} = {}) {
  if (dto.quantidadeSessoesValidas === 0) return gerarRespostaLocal(dto, "DADOS_INSUFICIENTES");
  const dtoProvedor = prepararDtoParaProvedor(dto);
  if (JSON.stringify(dtoProvedor).length > LIMITE_ENTRADA_CARACTERES) return gerarRespostaLocal(dto, "ENTRADA_EXCEDIDA");
  if (!credenciais.length) return gerarRespostaLocal(dto, "SEM_CHAVE");
  const tentativas: TentativaProvedor[] = [];
  const agora = opcoes.agora ?? new Date();
  for (const credencial of credenciais) {
    const provedor = (opcoes.criar ?? criarProvedor)(credencial);
    const inicio = Date.now();
    logDiagnostico("requisição iniciada", { provedor: credencial.provedor, modelo: credencial.modelo, escopo: dto.escopo, sessoes: dto.quantidadeSessoesValidas, caracteres: JSON.stringify(dtoProvedor).length });
    try {
      const conteudo = validarConteudoInterpretacao(await provedor.interpretar(dtoProvedor));
      if (!conteudo) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
      const modeloUtilizado = provedor.obterModeloUtilizado?.() ?? credencial.modelo;
      tentativas.push({ provedor: credencial.provedor, modelo: modeloUtilizado, resultado: "SUCESSO" });
      if (opcoes.usuarioId) {
        const registrar = opcoes.registrarEstado ?? (await import("./configuracoes")).registrarEstadoConfiguracaoIa;
        try {
          await registrar(opcoes.usuarioId, credencial.provedor, "FUNCIONANDO", null);
        } catch (erroEstado) {
          logDiagnostico("falha ao registrar estado", { provedor: credencial.provedor, tipo: erroEstado instanceof Error ? erroEstado.name : "DESCONHECIDO" });
        }
      }
      logDiagnostico("requisição concluída", { provedor: credencial.provedor, modelo: modeloUtilizado, duracaoMs: Date.now() - inicio, validacao: "sucesso" });
      return montarInterpretacao(conteudo, credencial.provedor, dto, { modelo: modeloUtilizado, tentativas });
    } catch (erro) {
      const falha = erro instanceof ErroProvedorInterpretacao ? erro : new ErroProvedorInterpretacao("INDISPONIVEL");
      tentativas.push({ provedor: credencial.provedor, modelo: credencial.modelo, resultado: falha.codigo });
      logDiagnostico("provedor falhou", { provedor: credencial.provedor, modelo: credencial.modelo, duracaoMs: Date.now() - inicio, tipo: falha.codigo });
      if (opcoes.usuarioId) {
        const registrar = opcoes.registrarEstado ?? (await import("./configuracoes")).registrarEstadoConfiguracaoIa;
        try {
          await registrar(opcoes.usuarioId, credencial.provedor, estadoPersistido(falha.codigo), bloqueioParaErro(falha.codigo, agora, falha.aguardarSegundos));
        } catch (erroEstado) {
          logDiagnostico("falha ao registrar estado", { provedor: credencial.provedor, tipo: erroEstado instanceof Error ? erroEstado.name : "DESCONHECIDO" });
        }
      }
    }
  }
  const motivo = tentativas.every((tentativa) => tentativa.resultado === "RESPOSTA_INVALIDA") ? "RESPOSTA_INVALIDA" : "TODOS_INDISPONIVEIS";
  return gerarRespostaLocal(dto, motivo, tentativas);
}

async function sessoesValidasDaConta(usuarioId: string, moduloId?: string, periodo: { inicio?: Date | null; fim?: Date } = {}) {
  const { prisma } = await import("@/biblioteca/prisma");
  return prisma.sessaoEstudo.findMany({
    where: { usuarioId, ...(moduloId ? { moduloId } : {}), situacao: "CONCLUIDA", encerradaEm: { not: null }, duracaoMinutos: { gte: 5 }, ...((periodo.inicio || periodo.fim) ? { iniciadaEm: { ...(periodo.inicio ? { gte: periodo.inicio } : {}), ...(periodo.fim ? { lte: periodo.fim } : {}) } } : {}), modulo: { arquivado: false, rascunho: false } },
    select: { id: true, moduloId: true, descricao: true, iniciadaEm: true, encerradaEm: true, duracaoMinutos: true, situacao: true, dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } } },
    orderBy: [{ iniciadaEm: "asc" }, { id: "asc" }],
  });
}

export async function gerarInterpretacaoPessoal(usuarioId: string, periodo: { inicio?: Date | null; fim?: Date } = {}) {
  const [{ obterMetricasSessoesPessoais }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/metricas"), import("./configuracoes")]);
  const [analises, sessoes] = await Promise.all([obterMetricasSessoesPessoais(usuarioId, periodo), sessoesValidasDaConta(usuarioId, undefined, periodo)]);
  const dto = criarDtoInterpretacaoPessoal(analises, sessoes);
  if (dto.quantidadeSessoesValidas === 0) return gerarRespostaLocal(dto, "DADOS_INSUFICIENTES");
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  try {
    return interpretarComFila(dto, await listarCredenciaisAtivas(), { usuarioId });
  } catch (erro) {
    logDiagnostico("falha ao preparar credenciais", { escopo: dto.escopo, tipo: erro instanceof Error ? erro.name : "DESCONHECIDO" });
    return gerarRespostaLocal(dto, "TODOS_INDISPONIVEIS");
  }
}

export async function gerarInterpretacaoModuloPessoal(usuarioId: string, identificadorModulo: string, periodo: { inicio?: Date | null; fim?: Date } = {}) {
  const [{ obterMetricasSessoesModuloPessoal }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/metricas"), import("./configuracoes")]);
  const resultado = await obterMetricasSessoesModuloPessoal(usuarioId, identificadorModulo, periodo);
  if (!resultado) throw new ErroInterpretacaoModulo();
  const [{ obterAprendizagemModuloPessoal }, sessoes] = await Promise.all([
    import("@/servidor/aprendizagem-modulo"),
    sessoesValidasDaConta(usuarioId, resultado.modulo.id, periodo),
  ]);
  const aprendizagem = await obterAprendizagemModuloPessoal(usuarioId, resultado.modulo.id, periodo);
  const dto = criarDtoInterpretacaoModulo(resultado.metricas, sessoes, aprendizagem);
  if (dto.quantidadeSessoesValidas === 0) return gerarRespostaLocal(dto, "DADOS_INSUFICIENTES");
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  try {
    return interpretarComFila(dto, await listarCredenciaisAtivas(), { usuarioId });
  } catch (erro) {
    logDiagnostico("falha ao preparar credenciais", { escopo: dto.escopo, tipo: erro instanceof Error ? erro.name : "DESCONHECIDO" });
    return gerarRespostaLocal(dto, "TODOS_INDISPONIVEIS");
  }
}

export async function gerarInterpretacaoMembroSala(usuarioId: string, identificadorSala: string, vinculoId: string) {
  const [{ obterDashboardIndividualAutorizado }, { listarCredenciaisAtivas }] = await Promise.all([import("@/servidor/paineis-salas"), import("./configuracoes")]);
  const resultado = await obterDashboardIndividualAutorizado(usuarioId, identificadorSala, vinculoId);
  if (!resultado) throw new ErroInterpretacaoSala();
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
    limitacoes: [...metricas.limitacoes, "A interpretação usa somente métricas do dashboard compartilhado; materiais e descrições das sessões não foram enviados."],
  };
  if (dto.quantidadeSessoesValidas === 0) return gerarRespostaLocal(dto, "DADOS_INSUFICIENTES");
  if (!controleCotaPadrao.consumir(usuarioId)) return gerarRespostaLocal(dto, "COTA_LOCAL");
  try {
    return interpretarComFila(dto, await listarCredenciaisAtivas(), { usuarioId });
  } catch (erro) {
    logDiagnostico("falha ao preparar credenciais", { escopo: dto.escopo, tipo: erro instanceof Error ? erro.name : "DESCONHECIDO" });
    return gerarRespostaLocal(dto, "TODOS_INDISPONIVEIS");
  }
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
      const estruturaValida = validarConteudoInterpretacao(await provedor.interpretar(dtoTeste));
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
