import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("@/componentes/estrutura-autenticada", () => ({
  EstruturaAutenticada: ({ children }: { children: React.ReactNode }) => createElement(Fragment, null, children),
}));

vi.mock("@/servidor/autenticacao", () => ({
  exigirUsuario: vi.fn().mockResolvedValue({ id: "usuario-1", nome: "Ana Souza" }),
}));

import PaginaDesafios from "./page";
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");

describe("página de Métodos", () => {
  it("apresenta o catálogo com o título padrão e sem os textos antigos de experimentação", async () => {
    const pagina = await PaginaDesafios();
    const html = renderToStaticMarkup(pagina);

    expect(html).toContain("<h1>MÉTODOS</h1>");
    expect(html).toMatch(/<p[^>]*class="[^"]*subtitulo[^"]*"[^>]*>Conheça diferentes formas de estudar e observe quais estratégias fazem sentido durante suas sessões.<\/p>/);
    expect(html).toContain("Métodos disponíveis");
    expect(html).toContain("Técnica de Feynman");
    expect(html).not.toContain("Flashcards");
    expect(html).toContain("Recuperação ativa");
    expect(html).not.toContain("EXPERIMENTAÇÃO PESSOAL");
    expect(html).not.toContain("Explore métodos com contexto, não com pressa.");
    expect(html).not.toContain("SEIS FORMAS DE EXPERIMENTAR");
    expect(html).not.toContain("Use estes métodos ao registrar suas sessões.");
    expect(html).not.toContain("Desafios criados");
    expect(html).not.toContain("Seu primeiro experimento começa ao lado");
    expect(html).not.toContain("Criar desafio");
    expect(html).not.toContain("Meta do desafio");
    expect(html).toMatch(/data-trilha-pre-titulo="vazia"/);
  });

  it("mantém o modal escuro sem borda externa e com exemplos legíveis", () => {
    expect(estilos).toMatch(/\.dialogoMetodo\s*\{[^}]*border:\s*0/s);
    expect(estilos).toMatch(/\.linhaTempoExemplo li\s*\{[^}]*color:\s*#fff[^}]*background:\s*#2D2D2D/s);
    expect(estilos).toMatch(/\.sessoesDistribuidas > div\s*\{[^}]*color:\s*#fff[^}]*background:\s*#2D2D2D/s);
    expect(estilos).toMatch(/\.itemSequencia p\s*\{[^}]*color:\s*rgb\(255 255 255 \/ 78%\)\s*!important/s);
  });

  it("mantém a cor estrutural como a última regra efetiva dos cards de método", () => {
    const regrasMetodo = [...estilos.matchAll(/(?:^|\n)\.metodo\s*\{([^}]*)\}/g)].map((resultado) => resultado[1]);

    expect(regrasMetodo.length).toBeGreaterThan(1);
    expect(regrasMetodo.join("\n")).toMatch(/border:\s*var\(--espessura-borda-estrutural\) solid var\(--cor-borda-estrutural\)/);
    expect(regrasMetodo.join("\n")).not.toMatch(/border-color:\s*var\(--cor-borda\)/);
  });
});
