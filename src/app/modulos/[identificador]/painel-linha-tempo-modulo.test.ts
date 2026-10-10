import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PainelLinhaTempoModulo } from "./painel-linha-tempo-modulo";

describe("linha do tempo do módulo", () => {
  it("apresenta eventos cronológicos com conceitos relacionados", () => {
    const html = renderToStaticMarkup(createElement(PainelLinhaTempoModulo, { eventos: [{ id: "s1", tipo: "SESSAO", data: new Date("2026-09-20T12:00:00.000Z"), titulo: "Sessão de estudo", resumo: "45 min", conceitos: ["Promises", "Event Loop"] }] }));
    expect(html).toContain("Como minha trajetória de aprendizagem aconteceu?");
    expect(html).toContain("Sessão de estudo");
    expect(html).toContain("Promises · Event Loop");
    expect(html).toContain("dateTime=\"2026-09-20T12:00:00.000Z\"");
  });

  it("apresenta estado vazio sem criar eventos", () => {
    const html = renderToStaticMarkup(createElement(PainelLinhaTempoModulo, { eventos: [] }));
    expect(html).toContain("A trajetória aparecerá quando houver sessões, materiais ou evidências.");
  });
});
