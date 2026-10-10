// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularDashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { MapaConceitosDashboard } from "./mapa-conceitos-dashboard";

const modulos = [{ id: "m1", identificador: "logica", titulo: "Lógica" }];
const referencia = new Date("2026-09-21T12:00:00.000Z");

afterEach(cleanup);

describe("mapa observacional de conceitos", () => {
  it("abre detalhe por teclado e separa arquivos de menções sem indicar domínio", async () => {
    const dados = calcularDashboardObservacional(modulos, [{
      id: "s1", moduloId: "m1", descricao: "Pratiquei árvores de decisão.", iniciadaEm: new Date("2026-09-19T11:30:00Z"), encerradaEm: new Date("2026-09-19T12:00:00Z"), duracaoMinutos: 30,
      situacao: SituacaoSessao.CONCLUIDA, arquivada: false, dificuldadePercebida: 3, compreensaoPercebida: 4,
      metodos: [MetodoEstudo.FEYNMAN], formatos: [FormatoConteudo.TEXTO],
    }], [{ id: "a1", moduloId: "m1", titulo: "Árvores em PDF", conceitos: ["Árvores de decisão"] }], referencia);
    render(createElement(MapaConceitosDashboard, { dados }));
    const botao = screen.getByRole("button", { name: /Árvores de decisão/i });
    botao.focus();
    await userEvent.keyboard("{Enter}");
    expect(botao.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/1 arquivo analisado/i)).toBeTruthy();
    expect(screen.getByText(/1 sessão com menção/i)).toBeTruthy();
    expect(screen.getByText(/Técnica de Feynman/i)).toBeTruthy();
    expect(screen.queryByText(/conceito consolidado|taxa de acerto/i)).toBeNull();
  });

  it("informa de onde vêm os conceitos quando não há arquivos analisados", () => {
    render(createElement(MapaConceitosDashboard, { dados: calcularDashboardObservacional(modulos, [], [], referencia) }));
    expect(screen.getByText(/Seus conceitos aparecerão aqui/i)).toBeTruthy();
  });
});
