import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MetodoEstudo } from "@/gerado/prisma/enums";
import { ConsistenciaMetodosDashboard } from "./consistencia-metodos-dashboard";

describe("consistência dos métodos entre módulos", () => {
  it("renderiza métodos ordenados, amostras e aviso discreto", () => {
    const html = renderToStaticMarkup(createElement(ConsistenciaMetodosDashboard, { itens: [
      { chave: MetodoEstudo.FEYNMAN, modulosPositivos: 2, modulosAnalisaveis: 3, quantidadeEvidencias: 9, proporcaoConsistencia: 2 / 3, poucosDados: false },
      { chave: MetodoEstudo.RECUPERACAO_ATIVA, modulosPositivos: 1, modulosAnalisaveis: 1, quantidadeEvidencias: 2, proporcaoConsistencia: 1, poucosDados: true },
    ] }));
    expect(html).toContain("Consistência dos métodos entre módulos");
    expect(html).toContain("Técnica de Feynman");
    expect(html).toContain("2 de 3 módulos");
    expect(html).toContain(">9<");
    expect(html).toContain("Poucos dados");
    expect(html).toContain("associação observacional");
  });

  it("orienta novos registros quando não há módulos analisáveis", () => {
    const html = renderToStaticMarkup(createElement(ConsistenciaMetodosDashboard, { itens: [] }));
    expect(html).toContain("Ainda não há métodos com dados suficientes em um módulo");
    expect(html).not.toContain("<table");
  });
});
