import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { calcularComparacaoDesafio } from "./comparar-desafio";
import type { SessaoParaMetricas, TentativaParaMetricas } from "./metricas-modulo";

const data = (dia: number) => new Date(`2026-09-${String(dia).padStart(2, "0")}T12:00:00.000Z`);
const sessao = (id: string, dia: number, desafioId: string | null): SessaoParaMetricas => ({
  id,
  moduloId: "m1",
  topicoId: "t1",
  formato: FormatoConteudo.TEXTO,
  metodo: MetodoEstudo.FEYNMAN,
  desafioId,
  encerradaEm: data(dia),
  duracaoMinutos: 15,
  situacao: "CONCLUIDA",
});
const tentativa = (id: string, dia: number, nota: number, numeroTentativa: number): TentativaParaMetricas => ({
  id,
  moduloId: "m1",
  topicoId: "t1",
  concluidaEm: data(dia),
  notaNormalizada: nota,
  numeroTentativa,
  respostasCorretas: Math.round(nota / 20),
  totalQuestoes: 5,
});
const desafio = { id: "d1", moduloId: "m1", metodo: MetodoEstudo.FEYNMAN };

describe("comparação contextual de desafio", () => {
  it("calcula diferença somente com duas evidências únicas em cada grupo", () => {
    const resultado = calcularComparacaoDesafio(
      desafio,
      [sessao("sd1", 1, "d1"), sessao("sd2", 10, "d1"), sessao("sc1", 20, null), sessao("sc2", 29, null)],
      [tentativa("td1", 2, 80, 1), tentativa("td2", 11, 100, 2), tentativa("tc1", 21, 60, 3), tentativa("tc2", 30, 80, 4)],
    );
    expect(resultado.desafio).toMatchObject({ quantidadeEvidencias: 2, mediaNotas: 90, nivelEvidencia: "INICIAL" });
    expect(resultado.contextoExterno).toMatchObject({ quantidadeEvidencias: 2, mediaNotas: 70, nivelEvidencia: "INICIAL" });
    expect(resultado).toMatchObject({ comparavel: true, diferencaMedias: 20, versaoAlgoritmo: "comparacao-desafio-v1" });
  });

  it("preserva a amostra mas não calcula diferença abaixo do mínimo", () => {
    const resultado = calcularComparacaoDesafio(desafio, [sessao("sd1", 1, "d1"), sessao("sc1", 10, null)], [tentativa("td1", 2, 100, 1), tentativa("tc1", 11, 0, 2)]);
    expect(resultado.desafio).toMatchObject({ quantidadeEvidencias: 1, mediaNotas: null, nivelEvidencia: "INSUFICIENTE" });
    expect(resultado.contextoExterno).toMatchObject({ quantidadeEvidencias: 1, mediaNotas: null, nivelEvidencia: "INSUFICIENTE" });
    expect(resultado).toMatchObject({ comparavel: false, diferencaMedias: null });
  });

  it("exclui exposição mista antes de comparar", () => {
    const outraSessao: SessaoParaMetricas = { ...sessao("mistura", 1, null), metodo: MetodoEstudo.POMODORO };
    const resultado = calcularComparacaoDesafio(desafio, [sessao("sd1", 1, "d1"), outraSessao], [tentativa("td1", 2, 100, 1)]);
    expect(resultado.desafio.quantidadeEvidencias).toBe(0);
    expect(resultado.diferencaMedias).toBeNull();
  });
});
