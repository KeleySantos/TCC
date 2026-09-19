import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { calcularDificuldadeAtualEstimada, calcularEvolucaoTaxaMediaTopicos, calcularMetricasModulo, calcularRecorrenciasEntreModulos, calcularTaxaAcertoGeral, selecionarMetodoComMaiorMediaObservada, type EvolucaoTaxaMediaTopicos, type RecorrenciaContextual, type SessaoParaMetricas, type TentativaParaMetricas } from "./metricas-modulo";

const data = (dia: number) => new Date(`2026-09-${String(dia).padStart(2, "0")}T12:00:00.000Z`);
const sessao = (id: string, moduloId: string, topicoId: string, formato: FormatoConteudo, metodo: MetodoEstudo | null, dia: number, dificuldadePercebida = 2, compreensaoPercebida = 4): SessaoParaMetricas => ({ id, moduloId, topicoId, formato, metodo, dificuldadePercebida, compreensaoPercebida, encerradaEm: data(dia), duracaoMinutos: 20, situacao: "CONCLUIDA" });
const tentativa = (id: string, moduloId: string, topicoId: string, dia: number, notaNormalizada: number, numeroTentativa: number, respostasCorretas = 4, totalQuestoes = 5): TentativaParaMetricas => ({ id, moduloId, topicoId, concluidaEm: data(dia), notaNormalizada, numeroTentativa, respostasCorretas, totalQuestoes });
const recorrenciaMetodo = (chave: MetodoEstudo, mediaNotas: number, quantidadeEvidencias: number, quantidadeModulos: number): RecorrenciaContextual => ({ tipo: "METODO", chave, mediaNotas, quantidadeEvidencias, quantidadeModulos, moduloIds: Array.from({ length: quantidadeModulos }, (_, indice) => `m${indice + 1}`), versaoAlgoritmo: "metricas-oficiais-v2" });
const recorrenciaFormato = (): RecorrenciaContextual => ({ tipo: "FORMATO", chave: FormatoConteudo.VIDEO, mediaNotas: 100, quantidadeEvidencias: 10, quantidadeModulos: 3, moduloIds: ["m1", "m2", "m3"], versaoAlgoritmo: "metricas-oficiais-v2" });

