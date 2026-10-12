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
    expect(html).toContain('aria-label="Ver explicação sobre Consistência dos métodos entre módulos"');
    expect(html.match(/Mostra em quantos módulos analisáveis cada método apresentou compreensão percebida de pelo menos 4\/5 e evidência posterior de pelo menos 70%\. É uma associação observacional\./g)).toHaveLength(1);
    expect(html).toMatch(/<dialog[\s\S]*Mostra em quantos módulos analisáveis[\s\S]*<\/dialog>/);
    expect(html).not.toContain("RESULTADOS EM DIFERENTES CONTEXTOS");
    expect(html).not.toContain("Métodos ordenados da maior para a menor consistência observada");
  });

  it("orienta novos registros quando não há módulos analisáveis", () => {
    const html = renderToStaticMarkup(createElement(ConsistenciaMetodosDashboard, { itens: [] }));
    expect(html).toContain("Ainda não há métodos com dados suficientes em um módulo");
    expect(html).not.toContain("<table");
  });
});
