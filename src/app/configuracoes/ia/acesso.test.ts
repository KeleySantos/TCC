import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarTokenSessao } from "@/servidor/sessao-assinada";
import PaginaConfiguracoesIa from "./page";
import { alternarProvedorIa, removerChaveIa, salvarChaveIa, testarChaveIa, usarSomenteInterpretacaoLocal } from "./acoes";

const dependencias = vi.hoisted(() => ({
  cookie: "", usuario: vi.fn(), listar: vi.fn().mockResolvedValue([]), salvar: vi.fn(),
  chave: Buffer.alloc(32, 4), testar: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => dependencias.cookie ? { value: dependencias.cookie } : undefined }) }));
vi.mock("next/navigation", () => ({ redirect: (caminho: string) => { throw new Error(`REDIRECIONAR:${caminho}`); }, usePathname: () => "/configuracoes/ia" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/biblioteca/prisma", () => ({ prisma: { usuario: { findUnique: dependencias.usuario } } }));
vi.mock("@/servidor/ia/cofre-credenciais", () => ({ obterChaveMestraCredenciais: async () => dependencias.chave }));
vi.mock("@/servidor/ia/configuracoes", () => ({
  listarConfiguracoesIaSeguras: dependencias.listar, salvarConfiguracaoIa: dependencias.salvar,
  definirConfiguracaoIaAtiva: vi.fn(), desativarTodasConfiguracoesIa: vi.fn(),
  obterCredencialConfigurada: vi.fn(), removerConfiguracaoIa: vi.fn(),
}));
vi.mock("@/servidor/ia/interpretacoes", () => ({ testarProvedorConfigurado: dependencias.testar }));

beforeEach(() => {
  vi.clearAllMocks();
  dependencias.cookie = criarTokenSessao("conta-comum", dependencias.chave);
  dependencias.usuario.mockResolvedValue({ id: "conta-comum", nome: "ADMIN", nomeUsuario: "conta.comum", administradorIa: false });
});

describe("acesso às configurações globais da IA", () => {
  it("recusa a página acessada diretamente por usuário comum, mesmo chamado ADMIN", async () => {
    await expect(PaginaConfiguracoesIa({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECIONAR:/dashboard");
    expect(dependencias.listar).not.toHaveBeenCalled();
  });

  it.each([salvarChaveIa, alternarProvedorIa, removerChaveIa, testarChaveIa, usarSomenteInterpretacaoLocal])("recusa chamadas diretas às ações por usuário comum (%s)", async (acao) => {
    const formulario = new FormData();
    formulario.set("provedor", "GROQ");
    formulario.set("chave", "credencial-ficticia-nao-deve-ser-salva");
    await expect(acao(formulario)).rejects.toThrow("REDIRECIONAR:/dashboard");
    expect(dependencias.salvar).not.toHaveBeenCalled();
    expect(dependencias.testar).not.toHaveBeenCalled();
  });

  it("recusa cookie forjado contendo somente o identificador do ADMIN", async () => {
    dependencias.cookie = "id-do-admin";
    await expect(PaginaConfiguracoesIa({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECIONAR:/entrar");
    expect(dependencias.usuario).not.toHaveBeenCalled();
  });

  it("permite a página e a atualização da chave quando a sessão pertence ao ADMIN", async () => {
    dependencias.cookie = criarTokenSessao("id-do-admin", dependencias.chave);
    dependencias.usuario.mockResolvedValue({ id: "id-do-admin", nome: "ADMIN", nomeUsuario: "admin", administradorIa: true });
    await expect(PaginaConfiguracoesIa({ searchParams: Promise.resolve({}) })).resolves.toBeTruthy();
    expect(dependencias.listar).toHaveBeenCalledWith("id-do-admin");
    const formulario = new FormData();
    formulario.set("provedor", "GROQ");
    formulario.set("chave", "credencial-ficticia-do-administrador");
    await expect(salvarChaveIa(formulario)).rejects.toThrow("REDIRECIONAR:/configuracoes/ia?sucesso=salva");
    expect(dependencias.salvar).toHaveBeenCalledWith("id-do-admin", "GROQ", "credencial-ficticia-do-administrador");
  });
});
