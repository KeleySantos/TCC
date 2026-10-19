import { describe, expect, it } from "vitest";
import { podeAdministrarIa } from "./administracao-ia";

describe("permissão específica para configurar IA", () => {
  it("exige a conta reservada ADMIN e a permissão persistida", () => {
    expect(podeAdministrarIa({ nomeUsuario: "admin", administradorIa: true })).toBe(true);
    expect(podeAdministrarIa({ nomeUsuario: "admin", administradorIa: false })).toBe(false);
    expect(podeAdministrarIa({ nomeUsuario: "diego.alves", administradorIa: true })).toBe(false);
    expect(podeAdministrarIa({ nomeUsuario: "admin" })).toBe(false);
    expect(podeAdministrarIa(null)).toBe(false);
  });
});
