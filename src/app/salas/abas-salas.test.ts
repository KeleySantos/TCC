// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { AbasSalas } from "./abas-salas";
afterEach(cleanup);
it("preserva o conteúdo das Salas e permite navegar às duas abas pelo teclado", async () => {
  const usuario = userEvent.setup();
  render(createElement(AbasSalas, { salas: createElement("p", null, "Sala existente"), compartilhados: createElement("p", null, "Módulo recebido") }));
  const salas = screen.getByRole("tab", { name: "Salas" });
  expect(salas.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tabpanel").textContent).toContain("Sala existente");
  salas.focus(); await usuario.keyboard("{ArrowRight}");
  expect(screen.getByRole("tabpanel").textContent).toContain("Módulo recebido");
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Compartilhado comigo" }));
  await usuario.keyboard("{Home}");
  expect(screen.getByRole("tabpanel").textContent).toContain("Sala existente");
});
