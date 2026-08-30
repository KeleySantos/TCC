import { describe, expect, it } from "vitest";
import { criarHashSenha, normalizarNomeUsuario, verificarSenha } from "./senhas";

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
});
