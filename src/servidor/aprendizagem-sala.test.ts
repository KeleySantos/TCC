import "dotenv/config";
import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { serializarResumoAprendizagemSala } from "./aprendizagem-sala";

describe("resumo de aprendizagem compartilhado com a Sala", () => {
  it("projeta somente os resultados necessários para o dashboard", () => {
    const resultado = { chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4.2, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 82, amostraEvidenciasSuficiente: true };
    const conceito = { chave: "closures", nome: "Closures", sessoes: 3, evidencias: 2, observacoes: 5, quantidadeCompreensoes: 3, quantidadeDificuldades: 3, compreensaoMedia: 4, dificuldadeMedia: 2, desempenhoMedio: 85, evidenciasSuficientes: true, indice: 3, ultimaObservacaoEm: new Date("2026-09-20T10:00:00.000Z") };
    const resumo = serializarResumoAprendizagemSala({
      resumoResultados: {
        duracaoSessoesComMelhorResultado: { mediaMinutos: 35, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 },
        metodoMaiorCompreensao: resultado,
        formatoMaiorCompreensao: { ...resultado, chave: FormatoConteudo.TEXTO },
      },
      evolucaoPercepcaoEvidencia: [{ periodoInicio: new Date("2026-09-14T00:00:00.000Z"), periodoFim: new Date("2026-09-20T23:59:59.999Z"), quantidadePercepcoes: 3, mediaCompreensaoPercebida: 4, quantidadeEvidencias: 2, desempenhoMedioEvidencias: 82 }],
      metodosResultados: [resultado],
      formatosResultados: [{ ...resultado, chave: FormatoConteudo.TEXTO }],
      conceitosMaiorDificuldade: [conceito],
      conceitosMaiorCompreensao: [conceito],
      privado: { descricao: "não pode sair", materiais: ["arquivo.pdf"] },
    });

    expect(resumo.resumoResultados.evolucaoPercepcaoEvidencia[0].periodoInicio).toBe("2026-09-14T00:00:00.000Z");
    expect(resumo.metodosResultados).toEqual([resultado]);
    expect(resumo.conceitosMaiorCompreensao[0].nome).toBe("Closures");
    expect(JSON.stringify(resumo)).not.toContain("não pode sair");
    expect(JSON.stringify(resumo)).not.toContain("arquivo.pdf");
  });
});
