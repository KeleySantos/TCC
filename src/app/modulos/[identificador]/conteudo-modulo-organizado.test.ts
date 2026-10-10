import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConteudoModuloOrganizado } from "./conteudo-modulo-organizado";

describe("composição da página do módulo", () => {
  it("mantém o cabeçalho fora das sub-abas e distribui responsabilidades", () => {
    const html = renderToStaticMarkup(createElement(ConteudoModuloOrganizado, {
      cabecalho: createElement("header", null, "Cabeçalho persistente"),
      dashboard: createElement("section", null, "Métodos × Resultados", "Conceitos com maior dificuldade"),
      linhaDoTempo: createElement("section", null, "Trajetória cronológica"),
      periodo: { inicio: "2026-07-01", fim: "2026-07-31", ativo: true, erro: null, hoje: "2026-09-27" },
      sessoesMateriais: createElement("section", null, "Biblioteca operacional"),
    }));

    expect(html.indexOf("Cabeçalho persistente")).toBeLessThan(html.indexOf('role="tablist"'));
    expect(html.match(/Métodos × Resultados/g)).toHaveLength(1);
    expect(html.match(/Trajetória cronológica/g)).toHaveLength(1);
    expect(html.match(/Biblioteca operacional/g)).toHaveLength(1);
    expect(html).toContain(">Filtro<");
    expect(html).toContain('name="inicio"');
    expect(html).toContain('name="fim"');
    expect(html).toContain("Concluir filtro");
    expect(html).toContain("Período filtrado");
  });
});
