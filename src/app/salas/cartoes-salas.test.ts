import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoModuloSala, GradeSalas } from "./cartoes-salas";

describe("cartões das salas", () => {
  it("organiza as salas como links com nome e papel, sem descrição ou contagens", () => {
    const html = renderToStaticMarkup(createElement(GradeSalas, { salas: [{
      id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", descricao: "Descrição que não aparece no card", papel: "MEMBRO", situacao: "ATIVA",
      _count: { modulos: 3, membros: 5 },
    }] }));

    expect(html).toContain('href="/salas/grupo-js"');
    expect(html).toContain("Grupo JavaScript");
    expect(html).not.toContain("3 módulos");
    expect(html).not.toContain("5 membros");
    expect(html).not.toContain("Descrição que não aparece no card");
    expect(html).toContain("Você é membro");
  });

  it("apresenta cada módulo da sala como link para sua página própria", () => {
    const html = renderToStaticMarkup(createElement(CartaoModuloSala, {
      href: "/salas/grupo-js/modulos/modulo-1",
      titulo: "Fundamentos",
      descricao: "Base compartilhada da sala.",
      resumo: "2 instâncias",
    }));

    expect(html).toContain('href="/salas/grupo-js/modulos/modulo-1"');
    expect(html).toContain('aria-label="Abrir módulo Fundamentos"');
    expect(html).toContain("Fundamentos");
    expect(html).toContain("Base compartilhada da sala.");
    expect(html).toContain("2 instâncias");
  });
});
