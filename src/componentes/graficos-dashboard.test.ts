import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularDashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { GraficosDashboard } from "./graficos-dashboard";

const modulos = [{ id: "m1", identificador: "logica", titulo: "Lógica" }];
const referencia = new Date("2026-09-21T12:00:00.000Z");

function sessao(id: string, data: string) {
  return {
    id, moduloId: "m1", descricao: "Estudei lógica.", iniciadaEm: new Date(Date.parse(data) - 30 * 60_000), encerradaEm: new Date(data), duracaoMinutos: 30,
    situacao: SituacaoSessao.CONCLUIDA, arquivada: false, dificuldadePercebida: 3, compreensaoPercebida: 4,
    metodos: [MetodoEstudo.FEYNMAN], formatos: [FormatoConteudo.TEXTO],
  };
}

describe("gráficos observacionais do Dashboard", () => {
  it("expõe resultados por método e percepção sem rótulos e tabelas recolhíveis", () => {
    const dados = calcularDashboardObservacional(modulos, [sessao("s1", "2026-09-18T12:00:00.000Z"), sessao("s2", "2026-09-19T12:00:00.000Z")], [], referencia, null, [{
      metodosResultados: [{ chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 75, amostraEvidenciasSuficiente: true }],
      formatosResultados: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 75, amostraEvidenciasSuficiente: true }],
      resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 2, compreensaoMinima: 4, desempenhoMinimo: 70 } },
    }]);
    const html = renderToStaticMarkup(createElement(GraficosDashboard, { dados }));
    expect(html).toContain("Métodos × Resultados");
    expect(html).toMatch(/compreensão percebida/i);
    expect(html).toMatch(/evidência posterior/i);
    expect(html).toContain("75/100");
    expect(html).toContain("75%");
    expect(html).toContain("Formatos × Resultados");
    expect(html).toContain("Evolução da percepção");
    expect(html).toContain("Resumo em anel: 0 contextos em linha e 0 em desacordo");
    expect(html).toContain("Associação observacional");
    expect(html).toContain("Técnica de Feynman");
    expect(html).not.toContain("AUTORRELATO");
    expect(html).not.toContain("SÍNTESE VISUAL");
    expect(html).not.toContain("PERCEPÇÃO E EVIDÊNCIAS");
    expect(html).not.toContain("Ver dados em tabela");
    expect(html).not.toContain("<details");
    expect(html).toContain('aria-label="Ver explicação sobre Evolução da percepção"');
    expect(html).toContain('aria-label="Ver explicação sobre Percepção × evidências"');
    expect(html.match(/Médias semanais de dificuldade e compreensão percebidas, de 1 a 5\. Cada ponto requer duas percepções na semana; não mede desempenho\./g)).toHaveLength(1);
    expect(html.match(/Resume somente contextos com amostra suficiente; não demonstra causalidade\./g)).toHaveLength(1);
    expect(html).toMatch(/<dialog[\s\S]*Médias semanais de dificuldade[\s\S]*<\/dialog>/);
    expect(html).toMatch(/<dialog[\s\S]*Resume somente contextos[\s\S]*<\/dialog>/);
    expect(html).not.toContain("Ver métodos e formatos");
    expect(html).not.toContain("Uso dos métodos");
    expect(html).not.toMatch(/eficácia comprovada|melhor método/i);
  });

  it("explica ausência de sessões e de percepções suficientes", () => {
    const dados = calcularDashboardObservacional(modulos, [], [], referencia);
    const html = renderToStaticMarkup(createElement(GraficosDashboard, { dados }));
    expect(html).toContain("Ainda não há métodos com percepção e evidências posteriores suficientes");
    expect(html).toContain("Ainda não há formatos com percepção e evidências posteriores suficientes");
    expect(html).toContain("Ainda não há semanas com duas percepções");
  });

  it("mantém método com uma sessão na tabela sem publicar média", () => {
    const dados = calcularDashboardObservacional(modulos, [sessao("s1", "2026-09-18T12:00:00.000Z")], [], referencia);
    const html = renderToStaticMarkup(createElement(GraficosDashboard, { dados }));
    expect(html).toContain("Ainda não há métodos com percepção e evidências posteriores suficientes");
  });
});
