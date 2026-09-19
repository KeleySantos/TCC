import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, MetodoEstudo, NivelBloom, PapelUsuario, SituacaoSessao } from "../src/gerado/prisma/enums";
import { criarHashSenha } from "../src/servidor/senhas";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
const referencia = new Date("2026-09-01T12:00:00.000Z");
const diasAntes = (dias: number) => new Date(referencia.getTime() - dias * 24 * 60 * 60 * 1000);

type ContaComConteudo = {
  usuario: { id: string };
  modulo: { id: string };
  loops: { id: string };
  recursos: { pdf: { id: string }; video: { id: string }; pratica: { id: string } };
  avaliacao: { id: string };
};

async function criarRespostasSinteticas(tentativaId: string, avaliacaoId: string, nota: number) {
  const questoes = await prisma.questao.findMany({ where: { avaliacaoId }, orderBy: { posicao: "asc" } });
  const quantidadeCorretas = Math.round((nota / 100) * questoes.length);
  await prisma.respostaQuestao.createMany({
    data: questoes.map((questao, indice) => {
      const opcoes = JSON.parse(questao.opcoesJson) as string[];
      const correta = indice < quantidadeCorretas;
      return {
        tentativaId,
        questaoId: questao.id,
        correta,
        pontos: correta ? questao.peso : 0,
        resposta: correta ? questao.opcaoCorreta : opcoes.find((opcao) => opcao !== questao.opcaoCorreta) ?? "Resposta sintética incorreta",
      };
    }),
  });
}

async function criarSessaoETentativa(
  conta: ContaComConteudo,
  recursoId: string,
  dias: number,
  minutos: number,
  nota: number,
  opcoes: { metodo?: MetodoEstudo; desafioId?: string | null } = {},
) {
  const iniciadaEm = diasAntes(dias);
  const encerradaEm = new Date(iniciadaEm.getTime() + minutos * 60 * 1000);
  const metodo = opcoes.metodo ?? (recursoId === conta.recursos.pdf.id ? MetodoEstudo.LEITURA_ATIVA : recursoId === conta.recursos.video.id ? MetodoEstudo.VIDEO_GUIADO : MetodoEstudo.EXERCICIO);
  const quantidadeTentativasAnteriores = await prisma.tentativaAvaliacao.count({
    where: { usuarioId: conta.usuario.id, avaliacaoId: conta.avaliacao.id },
  });
  await prisma.sessaoEstudo.create({
    data: {
      usuarioId: conta.usuario.id,
      moduloId: conta.modulo.id,
      topicoId: conta.loops.id,
      recursoId,
      metodo,
      desafioId: opcoes.desafioId ?? null,
      dificuldadePercebida: nota < 60 ? 4 : nota < 75 ? 3 : 2,
      compreensaoPercebida: Math.min(5, Math.max(1, Math.round(nota / 20))),
      observacao: "Registro sintético de sessão para validação do laboratório.",
      iniciadaEm,
      encerradaEm,
      duracaoMinutos: minutos,
      situacao: SituacaoSessao.CONCLUIDA,
    },
  });
  const tentativa = await prisma.tentativaAvaliacao.create({
    data: {
      usuarioId: conta.usuario.id,
      moduloId: conta.modulo.id,
      topicoId: conta.loops.id,
      avaliacaoId: conta.avaliacao.id,
      iniciadaEm: encerradaEm,
      concluidaEm: new Date(encerradaEm.getTime() + 10 * 60 * 1000),
      respostasCorretas: Math.round(nota / 20),
      totalQuestoes: 5,
      notaNormalizada: nota,
      numeroTentativa: quantidadeTentativasAnteriores + 1,
    },
  });
  await criarRespostasSinteticas(tentativa.id, conta.avaliacao.id, nota);
}

