import { describe, expect, it } from "vitest";
import { criarTokenSessao, validarTokenSessao } from "./sessao-assinada";

describe("assinatura da sessão autenticada", () => {
  const chave = Buffer.alloc(32, 7);
  const agora = new Date("2026-10-18T12:00:00.000Z");

  it("reconhece o usuário da sessão emitida pelo servidor", () => {
    const token = criarTokenSessao("conta-admin", chave, agora);
    expect(validarTokenSessao(token, chave, agora)).toBe("conta-admin");
  });

  it("recusa IDs diretos e tokens adulterados ou assinados com outra chave", () => {
    const token = criarTokenSessao("conta-comum", chave, agora);
    const [conteudo, assinatura] = token.split(".");
    const forjado = Buffer.from(JSON.stringify({ usuarioId: "conta-admin", expiraEm: agora.getTime() + 60_000 })).toString("base64url");
    expect(validarTokenSessao("conta-admin", chave, agora)).toBeNull();
    expect(validarTokenSessao(`${forjado}.${assinatura}`, chave, agora)).toBeNull();
    expect(validarTokenSessao(`${conteudo}.assinatura-falsa`, chave, agora)).toBeNull();
    expect(validarTokenSessao(token, Buffer.alloc(32, 8), agora)).toBeNull();
  });

  it("recusa sessões expiradas", () => {
    const token = criarTokenSessao("conta-admin", chave, agora);
    expect(validarTokenSessao(token, chave, new Date("2026-10-26T12:00:00.000Z"))).toBeNull();
  });
});
