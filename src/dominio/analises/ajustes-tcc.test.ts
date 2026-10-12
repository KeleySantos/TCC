import { describe, expect, it } from "vitest";
import { analisarAprendizagemModulo, normalizarEscalaPercebida } from "./aprendizagem-modulo";

const referencia = new Date("2026-10-10T12:00:00Z");
const evidencia = (id: string, desempenhoPercentual: number | null) => ({ id, dataEvento: new Date(`2026-10-0${id}T12:00:00Z`), desempenhoPercentual, conceitos: ["Conceito"], sessaoIdsExplicitos: [] });

describe("integridade analítica da prova de conceito", () => {
  it("normaliza os cinco pontos sem confundir percepção com acertos", () => {
    expect([1, 2, 3, 4, 5].map(normalizarEscalaPercebida)).toEqual([0, 25, 50, 75, 100]);
  });
  it("usa evidência válida sem confirmação, exclui incompletas e deduplica por id", () => {
    const resultado = analisarAprendizagemModulo({ referencia, sessoes: [], conceitos: [], evidencias: [evidencia("1", 40), evidencia("1", 40), evidencia("2", 80), evidencia("3", null), evidencia("4", 110)] });
    expect(resultado.conceitos[0]).toMatchObject({ evidencias: 2, desempenhoMedio: 60, tendencia: "DADOS_INSUFICIENTES" });
  });
  it.each([0, 1, 2, 3])("exige três evidências distintas para tendência (n=%s)", (n) => {
    const resultado = analisarAprendizagemModulo({ referencia, sessoes: [], conceitos: [], evidencias: [evidencia("1", 40), evidencia("2", 60), evidencia("3", 80)].slice(0, n) });
    expect(resultado.conceitos[0]?.tendencia ?? "DADOS_INSUFICIENTES").toBe(n === 3 ? "EVOLUCAO_POSITIVA" : "DADOS_INSUFICIENTES");
  });
  it("prioriza vínculo explícito sem atribuir a evidência a outra sessão do conceito", () => {
    const sessoes = ["1", "2"].map((id) => ({ id, encerradaEm: new Date("2026-10-01T10:00:00Z"), duracaoMinutos: 30, compreensaoPercebida: 3, dificuldadePercebida: 3, metodos: [id], formatos: ["TEXTO"], conceitos: ["Conceito"] }));
    const resultado = analisarAprendizagemModulo({ referencia, sessoes, conceitos: [], evidencias: [{ ...evidencia("2", 80), sessaoIdsExplicitos: ["1"] }] });
    expect(resultado.metodosResultados.find((item) => item.chave === "2")?.quantidadeEvidenciasPosteriores).toBe(0);
  });
  it("mantém limites inclusivos de 30 e 90 dias e deduplica contextos sobrepostos", () => {
    const encerradaEm = new Date("2026-08-01T10:00:00Z");
    const base = { id: "s", encerradaEm, duracaoMinutos: 30, compreensaoPercebida: 3, dificuldadePercebida: 3, metodos: ["A", "B", "A"], formatos: ["TEXTO"], conceitos: ["Conceito"] };
    const limite = { ...evidencia("1", 50), dataEvento: new Date(encerradaEm.getTime() + 30 * 86_400_000) };
    const fora = { ...evidencia("2", 90), dataEvento: new Date(limite.dataEvento.getTime() + 1) };
    const resultado = analisarAprendizagemModulo({ referencia, sessoes: [base], conceitos: [], evidencias: [limite, limite, fora] });
    expect(resultado.metodosResultados.map((item) => item.quantidadeEvidenciasPosteriores)).toEqual([1, 1]);
    expect(resultado.metodosResultados.map((item) => item.desempenhoMedioPosterior)).toEqual([50, 50]);
    const dataLimite = new Date(referencia.getTime() - 90 * 86_400_000);
    const recentes = analisarAprendizagemModulo({ referencia, sessoes: [], conceitos: [], evidencias: [{ ...limite, id: "90a", dataEvento: dataLimite }, { ...limite, id: "90b", dataEvento: dataLimite }, { ...fora, id: "fora", dataEvento: new Date(dataLimite.getTime() - 1) }] });
    expect(recentes.conceitosMaiorCompreensao[0]).toMatchObject({ evidencias: 2, desempenhoMedio: 50, evidenciasSuficientes: false });
  });
});
