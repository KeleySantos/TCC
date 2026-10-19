import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH, DELETE } from "./route";

const dependencias = vi.hoisted(() => ({ usuario: vi.fn(), obter: vi.fn(), nome: vi.fn(), senha: vi.fn(), foto: vi.fn(), excluir: vi.fn(), encerrar: vi.fn() }));
vi.mock("@/servidor/autenticacao", () => ({ obterUsuarioAtual: dependencias.usuario, encerrarSessaoDemonstracao: dependencias.encerrar }));
vi.mock("@/servidor/perfil", () => ({
  obterPerfil: dependencias.obter, atualizarNomePerfil: dependencias.nome, alterarSenhaPerfil: dependencias.senha, alterarFotoPerfil: dependencias.foto, excluirContaPessoal: dependencias.excluir,
  ErroPerfil: class ErroPerfil extends Error {},
}));

beforeEach(() => {
  vi.resetAllMocks();
  dependencias.usuario.mockResolvedValue({ id: "conta-autenticada", nome: "Conta", nomeUsuario: "conta", email: null });
});

describe("API do próprio perfil", () => {
  it("recusa leitura, edição e exclusão sem sessão", async () => {
    dependencias.usuario.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await PATCH(new Request("http://localhost/api/perfil", { method: "PATCH" }))).status).toBe(401);
    expect((await DELETE(new Request("http://localhost/api/perfil", { method: "DELETE" }))).status).toBe(401);
    expect(dependencias.excluir).not.toHaveBeenCalled();
  });

  it("ignora tentativa de enviar o identificador de outra conta na edição", async () => {
    const dados = new FormData();
    dados.set("operacao", "NOME"); dados.set("nome", "Novo Nome"); dados.set("nomeUsuario", "novo.nome"); dados.set("usuarioId", "outra-conta");
    expect((await PATCH(new Request("http://localhost/api/perfil", { method: "PATCH", body: dados }))).status).toBe(200);
    expect(dependencias.nome).toHaveBeenCalledWith("conta-autenticada", { nome: "Novo Nome", nomeUsuario: "novo.nome" });
  });

  it("exclui somente a conta da sessão e encerra a autenticação após sucesso", async () => {
    const requisicao = new Request("http://localhost/api/perfil", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuarioId: "outra-conta", senhaAtual: "senha-ficticia", confirmacao: "EXCLUIR" }) });
    expect((await DELETE(requisicao)).status).toBe(200);
    expect(dependencias.excluir).toHaveBeenCalledWith("conta-autenticada", expect.objectContaining({ confirmacao: "EXCLUIR" }));
    expect(dependencias.encerrar).toHaveBeenCalledOnce();
  });
});
