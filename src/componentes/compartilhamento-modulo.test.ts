// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { CompartilhamentoModulo } from "./compartilhamento-modulo";
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("mostra convidados, exige confirmação e mantém código selecionável quando a cópia falha", async () => {
  let ativo = true;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, opcoes?: RequestInit) => {
    if (opcoes?.method === "DELETE") ativo = false;
    return { ok: true, json: async () => ({ compartilhamento: { moduloId: "m", titulo: "Algoritmos", codigo: "MOD-TESTE", quantidadeAtivos: ativo ? 1 : 0, limite: 3, convidados: ativo ? [{ usuarioId: "ana", nome: "Ana" }] : [] } }) };
  }));
  const usuario = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("negado"); } } });
  render(createElement(CompartilhamentoModulo, { identificadorModulo: "algoritmos", titulo: "Algoritmos" }));
  expect(screen.getByRole("button", { name: /^Compartilhar$/ }).textContent).toBe("");
  await usuario.click(screen.getByRole("button", { name: "Compartilhar" }));
  await screen.findByText("Ana");
  expect(screen.getByText("1 de 3 pessoas")).toBeTruthy();
  await usuario.click(screen.getByRole("button", { name: "Copiar código" }));
  expect(await screen.findByText(/copie manualmente/i)).toBeTruthy();
  expect((screen.getByLabelText("Código de compartilhamento") as HTMLInputElement).value).toBe("MOD-TESTE");
  await usuario.click(screen.getByRole("button", { name: "Remover acesso de Ana" }));
  await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.getByText("Ana")).toBeTruthy();
  await usuario.click(screen.getByRole("button", { name: "Remover acesso de Ana" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar remoção" }));
  await waitFor(() => expect(screen.queryByText("Ana")).toBeNull());
  expect(screen.getByText("0 de 3 pessoas")).toBeTruthy();
});
