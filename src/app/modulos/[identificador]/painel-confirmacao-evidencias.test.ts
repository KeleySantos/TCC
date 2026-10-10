import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PainelConfirmacaoEvidencias } from "./painel-confirmacao-evidencias";

vi.mock("./acoes-aprendizagem", () => ({ confirmarEvidencia: async () => undefined, rejeitarEvidencia: async () => undefined }));

describe("confirmação de evidências", () => {
  it("preserva a revisão geral e por questão", () => {
    const html = renderToStaticMarkup(createElement(PainelConfirmacaoEvidencias, {
      caminho: "/modulos/javascript",
      conceitos: [{ id: "c1", chave: "promises", nome: "Promises", aliases: [] }],
      evidencias: [{ id: "e1", titulo: "Prova", dataEvento: new Date("2026-09-20T00:00:00.000Z"), situacaoConfirmacao: "PENDENTE", desempenhoPercentual: 75, conceitos: [{ conceitoId: "c1" }], questoes: [{ id: "q1", identificador: "1", resumo: "Aplicar promise", tipo: "APLICACAO", resultado: "PARCIAL", pontuacaoObtida: 0.5, pontuacaoMaxima: 1, conceitos: [{ conceitoId: "c1" }] }] }],
    } as never));
    expect(html).toContain("Confirmar evidências extraídas");
    expect(html).toContain("Conceitos associados");
    expect(html).toContain("Conceitos da questão");
    expect(html).toContain("Confirmar e usar nas análises");
    expect(html).toContain("Rejeitar extração");
  });

  it("não ocupa espaço quando não existem pendências", () => {
    expect(renderToStaticMarkup(createElement(PainelConfirmacaoEvidencias, { caminho: "/modulos/javascript", conceitos: [], evidencias: [] } as never))).toBe("");
  });
});
