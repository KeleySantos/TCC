import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { recomendarMateriais } from "@/dominio/analises/recomendacoes-materiais";
import { PainelRecomendacoesMateriais } from "./painel-recomendacoes-materiais";

describe("apresentação da recomendação oficial sem IA", () => {
  it("mostra seleção, regra, amostra e limites calculados", () => {
    const recomendacoes = recomendarMateriais({ usuarioId: "u1", moduloId: "m1", conceitos: [{ id: "c1", nome: "Conceito", desempenhoMedio: 40, compreensaoMedia: 2, dificuldadeMedia: 4, evidencias: 2 }], materiais: [{ id: "mat1", titulo: "Texto de revisão", usuarioId: "u1", moduloId: "m1", disponivel: true, conceitoIds: ["c1"] }] });
    const html = renderToStaticMarkup(createElement(PainelRecomendacoesMateriais, { recomendacoes }));
    expect(html).toContain("Texto de revisão");
    expect(html).toContain("RM-01");
    expect(html).toContain("n=2 evidências válidas");
    expect(html).toContain("Base limitada");
    expect(html).toContain("40.0%");
    expect(html).toContain("não demonstram causalidade");
  });
  it("explica início a frio sem material ou falsa personalização", () => {
    const html = renderToStaticMarkup(createElement(PainelRecomendacoesMateriais, { recomendacoes: recomendarMateriais({ usuarioId: "u1", moduloId: "m1", conceitos: [], materiais: [] }) }));
    expect(html).toContain("Exploração inicial");
    expect(html).toContain("RM-03");
    expect(html).toContain("n=0");
  });
});
