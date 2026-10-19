import { describe, expect, it } from "vitest";
import { cenariosTcc, identificadorModuloCenarioTcc, usuariosCenariosTcc } from "../../../testes/fixtures/cenarios-tcc";

describe("atribuição dos cenários do TCC às contas sintéticas", () => {
  it("relaciona cada cenário a exatamente uma conta cadastrada", () => {
    expect(usuariosCenariosTcc.map((item) => [item.nomeUsuario, item.cenario])).toEqual([
      ["ana.souza", "S1"],
      ["bruno.lima", "S2"],
      ["carla.rocha", "S3"],
      ["diego.alves", "S4"],
      ["elisa.martins", "S5"],
    ]);
    expect(new Set(usuariosCenariosTcc.map((item) => item.cenario)).size).toBe(cenariosTcc.length);
  });

  it("gera três identificadores exclusivos por cenário", () => {
    const identificadores = cenariosTcc.flatMap((cenario) => [0, 1, 2].map((numero) => identificadorModuloCenarioTcc(cenario.id, numero)));
    expect(new Set(identificadores).size).toBe(15);
    expect(identificadores[0]).toBe("avaliacao-tcc-s1-modulo-0");
  });
});
