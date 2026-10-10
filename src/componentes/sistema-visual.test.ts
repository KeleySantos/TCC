// @vitest-environment jsdom

import { createElement, type ComponentType, type PropsWithChildren } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EstruturaAutenticada } from "./estrutura-autenticada";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/app/acoes-sessao", () => ({
  sairDaConta: vi.fn(),
}));

const destinos = [
  ["Dashboard", "/dashboard"],
  ["Módulos", "/modulos"],
  ["Salas", "/salas"],
  ["Desafios", "/desafios"],
  ["Histórico", "/historico"],
  ["Configurações IA", "/configuracoes/ia"],
  ["Perfil", "/perfil"],
] as const;

function montarEstrutura() {
  const EstruturaTestavel = EstruturaAutenticada as ComponentType<PropsWithChildren<{ usuarioNome: string }>>;
  return createElement(
    EstruturaTestavel,
    { usuarioNome: "Diego" },
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
});
