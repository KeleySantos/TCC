import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { referenciaTcc, usuariosCenariosTcc } from "../testes/fixtures/cenarios-tcc";
import { aplicarCenariosAvaliacaoTcc } from "../prisma/cenarios-avaliacao-tcc";
import { calcularResumoAvaliacaoIaTcc, criarAvaliacaoManualPendente, VERSAO_FORMATO_AVALIACAO_IA_TCC, type DocumentoAvaliacaoIaTcc, type ExecucaoAvaliacaoIaTcc } from "../src/dominio/avaliacao-ia-tcc";

// Não lê nem reutiliza DATABASE_URL do desenvolvimento. Cada execução cria um banco novo.
const pasta = mkdtempSync(join(tmpdir(), "tcc-avaliacao-"));
process.env.DATABASE_URL = `file:${join(pasta, "avaliacao.db").replaceAll("\\", "/")}`;
execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/migrar-banco.ts"], { env: process.env, stdio: "pipe" });
const { prisma } = await import("../src/biblioteca/prisma");
const { obterAprendizagemModuloPessoal, registrarEvidenciaDoMaterial } = await import("../src/servidor/aprendizagem-modulo");
const { calcularMetricasSessoes } = await import("../src/dominio/analises/metricas-sessoes");
const { criarDtoInterpretacaoModulo, interpretarComFila, prepararDtoParaProvedor } = await import("../src/servidor/ia/interpretacoes");
const { criarInstrucaoInterpretacao, VERSAO_PROMPT_INTERPRETACAO } = await import("../src/servidor/ia/contrato-provedores");
const { validarConteudoInterpretacao } = await import("../src/dominio/interpretacoes/esquema");
const { criarHashSenha } = await import("../src/servidor/senhas");

const observados: Array<Record<string, unknown>> = [];
const execucoes: ExecucaoAvaliacaoIaTcc[] = [];
const reais = process.argv.includes("--ia-real");
if (reais && (!process.argv.includes("--autorizar-consumo") || !process.env.TCC_IA_CHAVE || !process.env.TCC_IA_MODELO || process.env.TCC_IA_PROVEDOR !== "GROQ")) {
  throw new Error("Experimento real exige --autorizar-consumo e TCC_IA_CHAVE, TCC_IA_MODELO e TCC_IA_PROVEDOR.");
}
const indiceSaida = process.argv.indexOf("--saida");
const instanteInicial = new Date();
const provedorPlanejado = "GROQ" as const;
const modeloPlanejado = reais ? process.env.TCC_IA_MODELO! : "fixture-sem-rede";
const idExperimento = `${reais ? "real" : "mock"}-${instanteInicial.toISOString().replaceAll(":", "-").replace(".", "-")}`;
const destino = resolve("AiFiles/RELATORIOS");
const caminhoSaida = indiceSaida >= 0 && process.argv[indiceSaida + 1]
  ? resolve(process.argv[indiceSaida + 1])
  : reais
    ? join(destino, "avaliacao-ia-tcc", `${idExperimento}.json`)
    : join(destino, "RESULTADOS_AVALIACAO_TCC.json");
mkdirSync(dirname(caminhoSaida), { recursive: true });

let documento: DocumentoAvaliacaoIaTcc = {
  versaoFormato: VERSAO_FORMATO_AVALIACAO_IA_TCC,
  experimento: {
    id: idExperimento,
    criadoEm: instanteInicial.toISOString(),
    atualizadoEm: instanteInicial.toISOString(),
    estado: "EM_EXECUCAO",
    modo: reais ? "REAL" : "MOCK_SEM_REDE",
    provedorPlanejado,
    modeloPlanejado,
    versaoPrompt: VERSAO_PROMPT_INTERPRETACAO,
    respostasPlanejadas: 15,
    regraAprovacaoIndividual: "4_DE_5_COM_C3_E_C4",
    regraSucessoGeral: "14_DE_15",
  },
  contagens: null,
  contagensFinais: null,
  controles: {},
  observados,
  execucoes,
  resumo: calcularResumoAvaliacaoIaTcc(execucoes),
};

