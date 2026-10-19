import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutDashboardModulo } from "./layout-dashboard-modulo";

describe("layout do Dashboard do módulo", () => {
  it("apresenta as análises em largura completa, sem coluna lateral de IA", () => {
    const html = renderToStaticMarkup(createElement(LayoutDashboardModulo, {
      conteudo: createElement("section", null, "Análises do módulo"),
    }));

    expect(html).toContain("Análises do módulo");
    expect(html).not.toContain("<aside");
  });
});
