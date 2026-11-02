import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TextoCartaoModulo } from "./texto-cartao-modulo";

describe("#textcardmodule", () => {
  it("preserva a tipografia reutilizável dos nomes nos cartões escuros", () => {
    const html = renderToStaticMarkup(createElement(TextoCartaoModulo, null, "Sala de estudos"));
    const estilos = readFileSync(resolve(process.cwd(), "src/componentes/texto-cartao-modulo.module.css"), "utf8");

    expect(html).toMatch(/<strong[^>]*>Sala de estudos<\/strong>/);
    expect(html).toContain("textoCartaoModulo");
    expect(estilos).toMatch(/\.textoCartaoModulo\s*\{[^}]*color:\s*#fff[^}]*font-family:\s*Inter[^}]*font-size:\s*\.98rem[^}]*font-weight:\s*700[^}]*line-height:\s*1\.3/is);
  });
});