describe("métricas oficiais por módulo", () => {
  it("representa estado vazio sem transformar ausência em zero", () => {
    const metricas = calcularMetricasModulo("m1", [], []);
    expect(metricas.taxaAcerto).toBeNull();
    expect(metricas.mediaNotas).toBeNull();
    expect(metricas.evolucao.variacao).toBeNull();
    expect(metricas.tempoEstudo.minutosTotais).toBe(0);
  });

  it("calcula acerto, tempo, evolução e percepção para uma exposição única", () => {
    const metricas = calcularMetricasModulo("m1", [sessao("s1", "m1", "t1", FormatoConteudo.VIDEO, MetodoEstudo.VIDEO_GUIADO, 1)], [tentativa("a1", "m1", "t1", 2, 80, 1)]);
    expect(metricas.taxaAcerto).toBe(0.8);
    expect(metricas.tempoEstudo).toMatchObject({ quantidadeSessoesValidas: 1, minutosTotais: 20 });
    expect(metricas.evolucao).toMatchObject({ amostra: 1, primeiraNota: 80, ultimaNota: 80, variacao: null });
    expect(metricas.desempenhoPorMetodo[0]).toMatchObject({ chave: MetodoEstudo.VIDEO_GUIADO, mediaNotas: 80 });
    expect(metricas.percepcaoVersusResultado).toMatchObject({ amostra: 1, mediaCompreensaoPercebida: 4, mediaNota: 80 });
    expect(metricas.metricasPorTopico).toHaveLength(1);
    expect(metricas.metricasPorTopico[0]).toMatchObject({ topicoId: "t1", taxaAcerto: 0.8 });
  });

  it("preserva a nota total mas não atribui desempenho quando a exposição é mista", () => {
    const metricas = calcularMetricasModulo("m1", [sessao("s1", "m1", "t1", FormatoConteudo.VIDEO, MetodoEstudo.VIDEO_GUIADO, 1), sessao("s2", "m1", "t1", FormatoConteudo.PDF, MetodoEstudo.LEITURA_ATIVA, 1)], [tentativa("a1", "m1", "t1", 2, 80, 1)]);
    expect(metricas.mediaNotas).toBe(80);
    expect(metricas.quantidadeExposicoesMistas).toBe(1);
    expect(metricas.desempenhoPorFormato).toHaveLength(0);
  });

  it("ordena empates de forma determinística e descreve contradição sem inferir causa", () => {
    const metricas = calcularMetricasModulo("m1", [sessao("s-pdf", "m1", "t-pdf", FormatoConteudo.PDF, MetodoEstudo.LEITURA_ATIVA, 1, 5, 5), sessao("s-video", "m1", "t-video", FormatoConteudo.VIDEO, MetodoEstudo.VIDEO_GUIADO, 3, 5, 5)], [tentativa("a-pdf", "m1", "t-pdf", 2, 0, 1, 0), tentativa("a-video", "m1", "t-video", 4, 0, 2, 0)]);
    expect(metricas.desempenhoPorFormato.map((item) => item.chave)).toEqual([FormatoConteudo.PDF, FormatoConteudo.VIDEO]);
    expect(metricas.percepcaoVersusResultado).toMatchObject({ mediaCompreensaoPercebida: 5, mediaNota: 0 });
    expect(metricas.evolucao.variacao).toBe(0);
  });

  it("só retorna recorrência quando o mesmo contexto aparece em pelo menos dois módulos", () => {
    const moduloUm = calcularMetricasModulo("m1", [sessao("s1", "m1", "t1", FormatoConteudo.VIDEO, MetodoEstudo.VIDEO_GUIADO, 1)], [tentativa("a1", "m1", "t1", 2, 70, 1)]);
    const moduloDois = calcularMetricasModulo("m2", [sessao("s2", "m2", "t2", FormatoConteudo.VIDEO, MetodoEstudo.VIDEO_GUIADO, 1)], [tentativa("a2", "m2", "t2", 2, 90, 1)]);
    const somenteUm = calcularRecorrenciasEntreModulos([moduloUm]);
    const dois = calcularRecorrenciasEntreModulos([moduloUm, moduloDois]);
    expect(somenteUm).toHaveLength(0);
    expect(dois).toEqual(expect.arrayContaining([expect.objectContaining({ tipo: "FORMATO", chave: FormatoConteudo.VIDEO, quantidadeModulos: 2, mediaNotas: 80 }), expect.objectContaining({ tipo: "METODO", chave: MetodoEstudo.VIDEO_GUIADO, quantidadeModulos: 2, mediaNotas: 80 })]));
  });

  it("mantém ausência geral como nula e preserva a versão do algoritmo", () => {
    expect(calcularTaxaAcertoGeral([])).toEqual({
      respostasCorretas: 0,
      totalQuestoes: 0,
      quantidadeTentativas: 0,
      quantidadeModulosComEvidencia: 0,
      taxaAcerto: null,
      versaoAlgoritmo: "metricas-oficiais-v2",
    });
  });

  it("calcula a taxa geral ponderada por questões e ignora módulos sem questões", () => {
    const primeiroModulo = calcularMetricasModulo("m1", [], [tentativa("a1", "m1", "t1", 1, 100, 1, 1, 1)]);
    const segundoModulo = calcularMetricasModulo("m2", [], [tentativa("a2", "m2", "t2", 2, 50, 1, 5, 10)]);
    const moduloSemQuestoes = calcularMetricasModulo("m3", [], []);

    expect(calcularTaxaAcertoGeral([primeiroModulo, segundoModulo, moduloSemQuestoes])).toMatchObject({
      respostasCorretas: 6,
      totalQuestoes: 11,
      quantidadeTentativas: 2,
      quantidadeModulosComEvidencia: 2,
      taxaAcerto: 6 / 11,
    });
  });

  it("reconhece taxa de zero por cento como evidência válida", () => {
    const moduloComZeroPorCento = calcularMetricasModulo("m1", [], [tentativa("a1", "m1", "t1", 1, 0, 1, 0, 5)]);
    const moduloSemQuestoes = calcularMetricasModulo("m2", [], []);

    expect(calcularTaxaAcertoGeral([moduloComZeroPorCento, moduloSemQuestoes])).toMatchObject({
      totalQuestoes: 5,
      quantidadeModulosComEvidencia: 1,
      taxaAcerto: 0,
    });
  });

  it("não seleciona método quando só há formato ou recorrência em um módulo", () => {
    expect(selecionarMetodoComMaiorMediaObservada([
      recorrenciaFormato(),
      recorrenciaMetodo(MetodoEstudo.LEITURA_ATIVA, 90, 3, 1),
    ])).toBeNull();
  });

  it("seleciona a maior média de método e preserva sua evidência no DTO", () => {
    expect(selecionarMetodoComMaiorMediaObservada([
      recorrenciaMetodo(MetodoEstudo.LEITURA_ATIVA, 75, 5, 2),
      recorrenciaMetodo(MetodoEstudo.EXERCICIO, 90, 3, 2),
    ])).toEqual({
      chave: MetodoEstudo.EXERCICIO,
      mediaNotas: 90,
      quantidadeEvidencias: 3,
      quantidadeModulos: 2,
      moduloIds: ["m1", "m2"],
      versaoAlgoritmo: "metricas-oficiais-v2",
    });
  });

  it("desempata método pela maior amostra, depois por módulos e por chave", () => {
    expect(selecionarMetodoComMaiorMediaObservada([
      recorrenciaMetodo(MetodoEstudo.LEITURA_ATIVA, 80, 2, 2),
      recorrenciaMetodo(MetodoEstudo.VIDEO_GUIADO, 80, 3, 2),
    ])?.chave).toBe(MetodoEstudo.VIDEO_GUIADO);
    expect(selecionarMetodoComMaiorMediaObservada([
      recorrenciaMetodo(MetodoEstudo.LEITURA_ATIVA, 80, 3, 2),
      recorrenciaMetodo(MetodoEstudo.REVISAO, 80, 3, 3),
    ])?.chave).toBe(MetodoEstudo.REVISAO);
    expect(selecionarMetodoComMaiorMediaObservada([
      recorrenciaMetodo(MetodoEstudo.RESUMO, 80, 3, 2),
      recorrenciaMetodo(MetodoEstudo.EXERCICIO, 80, 3, 2),
    ])?.chave).toBe(MetodoEstudo.EXERCICIO);
  });

  it("calcula semanalmente a média simples das taxas por tópico sem transformar ausência em zero", () => {
    const evolucao = calcularEvolucaoTaxaMediaTopicos("m1", [
      tentativa("a1", "m1", "t1", 1, 100, 1, 1, 1),
      tentativa("a2", "m1", "t2", 2, 90, 1, 9, 10),
      tentativa("a3", "m1", "t1", 9, 0, 2, 0, 5),
    ]);
    expect(evolucao).toMatchObject({ periodicidade: "SEMANAL", quantidadePeriodosComEvidencia: 2 });
    expect(evolucao.pontos[0]).toMatchObject({ quantidadeTopicosComEvidencia: 2, quantidadeTentativas: 2, respostasCorretas: 10, totalQuestoes: 11, mediaTaxasAcertoTopicos: 0.95 });
    expect(evolucao.pontos[0].topicos).toEqual(expect.arrayContaining([
      expect.objectContaining({ topicoId: "t1", taxaAcerto: 1 }),
      expect.objectContaining({ topicoId: "t2", taxaAcerto: 0.9 }),
    ]));
    expect(evolucao.pontos[1]).toMatchObject({ quantidadeTopicosComEvidencia: 1, mediaTaxasAcertoTopicos: 0, totalQuestoes: 5 });
    expect(evolucao.pontos[0].periodoInicio.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(evolucao.pontos[1].periodoInicio.toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("mantém zero por cento como evidência e ignora tentativa sem questões na evolução semanal", () => {
    const evolucao = calcularEvolucaoTaxaMediaTopicos("m1", [
      tentativa("zero", "m1", "t1", 1, 0, 1, 0, 5),
      tentativa("sem-questoes", "m1", "t2", 1, 0, 1, 0, 0),
    ]);
    expect(evolucao.pontos).toHaveLength(1);
    expect(evolucao.pontos[0]).toMatchObject({ mediaTaxasAcertoTopicos: 0, quantidadeTopicosComEvidencia: 1, quantidadeTentativas: 1 });
  });

  it("estima a dificuldade apenas pelos três períodos mais recentes e respeita todos os limites", () => {
    const criarEvolucao = (taxas: number[]): EvolucaoTaxaMediaTopicos => ({
      periodicidade: "SEMANAL",
      versaoAlgoritmo: "metricas-oficiais-v2",
      quantidadePeriodosComEvidencia: taxas.length,
      pontos: taxas.map((taxa, indice) => ({
        periodoInicio: data(1 + indice),
        periodoFim: data(1 + indice),
        mediaTaxasAcertoTopicos: taxa,
        quantidadeTopicosComEvidencia: 1,
        quantidadeTentativas: 1,
        respostasCorretas: Math.round(taxa * 100),
        totalQuestoes: 100,
        topicos: [{ topicoId: `t${indice}`, taxaAcerto: taxa, quantidadeTentativas: 1, respostasCorretas: Math.round(taxa * 100), totalQuestoes: 100 }],
      })),
    });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([]))).toMatchObject({ status: null, taxaReferencia: null, quantidadePeriodos: 0 });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0]))).toMatchObject({ status: "ALTA", amostraReduzida: true });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0.5999]))).toMatchObject({ status: "ALTA" });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0.6]))).toMatchObject({ status: "INTERMEDIARIA" });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0.7999]))).toMatchObject({ status: "INTERMEDIARIA" });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0.8]))).toMatchObject({ status: "BAIXA" });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([1]))).toMatchObject({ status: "BAIXA" });
    expect(calcularDificuldadeAtualEstimada(criarEvolucao([0, 0.1, 0.7, 0.9]))).toMatchObject({ taxaReferencia: (0.1 + 0.7 + 0.9) / 3, quantidadePeriodos: 3, amostraReduzida: false });
  });

  it("não permite que dificuldade percebida altere a dificuldade atual estimada", () => {
    const tentativas = [tentativa("a1", "m1", "t1", 1, 70, 1, 7, 10)];
    const comPercepcaoBaixa = calcularMetricasModulo("m1", [sessao("s1", "m1", "t1", FormatoConteudo.TEXTO, MetodoEstudo.RESUMO, 1, 1, 1)], tentativas);
    const comPercepcaoAlta = calcularMetricasModulo("m1", [sessao("s2", "m1", "t1", FormatoConteudo.TEXTO, MetodoEstudo.RESUMO, 1, 5, 5)], tentativas);
    expect(comPercepcaoBaixa.dificuldadeAtualEstimada).toEqual(comPercepcaoAlta.dificuldadeAtualEstimada);
  });
});
