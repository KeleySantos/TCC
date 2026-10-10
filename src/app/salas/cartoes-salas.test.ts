import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoModuloSala, GradeSalas } from "./cartoes-salas";

describe("cartões das salas", () => {
  it("organiza as salas como links com nome e contexto resumido", () => {
    const html = renderToStaticMarkup(createElement(GradeSalas, { salas: [{
      id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", papel: "MEMBRO", situacao: "ATIVA",
      _count: { modulos: 3, membros: 5 },
    }] }));

    expect(html).toContain('href="/salas/grupo-js"');
    expect(html).toContain("Grupo JavaScript");
    expect(html).toContain("3 módulos");
    expect(html).toContain("5 membros");
    expect(html).toContain("Você é membro");
  });

  it("apresenta cada módulo da sala como card e preserva suas ações", () => {
    const html = renderToStaticMarkup(createElement(CartaoModuloSala, {
      titulo: "Fundamentos",
      descricao: "Base compartilhada da sala.",
      resumo: "2 instâncias",
    }, createElement("button", null, "Vincular módulo")));

    expect(html).toContain("Fundamentos");
    expect(html).toContain("Base compartilhada da sala.");
    expect(html).toContain("2 instâncias");
    expect(html).toContain("Vincular módulo");
  });
});
