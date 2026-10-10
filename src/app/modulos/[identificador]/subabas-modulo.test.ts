import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { calcularIndiceSubaba, SubabasModulo } from "./subabas-modulo";

describe("sub-abas internas do módulo", () => {
  it("renderiza Dashboard ativo e relaciona as três abas aos painéis", () => {
    const html = renderToStaticMarkup(createElement(SubabasModulo, {
      dashboard: createElement("p", null, "Conteúdo analítico"),
      linhaDoTempo: createElement("p", null, "Trajetória"),
      periodo: { inicio: "", fim: "", ativo: false, erro: null, hoje: "2026-09-27" },
      sessoesMateriais: createElement("p", null, "Operação"),
    }));

    expect(html).toContain('role="tablist"');
    expect(html.match(/role="tab"/g)).toHaveLength(3);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="painel-subaba-dashboard"');
    expect(html).toContain('aria-labelledby="subaba-dashboard"');
    expect(html).toContain("Sessões e Materiais");
    expect(html).not.toContain("Sessões / Materiais");
    expect(html).not.toContain("MÓDULO DE APRENDIZAGEM");
  });

  it("calcula navegação circular por setas, início e fim", () => {
    expect(calcularIndiceSubaba(0, "ArrowRight", 3)).toBe(1);
    expect(calcularIndiceSubaba(2, "ArrowRight", 3)).toBe(0);
    expect(calcularIndiceSubaba(0, "ArrowLeft", 3)).toBe(2);
    expect(calcularIndiceSubaba(1, "Home", 3)).toBe(0);
    expect(calcularIndiceSubaba(1, "End", 3)).toBe(2);
  });
});
