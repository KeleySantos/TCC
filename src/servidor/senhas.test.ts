import { describe, expect, it } from "vitest";
import { criarHashSenha, normalizarIdentificadorConta, normalizarNomeUsuario, verificarSenha } from "./senhas";

describe("proteção de senhas", () => {
  it("valida a senha que originou o hash", () => {
    const hash = criarHashSenha("SenhaFicticia@2026");
    expect(verificarSenha("SenhaFicticia@2026", hash)).toBe(true);
  });

  it("rejeita senha ou hash inválido", () => {
    const hash = criarHashSenha("SenhaFicticia@2026");
    expect(verificarSenha("OutraSenha@2026", hash)).toBe(false);
    expect(verificarSenha("SenhaFicticia@2026", "invalido")).toBe(false);
  });

  it("normaliza o nome de usuário antes da consulta", () => {
    expect(normalizarNomeUsuario("  ANA.SOUZA  ")).toBe("ana.souza");
  });

  it("aceita nome completo ou usuário como identificador da conta", () => {
    expect(normalizarIdentificadorConta(" Ana Souza ")).toBe("ana.souza");
    expect(normalizarIdentificadorConta("ana.souza")).toBe("ana.souza");
    expect(normalizarIdentificadorConta(" José D'Ávila ")).toBe("jose.d.avila");
  });
});
