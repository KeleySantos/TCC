// @vitest-environment jsdom

import { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const acoes = vi.hoisted(() => ({
  editar: vi.fn(),
  parar: vi.fn(),
  atualizar: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: acoes.atualizar }) }));
vi.mock("./acoes", () => ({
  editarInstanciaVinculada: (...argumentos: unknown[]) => acoes.editar(...argumentos),
  pararCompartilhamentoDaInstancia: (...argumentos: unknown[]) => acoes.parar(...argumentos),
}));

import { ModalInstanciaVinculada } from "./modal-instancia-vinculada";

const estilos = readFileSync(resolve(process.cwd(), "src/app/salas/modal-instancia-vinculada.module.css"), "utf8");

const propriedades = {
  vinculoId: "vinculo-1",
  titulo: "Cálculo II",
  descricao: "Turma ATP5782",
  resumo: "Instância vinculada",
};

describe("modal da instância vinculada", () => {
  beforeEach(() => {
    acoes.editar.mockReset().mockResolvedValue({ sucesso: true });
    acoes.parar.mockReset().mockResolvedValue({ sucesso: true });
    acoes.atualizar.mockReset();
  });

  afterEach(cleanup);

  it("abre as ações da instância sem transformar o card em navegação", async () => {
    const usuario = userEvent.setup();
    render(createElement(ModalInstanciaVinculada, propriedades));

    const gatilho = screen.getByRole("button", { name: "Gerenciar instância Cálculo II" });
    expect(gatilho.closest("a")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();

    await usuario.click(gatilho);

    const dialogo = screen.getByRole("dialog", { name: "Gerenciar Cálculo II" });
    expect(within(dialogo).getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(within(dialogo).getByRole("button", { name: "Parar compartilhamento" })).toBeTruthy();
    expect(document.activeElement).toBe(within(dialogo).getByRole("button", { name: "Fechar" }));
  });

  it("edita nome e descrição pelo vínculo contextual e atualiza a tela", async () => {
    const usuario = userEvent.setup();
    render(createElement(ModalInstanciaVinculada, propriedades));

    await usuario.click(screen.getByRole("button", { name: "Gerenciar instância Cálculo II" }));
    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const titulo = screen.getByRole("textbox", { name: "Nome da instância" });
    const descricao = screen.getByRole("textbox", { name: "Descrição" });
    await usuario.clear(titulo);
    await usuario.type(titulo, "Cálculo avançado");
    await usuario.clear(descricao);
    await usuario.type(descricao, "Nova descrição");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(acoes.editar).toHaveBeenCalledTimes(1));
    const formulario = acoes.editar.mock.calls[0][1] as FormData;
    expect(formulario.get("vinculoId")).toBe("vinculo-1");
    expect(formulario.get("titulo")).toBe("Cálculo avançado");
    expect(formulario.get("descricao")).toBe("Nova descrição");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(acoes.atualizar).toHaveBeenCalledTimes(1);
  });

  it("exige confirmação explícita antes de parar o compartilhamento", async () => {
    const usuario = userEvent.setup();
    render(createElement(ModalInstanciaVinculada, propriedades));

    await usuario.click(screen.getByRole("button", { name: "Gerenciar instância Cálculo II" }));
    await usuario.click(screen.getByRole("button", { name: "Parar compartilhamento" }));
    expect(acoes.parar).not.toHaveBeenCalled();
    expect(screen.getByText(/deixará de receber atualizações/i)).toBeTruthy();

    await usuario.click(screen.getByRole("button", { name: "Confirmar parada do compartilhamento" }));
    await waitFor(() => expect(acoes.parar).toHaveBeenCalledTimes(1));
    const formulario = acoes.parar.mock.calls[0][1] as FormData;
    expect(formulario.get("vinculoId")).toBe("vinculo-1");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(acoes.atualizar).toHaveBeenCalledTimes(1);
  });

  it("fecha por Escape e devolve o foco ao card", async () => {
    const usuario = userEvent.setup();
    render(createElement(ModalInstanciaVinculada, propriedades));
    const gatilho = screen.getByRole("button", { name: "Gerenciar instância Cálculo II" });

    await usuario.click(gatilho);
    await usuario.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(gatilho);
  });

  it("reserva tokens estruturais a cards e usa o contrato de borda dos modais e controles", () => {
    expect(estilos).not.toMatch(/--(?:espessura|cor)-borda-estrutural/);
    expect(estilos).toMatch(/\.dialogo\s*\{[^}]*border:\s*1px solid var\(--cor-borda\)/s);
    expect(estilos).toMatch(/\.fechar\s*\{[^}]*border:\s*1px solid var\(--cor-borda\)[^}]*border-radius:\s*var\(--raio-controle\)/s);
    expect(estilos).toMatch(/\.formulario input,\s*\.formulario textarea\s*\{[^}]*border:\s*1px solid var\(--cor-borda\)[^}]*border-radius:\s*var\(--raio-controle\)/s);
    expect(estilos).toMatch(/\.rodape button\s*\{[^}]*border:\s*1px solid var\(--cor-borda\)[^}]*border-radius:\s*var\(--raio-controle\)/s);
  });
});
