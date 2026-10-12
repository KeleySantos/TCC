import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterpretacaoAutomatica } from "./interpretacao-automatica";

describe("interpretação automática no Dashboard", () => {
  const ComponenteTestavel = InterpretacaoAutomatica as ComponentType<{ compacto?: boolean }>;

  it("mantém somente o título e a ação antes de gerar uma interpretação", () => {
    const html = renderToStaticMarkup(createElement(ComponenteTestavel, { compacto: true }));

    expect(html).toContain("Insights da IA");
    expect(html).toContain("Gerar interpretação");
    expect(html).not.toContain("INTERPRETAÇÃO OPCIONAL");
    expect(html).not.toContain("Os provedores configurados interpretam métricas");
    expect(html).not.toContain("Configurar provedores e chaves");
    expect(html).not.toContain("/configuracoes/ia");
  });

  it("preserva a apresentação completa nos demais dashboards", () => {
    const html = renderToStaticMarkup(createElement(ComponenteTestavel));

    expect(html).toContain("INTERPRETAÇÃO OPCIONAL");
    expect(html).toContain("Os provedores configurados interpretam métricas");
    expect(html).toContain("Configurar provedores e chaves");
    expect(html).toContain("/configuracoes/ia");
  });
});
