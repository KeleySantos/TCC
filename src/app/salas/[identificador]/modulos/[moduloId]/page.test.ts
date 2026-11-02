import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const obterModulo = vi.fn();
const obterDashboards = vi.fn();
const estado = vi.hoisted(() => ({ usuario: { id: "admin", nome: "Admin", administradorIa: false } }));

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
vi.mock("@/componentes/estrutura-autenticada", () => ({ EstruturaAutenticada: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => estado.usuario }));
vi.mock("@/servidor/modulos", () => ({ listarModulosPessoais: async () => [{ id: "pessoal-2", titulo: "Outro módulo" }] }));
vi.mock("@/servidor/salas", () => ({ obterModuloSalaDaConta: (...args: unknown[]) => obterModulo(...args) }));
vi.mock("@/servidor/paineis-salas", () => ({
  obterDashboardModuloSalaDoProprietario: (...args: unknown[]) => obterDashboards(...args),
  serializarMetricasSala: (metricas: unknown) => metricas,
}));
vi.mock("../../../gerador-convite", () => ({ GeradorConvite: () => createElement("button", null, "Gerar convite do módulo") }));
vi.mock("@/app/modulos/[identificador]/painel-metricas-sessoes", () => ({ PainelMetricasSessoes: ({ tituloPainel }: { tituloPainel: string }) => createElement("section", null, tituloPainel) }));
vi.mock("@/app/modulos/[identificador]/conteudo-dashboard-modulo", () => ({ ConteudoDashboardModulo: ({ tituloPainel }: { tituloPainel: string }) => createElement("section", null, tituloPainel) }));
vi.mock("../../../comparacao-membros", () => ({ ComparacaoMembros: ({ participantes }: { participantes: unknown[] }) => createElement("section", null, "Comparação dos participantes", JSON.stringify(participantes)) }));
vi.mock("../../../interpretacao-membro", () => ({ InterpretacaoMembroSala: () => createElement("section", null, "Interpretação por IA") }));

import PaginaModuloSala from "./page";
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");
const fontePagina = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

const moduloAdministrado = {
  id: "modulo-1",
  titulo: "Fundamentos",
  descricao: "Base compartilhada",
  salaId: "sala-1",
  sala: { identificador: "grupo-js", nome: "Grupo JavaScript", situacao: "ATIVA" },
  papel: "ADMINISTRADOR",
  convites: [],
  participacoes: [
    { id: "p-admin", usuarioId: "admin", papel: "ADMINISTRADOR", usuario: { nome: "Admin", nomeUsuario: "admin" }, vinculo: null },
    { id: "p-ana", usuarioId: "ana", papel: "PARTICIPANTE", usuario: { nome: "Ana", nomeUsuario: "ana" }, vinculo: { id: "v-ana", moduloPessoal: { identificador: "fundamentos-ana", titulo: "Fundamentos Ana" } } },
    { id: "p-bruno", usuarioId: "bruno", papel: "PARTICIPANTE", usuario: { nome: "Bruno", nomeUsuario: "bruno" }, vinculo: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  estado.usuario = { id: "admin", nome: "Admin", administradorIa: false };
  obterModulo.mockResolvedValue(moduloAdministrado);
  obterDashboards.mockResolvedValue({
    agregado: { disponivel: true, quantidadeContribuidores: 1, metricas: { tempoEstudo: { quantidadeSessoesValidas: 3 } } },
    individuais: [{
      vinculoId: "v-ana", nome: "Ana", usuarioId: "ana", metricas: { tempoEstudo: { quantidadeSessoesValidas: 3 } },
      aprendizagem: { resumoResultados: { evolucaoPercepcaoEvidencia: [{ quantidadePercepcoes: 2, mediaCompreensaoPercebida: 4, quantidadeEvidencias: 1, desempenhoMedioEvidencias: 75 }] } },
    }],
  });
});

it("oferece Dashboard, Participantes e convite contextual ao administrador sem descrição sob o título", async () => {
  const pagina = await PaginaModuloSala({ params: Promise.resolve({ identificador: "grupo-js", moduloId: "modulo-1" }) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(obterModulo).toHaveBeenCalledWith("admin", "grupo-js", "modulo-1");
  expect(html).toContain('role="tab"');
  expect(html).toContain("Dashboard");
  expect(html).toContain("Participantes");
  expect(html).not.toContain(">Membros<");
  expect(html).toContain("Gerar convite do módulo");
  expect(html).toContain("Ana");
  expect(html).toContain("Bruno");
  expect(html).toContain("Aguardando vínculo");
  expect(html).not.toContain(">Admin<");
  expect(html).toContain("Comparação dos participantes");
  expect(html).toContain('&quot;quantidadePercepcoes&quot;:2');
  expect(html).toContain("<h1>Fundamentos</h1>");
  expect(html).not.toContain("Base compartilhada");
  expect(html).not.toContain('name="participacaoId" value="p-ana"');
  expect(fontePagina).toContain('<input name="participacaoId" type="hidden" value={participacao.id} />');
  expect(estilos).toMatch(/\.cabecalho h1\s*\{[^}]*font-size:\s*clamp\(2\.4rem,\s*4\.8vw,\s*4rem\)[^}]*font-weight:\s*850/s);
  expect(estilos).toMatch(/\.cabecalho\s*\{[^}]*border-bottom:\s*1px solid var\(--cor-borda\)/s);
  expect(fontePagina).toMatch(/<ConteudoDashboardModulo[^>]*visualEnxuto\s*\/>/s);
  expect(fontePagina).toMatch(/<PainelMetricasSessoes[^>]*visualEnxuto\s*\/>/s);
  expect(fontePagina).toContain("item.aprendizagem?.resumoResultados.evolucaoPercepcaoEvidencia ?? []");
});

it("nega acesso direto a módulo não autorizado", async () => {
  obterModulo.mockResolvedValue(null);
  await expect(PaginaModuloSala({ params: Promise.resolve({ identificador: "grupo-js", moduloId: "outro" }) })).rejects.toThrow("not-found");
});

it("oferece criar ou vincular instância ao participante ainda sem vínculo", async () => {
  estado.usuario = { id: "bruno", nome: "Bruno", administradorIa: false };
  obterModulo.mockResolvedValue({ ...moduloAdministrado, papel: "PARTICIPANTE", participacoes: [moduloAdministrado.participacoes[2]] });

  const pagina = await PaginaModuloSala({ params: Promise.resolve({ identificador: "grupo-js", moduloId: "modulo-1" }) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).toContain("Criar instância com o mesmo nome");
  expect(html).toContain("Vincular módulo existente");
  expect(html).not.toContain('role="tab"');
  expect(obterDashboards).not.toHaveBeenCalled();
});

it("mostra atalho pessoal e saída apenas deste módulo ao participante vinculado", async () => {
  estado.usuario = { id: "ana", nome: "Ana", administradorIa: false };
  obterModulo.mockResolvedValue({ ...moduloAdministrado, papel: "PARTICIPANTE", participacoes: [moduloAdministrado.participacoes[1]] });

  const pagina = await PaginaModuloSala({ params: Promise.resolve({ identificador: "grupo-js", moduloId: "modulo-1" }) });
  const html = renderToStaticMarkup(createElement(() => pagina));

  expect(html).toContain('href="/modulos/fundamentos-ana"');
  expect(html).toContain("Sair do módulo");
  expect(html).not.toContain("Parar de compartilhar");
  expect(html).not.toContain('role="tab"');
  expect(obterDashboards).not.toHaveBeenCalled();
});
