import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularMetricasSessoes, classificarAmostraSessoes, type SessaoParaMetricasSessoes } from "./metricas-sessoes";

function sessao(id: string, opcoes: Partial<SessaoParaMetricasSessoes> = {}): SessaoParaMetricasSessoes {
  const dia = Number(id.replace(/\D/g, "")) || 1;
  return {
    id,
    moduloId: "modulo-a",
    descricao: `Sessão ${id}`,
    iniciadaEm: new Date(`2026-09-${String(dia).padStart(2, "0")}T10:00:00.000Z`),
    encerradaEm: new Date(`2026-09-${String(dia).padStart(2, "0")}T10:30:00.000Z`),
    duracaoMinutos: 30,
    situacao: SituacaoSessao.CONCLUIDA,
    arquivada: false,
    dificuldadePercebida: 3,
    compreensaoPercebida: 4,
    metodos: [MetodoEstudo.FEYNMAN],
    formatos: [FormatoConteudo.TEXTO],
    ...opcoes,
  };
}

describe("métricas oficiais por sessões", () => {
  it("representa ausência sem inventar médias ou frequência", () => {
    const metricas = calcularMetricasSessoes([], "modulo-a");
    expect(metricas.versaoAlgoritmo).toBe("metricas-sessoes-v1");
    expect(metricas.tempoEstudo).toEqual({ quantidadeSessoesValidas: 0, minutosTotais: 0, mediaMinutos: null });
    expect(metricas.frequencia).toMatchObject({ diasComEstudo: 0, maiorSequenciaDias: 0, primeiraSessaoEm: null, ultimaSessaoEm: null });
    expect(metricas.percepcoes).toMatchObject({ amostra: 0, mediaDificuldadePercebida: null, nivelAmostra: "AUSENTE" });
    expect(metricas.evolucaoSemanal.pontos).toEqual([]);
  });

  it("inclui concluídas arquivadas e exclui planejadas, ativas e invalidadas", () => {
    const metricas = calcularMetricasSessoes([
      sessao("s1"),
      sessao("s2", { arquivada: true, duracaoMinutos: 45 }),
      sessao("s3", { situacao: SituacaoSessao.PLANEJADA }),
      sessao("s4", { situacao: SituacaoSessao.ATIVA, encerradaEm: null, duracaoMinutos: null }),
      sessao("s5", { situacao: SituacaoSessao.INVALIDADA, duracaoMinutos: 1 }),
    ], "modulo-a");
    expect(metricas.tempoEstudo).toEqual({ quantidadeSessoesValidas: 2, minutosTotais: 75, mediaMinutos: 37.5 });
    expect(metricas.criterios).toMatchObject({ planejadasExcluidas: true, arquivadasIncluidas: true });
  });

  it("agrega métodos e formatos múltiplos sem tratá-los como categorias exclusivas", () => {
    const metricas = calcularMetricasSessoes([
      sessao("s1", { metodos: [MetodoEstudo.FEYNMAN, MetodoEstudo.POMODORO], formatos: [FormatoConteudo.TEXTO, FormatoConteudo.PDF] }),
      sessao("s2", { metodos: [MetodoEstudo.FEYNMAN], formatos: [FormatoConteudo.PDF], duracaoMinutos: 60 }),
    ], "modulo-a");
    expect(metricas.porMetodo[0]).toMatchObject({ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 2, minutosAssociados: 90, percentualSessoes: 1 });
    expect(metricas.porMetodo.find((item) => item.chave === MetodoEstudo.POMODORO)).toMatchObject({ quantidadeSessoes: 1, minutosAssociados: 30, nivelAmostra: "INSUFICIENTE" });
    expect(metricas.porFormato.find((item) => item.chave === FormatoConteudo.PDF)?.quantidadeSessoes).toBe(2);
    expect(metricas.criterios.contextosMultiplosNaoExclusivos).toBe(true);
  });

  it("calcula frequência e evolução semanal UTC com percepções somente após amostra mínima", () => {
    const metricas = calcularMetricasSessoes([
      sessao("s1", { dificuldadePercebida: 2, compreensaoPercebida: 4 }),
      sessao("s2", { dificuldadePercebida: 4, compreensaoPercebida: 2 }),
      sessao("s3", { dificuldadePercebida: null, compreensaoPercebida: null }),
      sessao("s9", { dificuldadePercebida: 5, compreensaoPercebida: 1 }),
    ], "modulo-a");
    expect(metricas.frequencia).toMatchObject({ diasComEstudo: 4, maiorSequenciaDias: 3 });
    expect(metricas.percepcoes).toMatchObject({ amostra: 3, mediaDificuldadePercebida: 11 / 3, mediaCompreensaoPercebida: 7 / 3, nivelAmostra: "INICIAL" });
    expect(metricas.evolucaoSemanal.pontos).toHaveLength(2);
    expect(metricas.evolucaoSemanal.pontos[0]).toMatchObject({ quantidadeSessoes: 3, minutosTotais: 90, diasComEstudo: 3, quantidadePercepcoes: 2, mediaDificuldadePercebida: 3 });
    expect(metricas.evolucaoSemanal.pontos[1]).toMatchObject({ quantidadeSessoes: 1, quantidadePercepcoes: 1, mediaDificuldadePercebida: null });
  });

  it("restringe o cálculo ao módulo solicitado", () => {
    const metricas = calcularMetricasSessoes([sessao("s1"), sessao("s2", { moduloId: "modulo-b", duracaoMinutos: 90 })], "modulo-a");
    expect(metricas.tempoEstudo).toMatchObject({ quantidadeSessoesValidas: 1, minutosTotais: 30 });
  });

  it("classifica amostra de forma explícita", () => {
    expect([0, 1, 2, 5].map(classificarAmostraSessoes)).toEqual(["AUSENTE", "INSUFICIENTE", "INICIAL", "RECORRENTE"]);
  });
});
