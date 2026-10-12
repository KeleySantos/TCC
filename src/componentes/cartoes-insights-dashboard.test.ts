import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularDashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { CartoesInsightsDashboard } from "./cartoes-insights-dashboard";

const modulos = [{ id: "m1", identificador: "logica", titulo: "Lógica" }];
const referencia = new Date("2026-09-21T12:00:00.000Z");

function dadosComTresSessoes() {
  const sessoes = ["2026-09-17T12:00:00.000Z", "2026-09-18T12:00:00.000Z", "2026-09-19T12:00:00.000Z"].map((data, indice) => ({
    id: `s${indice}`, moduloId: "m1", descricao: "Estudei lógica.", iniciadaEm: new Date(Date.parse(data) - 30 * 60_000), encerradaEm: new Date(data), duracaoMinutos: 30,
    situacao: SituacaoSessao.CONCLUIDA, arquivada: false, dificuldadePercebida: 4, compreensaoPercebida: 3,
    metodos: [MetodoEstudo.FEYNMAN], formatos: [FormatoConteudo.TEXTO],
  }));
  return calcularDashboardObservacional(modulos, sessoes, [], referencia, null, [{
    metodosResultados: [],
    formatosResultados: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 78, amostraEvidenciasSuficiente: true }],
    resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 35, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 } },
  }]);
}

describe("cards do Dashboard pessoal", () => {
  it("apresenta rótulo e resultado principal em cada cartão", () => {
    const html = renderToStaticMarkup(createElement(CartoesInsightsDashboard, { dados: dadosComTresSessoes() }));
    expect(html).toContain(">Método associado à maior compreensão<");
    expect(html).toContain(">Formato associado à maior compreensão<");
    expect(html).toContain(">Duração associada a melhores resultados<");
    expect(html).toContain(">Maior dificuldade percebida<");
    expect(html).toContain("Técnica de Feynman");
    expect(html).toContain("Texto");
    expect(html).toContain("35 min");
    expect(html).toContain("Lógica");
    expect(html).not.toContain("LEITURAS DO SEU HISTÓRICO");
    expect(html.match(/<article/g)).toHaveLength(4);
    expect(html).not.toContain("<h3");
    expect(html).not.toContain("<p>Compreensão percebida média");
    expect(html).not.toContain("sessões analisadas");
    expect(html).not.toContain("associação observacional");
    expect(html).not.toContain("sessão(ões)");
    expect(html).not.toContain("nos últimos 90 dias");
  });

  it("apresenta o estado sem dados sem valores inventados", () => {
    const html = renderToStaticMarkup(createElement(CartoesInsightsDashboard, { dados: calcularDashboardObservacional(modulos, [], [], referencia) }));
    expect(html).toContain("Dados insuficientes");
    expect(html).toContain("Sem ponto de atenção suficiente");
    expect(html).toContain("Nenhum formato elegível");
    expect(html).toContain("Sem sessões elegíveis");
    expect(html).not.toContain("Registre mais sessões");
    expect(html).not.toContain("Mínimo de");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });
});
