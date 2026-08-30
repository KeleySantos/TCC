import { describe, expect, it } from "vitest";
import { FormatoConteudo, NivelEvidencia } from "@/gerado/prisma/enums";
import { gerarRecomendacao } from "./gerar";

describe("gerador de recomendações", () => {
  it("indica exploração quando os dados são insuficientes", () => {
    const resultado = gerarRecomendacao(
      { topicoId: "loops", evidencias: [], quantidadeExposicoesMistas: 0, resumosFormatos: [], ultimaNota: null, tendenciaNota: null },
      [{ id: "video", formato: FormatoConteudo.VIDEO, titulo: "Vídeo", aprovadoProfessor: true }],
    );
    expect(resultado?.nivelEvidencia).toBe(NivelEvidencia.INSUFICIENTE);
  });
});
