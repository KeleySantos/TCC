import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, NivelEvidencia, PapelUsuario, SituacaoSessao } from "../src/gerado/prisma/enums";
import { calcularAnaliseTopico } from "../src/dominio/analises/evidencias";
import { gerarRecomendacao } from "../src/dominio/recomendacoes/gerar";
import { verificarSenha } from "../src/servidor/senhas";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação do cenário sintético falhou: ${mensagem}`);
}

async function obterAnaliseDoAluno(nomeUsuario: string, identificadorTopico: string) {
  const aluno = await prisma.perfilAluno.findFirstOrThrow({ where: { usuario: { nomeUsuario } } });
  const topico = await prisma.topico.findUniqueOrThrow({ where: { identificador: identificadorTopico } });
  const [sessoes, tentativas] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { alunoId: aluno.id }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { alunoId: aluno.id } }),
  ]);
  return calcularAnaliseTopico(
    topico.id,
    sessoes.map((sessao) => ({ id: sessao.id, topicoId: sessao.topicoId, formato: sessao.recurso.formato, encerradaEm: sessao.encerradaEm, duracaoMinutos: sessao.duracaoMinutos, situacao: sessao.situacao })),
    tentativas.map((tentativa) => ({ id: tentativa.id, topicoId: tentativa.topicoId, concluidaEm: tentativa.concluidaEm, notaNormalizada: tentativa.notaNormalizada })),
  );
}

async function principal() {
  const [usuarios, alunos, administradores, professores, topicos, recursos, avaliacoes, sessoesConcluidas, sessoesInvalidas, tentativas, notasInvalidas, contaAdministrador, contaProfessor, contaAluno] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { papel: PapelUsuario.ALUNO } }),
    prisma.usuario.count({ where: { papel: PapelUsuario.ADMINISTRADOR } }),
    prisma.usuario.count({ where: { papel: PapelUsuario.PROFESSOR } }),
    prisma.topico.count({ where: { ativo: true } }),
    prisma.recursoConteudo.count({ where: { ativo: true } }),
    prisma.avaliacao.findMany({ where: { identificador: "quiz-loops-basico" }, include: { questoes: true } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.CONCLUIDA } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.INVALIDADA } }),
    prisma.tentativaAvaliacao.count(),
    prisma.tentativaAvaliacao.count({ where: { OR: [{ notaNormalizada: { lt: 0 } }, { notaNormalizada: { gt: 100 } }] } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "admin" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "prof.rafael" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
  ]);

  afirmar(usuarios === 8, "esperados 8 usuários sintéticos.");
  afirmar(alunos === 6, "esperados 6 alunos sintéticos.");
  afirmar(administradores === 1 && professores === 1, "esperados 1 administrador e 1 professor sintéticos.");
  afirmar(topicos === 3, "esperados 3 tópicos ativos.");
  afirmar(recursos === 3, "esperados 3 recursos ativos.");
  afirmar(avaliacoes.length === 1 && avaliacoes[0].questoes.length === 5, "o quiz de Loops deve possuir 5 questões.");
  afirmar(sessoesConcluidas === 20 && sessoesInvalidas === 1, "esperadas 20 sessões concluídas e 1 inválida.");
  afirmar(tentativas === 20 && notasInvalidas === 0, "esperadas 20 tentativas com notas entre 0 e 100.");
  afirmar(verificarSenha("Admin@2026", contaAdministrador.senhaHash), "a credencial fictícia do administrador deve ser válida.");
  afirmar(verificarSenha("Professor@2026", contaProfessor.senhaHash), "a credencial fictícia do professor deve ser válida.");
  afirmar(verificarSenha("Aluno@2026", contaAluno.senhaHash), "a credencial fictícia do aluno deve ser válida.");

  const analiseAna = await obterAnaliseDoAluno("ana.souza", "loops");
  const resumoPraticaAna = analiseAna.resumosFormatos.find((resumo) => resumo.formato === FormatoConteudo.EXERCICIO_PRATICO);
  afirmar(resumoPraticaAna?.quantidadeEvidencias === 3, "Ana deve possuir 3 evidências após exercícios práticos.");
  afirmar(Math.abs((resumoPraticaAna?.mediaNotas ?? 0) - 78.66666666666667) < 0.01, "a média de Ana após exercícios práticos deve ser aproximadamente 78,7%.");

  const analiseCarla = await obterAnaliseDoAluno("carla.rocha", "loops");
  afirmar(analiseCarla.evidencias.length === 1, "a sessão inválida de Carla não pode compor evidência.");
  afirmar(analiseCarla.resumosFormatos[0]?.nivelEvidencia === NivelEvidencia.INSUFICIENTE, "Carla deve permanecer com evidência insuficiente.");

  const recursosLoops = await prisma.recursoConteudo.findMany({
    where: { topico: { identificador: "loops" }, ativo: true },
    include: { aprovacoes: true },
  });
  const recomendacaoCarla = gerarRecomendacao(analiseCarla, recursosLoops.map((recurso) => ({
    id: recurso.id,
    formato: recurso.formato,
    titulo: recurso.titulo,
    aprovadoProfessor: recurso.aprovacoes.some((aprovacao) => aprovacao.situacao === "APROVADO"),
  })));
  afirmar(recomendacaoCarla?.nivelEvidencia === NivelEvidencia.INSUFICIENTE, "Carla deve receber recomendação exploratória.");

  console.log("Cenário sintético verificado: estrutura, notas e resultados analíticos esperados estão consistentes.");
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
