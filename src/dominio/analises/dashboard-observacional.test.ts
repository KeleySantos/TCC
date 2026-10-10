import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import type { SessaoParaMetricasSessoes } from "./metricas-sessoes";
import { calcularDashboardObservacional, MINIMO_SESSOES_METODO_DESTAQUE, type MaterialParaDashboard, type ModuloParaDashboard } from "./dashboard-observacional";

const referencia = new Date("2026-09-21T12:00:00.000Z");
const modulos: ModuloParaDashboard[] = [
  { id: "m1", identificador: "um", titulo: "Módulo um" },
  { id: "m2", identificador: "dois", titulo: "Módulo dois" },
];

function sessao(id: string, encerradaEm: string, opcoes: Partial<SessaoParaMetricasSessoes> = {}): SessaoParaMetricasSessoes {
  const fim = new Date(encerradaEm);
  return {
    id, moduloId: "m1", descricao: "Estudei árvores de decisão.",
    iniciadaEm: new Date(fim.getTime() - 30 * 60_000), encerradaEm: fim, duracaoMinutos: 30,
    situacao: SituacaoSessao.CONCLUIDA, arquivada: false, dificuldadePercebida: 3, compreensaoPercebida: 4,
    metodos: [MetodoEstudo.FEYNMAN], formatos: [FormatoConteudo.TEXTO], ...opcoes,
  };
}