async function criarContaComModulo(nome: string, nomeUsuario: string, perfil: string): Promise<ContaComConteudo> {
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      nomeUsuario,
      email: `${nomeUsuario}@exemplo.test`,
      senhaHash: criarHashSenha("Laboratorio@2026"),
      // Compatibilidade física com a migração inicial; não é um papel do produto.
      papel: PapelUsuario.ALUNO,
    },
  });
  const modulo = await prisma.moduloAprendizagem.create({
    data: {
      usuarioId: usuario.id,
      identificador: "javascript",
      titulo: "JavaScript",
      descricao: `Módulo pessoal sintético do perfil ${perfil}.`,
    },
  });
  const loops = await prisma.topico.create({
    data: {
      moduloId: modulo.id,
      identificador: "loops",
      nome: "Loops",
      descricao: "Repetições controladas com for e while.",
    },
  });
  await prisma.topico.createMany({
    data: [
      { moduloId: modulo.id, identificador: "condicionais", nome: "Condicionais", descricao: "Decisões com if, else e comparações." },
      { moduloId: modulo.id, identificador: "funcoes", nome: "Funções", descricao: "Parâmetros, retorno e organização de código." },
    ],
  });
  const [pdf, video, pratica] = await Promise.all([
    prisma.recursoConteudo.create({ data: { topicoId: loops.id, identificador: "guia-visual", titulo: "Loops: guia visual", descricao: "Leitura estruturada com exemplos.", formato: FormatoConteudo.PDF, minutosEstimados: 18, conteudoTexto: "Um loop repete instruções. Use for quando a quantidade de repetições é conhecida e while enquanto houver uma condição verdadeira." } }),
    prisma.recursoConteudo.create({ data: { topicoId: loops.id, identificador: "passo-a-passo", titulo: "Loops passo a passo", descricao: "Vídeo demonstrativo sobre for e while.", formato: FormatoConteudo.VIDEO, minutosEstimados: 12, conteudoTexto: "Roteiro sintético: inicialize o contador, defina a condição e atualize o contador em cada repetição." } }),
    prisma.recursoConteudo.create({ data: { topicoId: loops.id, identificador: "laboratorio", titulo: "Laboratório de loops", descricao: "Exercícios práticos progressivos.", formato: FormatoConteudo.EXERCICIO_PRATICO, minutosEstimados: 22, conteudoTexto: "Prática: escreva um for que imprima os números de 1 a 5 e explique quando a condição de parada acontece." } }),
  ]);
  const avaliacao = await prisma.avaliacao.create({
    data: {
      topicoId: loops.id,
      identificador: "quiz-basico",
      titulo: "Verificação de aprendizagem: Loops",
      descricao: "Questões objetivas sobre repetição.",
      questoes: {
        create: [
          { enunciado: "Qual estrutura repete enquanto uma condição for verdadeira?", opcoesJson: JSON.stringify(["if", "while", "return", "switch"]), opcaoCorreta: "while", posicao: 1, nivelBloom: NivelBloom.LEMBRAR },
          { enunciado: "Qual estrutura serve para quantidade conhecida de repetições?", opcoesJson: JSON.stringify(["for", "else", "break", "function"]), opcaoCorreta: "for", posicao: 2, nivelBloom: NivelBloom.COMPREENDER },
          { enunciado: "O que break faz em um loop?", opcoesJson: JSON.stringify(["Repete", "Interrompe", "Cria variável", "Compara"]), opcaoCorreta: "Interrompe", posicao: 3, nivelBloom: NivelBloom.COMPREENDER },
          { enunciado: "Qual operador pode incrementar contador?", opcoesJson: JSON.stringify(["++", "===", "&&", "!"]), opcaoCorreta: "++", posicao: 4, nivelBloom: NivelBloom.APLICAR },
          { enunciado: "Um loop infinito ocorre quando:", opcoesJson: JSON.stringify(["a condição nunca fica falsa", "há return", "contador aumenta", "há for"]), opcaoCorreta: "a condição nunca fica falsa", posicao: 5, nivelBloom: NivelBloom.ANALISAR },
        ],
      },
    },
  });

  return { usuario, modulo, loops, recursos: { pdf, video, pratica }, avaliacao };
}

