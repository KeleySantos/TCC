export type SessaoAprendizagemModulo = {
  id: string;
  encerradaEm: Date;
  compreensaoPercebida: number | null;
  dificuldadePercebida: number | null;
  duracaoMinutos: number;
  metodos: string[];
  formatos: string[];
  conceitos: string[];
};

export type EvidenciaAprendizagemModulo = {
  id: string;
  dataEvento: Date;
  confirmada: boolean;
  desempenhoPercentual: number | null;
  conceitos: string[];
  sessaoIdsExplicitos: string[];
};

export type ConceitoCatalogadoModulo = { chave: string; nome: string; aliases: string[] };

export type PadraoAprendizagemModulo = {
  tipo: "DIVERGENCIA_PERCEPCAO_EVIDENCIA" | "EVOLUCAO_POSITIVA" | "PONTO_DE_ATENCAO";
  conceito: string;
  amostra: number;
  texto: string;
};

export const MINIMO_EVIDENCIAS_PARA_TENDENCIA = 2;
export const MINIMO_EVIDENCIAS_PARA_ASSOCIACAO = 2;
export const MINIMO_EVIDENCIAS_PARA_COMPARACAO = 2;
export const JANELA_EVIDENCIA_POSTERIOR_DIAS = 30;
export const JANELA_CONCEITOS_DIAS = 90;
export const LIMITE_CONCEITOS_DESTAQUE = 5;
export const MINIMO_OBSERVACOES_CONCEITO = 2;
export const MINIMO_COMPREENSOES_PARA_DESTAQUE_CONTEXTO = 2;
export const COMPREENSAO_MINIMA_MELHOR_RESULTADO = 4;
export const DESEMPENHO_MINIMO_MELHOR_RESULTADO = 70;

export type ResultadoContextoAprendizagem<T extends string = string> = {
  chave: T;
  quantidadeSessoes: number;
  quantidadeCompreensoes: number;
  compreensaoMedia: number | null;
  quantidadeEvidenciasPosteriores: number;
  desempenhoMedioPosterior: number | null;
  amostraEvidenciasSuficiente: boolean;
};

export type ClassificacaoConceitoAprendizagem = {
  chave: string;
  nome: string;
  sessoes: number;
  evidencias: number;
  observacoes: number;
  compreensaoMedia: number | null;
  dificuldadeMedia: number | null;
  desempenhoMedio: number | null;
  evidenciasSuficientes: boolean;
  indice: number;
  ultimaObservacaoEm: Date;
};

export type EvolucaoPercepcaoEvidencia = {
  periodoInicio: Date;
  periodoFim: Date;
  quantidadePercepcoes: number;
  mediaCompreensaoPercebida: number | null;
  quantidadeEvidencias: number;
  desempenhoMedioEvidencias: number | null;
};

