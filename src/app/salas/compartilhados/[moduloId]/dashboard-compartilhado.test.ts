// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { calcularMetricasSessoes } from "@/dominio/analises/metricas-sessoes";
import { DashboardCompartilhado } from "./dashboard-compartilhado";
const dados = {
  modulo: { id: "m", titulo: "Algoritmos de Ana", proprietarioNome: "Ana" },
  metricas: { ...calcularMetricasSessoes([]), frequencia: { diasComEstudo: 0, maiorSequenciaDias: 0, primeiraSessaoEm: null, ultimaSessaoEm: null }, evolucaoSemanal: { periodicidade: "SEMANAL_UTC" as const, pontos: [] } },
  aprendizagem: { resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: null, quantidadeSessoes: 0, compreensaoMinima: 4, desempenhoMinimo: 70 }, metodoMaiorCompreensao: null, formatoMaiorCompreensao: null, evolucaoPercepcaoEvidencia: [] }, metodosResultados: [], formatosResultados: [], conceitosMaiorDificuldade: [], conceitosMaiorCompreensao: [] },
};
const periodo = { inicio: "2026-10-01", fim: "2026-10-18", hoje: "2026-10-18", ativo: false, erro: null };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("revogação detectada ao retomar a aba remove os dados e não aceita uma resposta anterior atrasada", async () => {
  let concluirAntiga!: (valor: unknown) => void;
  let chamadas = 0;
  vi.stubGlobal("fetch", vi.fn(() => {
    chamadas++;
    if (chamadas === 1) return new Promise((resolver) => { concluirAntiga = resolver; });
    return Promise.resolve({ ok: false, status: 403 });
  }));
  render(createElement(DashboardCompartilhado, { inicial: dados, periodo }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Algoritmos de Ana");
  fireEvent.focus(window); fireEvent.focus(window);
  await screen.findByText(/acesso.*não está mais disponível/i);
  concluirAntiga({ ok: true, json: async () => ({ dashboard: dados }) });
  await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "Algoritmos de Ana" })).toBeNull());
  expect(screen.queryByRole("button", { name: /Gerar interpretação/ })).toBeNull();
});
it("falha de rede mantém os dados com aviso, sem afirmar que houve revogação", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("rede"); }));
  render(createElement(DashboardCompartilhado, { inicial: dados, periodo }));
  fireEvent.focus(window);
  await screen.findByText(/Não foi possível atualizar/);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Algoritmos de Ana");
});
