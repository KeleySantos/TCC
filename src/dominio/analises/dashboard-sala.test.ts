import { describe, expect, it } from "vitest";
import { FormatoConteudo, MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularDashboardObservacionalSala } from "./dashboard-sala";

const referencia = new Date("2026-09-30T12:00:00.000Z");
const modulos = [
  { id: "sala-js", identificador: "sala-js", titulo: "JavaScript" },
  { id: "sala-bd", identificador: "sala-bd", titulo: "Banco de dados" },
];

function sessao(id: string, moduloId: string, compreensao: number) {
  return {
    id,
    moduloId,
    descricao: "",
    iniciadaEm: new Date(`2026-09-${id.slice(-2)}T10:00:00.000Z`),
    encerradaEm: new Date(`2026-09-${id.slice(-2)}T10:30:00.000Z`),
    duracaoMinutos: 30,
    situacao: SituacaoSessao.CONCLUIDA,
    arquivada: false,
    dificuldadePercebida: 4,
    compreensaoPercebida: compreensao,
    metodos: [MetodoEstudo.FEYNMAN],
    formatos: [FormatoConteudo.TEXTO],
  };
}

function analise(moduloId: string) {
  const resultado = { chave: MetodoEstudo.FEYNMAN, quantidadeSessoes: 3, quantidadeCompreensoes: 3, compreensaoMedia: 4.2, quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: true };
  return {
    moduloId,
    metodosResultados: [resultado],
    formatosResultados: [{ ...resultado, chave: FormatoConteudo.TEXTO }],
    resumoResultados: { duracaoSessoesComMelhorResultado: { mediaMinutos: 30, quantidadeSessoes: 3, compreensaoMinima: 4, desempenhoMinimo: 70 } },
  };
}

describe("Dashboard observacional agregado da Sala", () => {
  it("reutiliza os indicadores do Dashboard Principal entre módulos da sala", () => {
    const dados = calcularDashboardObservacionalSala({
      modulos,
      sessoes: [sessao("sessao-01", "sala-js", 4), sessao("sessao-02", "sala-js", 5), sessao("sessao-03", "sala-bd", 4)],
      analises: [analise("sala-js"), analise("sala-bd")],
      referencia,
    });

    expect(dados.metodoMaiorCompreensao?.chave).toBe(MetodoEstudo.FEYNMAN);
    expect(dados.formatoMaiorCompreensao?.chave).toBe(FormatoConteudo.TEXTO);
    expect(dados.duracaoSessoesMelhoresResultados.mediaMinutos).toBe(30);
    expect(dados.resultadosMetodosEvidencias[0].quantidadeEvidenciasPosteriores).toBe(4);
    expect(dados.baseHistorica.quantidadeModulosComSessoes).toBe(2);
  });

  it("não duplica a mesma sessão no mesmo módulo", () => {
    const repetida = sessao("sessao-01", "sala-js", 4);
    const dados = calcularDashboardObservacionalSala({ modulos, sessoes: [repetida, repetida], analises: [], referencia });
    expect(dados.baseHistorica.quantidadeSessoes).toBe(1);
  });
});
