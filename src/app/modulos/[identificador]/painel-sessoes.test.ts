// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PainelSessoes, type SessaoModulo } from "./painel-sessoes";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const sessao: SessaoModulo = {
  id: "sessao-1",
  descricao: "Revisão de eventos",
  modoRegistro: "MANUAL",
  dificuldadePercebida: 2,
  compreensaoPercebida: 4,
  iniciadaEm: "2026-08-30T11:13:00.000Z",
  encerradaEm: "2026-08-30T12:06:00.000Z",
  duracaoMinutos: 53,
  situacao: "CONCLUIDA",
  arquivada: false,
  metodos: [{ metodo: "POMODORO" }],
  formatos: [{ formato: "IMAGEM" }],
  materiais: [{ recurso: { id: "material-1", titulo: "DOM e eventos" } }],
};

afterEach(() => cleanup());

describe("histórico de sessões do módulo", () => {
  it("oculta o contexto até a linha da sessão ser expandida", async () => {
    const usuario = userEvent.setup();
    render(createElement(PainelSessoes, { agoraIso: "2026-09-01T12:00:00.000Z", materiais: [], moduloId: "modulo-1", sessoesIniciais: [sessao] }));

    expect(screen.queryByText(/ROTINA DE ESTUDO/)).toBeNull();
    expect(screen.queryByText(/Pomodoro/)).toBeNull();
    const expansor = screen.getByRole("button", { name: "Abrir detalhes da sessão Revisão de eventos" });
    expect(expansor.getAttribute("aria-expanded")).toBe("false");

    await usuario.click(expansor);

    expect(screen.getByText(/Pomodoro/)).toBeTruthy();
    expect(screen.getByText(/DOM e eventos/)).toBeTruthy();
    expect(screen.getByText("08:13 — 09:06")).toBeTruthy();
    expect(screen.queryByText(/30 de ago. de 2026, 08:13/)).toBeNull();
    expect(expansor.getAttribute("aria-expanded")).toBe("true");
  });

  it("mostra a data abaixo da duração e remove o título redundante do histórico", () => {
    render(createElement(PainelSessoes, { agoraIso: "2026-09-01T12:00:00.000Z", materiais: [], moduloId: "modulo-1", sessoesIniciais: [sessao] }));

    const duracao = screen.getByText("53 min");
    expect(duracao.parentElement?.textContent).toContain("30/08/2026");
    expect(screen.queryByRole("heading", { name: "Histórico do módulo" })).toBeNull();
  });

  it("registra uma única data, horários separados e percepções em escala direta", async () => {
    const usuario = userEvent.setup();
    render(createElement(PainelSessoes, { agoraIso: "2026-09-01T12:00:00.000Z", materiais: [{ id: "material-1", titulo: "DOM e eventos" }], moduloId: "modulo-1", sessoesIniciais: [] }));
    await usuario.click(screen.getByRole("button", { name: "Registrar sessão" }));

    expect(screen.queryByText("REGISTRO MANUAL")).toBeNull();
    expect(screen.getByLabelText("Data da sessão").getAttribute("type")).toBe("date");
    expect(screen.getByLabelText("Horário de início").getAttribute("type")).toBe("time");
    expect(screen.getByLabelText("Horário de término").getAttribute("type")).toBe("time");
    expect(document.querySelectorAll('input[type="datetime-local"]')).toHaveLength(0);
    expect(screen.queryByText(/A duração será calculada automaticamente/)).toBeNull();
    expect(screen.getByText("Informe pelo menos um formato utilizado.")).toBeTruthy();
    expect(screen.getByText("Opcional.")).toBeTruthy();
    expect(screen.queryByText(/A sessão também pode ser registrada/)).toBeNull();
    const dificuldade = screen.getByRole("group", { name: "Dificuldade percebida" });
    const dificuldadeBaixa = within(dificuldade).getByRole("radio", { name: "1 Muito baixa" });
    const dificuldadeAlta = within(dificuldade).getByRole("radio", { name: "5 Muito alta" });
    expect(dificuldadeBaixa.closest("label")?.textContent).toBe("1");
    expect(dificuldadeAlta.closest("label")?.textContent).toBe("5");
    expect(within(dificuldade).getByText("Muito baixa")).toBeTruthy();
    expect(within(dificuldade).getByText("Muito alta")).toBeTruthy();
  });

  it("mantém editar e arquivar dentro do menu de três pontos", async () => {
    const usuario = userEvent.setup();
    render(createElement(PainelSessoes, { agoraIso: "2026-09-01T12:00:00.000Z", materiais: [], moduloId: "modulo-1", sessoesIniciais: [sessao] }));

    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    await usuario.click(screen.getByRole("button", { name: "Ações da sessão Revisão de eventos" }));
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Arquivar" })).toBeTruthy();
  });

  it("oferece restaurar para uma sessão arquivada", async () => {
    const usuario = userEvent.setup();
    render(createElement(PainelSessoes, { agoraIso: "2026-09-01T12:00:00.000Z", materiais: [], moduloId: "modulo-1", sessoesIniciais: [{ ...sessao, arquivada: true }] }));

    await usuario.click(screen.getByRole("checkbox", { name: /Mostrar arquivadas/ }));
    await usuario.click(screen.getByRole("button", { name: "Ações da sessão Revisão de eventos" }));
    expect(screen.getByRole("button", { name: "Restaurar" })).toBeTruthy();
  });
});
