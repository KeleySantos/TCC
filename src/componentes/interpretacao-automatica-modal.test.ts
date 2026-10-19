// @vitest-environment jsdom

import { createElement, type ComponentType } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InterpretacaoAutomatica } from "./interpretacao-automatica";

describe("painel lateral da interpretação automática", () => {
  const ComponenteTestavel = InterpretacaoAutomatica as ComponentType<{ compacto?: boolean; modalLateral?: boolean }>;

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  });

  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("abre, gera os insights automaticamente, fecha e devolve o foco", async () => {
    const requisicao = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ interpretacao: {
        origem: "LOCAL", modelo: null, motivoContingencia: "SEM_CHAVE", tentativas: [],
        insights: [{ tipo: "OBSERVACAO", titulo: "Ritmo observado", observacao: "Os registros mostram um ritmo recente de estudo.", resumoEvidencias: null, perguntaReflexiva: null, experimentoSugerido: null, confianca: "BAIXA" }],
        contexto: { versaoAlgoritmo: "teste", quantidadeModulos: 1, quantidadeSessoesValidas: 3, minutosValidos: 90, periodo: { inicio: null, fim: null } },
        limitacao: "Interpretação limitada aos registros observados.", padroesObservados: [], feedbacks: [], conselhos: [], perguntasReflexao: [],
      } }),
    });
    vi.stubGlobal("fetch", requisicao);
    const usuario = userEvent.setup();
    render(createElement(ComponenteTestavel, { compacto: true, modalLateral: true }));

    const abrir = screen.getByRole("button", { name: "Gerar interpretação da IA" });
    expect(screen.queryByRole("dialog")).toBeNull();

    await usuario.click(abrir);
    expect(screen.getByRole("dialog", { name: "Interpretação da IA" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gerar interpretação" })).toBeNull();
    await waitFor(() => expect(screen.getByText("Ritmo observado")).toBeTruthy());
    expect(requisicao).toHaveBeenCalledWith("/api/interpretacoes", { method: "POST" });

    await usuario.click(screen.getByRole("button", { name: "Fechar interpretação da IA" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(abrir);
  });
});
