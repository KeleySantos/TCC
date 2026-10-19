// @vitest-environment jsdom

import { createElement, type ComponentType, type PropsWithChildren } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EstruturaAutenticada } from "./estrutura-autenticada";

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
  ["Salas", "/salas"],
  ["Desafios", "/desafios"],
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

    expect(screen.getByRole("button", { name: "Expandir barra lateral" }).getAttribute("aria-expanded")).toBe("false");
    for (const [rotulo, href] of destinos) {
      expect(screen.getByRole("link", { name: rotulo }).getAttribute("href")).toBe(href);
    }
    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
  });

  it("expande a navegação e preserva a preferência local", async () => {
    const usuario = userEvent.setup();
    render(montarEstrutura());

    await usuario.click(screen.getByRole("button", { name: "Expandir barra lateral" }));

    expect(screen.getByRole("button", { name: "Recolher barra lateral" }).getAttribute("aria-expanded")).toBe("true");
    expect(window.localStorage.getItem("learning-lab:barra-lateral-recolhida")).toBe("nao");
  });

  it("oculta as configurações de IA para contas comuns", () => {
    render(montarEstrutura());
    expect(screen.queryByRole("link", { name: "Configurações IA" })).toBeNull();
  });

  it("substitui o destino Perfil pelo acesso às configurações no rodapé", () => {
    render(montarEstrutura());
    expect(screen.queryByRole("link", { name: "Perfil" })).toBeNull();
    expect(screen.getByRole("button", { name: "Abrir configurações do perfil de Diego" })).toBeTruthy();
  });

  it("disponibiliza as configurações de IA para ADMIN", () => {
    render(montarEstrutura(true));
    expect(screen.getByRole("link", { name: "Configurações IA" }).getAttribute("href")).toBe("/configuracoes/ia");
  });
});
