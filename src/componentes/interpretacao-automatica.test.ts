import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterpretacaoAutomatica } from "./interpretacao-automatica";

describe("interpretação automática no Dashboard", () => {
  const ComponenteTestavel = InterpretacaoAutomatica as ComponentType<{ compacto?: boolean; modalLateral?: boolean }>;

  it("mantém somente o título e a ação antes de gerar uma interpretação", () => {
    const html = renderToStaticMarkup(createElement(ComponenteTestavel, { compacto: true }));

    expect(html).toContain("Insights da IA");
    expect(html).toContain("Gerar interpretação");
    expect(html).not.toContain("INTERPRETAÇÃO OPCIONAL");
    expect(html).not.toContain("O Groq interpreta métricas");
    expect(html).not.toContain("Configurar Groq");
    expect(html).not.toContain("/configuracoes/ia");
  });

  it("preserva a apresentação completa nos demais dashboards", () => {
    const html = renderToStaticMarkup(createElement(ComponenteTestavel));

    expect(html).toContain("INTERPRETAÇÃO OPCIONAL");
    expect(html).toContain("O Groq interpreta métricas");
    expect(html).not.toContain("Configurar Groq");
    expect(html).not.toContain("/configuracoes/ia");
  });

  it("oferece a interpretação em painel lateral sem uma segunda ação geradora", () => {
    const html = renderToStaticMarkup(createElement(ComponenteTestavel, { compacto: true, modalLateral: true }));

    expect(html).toContain("Gerar interpretação da IA");
    expect(html).toContain("<dialog");
    expect(html).toContain("Insights da IA");
    expect(html.match(/>Gerar interpretação(?: da IA)?</g)).toHaveLength(1);
  });
});
