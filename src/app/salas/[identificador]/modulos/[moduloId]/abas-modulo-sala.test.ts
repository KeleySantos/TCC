// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AbasModuloSala } from "./abas-modulo-sala";

const membros = [
  { id: "ana", nome: "Ana", resumo: "3 sessões", estado: "vinculado" as const, conteudo: createElement("p", null, "Dashboard individual de Ana") },
  { id: "bruno", nome: "Bruno", resumo: "Aguardando vínculo", estado: "aguardando_vinculo" as const },
  { id: "carla", nome: "Carla", resumo: "2 sessões", estado: "vinculado" as const, conteudo: createElement("p", null, "Dashboard individual de Carla") },
];

const estilos = readFileSync(resolve(process.cwd(), "src/app/salas/[identificador]/modulos/[moduloId]/page.module.css"), "utf8");
const estilosDashboard = readFileSync(resolve(process.cwd(), "src/app/salas/dashboard-sala.module.css"), "utf8");

afterEach(cleanup);

it("alterna Dashboard e Participantes com o mesmo padrão acessível das abas de módulo", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { dashboard: createElement("p", null, "Dashboard geral"), membros }));

  const dashboard = screen.getByRole("tab", { name: "Dashboard" });
  const membrosAba = screen.getByRole("tab", { name: "Participantes" });
  expect(dashboard.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("Dashboard geral")).toBeTruthy();

  dashboard.focus();
  await usuario.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(membrosAba);
  expect(membrosAba.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByText("Selecione um participante para visualizar o Dashboard")).toBeTruthy();
  expect(screen.queryByText("Dashboard individual de Ana")).toBeNull();
});

it("começa sem seleção e não renderiza dashboard individual antes do clique", () => {
  render(createElement(AbasModuloSala, { abaInicial: "membros", dashboard: createElement("p", null, "Dashboard geral"), membros }));

  expect(screen.getByText("Selecione um participante para visualizar o Dashboard")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Ana/ }).getAttribute("aria-pressed")).toBe("false");
  expect(screen.queryByText("Dashboard individual de Ana")).toBeNull();
  expect(screen.queryByText("Dashboard individual de Carla")).toBeNull();
});

it("renderiza somente o dashboard selecionado e troca sem misturar conteúdo", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { abaInicial: "membros", dashboard: createElement("p", null, "Dashboard geral"), membros }));

  await usuario.click(screen.getByRole("button", { name: /Ana/ }));
  expect(screen.getByText("Dashboard individual de Ana")).toBeTruthy();
  expect(screen.queryByText("Dashboard individual de Carla")).toBeNull();

  await usuario.click(screen.getByRole("button", { name: /Carla/ }));
  expect(screen.queryByText("Dashboard individual de Ana")).toBeNull();
  expect(screen.getByText("Dashboard individual de Carla")).toBeTruthy();
});

it("explica o estado aguardando vínculo sem tentar renderizar dashboard", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { abaInicial: "membros", dashboard: createElement("p", null, "Dashboard geral"), membros }));

  await usuario.click(screen.getByRole("button", { name: /Bruno/ }));
  expect(screen.getByRole("button", { name: /Bruno/ }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Bruno ainda precisa criar ou vincular uma instância pessoal para alimentar o dashboard.")).toBeTruthy();
  expect(screen.queryByText("Dashboard individual de Ana")).toBeNull();
});

it("mantém o convite contextual dentro da aba Participantes", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { cabecalhoMembros: createElement("button", null, "Convidar para este módulo"), dashboard: createElement("p", null, "Dashboard geral"), membros }));

  expect(screen.getByText("Convidar para este módulo").closest('[role="tabpanel"]')?.hasAttribute("hidden")).toBe(true);
  await usuario.click(screen.getByRole("tab", { name: "Participantes" }));
  expect(screen.getByText("Convidar para este módulo").closest('[role="tabpanel"]')?.hasAttribute("hidden")).toBe(false);
});

it("mostra estado vazio quando o módulo ainda não possui participantes", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasModuloSala, { dashboard: createElement("p", null, "Sem agregado"), membros: [] }));

  await usuario.click(screen.getByRole("tab", { name: "Participantes" }));
  expect(screen.getByText("Nenhum participante vinculado a este módulo.")).toBeTruthy();
});

it("usa painel escuro acessível e integra o dashboard individual sem card próprio", () => {
  expect(estilos).toMatch(/\.listaMembros\s*\{[^}]*background:\s*var\(--cor-navegacao\)/s);
  expect(estilos).toMatch(/\.listaMembros button\s*\{[^}]*color:\s*#fff[^}]*background:\s*var\(--cor-navegacao\)/s);
  expect(estilos).toMatch(/\.listaMembros button:hover\s*\{[^}]*background:\s*var\(--cor-navegacao-elevada\)/s);
  expect(estilos).toMatch(/\.listaMembros span\s*\{[^}]*color:\s*rgb\(255 255 255 \/ 68%\)/s);
  expect(estilosDashboard).toMatch(/\.conteudoIndividual\s*\{[^}]*display:\s*grid[^}]*gap:[^}]*\}/s);
  expect(estilosDashboard).not.toMatch(/\.conteudoIndividual\s*\{[^}]*(?:border|background):/s);
});
