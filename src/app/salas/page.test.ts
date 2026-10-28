// @vitest-environment jsdom
import { Fragment, createElement, type ReactNode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/componentes/estrutura-autenticada", () => ({
  EstruturaAutenticada: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => ({ id: "u", nome: "Ana" }) }));
vi.mock("./acoes", () => ({ criarNovaSala: vi.fn(), entrarEmSala: vi.fn() }));
const { listarSalas, listarCompartilhados } = vi.hoisted(() => ({ listarSalas: vi.fn(), listarCompartilhados: vi.fn() }));
vi.mock("@/servidor/salas", () => ({ listarSalasDaConta: listarSalas }));
vi.mock("@/servidor/compartilhamento-modulos", () => ({ listarModulosCompartilhados: listarCompartilhados }));
import PaginaSalas from "./page";

const salas = [
  { id: "s1", identificador: "estudos", nome: "Estudos", descricao: "Descrição da sala de estudos", papel: "MEMBRO", situacao: "ATIVA", _count: { modulos: 1, membros: 3 } },
  { id: "s2", identificador: "revisao", nome: "Revisão", descricao: "Descrição da sala de revisão", papel: "PROPRIETARIO", situacao: "ARQUIVADA", _count: { modulos: 2, membros: 1 } },
];
afterEach(() => { cleanup(); vi.clearAllMocks(); });

async function abrir(parametros: { aba?: string; erro?: string; sucesso?: string } = {}, lista = salas) {
  listarSalas.mockResolvedValue(lista);
  listarCompartilhados.mockResolvedValue([{ moduloId: "m", titulo: "JavaScript", identificador: "javascript", proprietarioNome: "Diego" }]);
  render(await PaginaSalas({ searchParams: Promise.resolve(parametros) }));
}

it("simplifica o cabeçalho e mantém a introdução e o título da biblioteca", async () => {
  await abrir();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("SALAS");
  for (const texto of ["APRENDIZAGEM EM GRUPO", "SUAS SALAS", "Módulos disponíveis"]) {
    expect(screen.queryByText(texto)).toBeNull();
  }
  expect(screen.queryByRole("definition")).toBeNull();
  expect(screen.getByText("Participe de espaços compartilhados e conecte seus módulos quando quiser colaborar.")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Espaços que você participa" })).toBeTruthy();
});

it("remove descrições e contagens dos cards sem alterar links, papéis e arquivamento", async () => {
  await abrir();
  const membro = screen.getByRole("link", { name: "Abrir sala Estudos" });
  const proprietario = screen.getByRole("link", { name: "Abrir sala Revisão" });
  expect(membro.getAttribute("href")).toBe("/salas/estudos");
  expect(proprietario.getAttribute("href")).toBe("/salas/revisao");
  expect(membro.textContent).toBe("EstudosVocê é membro");
  expect(proprietario.textContent).toBe("RevisãoVocê administra esta sala · Arquivada");
});

it("mantém formulários e navegação às duas abas, incluindo o proprietário do módulo recebido", async () => {
  await abrir();
  const usuario = userEvent.setup();
  await usuario.click(screen.getByText("Acessar módulo com código", { selector: "summary" }));
  expect(screen.getByRole("textbox", { name: "Código do módulo" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Acessar módulo" })).toBeTruthy();
  await usuario.click(screen.getByText("Criar sala", { selector: "summary" }));
  expect(screen.getByRole("textbox", { name: "Nome da sala" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Criar sala" })).toBeTruthy();
  const aba = screen.getByRole("tab", { name: "Compartilhado comigo" });
  await usuario.click(aba);
  const painel = screen.getByRole("tabpanel");
  expect(within(painel).getByText("Compartilhado por: Diego")).toBeTruthy();
  expect(within(painel).getByRole("link", { name: /JavaScript/ }).getAttribute("href")).toBe("/salas/compartilhados/m");
  expect(within(painel).getByRole("button", { name: "Acessar por código" })).toBeTruthy();
});

it("preserva o estado vazio e as mensagens de retorno", async () => {
  await abrir({ erro: "convite", sucesso: "saida" }, []);
  expect(screen.getByText("Sua primeira sala começa aqui")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("O código é inválido, expirou ou foi revogado.");
  expect(screen.getByRole("status").textContent).toBe("Você saiu da sala sem perder seus módulos pessoais.");
});
