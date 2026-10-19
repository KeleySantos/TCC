// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/app/modulos/acoes", () => ({ atualizarModulo: vi.fn() }));
import { EditorModulo } from "./editores";
import { ConteudoModuloOrganizado } from "./conteudo-modulo-organizado";
import { ConteudoDashboardModulo } from "./conteudo-dashboard-modulo";
import { InterpretacaoAutomatica, type PropriedadesInterpretacao } from "@/componentes/interpretacao-automatica";
import { calcularMetricasSessoes } from "@/dominio/analises/metricas-sessoes";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const periodo = { inicio: "2026-10-01", fim: "2026-10-18", ativo: true, erro: null, hoje: "2026-10-18" };

it("cabeçalho mostra somente o nome, sem perder a descrição no formulário de edição", () => {
  const propriedades = { id: "m", identificador: "javascript", titulo: "JavaScript", descricao: "Descrição armazenada", inicialmenteEditando: false };
  const tela = render(createElement(EditorModulo, propriedades));
  expect(screen.getByRole("heading", { name: "JavaScript", level: 1 })).toBeTruthy();
  expect(screen.queryByText("MÓDULO DE APRENDIZAGEM")).toBeNull();
  expect(screen.queryByText("Descrição armazenada")).toBeNull();
  tela.rerender(createElement(EditorModulo, { ...propriedades, inicialmenteEditando: true, key: "editar" }));
  expect((screen.getByLabelText("Descrição") as HTMLTextAreaElement).value).toBe("Descrição armazenada");
});

it("Filtro e IA ficam no grupo das abas; a IA do módulo abre o modal e trata erro sem chamar endpoint pessoal", async () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  const buscar = vi.fn(async () => ({ ok: false, json: async () => ({ erro: "FALHA" }) }));
  vi.stubGlobal("fetch", buscar);
  const usuario = userEvent.setup();
  render(createElement(ConteudoModuloOrganizado, {
    cabecalho: createElement("h1", null, "JavaScript"), dashboard: createElement("p", null, "Gráficos"), linhaDoTempo: createElement("p", null, "Trajetória"), sessoesMateriais: createElement("p", null, "Sessões"), periodo,
    acoesDashboard: createElement<PropriedadesInterpretacao>(InterpretacaoAutomatica, { compacto: true, modalLateral: true, identificadorModulo: "javascript", inicio: periodo.inicio, fim: periodo.fim }),
  }));
  const acoes = screen.getByRole("group", { name: "Ações do módulo" });
  expect(within(acoes).getByRole("button", { name: "Filtro" })).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  await usuario.click(within(acoes).getByRole("button", { name: "Gerar interpretação da IA" }));
  expect(await screen.findByRole("dialog", { name: "Interpretação da IA" })).toBeTruthy();
  expect(await screen.findByText(/Não foi possível preparar/)).toBeTruthy();
  expect(buscar).toHaveBeenCalledWith("/api/modulos/javascript/interpretacoes?inicio=2026-10-01&fim=2026-10-18", { method: "POST" });
  await usuario.click(screen.getByRole("tab", { name: "Linha do tempo" }));
  expect(within(acoes).queryByRole("button", { name: "Gerar interpretação da IA" })).toBeNull();
  expect(within(acoes).getByRole("button", { name: "Filtro" })).toBeTruthy();
});

it("versão simplificada mantém os indicadores e gráficos sem os cabeçalhos e controles removidos", () => {
  const originais = calcularMetricasSessoes([{ id: "s", moduloId: "m", descricao: "Registro", iniciadaEm: new Date("2026-10-01T10:00Z"), encerradaEm: new Date("2026-10-01T10:30Z"), duracaoMinutos: 30, situacao: "CONCLUIDA", arquivada: false, dificuldadePercebida: 2, compreensaoPercebida: 4, metodos: [], formatos: [] }], "m");
  const metricas = { ...originais, frequencia: { ...originais.frequencia, primeiraSessaoEm: "2026-10-01T10:30Z", ultimaSessaoEm: "2026-10-01T10:30Z" }, evolucaoSemanal: { periodicidade: "SEMANAL_UTC" as const, pontos: [] } };
  render(createElement(ConteudoDashboardModulo, {
    visualEnxuto: true, tituloModulo: "JavaScript", metricas,
    aprendizagem: { resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 }, metodoMaiorCompreensao: null, formatoMaiorCompreensao: null, evolucaoPercepcaoEvidencia: [] }, metodosResultados: [], formatosResultados: [], conceitosMaiorDificuldade: [], conceitosMaiorCompreensao: [] },
  }));
  expect(screen.getByText("30 min")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Percepção × evidências ao longo do tempo" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Regularidade do estudo" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Métodos × Resultados" })).toBeTruthy();
  for (const texto of ["MÉTRICAS DAS SESSÕES", "EVOLUÇÃO SEMANAL", "REGULARIDADE", "PERCEPÇÕES", "PERCEPÇÃO E EVIDÊNCIAS", "Como estas métricas são calculadas", "Ver dados em tabela"]) expect(screen.queryByText(texto)).toBeNull();
  expect(screen.queryByRole("heading", { name: "Seu ritmo em JavaScript" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Resultados associados às formas de estudo" })).toBeNull();
});
