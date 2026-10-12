import { describe, expect, it } from "vitest";
import { recomendarMateriais } from "./recomendacoes-materiais";

const conceito = { id: "c1", nome: "Conceito", desempenhoMedio: 40, compreensaoMedia: 2, dificuldadeMedia: 4, evidencias: 3 };
const material = { id: "b", titulo: "Referência", usuarioId: "u1", moduloId: "m1", disponivel: true, conceitoIds: ["c1"] };
const entrada = { usuarioId: "u1", moduloId: "m1", conceitos: [conceito], materiais: [material] };

describe("recomendação determinística de materiais", () => {
  it("explica a seleção e mantém decisão estável inclusive em empates", () => {
    const materiais = [material, { ...material, id: "a" }, material];
    const a = recomendarMateriais({ ...entrada, materiais });
    expect(a).toEqual(recomendarMateriais({ ...entrada, materiais: [...materiais].reverse() }));
    expect(a[0]).toMatchObject({ tipo: "MATERIAL", materialId: "a", conceitoId: "c1", regraId: "RM-01", tamanhoAmostra: 3, nivelEvidencia: "DESCRITIVA" });
    expect(a[0].limitacoes.join(" ")).toMatch(/causalidade/);
  });
  it("filtra outros usuários, módulos, conceitos e materiais indisponíveis", () => {
    const materiais = [{ ...material, usuarioId: "u2" }, { ...material, moduloId: "m2" }, { ...material, disponivel: false }, { ...material, conceitoIds: ["c2"] }];
    expect(recomendarMateriais({ ...entrada, materiais })[0]).toMatchObject({ tipo: "SEM_MATERIAL", materialId: null });
  });
  it("não ocupa duas recomendações com um material associado a vários conceitos", () => {
    const resultado = recomendarMateriais({ ...entrada, conceitos: [conceito, { ...conceito, id: "c2" }], materiais: [{ ...material, conceitoIds: ["c1", "c2"] }, { ...material, id: "z", conceitoIds: ["c2"] }] });
    expect(resultado.map((item) => item.materialId)).toEqual(["b", "z"]);
  });
  it.each([0, 1, 2])("trata n=%s como exploração, sem superioridade de formato", (evidencias) => {
    const resultado = recomendarMateriais({ ...entrada, conceitos: [{ ...conceito, evidencias }] });
    expect(resultado[0]).toMatchObject({ nivelEvidencia: "LIMITADA", tamanhoAmostra: evidencias });
    expect(resultado[0].justificativaEstruturada).toMatch(/exploratória/);
  });
  it("não personaliza no início a frio nem força material sem sinal de atenção", () => {
    expect(recomendarMateriais({ ...entrada, conceitos: [] })[0]).toMatchObject({ tipo: "EXPLORACAO", materialId: null, conceitoId: null });
    expect(recomendarMateriais({ ...entrada, conceitos: [{ ...conceito, desempenhoMedio: 90, compreensaoMedia: 5, dificuldadeMedia: 1 }] })[0].tipo).toBe("EXPLORACAO");
  });
});
