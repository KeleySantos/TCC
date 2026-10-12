// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AjudaMetrica } from "./ajuda-metrica";

describe("ajuda contextual de métricas", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  });

  afterEach(cleanup);

  it("abre a descrição em modal, fecha pelo botão e devolve o foco", async () => {
    const usuario = userEvent.setup();
    render(createElement(AjudaMetrica, { titulo: "Síntese visual", descricao: "Descrição da métrica." }));

    const abrir = screen.getByRole("button", { name: "Ver explicação sobre Síntese visual" });
    expect(screen.queryByRole("dialog")).toBeNull();

    await usuario.click(abrir);
    expect(screen.getByRole("dialog", { name: "Síntese visual" }).textContent).toContain("Descrição da métrica.");

    await usuario.click(screen.getByRole("button", { name: "Fechar explicação" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(abrir);
  });

  it("fecha ao clicar fora do conteúdo", async () => {
    const usuario = userEvent.setup();
    render(createElement(AjudaMetrica, { titulo: "Autorrelato", descricao: "Descrição." }));
    await usuario.click(screen.getByRole("button", { name: "Ver explicação sobre Autorrelato" }));

    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
