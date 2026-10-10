import { describe, expect, it } from "vitest";
import { analisarAprendizagemModulo, normalizarChaveConceito, saoVariacoesDoMesmoConceito, textoMencionaConceito } from "./aprendizagem-modulo";

const referencia = new Date("2026-09-27T12:00:00.000Z");

describe("análises de aprendizagem do módulo", () => {
  it("normaliza conceitos e reúne percepção com evidências confirmadas", () => {
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: [
        { id: "s1", encerradaEm: new Date("2026-09-01T12:00:00.000Z"), compreensaoPercebida: 5, dificuldadePercebida: 2, duracaoMinutos: 30, metodos: ["FEYNMAN"], formatos: ["TEXTO"], conceitos: ["Autômato Finito Determinístico", "AFD"] },
        { id: "s2", encerradaEm: new Date("2026-09-10T12:00:00.000Z"), compreensaoPercebida: 4, dificuldadePercebida: 3, duracaoMinutos: 35, metodos: ["FEYNMAN"], formatos: ["EXERCICIO_PRATICO"], conceitos: ["AFD"] },
      ],
      evidencias: [
        { id: "e-pendente", dataEvento: new Date("2026-09-11T12:00:00.000Z"), confirmada: false, desempenhoPercentual: 10, conceitos: ["AFD"], sessaoIdsExplicitos: [] },
        { id: "e1", dataEvento: new Date("2026-09-12T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 55, conceitos: ["AFD"], sessaoIdsExplicitos: [] },
        { id: "e2", dataEvento: new Date("2026-09-13T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 65, conceitos: ["AFD"], sessaoIdsExplicitos: [] },
      ],
      conceitos: [{ chave: "afd", nome: "Autômato Finito Determinístico", aliases: ["AFD"] }],
    });

    expect(normalizarChaveConceito("  Autômato Finito Determinístico ")).toBe("automato finito deterministico");
    expect(resultado.conceitos).toHaveLength(1);
    expect(resultado.conceitos[0]).toMatchObject({ nome: "Autômato Finito Determinístico", sessoes: 2, evidencias: 2, compreensaoMedia: 4.5, desempenhoMedio: 60, estadoPercepcaoEvidencia: "POSSIVEL_SUPERESTIMACAO" });
    expect(resultado.metodosEvidencias[0]).toMatchObject({ chave: "FEYNMAN", sessoes: 2, evidenciasPosteriores: 2, desempenhoMedioPosterior: 60, amostraSuficiente: true });
    expect(resultado.formatosEvidencias.some((item) => item.chave === "TEXTO")).toBe(true);
  });

  it("classifica evolução simples por conceito e explicita amostra insuficiente", () => {
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: [],
      evidencias: [
        { id: "e1", dataEvento: new Date("2026-08-01T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 40, conceitos: ["Órbitas"], sessaoIdsExplicitos: [] },
        { id: "e2", dataEvento: new Date("2026-09-20T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 75, conceitos: ["Órbitas"], sessaoIdsExplicitos: [] },
        { id: "e3", dataEvento: new Date("2026-09-21T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 90, conceitos: ["Gravitação"], sessaoIdsExplicitos: [] },
      ],
      conceitos: [],
    });
    expect(resultado.conceitos.find((item) => item.nome === "Órbitas")?.tendencia).toBe("EVOLUCAO_POSITIVA");
    expect(resultado.conceitos.find((item) => item.nome === "Gravitação")?.tendencia).toBe("DADOS_INSUFICIENTES");
  });

  it("não inventa padrões sem dados confirmados", () => {
    const resultado = analisarAprendizagemModulo({ referencia, sessoes: [], evidencias: [], conceitos: [] });
    expect(resultado).toMatchObject({ conceitos: [], metodosEvidencias: [], formatosEvidencias: [], padroes: [] });
  });

  it("identifica conceitos na descrição por termo completo", () => {
    expect(textoMencionaConceito("Usei map para transformar o array.", "map")).toBe(true);
    expect(textoMencionaConceito("Montei um mapa das relações.", "map")).toBe(false);
    expect(textoMencionaConceito("Revisei o EVENT LOOP.", "event loop")).toBe(true);
  });

  it("reconhece siglas como variações candidatas do conceito canônico", () => {
    expect(saoVariacoesDoMesmoConceito("AFD", "Autômato Finito Determinístico")).toBe(true);
    expect(saoVariacoesDoMesmoConceito("DOM", "Document Object Model")).toBe(true);
    expect(saoVariacoesDoMesmoConceito("map", "mapa mental")).toBe(false);
  });

  it("consolida percepção e evidências posteriores por método e formato sem duplicar evidências", () => {
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: [
        { id: "s1", encerradaEm: new Date("2026-09-01T12:00:00.000Z"), compreensaoPercebida: 4, dificuldadePercebida: 2, duracaoMinutos: 30, metodos: ["FEYNMAN", "FEYNMAN"], formatos: ["TEXTO"], conceitos: ["AFD"] },
        { id: "s2", encerradaEm: new Date("2026-09-05T12:00:00.000Z"), compreensaoPercebida: 5, dificuldadePercebida: 1, duracaoMinutos: 30, metodos: ["FEYNMAN"], formatos: ["TEXTO"], conceitos: ["AFD"] },
        { id: "s3", encerradaEm: new Date("2026-09-06T12:00:00.000Z"), compreensaoPercebida: 3, dificuldadePercebida: 3, duracaoMinutos: 30, metodos: ["POMODORO"], formatos: ["VIDEO"], conceitos: ["Outro conceito"] },
      ],
      evidencias: [
        { id: "e1", dataEvento: new Date("2026-09-10T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 80, conceitos: ["AFD"], sessaoIdsExplicitos: [] },
        { id: "e2", dataEvento: new Date("2026-09-11T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 70, conceitos: [], sessaoIdsExplicitos: ["s3"] },
        { id: "e3", dataEvento: new Date("2026-09-12T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 20, conceitos: ["Sem relação"], sessaoIdsExplicitos: [] },
        { id: "e4", dataEvento: new Date("2026-10-15T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 100, conceitos: ["AFD"], sessaoIdsExplicitos: [] },
      ],
      conceitos: [{ chave: "afd", nome: "AFD", aliases: [] }],
    });

    expect(resultado.metodosResultados).toEqual(expect.arrayContaining([
      expect.objectContaining({ chave: "FEYNMAN", quantidadeSessoes: 2, quantidadeCompreensoes: 2, compreensaoMedia: 4.5, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 80, amostraEvidenciasSuficiente: false }),
      expect.objectContaining({ chave: "POMODORO", quantidadeSessoes: 1, quantidadeEvidenciasPosteriores: 1, desempenhoMedioPosterior: 70 }),
    ]));
    expect(resultado.formatosResultados).toEqual(expect.arrayContaining([
      expect.objectContaining({ chave: "TEXTO", quantidadeSessoes: 2, quantidadeEvidenciasPosteriores: 1 }),
      expect.objectContaining({ chave: "VIDEO", quantidadeSessoes: 1, quantidadeEvidenciasPosteriores: 1 }),
    ]));
  });

  it("exige que a evidência seja estritamente posterior até no vínculo explícito", () => {
    const encerradaEm = new Date("2026-09-01T12:00:00.000Z");
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: [{ id: "s1", encerradaEm, compreensaoPercebida: 4, dificuldadePercebida: 2, duracaoMinutos: 30, metodos: ["FEYNMAN"], formatos: ["TEXTO"], conceitos: ["AFD"] }],
      evidencias: [{ id: "e1", dataEvento: encerradaEm, confirmada: true, desempenhoPercentual: 90, conceitos: ["AFD"], sessaoIdsExplicitos: ["s1"] }],
      conceitos: [{ chave: "afd", nome: "AFD", aliases: [] }],
    });

    expect(resultado.metodosResultados[0]).toMatchObject({ quantidadeEvidenciasPosteriores: 0, desempenhoMedioPosterior: null });
  });

  it("classifica no máximo cinco conceitos recentes com fórmula explicável e base mínima", () => {
    const nomes = ["Closures", "Promises", "Event Loop", "Prototypes", "Async Await", "Arrays"];
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: nomes.flatMap((nome, indice) => [1, 2].map((numero) => ({
        id: `${indice}-${numero}`,
        encerradaEm: new Date(`2026-09-${String(10 + indice).padStart(2, "0")}T12:00:00.000Z`),
        compreensaoPercebida: indice === 5 ? 5 : 2,
        dificuldadePercebida: indice === 5 ? 1 : 4,
        duracaoMinutos: 30,
        metodos: ["FEYNMAN"],
        formatos: ["TEXTO"],
        conceitos: [nome],
      }))),
      evidencias: nomes.map((nome, indice) => ({
        id: `e-${indice}`,
        dataEvento: new Date(`2026-09-${String(20 + indice).padStart(2, "0")}T12:00:00.000Z`),
        confirmada: true,
        desempenhoPercentual: indice === 5 ? 95 : 45 + indice,
        conceitos: [nome],
        sessaoIdsExplicitos: [],
      })),
      conceitos: nomes.map((nome) => ({ chave: nome.toLowerCase(), nome, aliases: [] })),
    });

    expect(resultado.conceitosMaiorDificuldade).toHaveLength(5);
    expect(resultado.conceitosMaiorDificuldade[0]).toMatchObject({ nome: "Closures", sessoes: 2, evidencias: 1, evidenciasSuficientes: false });
    expect(resultado.conceitosMaiorCompreensao[0]).toMatchObject({ nome: "Arrays", compreensaoMedia: 5, dificuldadeMedia: 1, desempenhoMedio: 95 });
    expect(resultado.conceitosMaiorCompreensao).toHaveLength(5);
  });

  it("resume duração de sessões com melhores resultados e destaca contextos por compreensão", () => {
    const resultado = analisarAprendizagemModulo({
      referencia,
      sessoes: [
        { id: "s1", encerradaEm: new Date("2026-09-01T12:00:00.000Z"), compreensaoPercebida: 5, dificuldadePercebida: 1, duracaoMinutos: 30, metodos: ["FEYNMAN"], formatos: ["TEXTO"], conceitos: ["A"] },
        { id: "s2", encerradaEm: new Date("2026-09-08T12:00:00.000Z"), compreensaoPercebida: 4, dificuldadePercebida: 2, duracaoMinutos: 60, metodos: ["FEYNMAN"], formatos: ["TEXTO"], conceitos: ["B"] },
        { id: "s3", encerradaEm: new Date("2026-09-15T12:00:00.000Z"), compreensaoPercebida: 5, dificuldadePercebida: 1, duracaoMinutos: 45, metodos: ["POMODORO"], formatos: ["VIDEO"], conceitos: ["C"] },
      ],
      evidencias: [
        { id: "e1", dataEvento: new Date("2026-09-02T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 80, conceitos: ["A"], sessaoIdsExplicitos: [] },
        { id: "e2", dataEvento: new Date("2026-09-09T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 60, conceitos: ["B"], sessaoIdsExplicitos: [] },
        { id: "e3", dataEvento: new Date("2026-09-16T12:00:00.000Z"), confirmada: true, desempenhoPercentual: 65, conceitos: ["C"], sessaoIdsExplicitos: [] },
      ],
      conceitos: [],
    });

    expect(resultado.resumoResultados.duracaoSessoesComMelhorResultado).toMatchObject({ mediaMinutos: 30, quantidadeSessoes: 1, compreensaoMinima: 4, desempenhoMinimo: 70 });
    expect(resultado.resumoResultados.metodoMaiorCompreensao).toMatchObject({ chave: "FEYNMAN", compreensaoMedia: 4.5, quantidadeCompreensoes: 2 });
    expect(resultado.resumoResultados.formatoMaiorCompreensao).toMatchObject({ chave: "TEXTO", compreensaoMedia: 4.5, quantidadeCompreensoes: 2 });
    expect(resultado.evolucaoPercepcaoEvidencia).toEqual(expect.arrayContaining([
      expect.objectContaining({ mediaCompreensaoPercebida: 5, desempenhoMedioEvidencias: 80, quantidadePercepcoes: 1, quantidadeEvidencias: 1 }),
    ]));
  });
});
