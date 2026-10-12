import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { cenariosTcc, percentualCenario, referenciaTcc } from "../testes/fixtures/cenarios-tcc";

// Não lê nem reutiliza DATABASE_URL do desenvolvimento. Cada execução cria um banco novo.
const pasta = mkdtempSync(join(tmpdir(), "tcc-avaliacao-"));
process.env.DATABASE_URL = `file:${join(pasta, "avaliacao.db").replaceAll("\\", "/")}`;
execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/migrar-banco.ts"], { env: process.env, stdio: "pipe" });
const { prisma } = await import("../src/biblioteca/prisma");
const { obterAprendizagemModuloPessoal, registrarEvidenciaDoMaterial } = await import("../src/servidor/aprendizagem-modulo");
const { calcularMetricasSessoes } = await import("../src/dominio/analises/metricas-sessoes");
const { criarDtoInterpretacaoModulo, interpretarComFila } = await import("../src/servidor/ia/interpretacoes");
const { criarInstrucaoInterpretacao } = await import("../src/servidor/ia/contrato-provedores");
const { criarHashSenha } = await import("../src/servidor/senhas");

const observados: Array<Record<string, unknown>> = [];
const interpretacoes: Array<Record<string, unknown>> = [];
const reais = process.argv.includes("--ia-real");
if (reais && (!process.argv.includes("--autorizar-consumo") || !process.env.TCC_IA_CHAVE || !process.env.TCC_IA_MODELO || !["GEMINI", "GROQ", "QWEN"].includes(process.env.TCC_IA_PROVEDOR ?? ""))) {
  throw new Error("Experimento real exige --autorizar-consumo e TCC_IA_CHAVE, TCC_IA_MODELO e TCC_IA_PROVEDOR.");
}
try {
  for (let cenario = 0; cenario < 5; cenario++) {
    const definicao = cenariosTcc[cenario];
    const usuario = await prisma.usuario.create({ data: { nome: `Pessoa sintética ${cenario + 1}`, nomeUsuario: `tcc-${cenario + 1}`, senhaHash: criarHashSenha("senha-sintetica-tcc") } });
    for (let numeroModulo = 0; numeroModulo < 3; numeroModulo++) {
      const modulo = await prisma.moduloAprendizagem.create({ data: { usuarioId: usuario.id, identificador: `modulo-${numeroModulo}`, titulo: `${definicao.id} módulo ${numeroModulo}`, descricao: "Cenário acadêmico inteiramente sintético." } });
      const conceito = await prisma.conceitoAprendizagem.create({ data: { moduloId: modulo.id, chave: "conceito", nome: "Conceito" } });
      const controle = await prisma.conceitoAprendizagem.create({ data: { moduloId: modulo.id, chave: "controle", nome: "Controle" } });
      if (cenario !== 3) await prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "referencia", titulo: "Referência do conceito", descricao: "Texto sintético disponível para revisão.", formato: "TEXTO", minutosEstimados: 20, conteudoTexto: "Conceito", conceitos: { create: { conceitoId: conceito.id } } } });
      for (let numeroSessao = 0; numeroSessao < 10; numeroSessao++) {
        const iniciadaEm = new Date(Date.UTC(2026, 8, numeroSessao + 1, 10));
        const encerradaEm = new Date(iniciadaEm.getTime() + 30 * 60_000);
        const sessao = await prisma.sessaoEstudo.create({ data: {
          usuarioId: usuario.id, moduloId: modulo.id, descricao: "Estudo do Conceito", iniciadaEm, encerradaEm, duracaoMinutos: 30, situacao: "CONCLUIDA", modoRegistro: "MANUAL",
          arquivada: numeroSessao === 9,
          compreensaoPercebida: cenario === 4 ? [5, 1, 3][numeroModulo] : 3,
          dificuldadePercebida: cenario === 4 ? [1, 5, 3][numeroModulo] : 3,
          metodos: { create: { metodo: numeroSessao < 5 ? "FEYNMAN" : "POMODORO" } },
          formatos: { create: { formato: numeroSessao < 5 ? "TEXTO" : "VIDEO" } },
          conceitos: { create: { conceitoId: conceito.id } },
        } });
        // Avaliação operacional = registro de desempenho de uma atividade, distinto da sessão.
        // Há dez atividades por módulo por desenho da fixture, não por inferência de equivalência.
        await prisma.evidenciaAprendizagem.create({ data: {
          moduloId: modulo.id, titulo: `Atividade sintética ${numeroSessao + 1}`, tipo: "EXERCICIO", dataEvento: new Date(encerradaEm.getTime() + 60_000),
          desempenhoPercentual: percentualCenario(cenario, numeroModulo, numeroSessao),
          dadosOrigemJson: JSON.stringify({ origem: "FIXTURE_TCC", atividade: numeroSessao + 1 }),
          conceitos: { create: { conceitoId: cenario === 3 && numeroSessao >= numeroModulo ? controle.id : conceito.id } },
          vinculosSessoes: { create: { sessaoId: sessao.id } },
        } });
      }
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
      observados.push({ cenario: definicao.id, modulo: numeroModulo, esperado: definicao.medias[numeroModulo], observado: resultado.desempenhoMedio, tendencia: resultado.tendencia, evidencias: resultado.evidencias, aprovado: true });
      if (numeroModulo === 0) {
        const sessoes = await prisma.sessaoEstudo.findMany({ where: { moduloId: modulo.id }, include: { metodos: true, formatos: true } });
        const metricas = calcularMetricasSessoes(sessoes.map((sessao) => ({ ...sessao, metodos: sessao.metodos.map((item) => item.metodo), formatos: sessao.formatos.map((item) => item.formato) })), modulo.id);
        const dto = criarDtoInterpretacaoModulo(metricas, sessoes, aprendizagem);
        const local = await interpretarComFila(dto, []);
        assert.equal(local.origem, "LOCAL");
        assert.equal((await obterAprendizagemModuloPessoal(usuario.id, modulo.id, referenciaTcc))?.recomendacoes[0].regraId, aprendizagem.recomendacoes[0].regraId);
        for (let execucao = 1; execucao <= 3; execucao++) {
          const resposta = reais ? await interpretarComFila(dto, [{ provedor: process.env.TCC_IA_PROVEDOR as "GROQ" | "GEMINI" | "QWEN", chave: process.env.TCC_IA_CHAVE!, modelo: process.env.TCC_IA_MODELO! }]) : await interpretarComFila(dto, [{ provedor: "GROQ", chave: "mock", modelo: "fixture-sem-rede" }], {
            criar: () => ({ nome: "GROQ", interpretar: async () => ({ insights: [{ tipo: "OBSERVACAO", titulo: definicao.nome, observacao: "Os registros deste módulo são observacionais. Compare percepção e desempenho mantendo os limites de amostra; explore uma revisão e registre novas evidências.", resumoEvidencias: null, perguntaReflexiva: null, experimentoSugerido: null, confianca: "BAIXA" }] }) }),
          });
          interpretacoes.push({ cenario: definicao.id, execucao, modo: reais ? "REAL" : "MOCK_SEM_REDE", prompt: criarInstrucaoInterpretacao(dto), entrada: dto, resposta, rubrica: { C1: null, C2: null, C3: null, C4: null, C5: null }, satisfatoria: null });
        }
      }
    }
  }
  const contagens = { usuarios: await prisma.usuario.count(), modulos: await prisma.moduloAprendizagem.count(), sessoes: await prisma.sessaoEstudo.count(), evidencias: await prisma.evidenciaAprendizagem.count() };
  assert.deepEqual(contagens, { usuarios: 5, modulos: 15, sessoes: 150, evidencias: 150 });
  // Controle de registro automático, legado pendente, deduplicação e autorização em banco real.
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { identificador: "modulo-0" }, orderBy: { titulo: "asc" } });
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
  const destino = resolve("AiFiles/RELATORIOS");
  mkdirSync(destino, { recursive: true });
  writeFileSync(join(destino, "RESULTADOS_AVALIACAO_TCC.json"), JSON.stringify({ contagens, contagensFinais, controles: { sessoesInvalidasAdicionais: 2, evidenciasAdicionais: 1, repeticaoSemDuplicidade: true, registroValidoEntraSemConfirmacao: true, incompletoExcluido: true, outraContaBloqueada: true }, observados, interpretacoes }, null, 2));
  console.log(JSON.stringify({ contagens, cenariosAprovados: observados.length, respostas: interpretacoes.length, modo: reais ? "REAL" : "MOCK_SEM_REDE", bancoIsolado: pasta }));
} finally { await prisma.$disconnect(); }
