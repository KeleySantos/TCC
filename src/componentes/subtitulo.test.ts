import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Subtitulo } from "./subtitulo";

describe("Subtitulo", () => {
  it("preserva o conteúdo e permite escolher o nível semântico", () => {
    expect(renderToStaticMarkup(createElement(Subtitulo, { id: "secao" }, "Título reutilizável")))
      .toMatch(/<h2[^>]*id="secao"[^>]*>Título reutilizável<\/h2>/);
    expect(renderToStaticMarkup(createElement(Subtitulo, { nivel: 3 }, "Subseção")))
      .toMatch(/<h3[^>]*>Subseção<\/h3>/);
  });

  it("permite aplicar o mesmo design a uma descrição sem transformá-la em título", () => {
    const html = renderToStaticMarkup(createElement(Subtitulo, { como: "p" }, "Descrição da página"));

    expect(html).toMatch(/<p[^>]*class="[^"]*subtitulo[^"]*"[^>]*>Descrição da página<\/p>/);
  });
});
