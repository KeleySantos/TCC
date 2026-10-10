import { beforeEach, describe, expect, it, vi } from "vitest";
import { extrairRascunhoEvidencia, obterAprendizagemModuloPessoal } from "./aprendizagem-modulo";

const consultas = vi.hoisted(() => ({ buscarModulo: vi.fn() }));

vi.mock("@/biblioteca/prisma", () => ({ prisma: { moduloAprendizagem: { findFirst: consultas.buscarModulo } } }));

describe("rascunho de evidência de aprendizagem", () => {
  beforeEach(() => consultas.buscarModulo.mockReset());
  it("extrai desempenho e questões sem transformar o rascunho em dado confirmado", () => {
    const resultado = extrairRascunhoEvidencia([
      "Resultado: 72,5%",
      "Questão 1 — correta: definição de AFD",
      "Q. 2 — erro na transição",
      "Questão 2 — linha duplicada",
      "Questão 3 — precisa de revisão",
    ].join("\n"));

    expect(resultado.desempenhoPercentual).toBe(72.5);
    expect(resultado.questoes).toEqual([
      expect.objectContaining({ identificador: "1", resultado: "ACERTO" }),
      expect.objectContaining({ identificador: "2", resultado: "ERRO" }),
      expect.objectContaining({ identificador: "3", resultado: "NAO_INFORMADO" }),
    ]);
  });

  it("mantém campos desconhecidos como ausentes para revisão humana", () => {
    expect(extrairRascunhoEvidencia("Atividade sem correção legível")).toEqual({
      desempenhoPercentual: null,
      questoes: [],
    });
  });

  it("entrega vínculos explícitos de sessão ao cálculo dos resultados contextuais", async () => {
    consultas.buscarModulo.mockResolvedValue({
      id: "m1",
      conceitos: [{ id: "c1", chave: "afd", nome: "AFD", aliasesJson: "[]" }],
      materiais: [],
      sessoesEstudo: [{
        id: "s1", moduloId: "m1", descricao: "Sessão sem conceito textual", iniciadaEm: new Date("2026-09-01T10:00:00.000Z"), encerradaEm: new Date("2026-09-01T11:00:00.000Z"), duracaoMinutos: 60,
        situacao: "CONCLUIDA", arquivada: false, dificuldadePercebida: 2, compreensaoPercebida: 4,
        metodos: [{ metodo: "FEYNMAN" }], formatos: [{ formato: "TEXTO" }], conceitos: [{ conceitoId: "c1" }], materiais: [],
      }],
      evidencias: [{
        id: "e1", titulo: "Prova", tipo: "AVALIACAO", dataEvento: new Date("2026-09-20T11:00:00.000Z"), situacaoConfirmacao: "CONFIRMADA", desempenhoPercentual: 85, resumo: null,
        conceitos: [], questoes: [], vinculosSessoes: [{ sessaoId: "s1", confirmado: true }],
      }, {
        id: "e2", titulo: "Exercício por questão", tipo: "EXERCICIO", dataEvento: new Date("2026-09-21T11:00:00.000Z"), situacaoConfirmacao: "CONFIRMADA", desempenhoPercentual: 75, resumo: null,
        conceitos: [], questoes: [{ id: "q1", identificador: "1", resumo: "Questão", tipo: "APLICACAO", resultado: "ACERTO", pontuacaoObtida: 1, pontuacaoMaxima: 1, conceitos: [{ conceitoId: "c1" }] }], vinculosSessoes: [],
      }, {
        id: "e3", titulo: "Vínculo recusado", tipo: "OUTRA", dataEvento: new Date("2026-09-22T11:00:00.000Z"), situacaoConfirmacao: "CONFIRMADA", desempenhoPercentual: 10, resumo: null,
        conceitos: [], questoes: [], vinculosSessoes: [{ sessaoId: "s1", confirmado: false }],
      }],
    });

    const resultado = await obterAprendizagemModuloPessoal("u1", "m1", new Date("2026-09-27T12:00:00.000Z"));

    expect(resultado?.analises.metodosResultados[0]).toMatchObject({ chave: "FEYNMAN", quantidadeEvidenciasPosteriores: 2, desempenhoMedioPosterior: 80 });
    expect(resultado?.linhaDoTempo.map((evento) => evento.tipo)).toEqual(expect.arrayContaining(["AVALIACAO", "EXERCICIO"]));
    expect(resultado?.linhaDoTempo.find((evento) => evento.id === "e2")?.conceitos).toEqual(["AFD"]);

    const filtrado = await obterAprendizagemModuloPessoal("u1", "m1", {
      inicio: new Date("2026-09-21T00:00:00.000Z"),
      fim: new Date("2026-09-21T23:59:59.999Z"),
    });
    expect(filtrado?.linhaDoTempo.map((evento) => evento.id)).toEqual(["e2"]);
    expect(filtrado?.analises.metodosResultados).toEqual([]);
    expect(filtrado?.base).toMatchObject({ sessoes: 0, evidenciasConfirmadas: 1, evidenciasPendentes: 0 });
  });
});