async function criarSegundoModuloDaAna(conta: ContaComConteudo) {
  const modulo = await prisma.moduloAprendizagem.create({
    data: { usuarioId: conta.usuario.id, identificador: "logica", titulo: "Lógica", descricao: "Segundo módulo sintético para verificar contexto e recorrência entre assuntos." },
  });
  const topico = await prisma.topico.create({
    data: { moduloId: modulo.id, identificador: "proposicoes", nome: "Proposições", descricao: "Conectivos, valores lógicos e tabelas-verdade." },
  });
  const recurso = await prisma.recursoConteudo.create({
    data: { topicoId: topico.id, identificador: "pratica-proposicoes", titulo: "Prática de proposições", descricao: "Exercícios de lógica proposicional.", formato: FormatoConteudo.EXERCICIO_PRATICO, minutosEstimados: 15, conteudoTexto: "Prática sintética: identifique proposições e avalie conectivos lógicos em exemplos simples." },
  });
  const avaliacao = await prisma.avaliacao.create({
    data: {
      topicoId: topico.id,
      identificador: "quiz-proposicoes",
      titulo: "Verificação de aprendizagem: Proposições",
      descricao: "Questões objetivas de lógica proposicional.",
      questoes: { create: [
        { enunciado: "Qual conectivo representa negação?", opcoesJson: JSON.stringify(["não", "e", "ou", "se"]), opcaoCorreta: "não", posicao: 1, nivelBloom: NivelBloom.LEMBRAR },
        { enunciado: "Se p é verdadeira e q é falsa, p e q é:", opcoesJson: JSON.stringify(["verdadeira", "falsa", "indefinida", "numérica"]), opcaoCorreta: "falsa", posicao: 2, nivelBloom: NivelBloom.APLICAR },
      ] },
    },
  });
  const iniciadaEm = diasAntes(16);
  const encerradaEm = new Date(iniciadaEm.getTime() + 15 * 60 * 1_000);
  await prisma.sessaoEstudo.create({
    data: { usuarioId: conta.usuario.id, moduloId: modulo.id, topicoId: topico.id, recursoId: recurso.id, metodo: MetodoEstudo.FEYNMAN, dificuldadePercebida: 3, compreensaoPercebida: 4, observacao: "Registro sintético de um segundo módulo para validar recorrência contextual.", iniciadaEm, encerradaEm, duracaoMinutos: 15, situacao: SituacaoSessao.CONCLUIDA },
  });
  const tentativa = await prisma.tentativaAvaliacao.create({
    data: { usuarioId: conta.usuario.id, moduloId: modulo.id, topicoId: topico.id, avaliacaoId: avaliacao.id, numeroTentativa: 1, iniciadaEm: encerradaEm, concluidaEm: new Date(encerradaEm.getTime() + 10 * 60 * 1_000), respostasCorretas: 2, totalQuestoes: 2, notaNormalizada: 100 },
  });
  await criarRespostasSinteticas(tentativa.id, avaliacao.id, 100);
}

