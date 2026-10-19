// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModulosCompartilhados } from "./modulos-compartilhados";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("adesão mostra o módulo e proprietário sem controles de edição", async () => {
  let aceito = false;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, opcoes?: RequestInit) => {
    if (opcoes?.method === "POST") { aceito = true; return { ok: true, json: async () => ({ moduloId: "m", jaPossuiAcesso: false }) }; }
    return { ok: true, json: async () => ({ modulos: aceito ? [{ moduloId: "m", identificador: "algoritmos", titulo: "Algoritmos", proprietarioNome: "Ana" }] : [] }) };
  }));
  const usuario = userEvent.setup();
  render(createElement(ModulosCompartilhados, { iniciais: [] }));
  expect(screen.getByText(/nenhum módulo compartilhado/i)).toBeTruthy();
  await usuario.type(screen.getByLabelText("Código do módulo"), "MOD-TESTE");
  await usuario.click(screen.getByRole("button", { name: "Acessar por código" }));
  expect(await screen.findByText("Compartilhado por: Ana")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Algoritmos/ }).getAttribute("href")).toBe("/salas/compartilhados/m");
  expect(screen.queryByRole("button", { name: /editar|excluir|compartilhar/i })).toBeNull();
});
