// @vitest-environment jsdom
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("../acoes", () => ({ removerParticipanteDaSala: vi.fn() }));

import { RemoverParticipanteSala } from "./remover-participante-sala";
import { removerParticipanteDaSala } from "../acoes";

afterEach(cleanup);
beforeEach(() => { vi.mocked(removerParticipanteDaSala).mockReset(); });

it("exige confirmação explícita antes de oferecer a remoção do participante", () => {
  render(createElement(RemoverParticipanteSala, { identificadorSala: "grupo-js", nome: "Ana", salaId: "sala-1", usuarioId: "ana" }));

  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Remover Ana da sala" }));

  const dialogo = screen.getByRole("dialog", { name: "Remover Ana da sala?" });
  expect(dialogo.textContent).toContain("Ana perderá o acesso à sala");
  expect(screen.getByRole("button", { name: "Confirmar remoção" })).toBeTruthy();
  expect(dialogo.querySelector('input[name="salaId"]')?.getAttribute("value")).toBe("sala-1");
  expect(dialogo.querySelector('input[name="usuarioId"]')?.getAttribute("value")).toBe("ana");

  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("foca Cancelar e devolve o foco ao gatilho ao fechar por Escape", () => {
  render(createElement(RemoverParticipanteSala, { identificadorSala: "grupo-js", nome: "Ana", salaId: "sala-1", usuarioId: "ana" }));
  const gatilho = screen.getByRole("button", { name: "Remover Ana da sala" });
  fireEvent.click(gatilho);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));

  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(gatilho);
  expect(removerParticipanteDaSala).not.toHaveBeenCalled();
});

it("só envia após confirmar e bloqueia nova confirmação durante a remoção", async () => {
  let concluir: () => void = () => {};
  vi.mocked(removerParticipanteDaSala).mockImplementation(() => new Promise<void>((resolver) => { concluir = resolver; }));
  render(createElement(RemoverParticipanteSala, { identificadorSala: "grupo-js", nome: "Ana", salaId: "sala-1", usuarioId: "ana" }));
  fireEvent.click(screen.getByRole("button", { name: "Remover Ana da sala" }));
  expect(removerParticipanteDaSala).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Confirmar remoção" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Processando…" }).hasAttribute("disabled")).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Processando…" }));
  expect(removerParticipanteDaSala).toHaveBeenCalledTimes(1);
  const formulario = vi.mocked(removerParticipanteDaSala).mock.calls[0][0];
  expect(formulario.get("salaId")).toBe("sala-1");
  expect(formulario.get("usuarioId")).toBe("ana");
  expect(formulario.get("identificadorSala")).toBe("grupo-js");
  concluir();
  await waitFor(() => expect(screen.getByRole("button", { name: "Confirmar remoção" }).hasAttribute("disabled")).toBe(false));
});
