// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PerfilUsuario } from "./perfil-usuario";

const navegacao = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navegacao }));
const perfil = { nome: "Pessoa Sintética", nomeUsuario: "pessoa.sintetica", administradorIa: false, fotoVersao: null };

beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ perfil }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function abrir() {
  const usuario = userEvent.setup();
  render(createElement(PerfilUsuario, { nome: perfil.nome }));
  const botao = screen.getByRole("button", { name: `Abrir configurações do perfil de ${perfil.nome}` });
  await usuario.click(botao);
  await screen.findByLabelText("Nome de usuário");
  return { usuario, botao, dialogo: screen.getByRole("dialog", { name: "Configurações do perfil" }) };
}

describe("perfil acessível pelo rodapé", () => {
  it("abre as quatro configurações e restaura foco ao fechar", async () => {
    const { usuario, botao, dialogo } = await abrir();
    for (const titulo of ["Alterar nome de usuário", "Alterar senha", "Alterar foto de perfil", "Excluir conta"]) expect(within(dialogo).getByRole("heading", { name: titulo })).toBeTruthy();
    await usuario.click(screen.getByRole("button", { name: "Fechar configurações do perfil" }));
    expect(dialogo.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(botao);
  });

  it("envia a mudança de login e atualiza o nome no rodapé", async () => {
    const { usuario } = await abrir();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ perfil: { ...perfil, nome: "Novo Nome", nomeUsuario: "novo.login" } }) } as Response);
    await usuario.clear(screen.getByLabelText("Nome exibido"));
    await usuario.type(screen.getByLabelText("Nome exibido"), "Novo Nome");
    await usuario.clear(screen.getByLabelText("Nome de usuário"));
    await usuario.type(screen.getByLabelText("Nome de usuário"), "novo.login");
    await usuario.click(screen.getByRole("button", { name: "Salvar nome" }));
    await screen.findByRole("button", { name: "Abrir configurações do perfil de Novo Nome" });
    const requisicao = vi.mocked(fetch).mock.calls[1][1];
    expect(requisicao?.method).toBe("PATCH");
    expect((requisicao?.body as FormData).get("nomeUsuario")).toBe("novo.login");
    expect(navegacao.refresh).toHaveBeenCalled();
  });

  it("mantém o modal aberto e apresenta falha de senha sem sucesso falso", async () => {
    const { usuario, dialogo } = await abrir();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ erro: "SENHA_INCORRETA" }) } as Response);
    await usuario.type(screen.getByLabelText("Senha atual"), "senha-errada");
    await usuario.type(screen.getByLabelText("Nova senha"), "NovaSenha2026");
    await usuario.type(screen.getByLabelText("Confirmar nova senha"), "NovaSenha2026");
    await usuario.click(screen.getByRole("button", { name: "Salvar senha" }));
    expect((await screen.findByRole("alert")).textContent).toContain("A senha atual não confere");
    expect(dialogo.hasAttribute("open")).toBe(true);
    expect(navegacao.refresh).not.toHaveBeenCalled();
  });

  it("fecha ao clicar fora do conteúdo", async () => {
    const { dialogo } = await abrir();
    fireEvent.click(dialogo);
    expect(dialogo.hasAttribute("open")).toBe(false);
  });
});
