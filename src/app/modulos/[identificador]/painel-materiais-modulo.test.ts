import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PainelMateriaisModulo } from "./painel-materiais-modulo";

vi.mock("../acoes", () => ({ arquivarMaterial: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("biblioteca de materiais do módulo", () => {
  it("identifica a função do arquivo sem apresentar sua classificação de formato", () => {
    const html = renderToStaticMarkup(createElement(PainelMateriaisModulo, {
      moduloId: "modulo-1",
      identificadorModulo: "javascript",
      materiais: [{
        id: "material-1",
        titulo: "Resultado da atividade",
        descricao: "Atividade corrigida.",
        minutosEstimados: 15,
        funcao: "AVALIACAO",
        dataEvento: new Date("2026-09-20T00:00:00.000Z"),
        origem: "ARQUIVO",
        formato: "PDF",
        arquivo: { nomeOriginal: "resultado-arquivo", tamanhoBytes: 1024, extensaoNormalizada: "pdf", tipoMime: "application/pdf" },
        analise: null,
        evidencia: null,
        url: null,
        conteudoTexto: null,
      }],
    } as never));

    expect(html).toContain(">Avaliação<");
    expect(html).not.toContain(">PDF<");
    expect(html).not.toContain("min estimados");
    expect(html).not.toContain("Método usado");
    expect(html).not.toContain("Iniciar sessão de estudo");
    expect(html).not.toContain("Editar material");
  });
});
