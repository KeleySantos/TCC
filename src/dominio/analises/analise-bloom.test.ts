import { describe, expect, it } from "vitest";
import { NivelBloom } from "@/gerado/prisma/enums";
import { calcularAnaliseBloom } from "./analise-bloom";

const data = (dia: number) => new Date(`2026-09-${String(dia).padStart(2, "0")}T12:00:00.000Z`);

describe("análise por nível de Bloom", () => {
  it("ignora respostas sem classificação", () => {
    const analise = calcularAnaliseBloom([{ nivelBloom: null, correta: true, concluidaEm: data(1) }]);
    expect(analise).toMatchObject({ niveis: [], quantidadeRespostasClassificadas: 0, quantidadeNiveisComEvidencia: 0 });
  });

  it("não transforma uma única resposta classificada em taxa", () => {
    const analise = calcularAnaliseBloom([{ nivelBloom: NivelBloom.APLICAR, correta: true, concluidaEm: data(1) }]);
    expect(analise.niveis[0]).toMatchObject({ nivelBloom: NivelBloom.APLICAR, quantidadeRespostas: 1, respostasCorretas: 1, taxaAcerto: null, nivelEvidencia: "INSUFICIENTE" });
  });

  it("mantém zero por cento como evidência válida com duas respostas", () => {
    const analise = calcularAnaliseBloom([
      { nivelBloom: NivelBloom.ANALISAR, correta: false, concluidaEm: data(1) },
      { nivelBloom: NivelBloom.ANALISAR, correta: false, concluidaEm: data(2) },
    ]);
    expect(analise.niveis[0]).toMatchObject({ nivelBloom: NivelBloom.ANALISAR, quantidadeRespostas: 2, respostasCorretas: 0, taxaAcerto: 0, nivelEvidencia: "INICIAL" });
    expect(analise.quantidadeNiveisComEvidencia).toBe(1);
  });
});
