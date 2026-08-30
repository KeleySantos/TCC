import { PapelUsuario, SituacaoAprovacao, SituacaoSessao } from "@/gerado/prisma/enums";
import { calcularAnaliseTopico, type AnaliseTopico } from "@/dominio/analises/evidencias";
import { gerarRecomendacao, type RecomendacaoGerada } from "@/dominio/recomendacoes/gerar";
import { prisma } from "@/biblioteca/prisma";

export type TopicoPainelAluno = {
  id: string;
  identificador: string;
  nome: string;
  descricao: string;
  analise: AnaliseTopico;
  recomendacao: RecomendacaoGerada | null;
  quantidadeRecursos: number;
};

export async function obterPainelAluno(perfilAlunoId: string) {
  const [perfil, topicos, sessoes, tentativas] = await Promise.all([
    prisma.perfilAluno.findUniqueOrThrow({ where: { id: perfilAlunoId }, include: { usuario: true } }),
    prisma.topico.findMany({ where: { ativo: true }, include: { recursos: { where: { ativo: true }, include: { aprovacoes: true } } }, orderBy: { nome: "asc" } }),
    prisma.sessaoEstudo.findMany({ where: { alunoId: perfilAlunoId }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { alunoId: perfilAlunoId } }),
  ]);

  const sessoesParaAnalise = sessoes.map((sessao) => ({
    id: sessao.id,
    topicoId: sessao.topicoId,
    formato: sessao.recurso.formato,
    encerradaEm: sessao.encerradaEm,
    duracaoMinutos: sessao.duracaoMinutos,
    situacao: sessao.situacao,
  }));
  const tentativasParaAnalise = tentativas.map((tentativa) => ({ id: tentativa.id, topicoId: tentativa.topicoId, concluidaEm: tentativa.concluidaEm, notaNormalizada: tentativa.notaNormalizada }));
  const topicosPainel: TopicoPainelAluno[] = topicos.map((topico) => {
    const analise = calcularAnaliseTopico(topico.id, sessoesParaAnalise, tentativasParaAnalise);
    const recomendacao = gerarRecomendacao(analise, topico.recursos.map((recurso) => ({
      id: recurso.id,
      formato: recurso.formato,
      titulo: recurso.titulo,
      aprovadoProfessor: recurso.aprovacoes.some((aprovacao) => aprovacao.situacao === SituacaoAprovacao.APROVADO),
    })));
    return { id: topico.id, identificador: topico.identificador, nome: topico.nome, descricao: topico.descricao, analise, recomendacao, quantidadeRecursos: topico.recursos.length };
  });

  return { perfil, topicos: topicosPainel, quantidadeSessoesValidas: sessoes.filter((sessao) => sessao.situacao === SituacaoSessao.CONCLUIDA).length, quantidadeTentativas: tentativas.filter((tentativa) => tentativa.concluidaEm).length };
}

export async function obterPainelProfessor(perfilProfessorId: string) {
  const [turmas, recursos] = await Promise.all([prisma.turma.findMany({
    where: { professorId: perfilProfessorId },
    include: { matriculas: { include: { aluno: { include: { usuario: true } } } } },
  }), prisma.recursoConteudo.findMany({ include: { topico: true, aprovacoes: { where: { professorId: perfilProfessorId } } }, orderBy: { titulo: "asc" } })]);
  const alunos = turmas.flatMap((turma) => turma.matriculas.map((matricula) => matricula.aluno));
  const paineis = await Promise.all(alunos.map((aluno) => obterPainelAluno(aluno.id)));
  const porTopico = new Map<string, { nome: string; notas: number[]; alunosAtencao: number }>();
  for (const painel of paineis) for (const topico of painel.topicos) {
    const atual = porTopico.get(topico.id) ?? { nome: topico.nome, notas: [], alunosAtencao: 0 };
    if (topico.analise.ultimaNota !== null) atual.notas.push(topico.analise.ultimaNota);
    if (topico.analise.ultimaNota !== null && topico.analise.ultimaNota < 60) atual.alunosAtencao += 1;
    porTopico.set(topico.id, atual);
  }
  return {
    quantidadeAlunos: alunos.length,
    turmas,
    topicos: [...porTopico.entries()].map(([id, valor]) => ({ id, ...valor, media: valor.notas.length ? valor.notas.reduce((soma, nota) => soma + nota, 0) / valor.notas.length : null })),
    alunos: paineis.map((painel) => ({ nome: painel.perfil.usuario.nome, pseudonimo: painel.perfil.pseudonimo, topicos: painel.topicos })),
    recursos: recursos.map((recurso) => ({ id: recurso.id, titulo: recurso.titulo, topico: recurso.topico.nome, formato: recurso.formato, situacao: recurso.aprovacoes[0]?.situacao ?? SituacaoAprovacao.PENDENTE })),
  };
}

export async function obterPainelAdministrador() {
  const professores = await prisma.usuario.findMany({
    where: { papel: PapelUsuario.PROFESSOR },
    include: { perfilProfessor: { include: { turmas: true } } },
    orderBy: { nome: "asc" },
  });
  return {
    professores: professores.map((professor) => ({
      id: professor.id,
      nome: professor.nome,
      nomeUsuario: professor.nomeUsuario,
      quantidadeTurmas: professor.perfilProfessor?.turmas.length ?? 0,
    })),
  };
}
