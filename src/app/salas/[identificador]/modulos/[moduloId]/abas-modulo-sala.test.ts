// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { AbasModuloSala } from "./abas-modulo-sala";

const membros = [
  { id: "ana", nome: "Ana", resumo: "3 sessões", estado: "vinculado" as const, conteudo: createElement("p", null, "Dashboard individual de Ana") },
  { id: "bruno", nome: "Bruno", resumo: "Aguardando vínculo", estado: "aguardando_vinculo" as const },
];

afterEach(cleanup);

it("alterna Dashboard e Membros com o mesmo padrão acessível das abas de módulo", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { dashboard: createElement("p", null, "Dashboard geral"), membros }));

  const dashboard = screen.getByRole("tab", { name: "Dashboard" });
  const membrosAba = screen.getByRole("tab", { name: "Membros" });
  expect(dashboard.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("Dashboard geral")).toBeTruthy();

  dashboard.focus();
  await usuario.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(membrosAba);
  expect(membrosAba.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("Dashboard individual de Ana")).toBeTruthy();
});

it("abre à direita o dashboard do membro vinculado selecionado", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { abaInicial: "membros", dashboard: createElement("p", null, "Dashboard geral"), membros }));

  expect(screen.getByRole("button", { name: /Ana/ }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Dashboard individual de Ana")).toBeTruthy();
});

it("explica o estado aguardando vínculo sem tentar renderizar dashboard", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { abaInicial: "membros", dashboard: createElement("p", null, "Dashboard geral"), membros }));

  await usuario.click(screen.getByRole("button", { name: /Bruno/ }));
  expect(screen.getByRole("button", { name: /Bruno/ }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Bruno ainda precisa criar ou vincular uma instância pessoal para alimentar o dashboard.")).toBeTruthy();
  expect(screen.queryByText("Dashboard individual de Ana")).toBeNull();
});

it("mantém o convite contextual dentro da aba Membros", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { cabecalhoMembros: createElement("button", null, "Convidar para este módulo"), dashboard: createElement("p", null, "Dashboard geral"), membros }));

  expect(screen.getByText("Convidar para este módulo").closest('[role="tabpanel"]')?.hasAttribute("hidden")).toBe(true);
  await usuario.click(screen.getByRole("tab", { name: "Membros" }));
  expect(screen.getByText("Convidar para este módulo").closest('[role="tabpanel"]')?.hasAttribute("hidden")).toBe(false);
});

it("mostra estado vazio quando o módulo ainda não possui participantes", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { dashboard: createElement("p", null, "Sem agregado"), membros: [] }));

  await usuario.click(screen.getByRole("tab", { name: "Membros" }));
  expect(screen.getByText("Nenhum participante vinculado a este módulo.")).toBeTruthy();
});
