// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterpretacaoAutomatica, type PropriedadesInterpretacao } from "./interpretacao-automatica";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("usa o endpoint compartilhado no modal e avisa quando o acesso é revogado", async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  const perder = vi.fn();
  const buscar = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ erro: "ACESSO_REVOGADO" }) }));
  vi.stubGlobal("fetch", buscar);
  const usuario = userEvent.setup();
  render(createElement<PropriedadesInterpretacao>(InterpretacaoAutomatica, { moduloCompartilhadoId: "m", aoPerderAcesso: perder, compacto: true, modalLateral: true }));
  await usuario.click(screen.getByRole("button", { name: "Gerar interpretação da IA" }));
  await waitFor(() => expect(buscar).toHaveBeenCalledWith("/api/compartilhamentos/modulos/m/interpretacoes", { method: "POST" }));
  await waitFor(() => expect(perder).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("alert").textContent).toContain("acesso");
});
