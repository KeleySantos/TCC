import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, expect, it, vi } from "vitest";

const obterSala = vi.fn();
const estado = vi.hoisted(() => ({ usuario: { id: "admin", nome: "Admin", administradorIa: false } }));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); }, redirect: vi.fn(), useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/componentes/estrutura-autenticada", () => ({ EstruturaAutenticada: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => estado.usuario }));
vi.mock("@/servidor/modulos", () => ({ listarModulosPessoais: async () => [] }));
vi.mock("@/servidor/salas", () => ({ obterSalaDaConta: (...args: unknown[]) => obterSala(...args) }));

import PaginaSala from "./page";
const estilos = readFileSync(resolve(process.cwd(), "src/app/salas/page.module.css"), "utf8");

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
  expect(html).toContain('aria-label="Adicionar módulo"');
  expect(html).toContain("Adicionar módulo</summary>");
  expect(html).toContain("Adicionar módulo (3/5)");
  expect(html).toContain('href="/salas"');
  expect(html).toContain("Voltar para Salas");
  expect(html).not.toContain("MÓDULOS-PAI");
  expect(html).not.toContain("Base A");
  expect(html).not.toContain("Base B");
  expect(html).not.toContain("Base C");
  expect(html).not.toContain("iconeDestaque");
  expect(html).not.toContain("Dashboards da sala");
  expect(html).not.toContain("Dashboard geral da sala");
  expect(html).toMatch(/<header[^>]*class="[^"]*apresentacao[^"]*"[^>]*>[\s\S]*Adicionar módulo[\s\S]*<\/header>/);
});

it("mostra participantes e move as ações para um menu no cabeçalho", async () => {
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).not.toContain("Convites");
  expect(html).toContain("Participantes da sala");
  expect(html).toContain("Ana");
  expect(html).toContain("Bruno");
  expect(html).toContain("Módulo A");
  expect(html).toContain("Módulo B");
  expect(html).toContain('aria-label="Remover Ana da sala"');
  expect(html).toContain('aria-label="Remover Bruno da sala"');
  expect(html).not.toContain("@ana");
  expect(html).not.toContain("@bruno");
  expect(html).toContain('aria-label="Ações da sala"');
  expect(html).toContain("Arquivar sala");
  expect(html).toContain("Excluir sala");
  expect(html).not.toContain("Controles da sala");
  expect(html).not.toContain("VISÃO CONSOLIDADA");
  expect(html).not.toContain("lucide-users-round");
  expect(html).toMatch(/<div[^>]*class="[^"]*barraSuperiorSala[^"]*"[^>]*>[\s\S]*Voltar para Salas[\s\S]*Arquivar sala[\s\S]*Excluir sala[\s\S]*<\/div>/);
  expect(html).toContain("colunaAcoes");
  expect(estilos).toMatch(/\.colunaAcoes\s*\{[^}]*min-height:\s*calc\(100dvh - 320px\)/s);
  expect(estilos).toMatch(/\.colunaAcoes\s*>\s*\.painel\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s);
  expect(estilos).toMatch(/\.gradeDetalhe\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(240px, 280px\)/s);
  expect(estilos).toMatch(/\.listaModulos\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
  expect(estilos).toMatch(/\.conteudoMenuSala\s+button\s*\{[^}]*min-height:\s*36px[^}]*background:\s*transparent[^}]*font-size:\s*0\.72rem[^}]*font-weight:\s*750/s);
  expect(estilos).toMatch(/\.botaoNeutro,\s*\.botaoPerigo,\s*\.botaoPerigoSecundario\s*\{[^}]*color:\s*var\(--cor-texto\)\s*!important[^}]*background:\s*transparent\s*!important/s);
});

it("centraliza o estado vazio dos participantes no card", async () => {
  obterSala.mockResolvedValue({
    id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", descricao: "Estudos em equipe", papel: "PROPRIETARIO", situacao: "ATIVA",
    convites: [], membros: [], participantes: [], modulos: [],
  });
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).toContain("Ainda não há participantes vinculados aos módulos desta sala.");
  expect(estilos).toMatch(/\.estadoVazioParticipantes\s*\{[^}]*display:\s*grid[^}]*place-items:\s*center[^}]*text-align:\s*center/s);
});

it("não oferece remoção de si mesmo ao proprietário nem controles na Sala arquivada", async () => {
  const sala = await obterSala();
  sala.participantes.push({ usuarioId: "admin", nome: "Admin", nomeUsuario: "admin", modulos: [] });
  obterSala.mockResolvedValue(sala);
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));
  expect(html).not.toContain('aria-label="Remover Admin da sala"');
  expect(html).toContain('aria-label="Remover Ana da sala"');

  obterSala.mockResolvedValue({ ...sala, situacao: "ARQUIVADA" });
  const arquivada = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  expect(renderToStaticMarkup(createElement(() => arquivada))).not.toContain('aria-label="Remover');
});

it("mostra ao participante apenas os módulos autorizados e oculta a lista geral", async () => {
  estado.usuario = { id: "ana", nome: "Ana", administradorIa: false };
  obterSala.mockResolvedValue({
    id: "sala-1", identificador: "grupo-js", nome: "Grupo JavaScript", descricao: "Estudos em equipe", papel: "MEMBRO", situacao: "ATIVA",
    convites: [], membros: [],
    modulos: [{ id: "modulo-a", titulo: "Módulo A", descricao: "Base A", vinculos: [{
      id: "vinculo-a", usuarioId: "ana", moduloPessoal: { id: "pessoal-a", identificador: "calculo-ii", titulo: "Cálculo II", descricao: "Turma ATP5782" }, usuario: { nome: "Ana" },
    }] }],
  });
  const pagina = await PaginaSala({ params: Promise.resolve({ identificador: "grupo-js" }), searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).not.toContain('href="/salas/grupo-js/modulos/modulo-a"');
  expect(html).toContain('aria-label="Gerenciar instância Cálculo II"');
  expect(html).toContain("Instância vinculada");
  expect(html).not.toContain("modulo-b");
  expect(html).not.toContain("modulo-c");
  expect(html).not.toContain("Participantes da sala");
  expect(html).toMatch(/barraSuperiorSala[\s\S]*<form[^>]*>[\s\S]*Sair da sala[\s\S]*<\/form>/);
  expect(html).not.toContain('aria-label="Ações da sala"');
});

it("apresenta os módulos da sala em cartões claros com texto escuro", () => {
  expect(estilos).toMatch(/\.cartaoModulo\s*\{[^}]*border:\s*var\(--espessura-borda-estrutural\) solid var\(--cor-borda-estrutural\)[^}]*color:\s*var\(--cor-texto\)[^}]*background:\s*var\(--cor-superficie\)/s);
  expect(estilos).toMatch(/\.cartaoModulo \.iconeModuloSala\s*\{[^}]*color:\s*#fff[^}]*background:\s*var\(--cor-navegacao\)/s);
  expect(estilos).toMatch(/\.cartaoModulo \.papelCartaoSala\s*\{[^}]*color:\s*var\(--cor-texto\)[^}]*background:\s*var\(--cor-acao-suave\)/s);
});
