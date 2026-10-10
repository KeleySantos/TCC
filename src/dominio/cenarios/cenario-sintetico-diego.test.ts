import { describe, expect, it } from "vitest";
import { normalizarConceito } from "@/dominio/analises/analise-material";
import { CENARIO_SINTETICO_DIEGO } from "./cenario-sintetico-diego";

describe("cenário sintético rico de Diego", () => {
  it("oferece volume e variedade para os gráficos e a interpretação", () => {
    const sessoes = CENARIO_SINTETICO_DIEGO.sessoes;
    const metodos = new Map<string, number>();
    const formatos = new Set(sessoes.flatMap((sessao) => sessao.formatos));

    for (const sessao of sessoes) {
      for (const metodo of sessao.metodos) metodos.set(metodo, (metodos.get(metodo) ?? 0) + 1);
      expect(sessao.formatos.length).toBeGreaterThanOrEqual(2);
      expect(sessao.dificuldadePercebida).toBeGreaterThanOrEqual(1);
      expect(sessao.dificuldadePercebida).toBeLessThanOrEqual(5);
      expect(sessao.compreensaoPercebida).toBeGreaterThanOrEqual(1);
      expect(sessao.compreensaoPercebida).toBeLessThanOrEqual(5);
      expect(sessao.descricao.length).toBeGreaterThan(45);
    }

    expect(sessoes.length).toBeGreaterThanOrEqual(20);
    expect(metodos.size).toBe(4);
    expect([...metodos.values()].every((quantidade) => quantidade >= 8)).toBe(true);
    expect(formatos.size).toBe(10);
    expect(new Set(sessoes.map((sessao) => sessao.compreensaoPercebida))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(new Set(sessoes.map((sessao) => sessao.dificuldadePercebida))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(sessoes.reduce((total, sessao) => total + sessao.dificuldadePercebida, 0) / sessoes.length).toBeGreaterThanOrEqual(3);
  });

  it("relaciona generosamente conceitos dos arquivos às descrições das sessões", () => {
    const conceitos = CENARIO_SINTETICO_DIEGO.materiais.flatMap((material) => material.conceitos);
    const descricoes = CENARIO_SINTETICO_DIEGO.sessoes.map((sessao) => ` ${normalizarConceito(sessao.descricao)} `);
    const quantidades = conceitos.map((conceito) => descricoes.filter((descricao) => descricao.includes(` ${normalizarConceito(conceito)} `)).length);

    expect(CENARIO_SINTETICO_DIEGO.materiais.length).toBeGreaterThanOrEqual(5);
    expect(new Set(conceitos.map(normalizarConceito)).size).toBeGreaterThanOrEqual(20);
    expect(quantidades.every((quantidade) => quantidade >= 2)).toBe(true);
    expect(CENARIO_SINTETICO_DIEGO.sessoes.every((sessao) => sessao.materiais.length >= 1)).toBe(true);
  });
});
