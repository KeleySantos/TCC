import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PainelResultadosContextuais } from "./painel-resultados-contextuais";

describe("resultados por método e formato", () => {
  it("reúne percepção, evidências posteriores e base contextual", () => {
    const html = renderToStaticMarkup(createElement(PainelResultadosContextuais, {
      metodos: [{ chave: "FEYNMAN", quantidadeSessoes: 10, quantidadeCompreensoes: 1, compreensaoMedia: 4.4, quantidadeEvidenciasPosteriores: 5, desempenhoMedioPosterior: 85, amostraEvidenciasSuficiente: true }],
      formatos: [{ chave: "VIDEO", quantidadeSessoes: 9, quantidadeCompreensoes: 9, compreensaoMedia: 3.8, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 71, amostraEvidenciasSuficiente: false }],
    }));

    expect(html).toContain("Métodos × Resultados");
    expect(html).toContain("Formatos × Resultados");
    expect(html).toContain("4,4/5");
    expect(html).toContain("85%");
    expect(html).toContain("10 sessões");
    expect(html).toContain("1 compreensão em 10 sessões");
    expect(html).toContain("5 evidências");
    expect(html).toContain("Amostra insuficiente");
    expect(html).toContain("não demonstram causalidade");
    expect(html.match(/role="img"/g)).toHaveLength(2);
    expect(html.match(/<table/g)).toHaveLength(2);
    expect(html).not.toContain("listaResultadosContextuais");
  });

  it("explicita ausência de dados sem inventar resultados", () => {
    const html = renderToStaticMarkup(createElement(PainelResultadosContextuais, { metodos: [], formatos: [] }));
    expect(html.match(/Ainda não há sessões válidas/g)).toHaveLength(2);
  });
});
