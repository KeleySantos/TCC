// @vitest-environment jsdom
import { Fragment, createElement, type ReactNode } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/componentes/estrutura-autenticada", () => ({
  EstruturaAutenticada: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));
vi.mock("@/componentes/atualizar-ao-retomar", () => ({ AtualizarAoRetomar: () => null }));
vi.mock("@/app/modulos/acoes", () => ({ criarRascunhoModulo: vi.fn() }));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => ({ id: "u", nome: "Ana" }) }));
const { listar } = vi.hoisted(() => ({ listar: vi.fn() }));
vi.mock("@/servidor/modulos", () => ({ listarModulosPessoais: listar }));
import PaginaModulos from "./page";
const estilos = readFileSync(resolve(process.cwd(), "src/app/modulos/page.module.css"), "utf8");

const modulos = [
  { id: "m1", identificador: "javascript", titulo: "JavaScript", rascunho: false, quantidadeCompartilhamentosDiretosAtivos: 0, vinculoSalaAtivo: { id: "v1", moduloPessoalId: "m1", situacao: "ATIVO", moduloSala: { id: "ms1", sala: { id: "s1", identificador: "sala-estudos", nome: "Sala de estudos" } } } },
  { id: "m2", identificador: "compiladores", titulo: "Compiladores", rascunho: false, quantidadeCompartilhamentosDiretosAtivos: 1, vinculoSalaAtivo: null },
  { id: "m3", identificador: "rascunho", titulo: "", rascunho: true, quantidadeCompartilhamentosDiretosAtivos: 0, vinculoSalaAtivo: null },
];
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("mostra título, descrição e divisor no cabeçalho e preserva o botão de criação", async () => {
  listar.mockResolvedValue(modulos);
  render(await PaginaModulos({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("MÓDULOS");
  for (const texto of ["SEUS ESPAÇOS DE ESTUDO", "BIBLIOTECA PESSOAL", "Continue de onde parou", "Módulos ativos", "Sessões concluídas"]) {
    expect(screen.queryByText(texto)).toBeNull();
  }
  const subtitulo = screen.getByText("Organize seus conteúdos, materiais e sessões de estudo em espaços separados.");
  expect(subtitulo.tagName).toBe("P");
  expect(subtitulo.className).toContain("subtitulo");
  expect(screen.getByRole("heading", { level: 1 }).closest("header")?.className).toContain("cabecalho");
  const adicionar = screen.getByRole("button", { name: "Adicionar módulo" });
  expect(adicionar.textContent).toContain("Adicionar módulo");
  expect(adicionar.closest("header")).toBe(screen.getByRole("heading", { level: 1 }).closest("header"));
  expect(screen.getByRole("region", { name: "Módulos pessoais" })).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Módulos registrados" })).toBeTruthy();
});

it("mantém links e rascunhos e sinaliza somente o vínculo ativo com Sala", async () => {
  listar.mockResolvedValue(modulos);
  render(await PaginaModulos({ searchParams: Promise.resolve({}) }));
  const compartilhado = screen.getByRole("link", { name: "Abrir módulo JavaScript" });
  expect(compartilhado.getAttribute("href")).toBe("/modulos/javascript");
  const indicador = within(compartilhado).getByRole("img", { name: "Instância compartilhada com a sala Sala de estudos" });
  expect(indicador.textContent).toBe("");
  expect(indicador.querySelector("svg")).toBeTruthy();
  expect(indicador.getAttribute("title")).toBe("Instância compartilhada com a sala Sala de estudos");
  expect(compartilhado.getAttribute("aria-describedby")).toBe(indicador.id);
  expect(estilos).toMatch(/\.indicadorCompartilhamento\s*\{[^}]*top:\s*16px[^}]*right:\s*16px/s);
  expect(within(screen.getByRole("link", { name: "Abrir módulo Compiladores" })).queryByRole("img")).toBeNull();
  expect(screen.getByRole("link", { name: "Continuar configuração de Módulo sem nome" }).getAttribute("href")).toBe("/modulos/rascunho");
});

it("preserva estado vazio e mensagens existentes", async () => {
  listar.mockResolvedValue([]);
  render(await PaginaModulos({ searchParams: Promise.resolve({ erro: "duplicado", sucesso: "arquivado" }) }));
  expect(screen.getByText("Seu primeiro módulo começa aqui")).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toBe("Já existe um módulo com este título na sua conta.");
  expect(screen.getByRole("status").textContent).toBe("Módulo arquivado sem apagar seus registros.");
  expect(screen.getByRole("button", { name: "Adicionar módulo" })).toBeTruthy();
});

it("reutiliza o controle de adicionar das salas e ícones com contraste escuro", () => {
  expect(estilos).toMatch(/\.botaoAdicionar\s*\{[^}]*min-height:\s*42px[^}]*padding:\s*0 14px[^}]*border-radius:\s*12px[^}]*box-shadow:\s*none[^}]*font-size:\s*\.76rem[^}]*font-weight:\s*780/s);
  expect(estilos).toMatch(/\.iconeModulo\s*\{[^}]*color:\s*#fff[^}]*background:\s*var\(--cor-navegacao\)/s);
});

it("separa a borda do controle de adicionar da borda estrutural dos cards", () => {
  expect(estilos).toMatch(/\.botaoAdicionar\s*\{[^}]*border:\s*1px solid var\(--cor-borda\)/s);
  expect(estilos).toMatch(/\.cartaoModulo\s*\{[^}]*border:\s*var\(--espessura-borda-estrutural\) solid var\(--cor-borda-estrutural\)/s);
});

it("usa no cabeçalho o mesmo respiro superior do Dashboard", () => {
  expect(estilos).toMatch(/\.areaConteudo\s*\{[^}]*padding:\s*clamp\(38px,\s*4\.8vw,\s*64px\)\s+clamp\(20px,\s*3vw,\s*46px\)\s+58px/s);
});
