import { describe, expect, it } from "vitest";
import { MetodoEstudo } from "@/gerado/prisma/enums";
import { calcularComparacaoDesafio, type SessaoParaComparacaoDesafio } from "./comparar-desafio";

const data = (dia: number) => new Date(`2026-09-${String(dia).padStart(2, "0")}T12:00:00.000Z`);
const sessao = (id: string, dia: number, desafioId: string | null, duracaoMinutos: number, dificuldade: number, compreensao: number): SessaoParaComparacaoDesafio => ({
  id, moduloId: "m1", desafioId, encerradaEm: data(dia), duracaoMinutos, situacao: "CONCLUIDA",
  dificuldadePercebida: dificuldade, compreensaoPercebida: compreensao, metodos: [MetodoEstudo.FEYNMAN],
});
const desafio = { id: "d1", moduloId: "m1", metodo: MetodoEstudo.FEYNMAN };

describe("comparação contextual de desafio por sessões", () => {
  it("compara duração e percepções somente com duas sessões em cada grupo", () => {
    const resultado = calcularComparacaoDesafio(desafio, [
      sessao("sd1", 1, "d1", 20, 3, 4), sessao("sd2", 2, "d1", 30, 2, 5),
      sessao("sc1", 3, null, 15, 4, 2), sessao("sc2", 4, null, 25, 3, 3),
    ]);
    expect(resultado.desafio).toMatchObject({ quantidadeSessoes: 2, minutosTotais: 50, mediaDuracaoMinutos: 25, mediaDificuldadePercebida: 2.5, mediaCompreensaoPercebida: 4.5, nivelAmostra: "INICIAL" });
    expect(resultado.contextoExterno).toMatchObject({ quantidadeSessoes: 2, minutosTotais: 40, mediaDuracaoMinutos: 20, mediaCompreensaoPercebida: 2.5 });
    expect(resultado).toMatchObject({ comparavel: true, diferencaDuracaoMedia: 5, diferencaDificuldadePercebida: -1, diferencaCompreensaoPercebida: 2, versaoAlgoritmo: "comparacao-desafio-v2-sessoes" });
  });

  it("preserva a amostra sem publicar médias abaixo do mínimo", () => {
    const resultado = calcularComparacaoDesafio(desafio, [sessao("sd1", 1, "d1", 20, 3, 4), sessao("sc1", 2, null, 15, 4, 2)]);
    expect(resultado.desafio).toMatchObject({ quantidadeSessoes: 1, minutosTotais: 20, mediaDuracaoMinutos: null, nivelAmostra: "INSUFICIENTE" });
    expect(resultado).toMatchObject({ comparavel: false, diferencaCompreensaoPercebida: null });
  });

  it("exclui sessões inválidas, curtas e de outro método", () => {
    const resultado = calcularComparacaoDesafio(desafio, [
      { ...sessao("invalida", 1, "d1", 20, 3, 4), situacao: "INVALIDADA" },
      sessao("curta", 2, "d1", 4, 3, 4),
      { ...sessao("outro-metodo", 3, "d1", 20, 3, 4), metodos: [MetodoEstudo.POMODORO] },
    ]);
    expect(resultado.desafio.quantidadeSessoes).toBe(0);
    expect(resultado.comparavel).toBe(false);
  });
});
