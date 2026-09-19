import { describe, expect, it } from "vitest";
import { autorizarUsuarioNaApi, type UsuarioAtual } from "./autorizacao";

const conta: UsuarioAtual = {
  id: "usuario-a",
  nome: "Ana Souza",
  nomeUsuario: "ana.souza",
  email: "ana.souza@exemplo.test",
};

describe("autorização das APIs pessoais", () => {
  it("rejeita uma requisição sem sessão com 401", () => {
    expect(autorizarUsuarioNaApi(null)).toMatchObject({ permitido: false, status: 401 });
  });

  it("preserva a conta autenticada para a verificação de propriedade", () => {
    const resultado = autorizarUsuarioNaApi(conta);
    expect(resultado.permitido).toBe(true);
    if (resultado.permitido) expect(resultado.usuario.id).toBe("usuario-a");
  });
});
