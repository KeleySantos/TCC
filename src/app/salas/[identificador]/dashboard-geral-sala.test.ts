import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { calcularDashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { DashboardGeralSala } from "./dashboard-geral-sala";

const referencia = new Date("2026-09-30T12:00:00.000Z");
const sessoes = [1, 2, 3].map((dia) => ({
  id: `s${dia}`,
  moduloId: "m1",
  descricao: "",
  iniciadaEm: new Date(`2026-09-0${dia}T10:00:00.000Z`),
  encerradaEm: new Date(`2026-09-0${dia}T10:30:00.000Z`),
  duracaoMinutos: 30,
  situacao: SituacaoSessao.CONCLUIDA,
  arquivada: false,
  dificuldadePercebida: 4,
  compreensaoPercebida: 4,
  metodos: [MetodoEstudo.FEYNMAN],
  formatos: [FormatoConteudo.TEXTO],
}));

describe("Dashboard geral da Sala", () => {
  it("exibe os cards e gráficos do Dashboard Principal sem as seções excluídas", () => {
    const dados = calcularDashboardObservacional([{ id: "m1", identificador: "js", titulo: "JavaScript" }], sessoes, [], referencia, null, [{
      metodosResultados: [],
      formatosResultados: [{ chave: FormatoConteudo.TEXTO, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: true }],
      resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 } },
    }]);
    const html = renderToStaticMarkup(createElement(DashboardGeralSala, { dados, nomeSala: "Turma A" }));

    expect(html).toContain("Visão geral de Turma A");
    expect(html).toContain(">Método associado à maior compreensão<");
    expect(html).toContain(">Formato associado à maior compreensão<");
    expect(html).toContain(">Duração associada a melhores resultados<");
    expect(html).toContain("Métodos × Resultados");
    expect(html).toContain("Formatos × Resultados");
    expect(html).toContain("Evolução da percepção");
    expect(html).not.toContain("Consistência dos métodos entre módulos");
    expect(html).not.toContain("Base das análises");
  });
});
