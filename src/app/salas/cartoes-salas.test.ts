import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./acoes", () => ({ editarInstanciaVinculada: vi.fn(), pararCompartilhamentoDaInstancia: vi.fn() }));
import { CartaoModuloSala, GradeSalas } from "./cartoes-salas";

const estilos = readFileSync(resolve(process.cwd(), "src/app/salas/page.module.css"), "utf8");

describe("cartões das salas", () => {
  it("organiza as salas como links com nome e papel, sem descrição ou contagens", () => {
    const html = renderToStaticMarkup(createElement(GradeSalas, { salas: [{
      id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", descricao: "Descrição que não aparece no card", papel: "MEMBRO", situacao: "ATIVA",
      _count: { modulos: 3, membros: 5 },
    }] }));

    expect(html).toContain('href="/salas/grupo-js"');
    expect(html).toContain("Grupo JavaScript");
    expect(html).not.toContain("3 módulos");
    expect(html).not.toContain("5 membros");
    expect(html).not.toContain("Descrição que não aparece no card");
    expect(html).toContain("Você é membro");
    expect(html).toContain("textoCartaoModulo");
  });

  it("apresenta cada módulo da sala como link para sua página própria", () => {
    const html = renderToStaticMarkup(createElement(CartaoModuloSala, {
      href: "/salas/grupo-js/modulos/modulo-1",
      titulo: "Fundamentos",
      resumo: "2 instâncias",
    }));

    expect(html).toContain('href="/salas/grupo-js/modulos/modulo-1"');
    expect(html).toContain('aria-label="Abrir módulo Fundamentos"');
    expect(html).toContain("Fundamentos");
    expect(html).not.toContain("Base compartilhada da sala.");
    expect(html).toContain("2 instâncias");
    expect(html).toContain("textoCartaoModulo");
    expect(estilos).toMatch(/\.cartaoSalaBiblioteca,\s*\.cartaoModulo\s*\{[^}]*min-height:\s*108px[^}]*padding:\s*20px 24px/s);
    expect(estilos).toMatch(/\.cartaoModulo\s*\{[^}]*color:\s*var\(--cor-texto\)[^}]*background:\s*var\(--cor-superficie\)/s);
    expect(estilos).toMatch(/\.cartaoModulo \.iconeModuloSala\s*\{[^}]*color:\s*#fff[^}]*background:\s*var\(--cor-navegacao\)/s);
  });

  it("preserva a navegação do cartão administrativo mesmo com instâncias", () => {
    const html = renderToStaticMarkup(createElement(CartaoModuloSala, {
      href: "/salas/grupo-js/modulos/modulo-1",
      titulo: "Fundamentos",
      resumo: "2 instâncias",
    }));

    expect(html).toContain('href="/salas/grupo-js/modulos/modulo-1"');
    expect(html).toContain('aria-label="Abrir módulo Fundamentos"');
    expect(html).not.toContain("Gerenciar instância");
  });
});
