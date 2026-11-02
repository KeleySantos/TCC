// @vitest-environment jsdom

import { createElement, type ComponentType, type PropsWithChildren } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EstruturaAutenticada } from "./estrutura-autenticada";

const estilos = readFileSync(resolve(process.cwd(), "src/componentes/estrutura-autenticada.module.css"), "utf8");

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/app/acoes-sessao", () => ({
  sairDaConta: vi.fn(),
}));

const destinos = [
  ["Dashboard", "/dashboard"],
  ["Módulos", "/modulos"],
  ["Métodos", "/desafios"],
  ["Salas", "/salas"],
] as const;

function montarEstrutura(administradorIa = false) {
  const EstruturaTestavel = EstruturaAutenticada as ComponentType<PropsWithChildren<{ usuarioNome: string; administradorIa?: boolean }>>;
  return createElement(
    EstruturaTestavel,
    { usuarioNome: administradorIa ? "ADMIN" : "Diego", administradorIa },
    createElement("main", null, "Conteúdo"),
  );
}

describe("sistema visual autenticado", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("inicia compacto sem remover destinos nem a saída", () => {
    render(montarEstrutura());

    const expandir = screen.getByRole("button", { name: "Expandir barra lateral" });
    expect(expandir.getAttribute("aria-expanded")).toBe("false");
    expect(expandir.querySelector(".lucide-flask-conical")).toBeTruthy();
    expect(expandir.querySelector(".lucide-chevron-right")).toBeTruthy();
    for (const [rotulo, href] of destinos) {
      expect(screen.getByRole("link", { name: rotulo }).getAttribute("href")).toBe(href);
    }
    const metodos = screen.getByRole("link", { name: "Métodos" });
    const salas = screen.getByRole("link", { name: "Salas" });
    expect(metodos.compareDocumentPosition(salas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
    expect(estilos).toMatch(/\.botaoMarcaRecolhida\s+\.simboloMarca\s*\{[^}]*color:\s*#111[^}]*background:\s*#fff/s);
  });

  it("expande a navegação e preserva a preferência local", async () => {
    const usuario = userEvent.setup();
    render(montarEstrutura());

    await usuario.click(screen.getByRole("button", { name: "Expandir barra lateral" }));

    expect(screen.getByRole("button", { name: "Recolher barra lateral" }).getAttribute("aria-expanded")).toBe("true");
    expect(window.localStorage.getItem("learning-lab:barra-lateral-recolhida")).toBe("nao");
    expect(screen.queryByText(/Aprender bem hoje/)).toBeNull();
  });

  it("oculta as configurações de IA para contas comuns", () => {
    render(montarEstrutura());
    expect(screen.queryByRole("link", { name: "Configurações IA" })).toBeNull();
  });

  it("substitui o destino Perfil pelo acesso às configurações no rodapé", () => {
    render(montarEstrutura());
    expect(screen.queryByRole("link", { name: "Perfil" })).toBeNull();
    const sair = screen.getByRole("button", { name: "Sair" });
    const perfil = screen.getByRole("button", { name: "Abrir configurações do perfil de Diego" });
    expect(sair.compareDocumentPosition(perfil) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("disponibiliza as configurações de IA para ADMIN", () => {
    render(montarEstrutura(true));
    expect(screen.getByRole("link", { name: "Configurações IA" }).getAttribute("href")).toBe("/configuracoes/ia");
  });
});
