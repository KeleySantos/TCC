// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CatalogoMetodos } from "./catalogo-metodos";

describe("catálogo informativo de métodos", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  afterEach(cleanup);

  it.each([
    ["Técnica Feynman", "Aprender explicando com simplicidade", "Imagine uma pilha de pratos"],
    ["Pomodoro", "Organização do estudo em ciclos de foco e pausa", "Após quatro focos"],
    ["Repetição espaçada", "Revisar um conteúdo em intervalos ao longo do tempo", "Dia 14"],
    ["Intercalamento", "Alternância entre diferentes conteúdos ou tipos de exercícios.", "Exercício 6: Insertion Sort"],
    ["Prática distribuída", "Distribuir o estudo em diferentes sessões", "Sexta-feira"],
  ])("abre o modal informativo de %s", async (titulo, subtitulo, exemplo) => {
    const usuario = userEvent.setup();
    render(createElement(CatalogoMetodos));

    const abrir = screen.getByRole("button", { name: `Conhecer o método ${titulo}` });
    await usuario.click(abrir);

    const dialogo = screen.getByRole("dialog", { name: titulo });
    expect(dialogo.textContent).toContain(subtitulo);
    expect(dialogo.textContent).toContain("O que é?");
    expect(dialogo.textContent).toContain("Como aplicar");
    expect(dialogo.textContent).toContain(exemplo);
    expect(dialogo.textContent).toContain("Quando utilizar?");
    const quantidadeItens = titulo === "Repetição espaçada" ? 9 : titulo === "Intercalamento" ? 10 : 4;
    expect(within(dialogo).getAllByRole("listitem")).toHaveLength(quantidadeItens);

    await usuario.click(within(dialogo).getByRole("button", { name: `Fechar explicação sobre ${titulo}` }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(abrir);
  });

  it("revela a resposta de Recuperação ativa e reinicia o exemplo ao reabrir", async () => {
    const usuario = userEvent.setup();
    render(createElement(CatalogoMetodos));

    const abrir = screen.getByRole("button", { name: "Conhecer o método Recuperação ativa" });
    await usuario.click(abrir);

    let dialogo = screen.getByRole("dialog", { name: "Recuperação ativa" });
    const conteudoRolavel = dialogo.firstElementChild as HTMLDivElement;
    conteudoRolavel.scrollTop = 240;
    const resposta = "Uma função recursiva chama a si mesma";
    expect(dialogo.textContent).not.toContain(resposta);

    await usuario.click(within(dialogo).getByRole("button", { name: "Ver resposta" }));
    expect(dialogo.textContent).toContain(resposta);
    expect(within(dialogo).getByRole("button", { name: "Ocultar resposta" })).toBeTruthy();

    await usuario.click(within(dialogo).getByRole("button", { name: "Fechar explicação sobre Recuperação ativa" }));
    expect(conteudoRolavel.scrollTop).toBe(0);
    await usuario.click(abrir);
    dialogo = screen.getByRole("dialog", { name: "Recuperação ativa" });
    expect(dialogo.textContent).not.toContain(resposta);
    expect(within(dialogo).getByRole("button", { name: "Ver resposta" })).toBeTruthy();
  });

  it("apresenta exatamente os seis métodos oficiais, sem ações ou conteúdo de Flashcards", () => {
    render(createElement(CatalogoMetodos));

    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: /^Conhecer o método / })).toHaveLength(6);
    for (const cartao of screen.getAllByRole("article")) {
      expect(within(cartao).getAllByRole("button")).toHaveLength(1);
    }
    expect(screen.queryByText(/Flashcards/i)).toBeNull();
  });

  it("fecha pelo fundo e não apresenta ações de gerenciamento", async () => {
    const usuario = userEvent.setup();
    render(createElement(CatalogoMetodos));

    await usuario.click(screen.getByRole("button", { name: "Conhecer o método Pomodoro" }));
    const dialogo = screen.getByRole("dialog", { name: "Pomodoro" });
    expect(dialogo.textContent).not.toMatch(/Criar|Iniciar sessão|Salvar|Cronômetro/);

    fireEvent.click(dialogo);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

});