export function normalizarChaveConceito(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

export function textoMencionaConceito(texto: string, termo: string) {
  const textoNormalizado = normalizarChaveConceito(texto);
  const termoNormalizado = normalizarChaveConceito(termo).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return termoNormalizado.length > 0 && new RegExp(`(^|[^a-z0-9])${termoNormalizado}($|[^a-z0-9])`, "i").test(textoNormalizado);
}

function siglaConceito(valor: string) {
  const ignoradas = new Set(["a", "as", "de", "da", "das", "do", "dos", "e", "em", "o", "os"]);
  const palavras = normalizarChaveConceito(valor).split(/[^a-z0-9]+/).filter((palavra) => palavra && !ignoradas.has(palavra));
  return palavras.length >= 2 ? palavras.map((palavra) => palavra[0]).join("") : "";
}

export function saoVariacoesDoMesmoConceito(a: string, b: string) {
  const chaveA = normalizarChaveConceito(a);
  const chaveB = normalizarChaveConceito(b);
  return chaveA === chaveB || (siglaConceito(a) !== "" && siglaConceito(a) === chaveB) || (siglaConceito(b) !== "" && siglaConceito(b) === chaveA);
}

function media(valores: number[]) {
  return valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null;
}

function criarResolvedorConceitos(catalogo: ConceitoCatalogadoModulo[]) {
  const canonicos = new Map<string, { chave: string; nome: string }>();
  for (const item of catalogo) {
    const chave = normalizarChaveConceito(item.chave || item.nome);
    const valor = { chave, nome: item.nome.trim() };
    for (const termo of [item.chave, item.nome, ...item.aliases]) canonicos.set(normalizarChaveConceito(termo), valor);
  }
  return (nome: string) => canonicos.get(normalizarChaveConceito(nome)) ?? { chave: normalizarChaveConceito(nome), nome: nome.trim() };
}

function estadoPercepcaoEvidencia(compreensao: number | null, desempenho: number | null, quantidadeEvidencias: number) {
  if (compreensao === null || desempenho === null || quantidadeEvidencias < MINIMO_EVIDENCIAS_PARA_COMPARACAO) return "DADOS_INSUFICIENTES" as const;
  const percepcaoAlta = compreensao * 20 >= 70;
  const evidenciaAlta = desempenho >= 70;
  if (percepcaoAlta && evidenciaAlta) return "ALINHAMENTO_POSITIVO" as const;
  if (percepcaoAlta) return "POSSIVEL_SUPERESTIMACAO" as const;
  if (evidenciaAlta) return "POSSIVEL_SUBESTIMACAO" as const;
  return "PONTO_DE_ATENCAO" as const;
}

function tendenciaEvidencias(valores: Array<{ data: Date; valor: number }>) {
  if (valores.length < MINIMO_EVIDENCIAS_PARA_TENDENCIA) return "DADOS_INSUFICIENTES" as const;
  const ordenados = [...valores].sort((a, b) => a.data.getTime() - b.data.getTime());
  const variacao = ordenados.at(-1)!.valor - ordenados[0].valor;
  if (variacao >= 10) return "EVOLUCAO_POSITIVA" as const;
  if (variacao <= -10) return "PONTO_DE_ATENCAO" as const;
  return "ESTAVEL" as const;
}

function agruparResultadosPorContexto<T extends string>(
  sessoes: SessaoAprendizagemModulo[],
  evidencias: EvidenciaAprendizagemModulo[],
  selecionar: (sessao: SessaoAprendizagemModulo) => T[],
  resolver: ReturnType<typeof criarResolvedorConceitos>,
): ResultadoContextoAprendizagem<T>[] {
  const grupos = new Map<T, { sessoes: Set<string>; compreensoes: number[]; evidencias: Map<string, number> }>();
  for (const sessao of sessoes) {
    const evidenciasDaSessao = evidenciasPosterioresDaSessao(sessao, evidencias, resolver);
    for (const chave of new Set(selecionar(sessao))) {
      const grupo = grupos.get(chave) ?? { sessoes: new Set<string>(), compreensoes: [], evidencias: new Map<string, number>() };
      grupo.sessoes.add(sessao.id);
      if (sessao.compreensaoPercebida !== null) grupo.compreensoes.push(sessao.compreensaoPercebida);
      for (const evidencia of evidenciasDaSessao) {
        grupo.evidencias.set(evidencia.id, evidencia.desempenhoPercentual);
      }
      grupos.set(chave, grupo);
    }
  }
  return [...grupos.entries()].map(([chave, grupo]) => ({
    chave,
    quantidadeSessoes: grupo.sessoes.size,
    quantidadeCompreensoes: grupo.compreensoes.length,
    compreensaoMedia: media(grupo.compreensoes),
    quantidadeEvidenciasPosteriores: grupo.evidencias.size,
    desempenhoMedioPosterior: media([...grupo.evidencias.values()]),
    amostraEvidenciasSuficiente: grupo.evidencias.size >= MINIMO_EVIDENCIAS_PARA_ASSOCIACAO,
  })).sort((a, b) => (b.desempenhoMedioPosterior ?? -1) - (a.desempenhoMedioPosterior ?? -1) || b.quantidadeEvidenciasPosteriores - a.quantidadeEvidenciasPosteriores || a.chave.localeCompare(b.chave));
}

function evidenciasPosterioresDaSessao(
  sessao: SessaoAprendizagemModulo,
  evidencias: EvidenciaAprendizagemModulo[],
  resolver: ReturnType<typeof criarResolvedorConceitos>,
) {
  const conceitosSessao = new Set(sessao.conceitos.map((nome) => resolver(nome).chave));
  return evidencias.filter((evidencia): evidencia is EvidenciaAprendizagemModulo & { desempenhoPercentual: number } => {
    if (evidencia.desempenhoPercentual === null || evidencia.dataEvento <= sessao.encerradaEm) return false;
    const vinculadaExplicitamente = evidencia.sessaoIdsExplicitos.includes(sessao.id);
    const dentroDaJanela = evidencia.dataEvento.getTime() - sessao.encerradaEm.getTime() <= JANELA_EVIDENCIA_POSTERIOR_DIAS * 86_400_000;
    const possuiConceitoComum = evidencia.conceitos.some((nome) => conceitosSessao.has(resolver(nome).chave));
    return vinculadaExplicitamente || (dentroDaJanela && possuiConceitoComum);
  });
}

function selecionarContextoMaiorCompreensao<T extends string>(itens: ResultadoContextoAprendizagem<T>[]) {
  return [...itens]
    .filter((item) => item.compreensaoMedia !== null && item.quantidadeCompreensoes >= MINIMO_COMPREENSOES_PARA_DESTAQUE_CONTEXTO)
    .sort((a, b) => (b.compreensaoMedia ?? 0) - (a.compreensaoMedia ?? 0) || b.quantidadeCompreensoes - a.quantidadeCompreensoes || b.quantidadeSessoes - a.quantidadeSessoes || a.chave.localeCompare(b.chave))[0] ?? null;
}

function resumirDuracaoSessoesComMelhorResultado(
  sessoes: SessaoAprendizagemModulo[],
  evidencias: EvidenciaAprendizagemModulo[],
  resolver: ReturnType<typeof criarResolvedorConceitos>,
) {
  const elegiveis = sessoes.filter((sessao) => {
    if ((sessao.compreensaoPercebida ?? 0) < COMPREENSAO_MINIMA_MELHOR_RESULTADO) return false;
    const desempenho = media(evidenciasPosterioresDaSessao(sessao, evidencias, resolver).map((item) => item.desempenhoPercentual));
    return desempenho !== null && desempenho >= DESEMPENHO_MINIMO_MELHOR_RESULTADO;
  });
  return {
    mediaMinutos: media(elegiveis.map((sessao) => sessao.duracaoMinutos)),
    quantidadeSessoes: elegiveis.length,
    compreensaoMinima: COMPREENSAO_MINIMA_MELHOR_RESULTADO,
    desempenhoMinimo: DESEMPENHO_MINIMO_MELHOR_RESULTADO,
  };
}

function inicioSemanaUtc(data: Date) {
  const inicio = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  const dia = inicio.getUTCDay() || 7;
  inicio.setUTCDate(inicio.getUTCDate() - dia + 1);
  return inicio;
}

function agruparEvolucaoPercepcaoEvidencia(sessoes: SessaoAprendizagemModulo[], evidencias: EvidenciaAprendizagemModulo[]): EvolucaoPercepcaoEvidencia[] {
  const periodos = new Map<string, { inicio: Date; compreensoes: number[]; evidencias: number[] }>();
  const obter = (data: Date) => {
    const inicio = inicioSemanaUtc(data);
    const chave = inicio.toISOString();
    const periodo = periodos.get(chave) ?? { inicio, compreensoes: [], evidencias: [] };
    periodos.set(chave, periodo);
    return periodo;
  };
  for (const sessao of sessoes) if (sessao.compreensaoPercebida !== null) obter(sessao.encerradaEm).compreensoes.push(sessao.compreensaoPercebida);
  for (const evidencia of evidencias) if (evidencia.desempenhoPercentual !== null) obter(evidencia.dataEvento).evidencias.push(evidencia.desempenhoPercentual);
  return [...periodos.values()].sort((a, b) => a.inicio.getTime() - b.inicio.getTime()).map((periodo) => ({
    periodoInicio: periodo.inicio,
    periodoFim: new Date(periodo.inicio.getTime() + 7 * 86_400_000 - 1),
    quantidadePercepcoes: periodo.compreensoes.length,
    mediaCompreensaoPercebida: media(periodo.compreensoes),
    quantidadeEvidencias: periodo.evidencias.length,
    desempenhoMedioEvidencias: media(periodo.evidencias),
  }));
}

function normalizarEscalaPercebida(valor: number) {
  return ((valor - 1) / 4) * 100;
}

function classificarConceitosRecentes(
  grupos: Map<string, { nome: string; sessoes: Map<string, SessaoAprendizagemModulo>; evidencias: Map<string, EvidenciaAprendizagemModulo> }>,
  referencia: Date,
) {
  const inicio = new Date(referencia.getTime() - JANELA_CONCEITOS_DIAS * 86_400_000);
  const base = [...grupos.entries()].flatMap<ClassificacaoConceitoAprendizagem & { indiceDificuldade: number; indiceCompreensao: number }>(([chave, grupo]) => {
    const sessoes = [...grupo.sessoes.values()].filter((item) => item.encerradaEm >= inicio && item.encerradaEm <= referencia);
    const evidencias = [...grupo.evidencias.values()].filter((item) => item.dataEvento >= inicio && item.dataEvento <= referencia && item.desempenhoPercentual !== null);
    const sessoesComPercepcao = sessoes.filter((item) => item.compreensaoPercebida !== null || item.dificuldadePercebida !== null);
    const observacoes = sessoesComPercepcao.length + evidencias.length;
    if (observacoes < MINIMO_OBSERVACOES_CONCEITO) return [];
    const compreensaoMedia = media(sessoes.flatMap((item) => item.compreensaoPercebida === null ? [] : [item.compreensaoPercebida]));
    const dificuldadeMedia = media(sessoes.flatMap((item) => item.dificuldadePercebida === null ? [] : [item.dificuldadePercebida]));
    const desempenhoMedio = media(evidencias.flatMap((item) => item.desempenhoPercentual === null ? [] : [item.desempenhoPercentual]));
    const sinaisDificuldade = [
      ...(dificuldadeMedia === null ? [] : [normalizarEscalaPercebida(dificuldadeMedia)]),
      ...(compreensaoMedia === null ? [] : [100 - normalizarEscalaPercebida(compreensaoMedia)]),
      ...(desempenhoMedio === null ? [] : [100 - desempenhoMedio]),
    ];
    const sinaisCompreensao = [
      ...(compreensaoMedia === null ? [] : [normalizarEscalaPercebida(compreensaoMedia)]),
      ...(dificuldadeMedia === null ? [] : [100 - normalizarEscalaPercebida(dificuldadeMedia)]),
      ...(desempenhoMedio === null ? [] : [desempenhoMedio]),
    ];
    const ultimaObservacaoEm = [...sessoesComPercepcao.map((item) => item.encerradaEm), ...evidencias.map((item) => item.dataEvento)].sort((a, b) => b.getTime() - a.getTime())[0];
    return [{
      chave,
      nome: grupo.nome,
      sessoes: sessoesComPercepcao.length,
      evidencias: evidencias.length,
      observacoes,
      compreensaoMedia,
      dificuldadeMedia,
      desempenhoMedio,
      evidenciasSuficientes: evidencias.length >= MINIMO_EVIDENCIAS_PARA_COMPARACAO,
      indice: 0,
      indiceDificuldade: media(sinaisDificuldade) ?? 0,
      indiceCompreensao: media(sinaisCompreensao) ?? 0,
      ultimaObservacaoEm,
    }];
  });
  const desempatar = (a: typeof base[number], b: typeof base[number]) => b.ultimaObservacaoEm.getTime() - a.ultimaObservacaoEm.getTime() || b.observacoes - a.observacoes || a.nome.localeCompare(b.nome, "pt-BR");
  const projetar = (item: typeof base[number], indice: number): ClassificacaoConceitoAprendizagem => ({ ...item, indice });
  return {
    conceitosMaiorDificuldade: [...base].sort((a, b) => b.indiceDificuldade - a.indiceDificuldade || desempatar(a, b)).slice(0, LIMITE_CONCEITOS_DESTAQUE).map((item) => projetar(item, item.indiceDificuldade)),
    conceitosMaiorCompreensao: [...base].sort((a, b) => b.indiceCompreensao - a.indiceCompreensao || desempatar(a, b)).slice(0, LIMITE_CONCEITOS_DESTAQUE).map((item) => projetar(item, item.indiceCompreensao)),
  };
}

export function analisarAprendizagemModulo(entrada: {
  referencia: Date;
  sessoes: SessaoAprendizagemModulo[];
  evidencias: EvidenciaAprendizagemModulo[];
  conceitos: ConceitoCatalogadoModulo[];
}) {
  const resolver = criarResolvedorConceitos(entrada.conceitos);
  const sessoes = entrada.sessoes.filter((item) => item.encerradaEm <= entrada.referencia);
  const evidencias = entrada.evidencias.filter((item) => item.confirmada && item.dataEvento <= entrada.referencia);
  const grupos = new Map<string, { nome: string; sessoes: Map<string, SessaoAprendizagemModulo>; evidencias: Map<string, EvidenciaAprendizagemModulo> }>();
  const obterGrupo = (nome: string) => {
    const conceito = resolver(nome);
    const grupo = grupos.get(conceito.chave) ?? { nome: conceito.nome, sessoes: new Map(), evidencias: new Map() };
    grupos.set(conceito.chave, grupo);
    return grupo;
  };
  for (const sessao of sessoes) for (const nome of new Set(sessao.conceitos)) obterGrupo(nome).sessoes.set(sessao.id, sessao);
  for (const evidencia of evidencias) for (const nome of new Set(evidencia.conceitos)) obterGrupo(nome).evidencias.set(evidencia.id, evidencia);

  const conceitos = [...grupos.entries()].map(([chave, grupo]) => {
    const compreensoes = [...grupo.sessoes.values()].flatMap((item) => item.compreensaoPercebida === null ? [] : [item.compreensaoPercebida]);
    const desempenhos = [...grupo.evidencias.values()].flatMap((item) => item.desempenhoPercentual === null ? [] : [{ data: item.dataEvento, valor: item.desempenhoPercentual }]);
    const compreensaoMedia = media(compreensoes);
    const desempenhoMedio = media(desempenhos.map((item) => item.valor));
    return {
      chave,
      nome: grupo.nome,
      sessoes: grupo.sessoes.size,
      evidencias: grupo.evidencias.size,
      compreensaoMedia,
      dificuldadeMedia: media([...grupo.sessoes.values()].flatMap((item) => item.dificuldadePercebida === null ? [] : [item.dificuldadePercebida])),
      desempenhoMedio,
      estadoPercepcaoEvidencia: estadoPercepcaoEvidencia(compreensaoMedia, desempenhoMedio, desempenhos.length),
      tendencia: tendenciaEvidencias(desempenhos),
    };
  }).sort((a, b) => b.evidencias - a.evidencias || b.sessoes - a.sessoes || a.nome.localeCompare(b.nome, "pt-BR"));

  const metodosResultados = agruparResultadosPorContexto(sessoes, evidencias, (sessao) => sessao.metodos, resolver);
  const formatosResultados = agruparResultadosPorContexto(sessoes, evidencias, (sessao) => sessao.formatos, resolver);
  const metodosEvidencias = metodosResultados.map((item) => ({ chave: item.chave, sessoes: item.quantidadeSessoes, evidenciasPosteriores: item.quantidadeEvidenciasPosteriores, desempenhoMedioPosterior: item.desempenhoMedioPosterior, amostraSuficiente: item.amostraEvidenciasSuficiente }));
  const formatosEvidencias = formatosResultados.map((item) => ({ chave: item.chave, sessoes: item.quantidadeSessoes, evidenciasPosteriores: item.quantidadeEvidenciasPosteriores, desempenhoMedioPosterior: item.desempenhoMedioPosterior, amostraSuficiente: item.amostraEvidenciasSuficiente }));
  const resumoResultados = {
    duracaoSessoesComMelhorResultado: resumirDuracaoSessoesComMelhorResultado(sessoes, evidencias, resolver),
    metodoMaiorCompreensao: selecionarContextoMaiorCompreensao(metodosResultados),
    formatoMaiorCompreensao: selecionarContextoMaiorCompreensao(formatosResultados),
  };
  const evolucaoPercepcaoEvidencia = agruparEvolucaoPercepcaoEvidencia(sessoes, evidencias);
  const classificacoes = classificarConceitosRecentes(grupos, entrada.referencia);
  const padroes = conceitos.flatMap<PadraoAprendizagemModulo>((conceito) => {
    if (conceito.estadoPercepcaoEvidencia === "POSSIVEL_SUPERESTIMACAO") return [{ tipo: "DIVERGENCIA_PERCEPCAO_EVIDENCIA" as const, conceito: conceito.nome, amostra: conceito.evidencias, texto: `A compreensão percebida em ${conceito.nome} ficou alta enquanto o desempenho médio nas evidências confirmadas ficou abaixo de 70%.` }];
    if (conceito.estadoPercepcaoEvidencia === "PONTO_DE_ATENCAO") return [{ tipo: "PONTO_DE_ATENCAO" as const, conceito: conceito.nome, amostra: conceito.evidencias, texto: `A compreensão percebida e o desempenho confirmado em ${conceito.nome} ficaram abaixo dos níveis de referência nesta amostra.` }];
    if (conceito.tendencia === "EVOLUCAO_POSITIVA") return [{ tipo: "EVOLUCAO_POSITIVA" as const, conceito: conceito.nome, amostra: conceito.evidencias, texto: `O desempenho confirmado em ${conceito.nome} aumentou entre a primeira e a evidência mais recente.` }];
    return [];
  });
  return { conceitos, metodosResultados, formatosResultados, resumoResultados, evolucaoPercepcaoEvidencia, ...classificacoes, metodosEvidencias, formatosEvidencias, padroes };
}
