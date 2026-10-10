import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutDashboardModulo } from "./layout-dashboard-modulo";

describe("layout do Dashboard do módulo", () => {
  it("mantém análises na coluna principal e insights da IA em uma lateral identificada", () => {
    const html = renderToStaticMarkup(createElement(LayoutDashboardModulo, {
      conteudo: createElement("section", null, "Análises do módulo"),
      insights: createElement("section", null, "Insights da IA"),
    }));

    expect(html.indexOf("Análises do módulo")).toBeLessThan(html.indexOf("Insights da IA"));
    expect(html).toContain('aria-label="Interpretação opcional do módulo"');
  });
});
