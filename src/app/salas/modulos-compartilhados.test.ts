// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulosCompartilhados } from "./modulos-compartilhados";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("mostra o proprietário uma única vez na copy aprovada e preserva o padrão do título", () => {
  render(createElement(ModulosCompartilhados, { iniciais: [{ moduloId: "m", identificador: "algoritmos", titulo: "Algoritmos", proprietarioNome: "Ana" }] }));

  expect(screen.getAllByText("Compartilhado por Ana")).toHaveLength(1);
  expect(screen.queryByText("Compartilhado por: Ana")).toBeNull();
  expect(screen.queryByText("Dashboard · Somente leitura")).toBeNull();
  const link = screen.getByRole("link", { name: /Algoritmos/ });
  expect(link.getAttribute("href")).toBe("/salas/compartilhados/m");
  expect(screen.getByText("Algoritmos").getAttribute("data-padrao")).toBe("#textcardmodule");
  expect(screen.queryByRole("textbox", { name: "Código do módulo" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Acessar por código" })).toBeNull();
  expect(screen.queryByRole("button", { name: /editar|excluir|compartilhar/i })).toBeNull();
});
