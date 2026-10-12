import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { ConteudoDashboardModulo } from "./conteudo-dashboard-modulo";

const metricas = {
  versaoAlgoritmo: "teste",
  tempoEstudo: { quantidadeSessoesValidas: 3, minutosTotais: 90, mediaMinutos: 30 },
  frequencia: { diasComEstudo: 3, maiorSequenciaDias: 2, primeiraSessaoEm: "2026-09-01T00:00:00.000Z", ultimaSessaoEm: "2026-09-03T00:00:00.000Z" },
  regularidade: { semanasAtivas: 1, semanasNoPeriodo: 1, proporcaoSemanasAtivas: 1, classificacao: "CONSTANTE" as const },
  percepcoes: { amostra: 3, mediaDificuldadePercebida: 2, mediaCompreensaoPercebida: 4, nivelAmostra: "INICIAL" as const },
  porMetodo: [],
  porFormato: [],
  evolucaoSemanal: { periodicidade: "SEMANAL_UTC" as const, pontos: [] },
  limitacoes: [],
};

const resultado = {
  chave: MetodoEstudo.FEYNMAN,
  quantidadeSessoes: 3,
  quantidadeCompreensoes: 3,
  compreensaoMedia: 4,
  quantidadeEvidenciasPosteriores: 2,
  desempenhoMedioPosterior: 80,
  amostraEvidenciasSuficiente: true,
};

const aprendizagem = {
  resumoResultados: {
    duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 },
    metodoMaiorCompreensao: resultado,
    formatoMaiorCompreensao: { ...resultado, chave: FormatoConteudo.TEXTO },
    evolucaoPercepcaoEvidencia: [],
  },
  metodosResultados: [resultado],
  formatosResultados: [{ ...resultado, chave: FormatoConteudo.TEXTO }],
  conceitosMaiorDificuldade: [{ chave: "promessas", nome: "Promessas", sessoes: 3, evidencias: 2, observacoes: 5, quantidadeCompreensoes: 3, quantidadeDificuldades: 3, dificuldadeMedia: 4, compreensaoMedia: 3, desempenhoMedio: 60, evidenciasSuficientes: true, indice: 2, ultimaObservacaoEm: new Date("2026-09-20T10:00:00.000Z") }],
  conceitosMaiorCompreensao: [{ chave: "closures", nome: "Closures", sessoes: 3, evidencias: 2, observacoes: 5, quantidadeCompreensoes: 3, quantidadeDificuldades: 3, dificuldadeMedia: 2, compreensaoMedia: 4, desempenhoMedio: 85, evidenciasSuficientes: true, indice: 2, ultimaObservacaoEm: new Date("2026-09-20T10:00:00.000Z") }],
};

describe("composição compartilhada do Dashboard do Módulo", () => {
  it("renderiza os mesmos cards e gráficos usados no módulo pessoal", () => {
    const html = renderToStaticMarkup(createElement(ConteudoDashboardModulo, {
      aprendizagem,
      idTitulo: "dashboard-membro-1",
      metricas,
      tituloModulo: "JavaScript",
    }));

    expect(html).toContain(">30 min<");
    expect(html).toContain(">Técnica de Feynman<");
    expect(html).toContain(">Texto<");
    expect(html).toContain(">Duração associada a melhores resultados<");
    expect(html).toContain(">Método associado à maior compreensão<");
    expect(html).toContain(">Formato associado à maior compreensão<");
    expect(html).toContain("Regularidade do estudo");
    expect(html).toContain("Métodos × Resultados");
    expect(html).toContain("Formatos × Resultados");
    expect(html).toContain("Conceitos com maiores sinais de dificuldade");
    expect(html).toContain("Conceitos com maiores sinais de compreensão");
    expect(html).toContain('id="dashboard-membro-1"');
    expect(html).toContain('id="dashboard-membro-1-resultados"');
  });
});
