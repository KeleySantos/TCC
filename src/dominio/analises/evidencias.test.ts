import { describe, expect, it } from "vitest";
import { FormatoConteudo, NivelEvidencia } from "@/gerado/prisma/enums";
import { construirEvidencias, obterNivelEvidencia } from "./evidencias";

describe("evidências de aprendizagem", () => {
  it("cria evidência somente para uma sessão válida e única", () => {
    const resultado = construirEvidencias(
      [{ id: "s1", topicoId: "loops", formato: FormatoConteudo.VIDEO, encerradaEm: new Date("2026-08-29T12:00:00.000Z"), duracaoMinutos: 12, situacao: "CONCLUIDA" }],
      [{ id: "a1", topicoId: "loops", concluidaEm: new Date("2026-08-30T12:00:00.000Z"), notaNormalizada: 80 }],
    );
    expect(resultado.evidencias).toHaveLength(1);
  });

  it("não atribui resultado quando há exposição mista", () => {
    const resultado = construirEvidencias(
      [
        { id: "s1", topicoId: "loops", formato: FormatoConteudo.VIDEO, encerradaEm: new Date("2026-08-29T12:00:00.000Z"), duracaoMinutos: 12, situacao: "CONCLUIDA" },
        { id: "s2", topicoId: "loops", formato: FormatoConteudo.PDF, encerradaEm: new Date("2026-08-29T13:00:00.000Z"), duracaoMinutos: 12, situacao: "CONCLUIDA" },
      ],
      [{ id: "a1", topicoId: "loops", concluidaEm: new Date("2026-08-30T12:00:00.000Z"), notaNormalizada: 80 }],
    );
    expect(resultado.evidencias).toHaveLength(0);
    expect(resultado.quantidadeExposicoesMistas).toBe(1);
  });

  it("classifica evidência proporcionalmente", () => {
    expect(obterNivelEvidencia(1)).toBe(NivelEvidencia.INSUFICIENTE);
    expect(obterNivelEvidencia(2)).toBe(NivelEvidencia.INICIAL);
    expect(obterNivelEvidencia(5, [75, 76, 80, 78, 77])).toBe(NivelEvidencia.FORTE);
  });
});
