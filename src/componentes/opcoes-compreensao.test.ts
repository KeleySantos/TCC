// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { PainelSessoes } from "@/app/modulos/[identificador]/painel-sessoes";
import { CronometroEstudo } from "./cronometro-estudo";

const rotulosEsperados = [
  "Selecione",
  "1 — Muito baixa",
  "2 — Baixa",
  "3 — Intermediária / parcial",
  "4 — Boa",
  "5 — Muito boa",
];

const sessaoConcluida = {
  id: "s1",
  descricao: "Revisão da sessão",
  modoRegistro: "MANUAL" as const,
  dificuldadePercebida: 3,
  compreensaoPercebida: 4,
  iniciadaEm: "2026-09-25T10:00:00.000Z",
  encerradaEm: "2026-09-25T10:30:00.000Z",
  duracaoMinutos: 30,
  situacao: "CONCLUIDA" as const,
  arquivada: false,
  metodos: [{ metodo: "FEYNMAN" }],
  formatos: [{ formato: "TEXTO" }],
  materiais: [],
};

describe("opções de compreensão percebida", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("usa a escala discreta completa no registro manual", () => {
    render(createElement(PainelSessoes, {
      moduloId: "m1",
      sessoesIniciais: [],
      materiais: [],
      agoraIso: "2026-09-26T12:00:00.000Z",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Registrar sessão" }));
    const opcoes = within(screen.getByLabelText("Compreensão percebida")).getAllByRole("option").map((opcao) => opcao.textContent);
    expect(opcoes).toEqual(rotulosEsperados);
  });

  it("mantém a escala completa ao editar uma sessão", () => {
    render(createElement(PainelSessoes, {
      moduloId: "m1",
      sessoesIniciais: [sessaoConcluida],
      materiais: [],
      agoraIso: "2026-09-26T12:00:00.000Z",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const opcoes = within(screen.getByLabelText("Compreensão percebida")).getAllByRole("option").map((opcao) => opcao.textContent);
    expect(opcoes).toEqual(rotulosEsperados);
  });

  it("mantém a escala completa ao concluir uma sessão ativa", () => {
    render(createElement(PainelSessoes, {
      moduloId: "m1",
      sessoesIniciais: [{
        ...sessaoConcluida,
        modoRegistro: "CRONOMETRO",
        compreensaoPercebida: null,
        dificuldadePercebida: null,
        encerradaEm: null,
        duracaoMinutos: null,
        situacao: "ATIVA",
      }],
      materiais: [],
      agoraIso: "2026-09-26T12:00:00.000Z",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));
    const opcoes = within(screen.getByLabelText("Compreensão percebida")).getAllByRole("option").map((opcao) => opcao.textContent);
    expect(opcoes).toEqual(rotulosEsperados);
  });

  it("usa a mesma escala ao concluir o cronômetro legado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sessaoId: "s1" }) }));
    render(createElement(CronometroEstudo, { recursoId: "r1" }));
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sessão de estudo" }));
    const opcoes = within(await screen.findByLabelText("Compreensão percebida")).getAllByRole("option").map((opcao) => opcao.textContent);
    expect(opcoes).toEqual(rotulosEsperados);
  });
});
