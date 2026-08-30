import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, PapelUsuario, SituacaoAprovacao, SituacaoSessao } from "../src/gerado/prisma/enums";
import { criarHashSenha } from "../src/servidor/senhas";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
const diasAtras = (dias: number) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

async function criarSessaoETentativa(alunoId: string, topicoId: string, recursoId: string, avaliacaoId: string, dias: number, minutos: number, nota: number) {
  const iniciadaEm = diasAtras(dias);
  const encerradaEm = new Date(iniciadaEm.getTime() + minutos * 60 * 1000);
  await prisma.sessaoEstudo.create({ data: { alunoId, topicoId, recursoId, iniciadaEm, encerradaEm, duracaoMinutos: minutos, situacao: SituacaoSessao.CONCLUIDA } });
  await prisma.tentativaAvaliacao.create({
    data: { alunoId, topicoId, avaliacaoId, iniciadaEm: encerradaEm, concluidaEm: new Date(encerradaEm.getTime() + 10 * 60 * 1000), respostasCorretas: Math.round(nota / 20), totalQuestoes: 5, notaNormalizada: nota },
  });
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
  await prisma.matricula.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.perfilAluno.deleteMany();
  await prisma.perfilProfessor.deleteMany();
  await prisma.usuario.deleteMany();

  const senhaAdministrador = criarHashSenha("Admin@2026");
  const senhaProfessor = criarHashSenha("Professor@2026");
  await prisma.usuario.create({ data: { nome: "Administrador da Demonstração", nomeUsuario: "admin", senhaHash: senhaAdministrador, papel: PapelUsuario.ADMINISTRADOR } });
  const usuarioProfessor = await prisma.usuario.create({ data: { nome: "Prof. Rafael Mendes", nomeUsuario: "prof.rafael", senhaHash: senhaProfessor, papel: PapelUsuario.PROFESSOR, perfilProfessor: { create: {} } }, include: { perfilProfessor: true } });
  const turma = await prisma.turma.create({ data: { nome: "Fundamentos de Programação", periodo: "2026.2", professorId: usuarioProfessor.perfilProfessor!.id } });
  const alunos = await Promise.all([
    ["Ana Souza", "ana.souza", "EST-001"], ["Bruno Lima", "bruno.lima", "EST-002"], ["Carla Rocha", "carla.rocha", "EST-003"], ["Diego Alves", "diego.alves", "EST-004"], ["Elisa Martins", "elisa.martins", "EST-005"], ["Felipe Costa", "felipe.costa", "EST-006"],
  ].map(async ([nome, nomeUsuario, pseudonimo]) => {
    const usuario = await prisma.usuario.create({ data: { nome, nomeUsuario, senhaHash: criarHashSenha("Aluno@2026"), papel: PapelUsuario.ALUNO, perfilAluno: { create: { pseudonimo } } }, include: { perfilAluno: true } });
    await prisma.matricula.create({ data: { alunoId: usuario.perfilAluno!.id, turmaId: turma.id } });
    return usuario.perfilAluno!;
  }));

  const loops = await prisma.topico.create({ data: { identificador: "loops", nome: "Loops", descricao: "Repetições controladas com for e while." } });
  await prisma.topico.create({ data: { identificador: "condicionais", nome: "Condicionais", descricao: "Decisões com if, else e comparações." } });
  await prisma.topico.create({ data: { identificador: "funcoes", nome: "Funções", descricao: "Parâmetros, retorno e organização de código." } });
  const [pdf, video, pratica] = await Promise.all([
    prisma.recursoConteudo.create({ data: { identificador: "loops-pdf", titulo: "Loops: guia visual", descricao: "Leitura estruturada com exemplos.", formato: FormatoConteudo.PDF, minutosEstimados: 18, topicoId: loops.id } }),
    prisma.recursoConteudo.create({ data: { identificador: "loops-video", titulo: "Loops passo a passo", descricao: "Vídeo demonstrativo sobre for e while.", formato: FormatoConteudo.VIDEO, minutosEstimados: 12, topicoId: loops.id } }),
    prisma.recursoConteudo.create({ data: { identificador: "loops-pratica", titulo: "Laboratório de loops", descricao: "Exercícios práticos progressivos.", formato: FormatoConteudo.EXERCICIO_PRATICO, minutosEstimados: 22, topicoId: loops.id } }),
  ]);
  await Promise.all([video, pratica].map((recurso) => prisma.aprovacaoRecurso.create({ data: { recursoId: recurso.id, professorId: usuarioProfessor.perfilProfessor!.id, situacao: SituacaoAprovacao.APROVADO, observacao: "Recurso revisado para a demonstração." } })));
  await prisma.aprovacaoRecurso.create({ data: { recursoId: pdf.id, professorId: usuarioProfessor.perfilProfessor!.id, situacao: SituacaoAprovacao.PENDENTE } });
  const avaliacao = await prisma.avaliacao.create({ data: { identificador: "quiz-loops-basico", titulo: "Verificação de aprendizagem: Loops", descricao: "Questões objetivas sobre repetição.", topicoId: loops.id, questoes: { create: [
    { enunciado: "Qual estrutura repete enquanto uma condição for verdadeira?", opcoesJson: JSON.stringify(["if", "while", "return", "switch"]), opcaoCorreta: "while", posicao: 1 },
    { enunciado: "Qual estrutura serve para quantidade conhecida de repetições?", opcoesJson: JSON.stringify(["for", "else", "break", "function"]), opcaoCorreta: "for", posicao: 2 },
    { enunciado: "O que break faz em um loop?", opcoesJson: JSON.stringify(["Repete", "Interrompe", "Cria variável", "Compara"]), opcaoCorreta: "Interrompe", posicao: 3 },
    { enunciado: "Qual operador pode incrementar contador?", opcoesJson: JSON.stringify(["++", "===", "&&", "!"]), opcaoCorreta: "++", posicao: 4 },
    { enunciado: "Um loop infinito ocorre quando:", opcoesJson: JSON.stringify(["a condição nunca fica falsa", "há return", "contador aumenta", "há for"]), opcaoCorreta: "a condição nunca fica falsa", posicao: 5 },
  ] } } });
  const [ana, bruno, carla, diego, elisa, felipe] = alunos;
  const dados: Array<[string, string, number, number]> = [
    [ana.id, pdf.id, 25, 46], [ana.id, pratica.id, 21, 78], [ana.id, pratica.id, 19, 82], [ana.id, pratica.id, 17, 76],
    [bruno.id, video.id, 16, 70], [bruno.id, video.id, 14, 74], [bruno.id, video.id, 13, 72], [bruno.id, pdf.id, 18, 68],
    [carla.id, pdf.id, 17, 58], [diego.id, pratica.id, 20, 48], [diego.id, video.id, 13, 51], [diego.id, pratica.id, 19, 47],
    [elisa.id, pdf.id, 16, 84], [elisa.id, video.id, 12, 86], [elisa.id, pdf.id, 18, 83], [elisa.id, video.id, 11, 85], [elisa.id, pratica.id, 20, 87],
    [felipe.id, pratica.id, 20, 62], [felipe.id, pratica.id, 23, 65], [felipe.id, video.id, 13, 60],
  ];
  for (const [indice, [alunoId, recursoId, minutos, nota]] of dados.entries()) await criarSessaoETentativa(alunoId, loops.id, recursoId, avaliacao.id, 180 - indice * 8, minutos, nota);
  await prisma.sessaoEstudo.create({ data: { alunoId: carla.id, topicoId: loops.id, recursoId: video.id, iniciadaEm: diasAtras(2), encerradaEm: diasAtras(2), duracaoMinutos: 1, situacao: SituacaoSessao.INVALIDADA } });
  console.log("Cenário sintético criado com sucesso.");
}

principal().catch((erro) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
