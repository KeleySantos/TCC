import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo } from "@/gerado/prisma/enums";
import { PainelMetricasSessoes, type MetricasSessoesExibicao } from "./painel-metricas-sessoes";

const metricas: MetricasSessoesExibicao = {
  versaoAlgoritmo: "metricas-sessoes-v1",
  tempoEstudo: { quantidadeSessoesValidas: 4, minutosTotais: 82, mediaMinutos: 20.5 },
  frequencia: { diasComEstudo: 4, maiorSequenciaDias: 1, primeiraSessaoEm: "2026-03-05T09:00:00.000Z", ultimaSessaoEm: "2026-03-29T09:17:00.000Z" },
  regularidade: { semanasAtivas: 3, semanasNoPeriodo: 4, proporcaoSemanasAtivas: 0.75, classificacao: "CONSTANTE" },
  percepcoes: { amostra: 4, mediaDificuldadePercebida: 2.5, mediaCompreensaoPercebida: 3.5, nivelAmostra: "INICIAL" },
  porMetodo: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 4, quantidadeCompreensoes: 4, mediaCompreensaoPercebida: 4.25, minutosAssociados: 82, percentualSessoes: 1, nivelAmostra: "INICIAL" }],
  porFormato: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 4, quantidadeCompreensoes: 4, mediaCompreensaoPercebida: 4.25, minutosAssociados: 82, percentualSessoes: 1, nivelAmostra: "INICIAL" }],
  evolucaoSemanal: { periodicidade: "SEMANAL_UTC", pontos: [{ periodoInicio: "2026-03-02T00:00:00.000Z", periodoFim: "2026-03-08T23:59:59.999Z", quantidadeSessoes: 4, minutosTotais: 82, mediaMinutos: 20.5, diasComEstudo: 4, quantidadePercepcoes: 4, mediaDificuldadePercebida: 2.5, mediaCompreensaoPercebida: 3.5, metodos: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 4 }], formatos: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 4 }] }] },
  limitacoes: ["As métricas descrevem somente as sessões registradas."],
};

describe("painel de métricas do módulo", () => {
  it("apresenta somente os indicadores mantidos na composição", () => {
    const html = renderToStaticMarkup(createElement(PainelMetricasSessoes, {
      metricas,
      tituloModulo: "JavaScript",
      aprendizagem: {
        duracaoSessoesComMelhorResultado: { mediaMinutos: 35, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 },
        metodoMaiorCompreensao: { chave: "FEYNMAN", quantidadeSessoes: 4, quantidadeCompreensoes: 4, compreensaoMedia: 4.5, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 82, amostraEvidenciasSuficiente: true },
        formatoMaiorCompreensao: { chave: "TEXTO", quantidadeSessoes: 4, quantidadeCompreensoes: 4, compreensaoMedia: 4.25, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: true },
        evolucaoPercepcaoEvidencia: [{ periodoInicio: "2026-03-02T00:00:00.000Z", periodoFim: "2026-03-08T23:59:59.999Z", quantidadePercepcoes: 4, mediaCompreensaoPercebida: 3.5, quantidadeEvidencias: 2, desempenhoMedioEvidencias: 78 }],
      },
    }));

    expect(html).not.toContain("<p>Tempo estudado</p>");
    expect(html).toContain(">Duração associada a melhores resultados<");
    expect(html).toContain(">Método associado à maior compreensão<");
    expect(html).toContain(">Formato associado à maior compreensão<");
    expect(html).toContain("Técnica de Feynman");
    expect(html).toContain("Texto");
    expect(html).not.toContain("<p>Sessões válidas</p>");
    expect(html).not.toContain("<p>Frequência</p>");
    expect(html).not.toContain("Métodos × Resultados");
    expect(html).not.toContain("Formatos × Resultados");
    expect(html).toContain("Regularidade do estudo");
    expect(html).toContain("3 de 4 semanas com estudo");
    expect(html).toContain("Regularidade observada: 3 de 4 semanas com estudo");
    expect(html).toContain("75% das semanas");
    expect(html).toContain("Percepção × evidências ao longo do tempo");
    expect(html).toContain("78%");
    expect(html).not.toContain("Minutos");
    expect(html).not.toContain("Métodos utilizados");
    expect(html).not.toContain("Formatos utilizados");
    expect(html).not.toContain("Tempo e quantidade de sessões");
  });

  it("mantém visíveis os rótulos dos indicadores quando não há aprendizagem associada", () => {
    const html = renderToStaticMarkup(createElement(PainelMetricasSessoes, { metricas, tituloModulo: "JavaScript" }));

    expect(html).toContain(">Tempo estudado<");
    expect(html).toContain(">Duração média<");
    expect(html).toContain(">Regularidade do estudo<");
  });
});
