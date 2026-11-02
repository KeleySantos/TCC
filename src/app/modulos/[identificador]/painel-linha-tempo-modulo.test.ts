import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PainelLinhaTempoModulo } from "./painel-linha-tempo-modulo";

const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");

describe("linha do tempo do módulo", () => {
  it("apresenta eventos cronológicos em um feed sem o rótulo redundante", () => {
    const html = renderToStaticMarkup(createElement(PainelLinhaTempoModulo, { eventos: [{ id: "s1", tipo: "SESSAO", data: new Date("2026-09-20T12:00:00.000Z"), titulo: "Sessão de estudo", resumo: "45 min", conceitos: ["Promises", "Event Loop"] }] }));
    expect(html).toContain("Como minha trajetória de aprendizagem aconteceu?");
    expect(html).not.toContain("TRAJETÓRIA");
    expect(html).toContain("Sessão de estudo");
    expect(html).toContain("Promises · Event Loop");
    expect(html).toContain("dateTime=\"2026-09-20T12:00:00.000Z\"");
    expect(html).toContain(">20/09/2026</time>");
    expect(html).toContain("data-tipo=\"SESSAO\"");
    expect(html).toContain("Sessao");
  });

  it("usa linhas sutis e remove a haste com marcadores", () => {
    expect(estilos).toMatch(/\.painelLinhaTempo\s*\{[^}]*box-shadow:\s*none[^}]*border:\s*0/s);
    expect(estilos).toMatch(/\.linhaTempo li\s*\{[^}]*border-bottom:\s*1px solid var\(--cor-borda\)/s);
    expect(estilos).toMatch(/\.tipoEventoLinhaTempo\s*\{[^}]*border-radius:\s*999px/s);
    expect(estilos).toMatch(/\.tipoEventoLinhaTempo\s*\{[^}]*color:\s*#fff[^}]*background:\s*var\(--cor-navegacao\)/s);
    expect(estilos).not.toMatch(/\.linhaTempo li::before/);
  });

  it("apresenta estado vazio sem criar eventos", () => {
    const html = renderToStaticMarkup(createElement(PainelLinhaTempoModulo, { eventos: [] }));
    expect(html).toContain("A trajetória aparecerá quando houver sessões, materiais ou evidências.");
  });
});
