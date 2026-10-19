import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/componentes/estrutura-autenticada", () => ({
  EstruturaAutenticada: ({ children }: { children: React.ReactNode }) => createElement(Fragment, null, children),
}));

vi.mock("@/servidor/autenticacao", () => ({
  exigirUsuario: vi.fn().mockResolvedValue({ id: "usuario-1", nome: "Ana Souza" }),
}));

import PaginaDesafios from "./page";

describe("página de Experimentos", () => {
  it("mantém o catálogo de métodos sem exibir recursos de desafios", async () => {
    const pagina = await PaginaDesafios();
    const html = renderToStaticMarkup(pagina);

    expect(html).toContain("Métodos disponíveis");
    expect(html).toContain("Técnica de Feynman");
    expect(html).not.toContain("Flashcards");
    expect(html).toContain("Recuperação ativa");
    expect(html).not.toContain("Desafios criados");
    expect(html).not.toContain("Seu primeiro experimento começa ao lado");
    expect(html).not.toContain("Criar desafio");
    expect(html).not.toContain("Meta do desafio");
  });
});
