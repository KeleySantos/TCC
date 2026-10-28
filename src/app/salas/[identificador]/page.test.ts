import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const obterSala = vi.fn();
const estado = vi.hoisted(() => ({ usuario: { id: "admin", nome: "Admin", administradorIa: false } }));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); }, redirect: vi.fn() }));
vi.mock("@/componentes/estrutura-autenticada", () => ({ EstruturaAutenticada: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => estado.usuario }));
vi.mock("@/servidor/modulos", () => ({ listarModulosPessoais: async () => [] }));
vi.mock("@/servidor/salas", () => ({ obterSalaDaConta: (...args: unknown[]) => obterSala(...args) }));

import PaginaSala from "./page";

beforeEach(() => {
  estado.usuario = { id: "admin", nome: "Admin", administradorIa: false };
  obterSala.mockResolvedValue({
    id: "sala-1",
    identificador: "grupo-js",
    nome: "Grupo JavaScript",
    descricao: "Estudos em equipe",
    papel: "PROPRIETARIO",
    situacao: "ATIVA",
    convites: [], membros: [],
    participantes: [
      { usuarioId: "ana", nome: "Ana", nomeUsuario: "ana", modulos: [{ id: "modulo-a", titulo: "Módulo A" }] },
      { usuarioId: "bruno", nome: "Bruno", nomeUsuario: "bruno", modulos: [{ id: "modulo-a", titulo: "Módulo A" }, { id: "modulo-b", titulo: "Módulo B" }] },
    ],
    modulos: [
      { id: "modulo-a", titulo: "Módulo A", descricao: "Base A", vinculos: [] },
      { id: "modulo-b", titulo: "Módulo B", descricao: "Base B", vinculos: [] },
      { id: "modulo-c", titulo: "Módulo C", descricao: "Base C", vinculos: [] },
    ],
  });
});

it("prioriza os cards dos módulos e mantém a criação em um controle discreto", async () => {
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  for (const id of ["modulo-a", "modulo-b", "modulo-c"]) expect(html).toContain(`href="/salas/grupo-js/modulos/${id}"`);
  expect(html).toContain('aria-label="Criar módulo da sala"');
  expect(html).toContain("Adicionar módulo (3/5)");
  expect(html).not.toContain("Dashboards da sala");
  expect(html).not.toContain("Dashboard geral da sala");
});

it("mostra ao administrador participantes deduplicados com seus módulos, sem convites de Sala", async () => {
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).not.toContain("Convites");
  expect(html).toContain("Participantes da sala");
  expect(html).toContain("Ana");
  expect(html).toContain("Bruno");
  expect(html).toContain("Módulo A");
  expect(html).toContain("Módulo B");
  expect(html).toContain("Controles da sala");
});

it("mostra ao participante apenas os módulos autorizados e oculta a lista geral", async () => {
  estado.usuario = { id: "ana", nome: "Ana", administradorIa: false };
  obterSala.mockResolvedValue({
    id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", descricao: "Estudos em equipe", papel: "MEMBRO", situacao: "ATIVA",
    convites: [], membros: [],
    modulos: [{ id: "modulo-a", titulo: "Módulo A", descricao: "Base A", vinculos: [] }],
  });
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).toContain('href="/salas/grupo-js/modulos/modulo-a"');
  expect(html).not.toContain("modulo-b");
  expect(html).not.toContain("modulo-c");
  expect(html).not.toContain("Participantes da sala");
});
