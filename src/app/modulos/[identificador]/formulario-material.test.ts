// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioMaterial } from "./formulario-material";

const atualizar = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: atualizar }),
}));
vi.mock("../acoes", () => ({ criarMaterial: vi.fn() }));

describe("cadastro de arquivo no módulo", () => {
  beforeEach(() => {
    atualizar.mockClear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ analisar: false }) }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("oferece somente as quatro funções do arquivo e não oferece link, texto ou formato", async () => {
    const usuario = userEvent.setup();
    render(createElement(FormularioMaterial, { moduloId: "modulo-1" }));

    await usuario.click(screen.getByRole("button", { name: "Adicionar material" }));

    expect(screen.getByRole("button", { name: "Material" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Avaliação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anotação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidência visual" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Texto" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tipo do conteúdo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome do arquivo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Descrição")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Tempo estimado")).not.toBeInTheDocument();
  });

  it("oculta a data para material e permite informá-la nas outras funções", async () => {
    const usuario = userEvent.setup();
    const { container } = render(createElement(FormularioMaterial, { moduloId: "modulo-1" }));
    await usuario.click(screen.getByRole("button", { name: "Adicionar material" }));

    const dataMaterial = container.querySelector<HTMLInputElement>('input[name="dataEvento"]');
    expect(dataMaterial).toBeNull();
    expect(screen.queryByLabelText("Data do arquivo")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Avaliação" }));
    expect(screen.getByLabelText("Data do arquivo")).toHaveAttribute("type", "date");
  });

  it("envia o arquivo sem exigir nome, descrição ou tempo", async () => {
    const usuario = userEvent.setup();
    render(createElement(FormularioMaterial, { moduloId: "modulo-1" }));
    await usuario.click(screen.getByRole("button", { name: "Adicionar material" }));
    await usuario.upload(screen.getByLabelText("Selecionar arquivo"), new File(["conteúdo"], "resumo-aula.txt", { type: "text/plain" }));
    const botaoEnviar = screen.getByRole("button", { name: "Enviar arquivo" });
    fireEvent.submit(botaoEnviar.closest("form")!);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const requisicao = vi.mocked(fetch).mock.calls[0][1];
    const dados = requisicao?.body as FormData;
    expect(dados.get("arquivo")).toBeInstanceOf(File);
    expect(dados.has("titulo")).toBe(false);
    expect(dados.has("descricao")).toBe(false);
    expect(dados.has("minutosEstimados")).toBe(false);
  });
});