function salvarDocumento() {
  documento = { ...documento, experimento: { ...documento.experimento, atualizadoEm: new Date().toISOString() }, observados, execucoes, resumo: calcularResumoAvaliacaoIaTcc(execucoes) };
  writeFileSync(caminhoSaida, JSON.stringify(documento, null, 2));
}
try {
  const usuarios = await Promise.all(usuariosCenariosTcc.map((atribuicao) => prisma.usuario.create({ data: { nome: atribuicao.nome, nomeUsuario: atribuicao.nomeUsuario, senhaHash: criarHashSenha("senha-sintetica-tcc") } })));
  const cenariosAplicados = await aplicarCenariosAvaliacaoTcc(prisma, usuarios);
  for (const { indiceCenario: cenario, definicao, usuario, modulos } of cenariosAplicados) {
    for (const { numeroModulo, modulo } of modulos) {
      const aprendizagem = await obterAprendizagemModuloPessoal(usuario.id, modulo.id, referenciaTcc);
      assert(aprendizagem);
      const resultado = aprendizagem.analises.conceitos.find((item) => item.chave === "conceito")!;
      assert.equal(resultado.desempenhoMedio, definicao.medias[numeroModulo]);
      assert.equal(resultado.tendencia, definicao.tendencias[numeroModulo]);
      assert.equal(resultado.evidencias, cenario === 3 ? numeroModulo : 10);
      if (cenario === 0) {
        assert.equal(aprendizagem.analises.metodosResultados.find((item) => item.chave === "FEYNMAN")?.desempenhoMedioPosterior, 80);
        assert.equal(aprendizagem.analises.metodosResultados.find((item) => item.chave === "POMODORO")?.desempenhoMedioPosterior, 40);
      }
      if (cenario === 3) assert(aprendizagem.recomendacoes.every((item) => item.materialId === null));
      if (cenario === 4) {
        assert.equal(resultado.estadoPercepcaoEvidencia, ["POSSIVEL_SUPERESTIMACAO", "POSSIVEL_SUBESTIMACAO", "PONTO_DE_ATENCAO"][numeroModulo]);
        const indice = aprendizagem.analises.conceitosMaiorCompreensao.find((item) => item.chave === "conceito")!.indice;
        assert(Math.abs(indice - [73.33333333333333, 30, 50][numeroModulo]) < 1e-9);
      }
      assert.equal(await obterAprendizagemModuloPessoal("outro-usuario", modulo.id, referenciaTcc), null);
      observados.push({ usuario: usuario.nomeUsuario, cenario: definicao.id, modulo: numeroModulo, esperado: definicao.medias[numeroModulo], observado: resultado.desempenhoMedio, tendencia: resultado.tendencia, evidencias: resultado.evidencias, aprovado: true });
      if (numeroModulo === 0) {
        const sessoes = await prisma.sessaoEstudo.findMany({ where: { moduloId: modulo.id }, include: { metodos: true, formatos: true } });
        const metricas = calcularMetricasSessoes(sessoes.map((sessao) => ({ ...sessao, metodos: sessao.metodos.map((item) => item.metodo), formatos: sessao.formatos.map((item) => item.formato) })), modulo.id);
        const dto = criarDtoInterpretacaoModulo(metricas, sessoes, aprendizagem);
        const local = await interpretarComFila(dto, []);
        assert.equal(local.origem, "LOCAL");
        assert.equal((await obterAprendizagemModuloPessoal(usuario.id, modulo.id, referenciaTcc))?.recomendacoes[0].regraId, aprendizagem.recomendacoes[0].regraId);
        for (let execucao = 1; execucao <= 3; execucao++) {
          const geradaEm = new Date().toISOString();
          const entradaProvedor = prepararDtoParaProvedor(dto);
          const prompt = criarInstrucaoInterpretacao(entradaProvedor);
          const resposta = reais ? await interpretarComFila(dto, [{ provedor: "GROQ", chave: process.env.TCC_IA_CHAVE!, modelo: process.env.TCC_IA_MODELO! }]) : await interpretarComFila(dto, [{ provedor: "GROQ", chave: "mock", modelo: "fixture-sem-rede" }], {
            criar: () => ({ nome: "GROQ", interpretar: async () => ({ insights: [{ tipo: "OBSERVACAO", titulo: definicao.nome, observacao: "Os registros deste módulo são observacionais. Compare percepção e desempenho mantendo os limites de amostra; explore uma revisão e registre novas evidências.", resumoEvidencias: null, perguntaReflexiva: null, experimentoSugerido: null, confianca: "BAIXA" }] }) }),
          });
          const estruturaValida = validarConteudoInterpretacao(resposta) !== null;
          const respostaExterna = reais && resposta.origem !== "LOCAL";
          const provedorEsperado = resposta.origem === provedorPlanejado;
          const modeloEsperado = resposta.modelo === modeloPlanejado;
          const motivos = [
            ...(!reais ? ["EXECUCAO_SIMULADA"] : []),
            ...(!estruturaValida ? ["RESPOSTA_REJEITADA_PELA_VALIDACAO_AUTOMATICA"] : []),
            ...(reais && !respostaExterna ? [`CONTINGENCIA_${resposta.motivoContingencia ?? "LOCAL"}`] : []),
            ...(respostaExterna && !provedorEsperado ? ["PROVEDOR_DIFERENTE_DO_PLANEJADO"] : []),
            ...(respostaExterna && !modeloEsperado ? ["MODELO_DIFERENTE_DO_PLANEJADO"] : []),
          ];
          execucoes.push({
            id: `${definicao.id}-${execucao}`,
            cenario: definicao.id,
            nomeCenario: definicao.nome,
            usuario: usuario.nomeUsuario,
            numeroExecucao: execucao,
            geradaEm,
            provedorPlanejado,
            modeloPlanejado,
            versaoPrompt: VERSAO_PROMPT_INTERPRETACAO,
            hashPrompt: createHash("sha256").update(prompt).digest("hex"),
            entrada: entradaProvedor,
            prompt,
            resposta,
            origemResposta: resposta.origem,
            modeloEfetivo: resposta.modelo,
            tentativasProvedores: resposta.tentativas,
            validacaoAutomatica: { estruturaValida, respostaExterna, provedorEsperado, modeloEsperado, validaParaExperimento: reais && estruturaValida && respostaExterna && provedorEsperado && modeloEsperado, motivos },
            erroOuContingencia: resposta.motivoContingencia,
            historicoGeracoes: [],
            avaliacao: criarAvaliacaoManualPendente(),
          });
          salvarDocumento();
        }
      }
    }
  }
  const contagens = { usuarios: await prisma.usuario.count(), modulos: await prisma.moduloAprendizagem.count(), sessoes: await prisma.sessaoEstudo.count(), evidencias: await prisma.evidenciaAprendizagem.count() };
  assert.deepEqual(contagens, { usuarios: 5, modulos: 15, sessoes: 150, evidencias: 150 });
  // Controle de registro automático, legado pendente, deduplicação e autorização em banco real.
  const modulo = cenariosAplicados[0].modulos[0].modulo;
  for (const duracao of [4, 30]) await prisma.sessaoEstudo.create({ data: { usuarioId: modulo.usuarioId, moduloId: modulo.id, descricao: "Controle excluído das métricas", iniciadaEm: new Date("2026-09-21T10:00:00Z"), encerradaEm: duracao === 4 ? new Date("2026-09-21T10:04:00Z") : null, duracaoMinutos: duracao, situacao: duracao === 4 ? "CONCLUIDA" : "PLANEJADA", compreensaoPercebida: 1 } });
  assert.equal((await obterAprendizagemModuloPessoal(modulo.usuarioId, modulo.id, referenciaTcc))?.base.sessoes, 10);
  assert.equal((await obterAprendizagemModuloPessoal(modulo.usuarioId, modulo.id, { inicio: new Date("2026-09-02"), fim: new Date("2026-09-02T23:59:59Z") }))?.base.evidenciasValidas, 1);
  const material = await prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "controle-extracao", titulo: "Avaliação controle", descricao: "Dados sintéticos", formato: "TEXTO", minutosEstimados: 5, funcao: "AVALIACAO", dataEvento: new Date("2026-09-20T12:00:00Z") } });
  assert.equal(await registrarEvidenciaDoMaterial("outro-usuario", material.id, "Resultado: 70%", ["Conceito"]), null);
  await registrarEvidenciaDoMaterial(modulo.usuarioId, material.id, "Resultado: 70%", ["Conceito"]);
  await registrarEvidenciaDoMaterial(modulo.usuarioId, material.id, "Resultado: 70%", ["Conceito"]);
  assert.equal(await prisma.evidenciaAprendizagem.count({ where: { recursoId: material.id } }), 1);
  const depois = await obterAprendizagemModuloPessoal(modulo.usuarioId, modulo.id, referenciaTcc);
  assert.equal(depois?.base.evidenciasValidas, 11);
  assert.equal(depois?.analises.conceitos.find((item) => item.chave === "conceito")?.desempenhoMedio, 670 / 11);
  await prisma.recursoConteudo.update({ where: { id: material.id }, data: { ativo: false } });
  assert.equal((await obterAprendizagemModuloPessoal(modulo.usuarioId, modulo.id, referenciaTcc))?.base.evidenciasValidas, 10);
  await prisma.recursoConteudo.update({ where: { id: material.id }, data: { ativo: true } });
  await registrarEvidenciaDoMaterial(modulo.usuarioId, material.id, "Sem resultado", ["Conceito"]);
  assert.equal((await obterAprendizagemModuloPessoal(modulo.usuarioId, modulo.id, referenciaTcc))?.base.evidenciasValidas, 10);
  const contagensFinais = { usuarios: await prisma.usuario.count(), modulos: await prisma.moduloAprendizagem.count(), sessoes: await prisma.sessaoEstudo.count(), evidencias: await prisma.evidenciaAprendizagem.count() };
  documento = {
    ...documento,
    experimento: { ...documento.experimento, estado: "CONCLUIDO", atualizadoEm: new Date().toISOString() },
    contagens,
    contagensFinais,
    controles: { sessoesInvalidasAdicionais: 2, evidenciasAdicionais: 1, repeticaoSemDuplicidade: true, registroValidoEntraSemConfirmacao: true, incompletoExcluido: true, outraContaBloqueada: true },
    observados,
    execucoes,
    resumo: calcularResumoAvaliacaoIaTcc(execucoes),
  };
  salvarDocumento();
  console.log(JSON.stringify({ contagens, atribuicoes: usuariosCenariosTcc, cenariosAprovados: observados.length, respostas: execucoes.length, respostasValidasExperimento: documento.resumo.validasExperimento, modo: reais ? "REAL" : "MOCK_SEM_REDE", arquivo: caminhoSaida, bancoIsolado: pasta }));
} finally { await prisma.$disconnect(); }
