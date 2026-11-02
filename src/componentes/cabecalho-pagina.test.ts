import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CabecalhoPagina } from "./cabecalho-pagina";

describe("CabecalhoPagina", () => {
  it("mantem a trilha superior reservada quando nao ha pre-titulo", () => {
    const html = renderToStaticMarkup(createElement(CabecalhoPagina, {
      titulo: "Módulos",
      descricao: "Organize seus estudos.",
    }));

    expect(html).toMatch(/^<header/);
    expect(html).toMatch(/<div[^>]*aria-hidden="true"[^>]*data-trilha-pre-titulo="vazia"/);
    expect(html).toContain("<h1>Módulos</h1>");
    expect(html).toMatch(/<p[^>]*>Organize seus estudos.<\/p>/);
  });

  it("renderiza pre-titulo e acoes nos slots semanticos", () => {
    const html = renderToStaticMarkup(createElement(CabecalhoPagina, {
      titulo: "Dashboard",
      preTitulo: "Olá, Ana!",
      acoes: createElement("button", { type: "button" }, "Filtrar"),
    }));

    expect(html).toMatch(/<div[^>]*data-trilha-pre-titulo="preenchida"[^>]*>Olá, Ana!<\/div>/);
    expect(html).toMatch(/<div[^>]*data-acoes-cabecalho="true"[^>]*><button type="button">Filtrar<\/button><\/div>/);
  });
});