async function principal() {
  await prisma.eventoAuditoria.deleteMany();
  await prisma.recomendacao.deleteMany();
  await prisma.respostaQuestao.deleteMany();
  await prisma.tentativaAvaliacao.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.sessaoEstudo.deleteMany();
  await prisma.aprovacaoRecurso.deleteMany();
  await prisma.recursoConteudo.deleteMany();
  await prisma.topico.deleteMany();
  await prisma.moduloAprendizagem.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.perfilAluno.deleteMany();
  await prisma.perfilProfessor.deleteMany();
  await prisma.usuario.deleteMany();

  const [ana, bruno, carla, diego, elisa] = await Promise.all([
    criarContaComModulo("Ana Souza", "ana.souza", "A"),
    criarContaComModulo("Bruno Lima", "bruno.lima", "B"),
    criarContaComModulo("Carla Rocha", "carla.rocha", "C"),
    criarContaComModulo("Diego Alves", "diego.alves", "D"),
    criarContaComModulo("Elisa Martins", "elisa.martins", "E"),
  ]);

  const [desafioFeynmanAna] = await Promise.all([
    prisma.desafioExperimentacao.create({
      data: {
        usuarioId: ana.usuario.id,
        moduloId: ana.modulo.id,
        metodo: MetodoEstudo.FEYNMAN,
        meta: "Explicar estruturas de repetição com minhas próprias palavras antes da avaliação.",
      },
    }),
    prisma.desafioExperimentacao.create({
      data: {
        usuarioId: bruno.usuario.id,
        moduloId: bruno.modulo.id,
        metodo: MetodoEstudo.POMODORO,
        meta: "Organizar blocos curtos de estudo para revisar o módulo.",
        situacao: "CANCELADO",
        canceladoEm: diasAntes(40),
      },
    }),
  ]);

  for (const [indice, [conta, recurso, minutos, nota, metodo, desafioId]] of ([
    [ana, ana.recursos.pdf, 25, 46, MetodoEstudo.FEYNMAN, desafioFeynmanAna.id], [ana, ana.recursos.pratica, 21, 78, MetodoEstudo.FEYNMAN, desafioFeynmanAna.id], [ana, ana.recursos.pratica, 19, 82, MetodoEstudo.FEYNMAN, null], [ana, ana.recursos.pratica, 17, 76, MetodoEstudo.FEYNMAN, null],
    [bruno, bruno.recursos.video, 16, 70, MetodoEstudo.RECUPERACAO_ATIVA, null], [bruno, bruno.recursos.video, 14, 74, MetodoEstudo.RECUPERACAO_ATIVA, null], [bruno, bruno.recursos.video, 13, 72, MetodoEstudo.REPETICAO_ESPACADA, null], [bruno, bruno.recursos.pdf, 18, 68, MetodoEstudo.REPETICAO_ESPACADA, null],
    [carla, carla.recursos.pdf, 17, 58, MetodoEstudo.POMODORO, null], [diego, diego.recursos.pratica, 20, 48, MetodoEstudo.INTERCALAMENTO, null], [diego, diego.recursos.video, 13, 51, MetodoEstudo.PRATICA_DISTRIBUIDA, null], [diego, diego.recursos.pratica, 19, 47, MetodoEstudo.INTERCALAMENTO, null],
    [elisa, elisa.recursos.pdf, 16, 84, MetodoEstudo.POMODORO, null], [elisa, elisa.recursos.video, 12, 86, MetodoEstudo.REPETICAO_ESPACADA, null], [elisa, elisa.recursos.pdf, 18, 83, MetodoEstudo.RECUPERACAO_ATIVA, null], [elisa, elisa.recursos.video, 11, 85, MetodoEstudo.PRATICA_DISTRIBUIDA, null], [elisa, elisa.recursos.pratica, 20, 87, MetodoEstudo.INTERCALAMENTO, null],
  ] as Array<[ContaComConteudo, { id: string }, number, number, MetodoEstudo, string | null]>).entries()) {
    await criarSessaoETentativa(conta, recurso.id, 180 - indice * 8, minutos, nota, { metodo, desafioId });
  }

  await criarSegundoModuloDaAna(ana);

  await prisma.sessaoEstudo.create({
    data: {
      usuarioId: carla.usuario.id,
      moduloId: carla.modulo.id,
      topicoId: carla.loops.id,
      recursoId: carla.recursos.video.id,
      metodo: MetodoEstudo.VIDEO_GUIADO,
      dificuldadePercebida: 4,
      compreensaoPercebida: 2,
      observacao: "Sessão curta sintética, inválida para cálculo de evidências.",
      iniciadaEm: diasAntes(2),
      encerradaEm: diasAntes(2),
      duracaoMinutos: 1,
      situacao: SituacaoSessao.INVALIDADA,
    },
  });
  console.log("Cenário sintético pessoal criado com sucesso.");
}

principal().catch((erro) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
