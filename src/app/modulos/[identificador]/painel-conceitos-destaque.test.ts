import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PainelConceitosDestaque } from "./painel-conceitos-destaque";

const conceito = { chave: "closures", nome: "Closures", sessoes: 3, evidencias: 1, observacoes: 4, quantidadeCompreensoes: 3, quantidadeDificuldades: 3, compreensaoMedia: 2.3, dificuldadeMedia: 4.4, desempenhoMedio: 48, evidenciasSuficientes: false, indice: 70, ultimaObservacaoEm: new Date("2026-09-20T12:00:00.000Z") };

describe("conceitos em destaque", () => {
  it("explica os sinais dos rankings e a insuficiência de evidências", () => {
    const html = renderToStaticMarkup(createElement(PainelConceitosDestaque, { maiorDificuldade: [conceito], maiorCompreensao: [{ ...conceito, chave: "arrays", nome: "Arrays", compreensaoMedia: 4.8, dificuldadeMedia: 1.4, desempenhoMedio: 91, evidencias: 3, evidenciasSuficientes: true }] }));
    expect(html).toContain("Conceitos com maiores sinais de dificuldade");
    expect(html).toContain("Conceitos com maiores sinais de compreensão");
    expect(html).toContain("Dificuldade percebida: 4,4/5");
    expect(html).toContain("Compreensão percebida: 2,3/5");
    expect(html).toContain("Evidências ainda insuficientes");
    expect(html).toContain("91%");
    expect(html).toContain("Índice exploratório");
    expect(html).toContain("<ul");
    expect(html).not.toContain("<ol");
  });

  it("apresenta estado vazio quando nenhum conceito possui base mínima", () => {
    const html = renderToStaticMarkup(createElement(PainelConceitosDestaque, { maiorDificuldade: [], maiorCompreensao: [] }));
    expect(html.match(/Ainda não há dados suficientes para classificar conceitos/g)).toHaveLength(2);
  });
});
