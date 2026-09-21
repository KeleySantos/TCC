import { describe, expect, it } from "vitest";
import { compararConceitosComSessoes, gerarAnaliseMaterialLocal, normalizarConceito } from "./analise-material";

describe("análise local de materiais", () => {
  it("extrai conceitos recorrentes sem transformar o resultado em avaliação", () => {
    const resultado = gerarAnaliseMaterialLocal("Algoritmos organizam dados. Algoritmos de ordenação permitem comparar dados e estruturas.");
    expect(resultado.conceitos).toContain("algoritmos");
    expect(resultado.resumo).toContain("Algoritmos");
    expect(JSON.stringify(resultado)).not.toMatch(/nota|domínio comprovado/i);
  });

  it("compara conceitos normalizados somente com descrições", () => {
    expect(normalizarConceito("Ordenação Ágil")).toBe("ordenacao agil");
    expect(compararConceitosComSessoes(["algoritmos", "árvores"], [
      { id: "s1", descricao: "Pratiquei algoritmos de ordenação." },
      { id: "s2", descricao: "Revisei banco de dados." },
    ])).toEqual([
      { conceito: "algoritmos", quantidadeSessoes: 1, sessoes: ["s1"] },
      { conceito: "árvores", quantidadeSessoes: 0, sessoes: [] },
    ]);
  });
});