describe("Dashboard observacional", () => {
  it("separa histórico de janela recente e reutiliza os critérios oficiais de sessão", () => {
    const inicio = "2026-06-23T12:00:00.000Z";
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("limite", inicio, { metodos: [MetodoEstudo.FEYNMAN, MetodoEstudo.POMODORO] }),
      sessao("arquivada", "2026-09-20T12:00:00.000Z", { arquivada: true, moduloId: "m2", metodos: [MetodoEstudo.FEYNMAN] }),
      sessao("antiga", "2026-06-23T11:59:59.000Z"),
      sessao("futura", "2026-09-22T12:00:00.000Z"),
      sessao("curta", "2026-09-19T12:00:00.000Z", { duracaoMinutos: 4 }),
      sessao("planejada", "2026-09-18T12:00:00.000Z", { situacao: SituacaoSessao.PLANEJADA }),
      sessao("externa", "2026-09-18T12:00:00.000Z", { moduloId: "alheio" }),
    ], [], referencia);

    expect(resultado.periodoRecente).toMatchObject({ inicio: new Date(inicio), fim: referencia, quantidadeSessoes: 2, nivelAmostra: "INICIAL" });
    expect(resultado.baseHistorica).toMatchObject({ quantidadeSessoes: 3, quantidadeModulosComSessoes: 2, quantidadeMetodosRegistrados: 2 });
    expect(resultado.resultadosMetodos.find((item) => item.chave === MetodoEstudo.FEYNMAN)).toMatchObject({ quantidadeSessoes: 3, quantidadeCompreensoes: 3, mediaCompreensaoPercebida: 4, quantidadeModulos: 2 });
    expect(resultado.metodosRecentes.find((item) => item.chave === MetodoEstudo.FEYNMAN)).toMatchObject({ quantidadeSessoes: 2, percentualSessoes: 1, quantidadeModulos: 2 });
    expect(resultado.metodosRecentes.find((item) => item.chave === MetodoEstudo.POMODORO)).toMatchObject({ quantidadeSessoes: 1, percentualSessoes: 0.5, nivelAmostra: "INSUFICIENTE" });
    expect(resultado.coberturaMetodos.find((item) => item.metodo === MetodoEstudo.POMODORO)?.quantidadeSessoes).toBe(1);
    expect(resultado.metodosRecentes.reduce((soma, item) => soma + item.percentualSessoes, 0)).toBe(1.5);
    expect(resultado.percepcoesRecentes).toMatchObject({ amostra: 2, mediaCompreensaoPercebida: 4 });
  });

  it("calcula o resultado histórico diretamente pelas sessões de todos os módulos", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("a1", "2026-01-01T12:00:00.000Z", { moduloId: "m1", metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 5 }),
      sessao("a2", "2026-01-02T12:00:00.000Z", { moduloId: "m1", metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 5 }),
      sessao("a3", "2026-01-03T12:00:00.000Z", { moduloId: "m1", metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 5 }),
      sessao("b1", "2026-02-01T12:00:00.000Z", { moduloId: "m2", metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 1 }),
    ], [], referencia);
    expect(resultado.resultadosMetodos).toEqual([
      expect.objectContaining({
        chave: MetodoEstudo.POMODORO,
        quantidadeSessoes: 4,
        quantidadeCompreensoes: 4,
        mediaCompreensaoPercebida: 4,
        quantidadeModulos: 2,
      }),
    ]);
  });

  it("destaca a maior compreensão elegível mesmo quando outro método é mais frequente", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      ...[4, 4, 4, 3, 3].map((compreensaoPercebida, indice) => sessao(`p${indice}`, `2026-01-${String(indice + 1).padStart(2, "0")}T12:00:00.000Z`, { metodos: [MetodoEstudo.POMODORO], compreensaoPercebida })),
      sessao("f1", "2026-02-01T12:00:00.000Z", { moduloId: "m1", metodos: [MetodoEstudo.FEYNMAN, MetodoEstudo.FEYNMAN], compreensaoPercebida: 5 }),
      sessao("f2", "2026-02-02T12:00:00.000Z", { moduloId: "m2", metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 5 }),
      sessao("f3", "2026-02-03T12:00:00.000Z", { moduloId: "m2", metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 4 }),
      sessao("isolada", "2026-03-01T12:00:00.000Z", { metodos: [MetodoEstudo.PRATICA_DISTRIBUIDA], compreensaoPercebida: 5 }),
    ], [], referencia);
    expect(MINIMO_SESSOES_METODO_DESTAQUE).toBe(3);
    expect(resultado.metodoMaiorCompreensao).toMatchObject({
      chave: MetodoEstudo.FEYNMAN,
      quantidadeSessoes: 3,
      quantidadeCompreensoes: 3,
      mediaCompreensaoPercebida: 14 / 3,
      quantidadeModulos: 2,
    });
  });

  it("resolve empate por maior amostra e depois pela chave do método", () => {
    const comAmostrasDiferentes = calcularDashboardObservacional(modulos, [
      ...[1, 2, 3].map((dia) => sessao(`p${dia}`, `2026-01-0${dia}T12:00:00.000Z`, { metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 4 })),
      ...[1, 2, 3, 4].map((dia) => sessao(`f${dia}`, `2026-02-0${dia}T12:00:00.000Z`, { metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 4 })),
    ], [], referencia);
    expect(comAmostrasDiferentes.metodoMaiorCompreensao?.chave).toBe(MetodoEstudo.FEYNMAN);

    const empateCompleto = calcularDashboardObservacional(modulos, [
      ...[1, 2, 3].flatMap((dia) => [
        sessao(`p${dia}`, `2026-01-0${dia}T12:00:00.000Z`, { metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 4 }),
        sessao(`f${dia}`, `2026-02-0${dia}T12:00:00.000Z`, { metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 4 }),
      ]),
    ], [], referencia);
    expect(empateCompleto.metodoMaiorCompreensao?.chave).toBe(MetodoEstudo.FEYNMAN);
  });

  it("mantém ausência e percepção insuficiente sem inventar resultado", () => {
    const vazia = calcularDashboardObservacional(modulos, [], [], referencia);
    expect(vazia.estados).toEqual({ semSessoesRecentes: true, percepcaoRecenteInsuficiente: true, semConceitosAnalisados: true });
    expect(vazia.metodosRecentes).toEqual([]);
    expect(vazia.resultadosMetodos).toEqual([]);
    expect(vazia.metodoMaiorCompreensao).toBeNull();
    expect(vazia.evolucaoPercepcoes).toEqual([]);
    expect(vazia.baseHistorica).toMatchObject({ quantidadeSessoes: 0, primeiraSessaoEm: null, ultimaSessaoEm: null });
    expect(vazia.coberturaMetodos.every((item) => item.nivelAmostra === "AUSENTE")).toBe(true);

    const unica = calcularDashboardObservacional(modulos, [sessao("unica", "2026-09-20T12:00:00.000Z")], [], referencia);
    expect(unica.percepcoesRecentes).toMatchObject({ amostra: 1, mediaCompreensaoPercebida: null, mediaDificuldadePercebida: null });
    expect(unica.resultadosMetodos[0]).toMatchObject({ quantidadeSessoes: 1, quantidadeCompreensoes: 1, mediaCompreensaoPercebida: null, nivelAmostra: "INSUFICIENTE" });
    expect(unica.metodoMaiorCompreensao).toBeNull();
    expect(unica.evolucaoPercepcoes[0]).toMatchObject({ quantidadePercepcoes: 1, mediaCompreensaoPercebida: null });
  });

  it("deduplica conceitos e sessões mencionadas somente no módulo do material", () => {
    const materiais: MaterialParaDashboard[] = [
      { id: "a1", moduloId: "m1", titulo: "Árvores", conceitos: ["Árvores de decisão", "arvores de decisao"] },
      { id: "a2", moduloId: "m1", titulo: "Outro arquivo", conceitos: ["árvores de decisão"] },
      { id: "a3", moduloId: "m2", titulo: "Árvores em outro módulo", conceitos: ["árvores de decisão"] },
      { id: "externo", moduloId: "alheio", titulo: "Privado", conceitos: ["segredo"] },
    ];
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("s1", "2026-09-19T12:00:00.000Z", { descricao: "Estudei árvores de decisão." }),
      sessao("s2", "2026-09-18T12:00:00.000Z", { moduloId: "m2", descricao: "Revisei outro conceito." }),
      sessao("s3", "2026-09-17T12:00:00.000Z", { moduloId: "m2", descricao: "Árvores de decisão em exercício.", arquivada: true }),
      sessao("s4", "2026-09-16T12:00:00.000Z", { situacao: SituacaoSessao.INVALIDADA }),
    ], materiais, referencia);
    expect(resultado.conceitos).toHaveLength(1);
    expect(resultado.conceitos[0]).toMatchObject({ chave: "arvores de decisao", quantidadeMateriais: 3, quantidadeSessoesMencionadas: 2 });
    expect(resultado.conceitos[0].sessoesMencionadas.map((item) => item.id)).toEqual(["s1", "s3"]);
    expect(resultado.baseHistorica.quantidadeMateriaisAnalisados).toBe(3);
    expect(JSON.stringify(resultado)).not.toContain("Estudei árvores de decisão");
  });

  it("aponta dificuldade autorrelatada só com amostra suficiente no módulo", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("s1", "2026-09-01T12:00:00.000Z", { dificuldadePercebida: 4 }),
      sessao("s2", "2026-09-08T12:00:00.000Z", { dificuldadePercebida: 4 }),
      sessao("s3", "2026-09-10T12:00:00.000Z", { moduloId: "m2", dificuldadePercebida: 5 }),
    ], [], referencia);
    expect(resultado.pontoAtencao).toMatchObject({ moduloId: "m1", tituloModulo: "Módulo um", mediaDificuldadePercebida: 4, amostra: 2 });

    const insuficiente = calcularDashboardObservacional(modulos, [sessao("s1", "2026-09-01T12:00:00.000Z", { dificuldadePercebida: 5 })], [], referencia);
    expect(insuficiente.pontoAtencao).toBeNull();
  });

  it("sugere exploração de método pouco registrado sem atribuir eficácia", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("s1", "2026-09-01T12:00:00.000Z"),
      sessao("s2", "2026-09-08T12:00:00.000Z", { metodos: [MetodoEstudo.FEYNMAN, MetodoEstudo.POMODORO] }),
    ], [], referencia);
    expect(resultado.proximoExperimento).toMatchObject({ metodo: MetodoEstudo.RECUPERACAO_ATIVA, quantidadeSessoes: 0 });
    expect(resultado.descobertasRecentes.length).toBeGreaterThanOrEqual(2);
    expect(resultado.descobertasRecentes.length).toBeLessThanOrEqual(4);
    expect(resultado.descobertasRecentes.every((item) => item.amostra >= 2 && item.periodoInicio.toISOString() === "2026-06-23T12:00:00.000Z")).toBe(true);
    expect(JSON.stringify(resultado.descobertasRecentes)).not.toMatch(/eficaz|melhor método|desempenho observado/i);

    const semHistorico = calcularDashboardObservacional(modulos, [], [], referencia);
    expect(semHistorico.proximoExperimento).toBeNull();
    expect(semHistorico.descobertasRecentes).toEqual([]);
  });

  it("oferece métricas secundárias do histórico sem misturar a janela recente", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("antiga", "2026-02-01T12:00:00.000Z", { duracaoMinutos: 40 }),
      sessao("recente", "2026-09-01T12:00:00.000Z", { duracaoMinutos: 20 }),
    ], [], referencia);
    expect(resultado.metricasSecundarias).toEqual({ minutosTotais: 60, quantidadeSessoes: 2, diasComEstudo: 2, mediaMinutos: 30 });
    expect(resultado.periodoRecente.quantidadeSessoes).toBe(1);
  });

  it("recalcula todo o Dashboard somente com o período filtrado", () => {
    const inicio = new Date("2026-08-01T00:00:00.000Z");
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("anterior", "2026-07-31T23:59:59.999Z", { metodos: [MetodoEstudo.POMODORO], compreensaoPercebida: 1 }),
      sessao("inicio", "2026-08-01T00:30:00.000Z", { metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 5 }),
      sessao("fim", "2026-09-21T12:00:00.000Z", { metodos: [MetodoEstudo.FEYNMAN], compreensaoPercebida: 4 }),
    ], [], referencia, inicio);

    expect(resultado.periodoFiltrado).toBe(true);
    expect(resultado.periodoRecente).toMatchObject({ inicio, fim: referencia, quantidadeSessoes: 2 });
    expect(resultado.baseHistorica.quantidadeSessoes).toBe(2);
    expect(resultado.resultadosMetodos).toEqual([expect.objectContaining({ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 2 })]);
    expect(resultado.resultadosMetodos.some((item) => item.chave === MetodoEstudo.POMODORO)).toBe(false);
  });

  it("consolida percepção e evidências posteriores por método e formato entre módulos", () => {
    const resultado = calcularDashboardObservacional(modulos, [
      sessao("s1", "2026-09-18T12:00:00.000Z"),
      sessao("s2", "2026-09-19T12:00:00.000Z", { moduloId: "m2" }),
    ], [], referencia, null, [
      {
        metodosResultados: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4.5, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: true }],
        formatosResultados: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4.5, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: true }],
        resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 2, compreensaoMinima: 4, desempenhoMinimo: 70 } },
      },
      {
        metodosResultados: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 1, quantidadeCompreensoes: 1, compreensaoMedia: 3, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 60, amostraEvidenciasSuficiente: false }],
        formatosResultados: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 1, quantidadeCompreensoes: 1, compreensaoMedia: 3, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 60, amostraEvidenciasSuficiente: false }],
        resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 60, quantidadeSessoes: 1, compreensaoMinima: 4, desempenhoMinimo: 70 } },
      },
    ]);

    expect(resultado.resultadosMetodosEvidencias[0]).toMatchObject({ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 3, desempenhoMedioPosterior: 220 / 3, amostraEvidenciasSuficiente: true });
    expect(resultado.resultadosFormatosEvidencias[0]).toMatchObject({ chave: FormatoConteudo.TEXTO, quantidadeCompreensoes: 3, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 3, desempenhoMedioPosterior: 220 / 3 });
    expect(resultado.formatoMaiorCompreensao).toMatchObject({ chave: FormatoConteudo.TEXTO, quantidadeCompreensoes: 3, compreensaoMedia: 4 });
    expect(resultado.duracaoSessoesMelhoresResultados).toEqual({ mediaMinutos: 40, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 });
  });

  it("não destaca formato nem duração quando a amostra é insuficiente", () => {
    const resultado = calcularDashboardObservacional(modulos, [], [], referencia, null, [{
      metodosResultados: [],
      formatosResultados: [{ chave: FormatoConteudo.IMAGEM, quantidadeSessoes: 1, quantidadeCompreensoes: 1, compreensaoMedia: 5, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 100, amostraEvidenciasSuficiente: false }],
      resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: null, quantidadeSessoes: 0, compreensaoMinima: 4, desempenhoMinimo: 70 } },
    }]);

    expect(resultado.formatoMaiorCompreensao).toBeNull();
    expect(resultado.duracaoSessoesMelhoresResultados.mediaMinutos).toBeNull();
  });

  it("ordena a consistência dos métodos entre módulos pela proporção positiva", () => {
    const analise = (moduloId: string, metodosResultados: Array<{ chave: string; quantidadeSessoes: number; quantidadeCompreensoes: number; compreensaoMedia: number | null; quantidadeEvidenciasPosteriores: number; desempenhoMedioPosterior: number | null; amostraEvidenciasSuficiente: boolean }>) => ({
      moduloId,
      metodosResultados,
      formatosResultados: [],
      resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: null, quantidadeSessoes: 0, compreensaoMinima: 4, desempenhoMinimo: 70 } },
    });
    const positivo = (chave: string, evidencias = 3) => ({ chave, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4.2, quantidadeEvidenciasPosteriores: evidencias, desempenhoMedioPosterior: 78, amostraEvidenciasSuficiente: true });
    const negativo = (chave: string, evidencias = 3) => ({ chave, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 3.8, quantidadeEvidenciasPosteriores: evidencias, desempenhoMedioPosterior: 65, amostraEvidenciasSuficiente: true });

    const resultado = calcularDashboardObservacional(modulos, [], [], referencia, null, [
      analise("m1", [positivo(MetodoEstudo.FEYNMAN), positivo(MetodoEstudo.POMODORO)]),
      analise("m2", [positivo(MetodoEstudo.FEYNMAN), negativo(MetodoEstudo.POMODORO)]),
      analise("m3", [negativo(MetodoEstudo.FEYNMAN), negativo(MetodoEstudo.POMODORO)]),
      analise("m4", [positivo(MetodoEstudo.RECUPERACAO_ATIVA, 2)]),
      analise("m5", [{ ...positivo(MetodoEstudo.FEYNMAN), quantidadeCompreensoes: 1 }]),
    ]);

    expect(resultado.consistenciaMetodos).toEqual([
      expect.objectContaining({ chave: MetodoEstudo.RECUPERACAO_ATIVA, modulosPositivos: 1, modulosAnalisaveis: 1, quantidadeEvidencias: 2, poucosDados: true }),
      expect.objectContaining({ chave: MetodoEstudo.FEYNMAN, modulosPositivos: 2, modulosAnalisaveis: 3, quantidadeEvidencias: 9, poucosDados: false }),
      expect.objectContaining({ chave: MetodoEstudo.POMODORO, modulosPositivos: 1, modulosAnalisaveis: 3, quantidadeEvidencias: 9, poucosDados: false }),
    ]);
  });

  it("omite métodos sem nenhum módulo com amostra analisável", () => {
    const resultado = calcularDashboardObservacional(modulos, [], [], referencia, null, [{
      moduloId: "m1",
      metodosResultados: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 1, quantidadeCompreensoes: 1, compreensaoMedia: 5, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 100, amostraEvidenciasSuficiente: false }],
      formatosResultados: [],
      resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: null, quantidadeSessoes: 0, compreensaoMinima: 4, desempenhoMinimo: 70 } },
    }]);
    expect(resultado.consistenciaMetodos).toEqual([]);
  });
});
