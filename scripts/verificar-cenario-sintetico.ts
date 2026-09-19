import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, MetodoEstudo, NivelEvidencia, SituacaoSessao } from "../src/gerado/prisma/enums";
import { calcularAnaliseBloom } from "../src/dominio/analises/analise-bloom";
import { calcularComparacaoDesafio } from "../src/dominio/analises/comparar-desafio";
import { calcularAnaliseTopico } from "../src/dominio/analises/evidencias";
import { gerarRecomendacao } from "../src/dominio/recomendacoes/gerar";
import { verificarSenha } from "../src/servidor/senhas";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação do cenário sintético falhou: ${mensagem}`);
}

async function obterAnaliseDaConta(nomeUsuario: string, identificadorModulo: string, identificadorTopico: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario } });
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: usuario.id, identificador: identificadorModulo } });
  const topico = await prisma.topico.findFirstOrThrow({ where: { moduloId: modulo.id, identificador: identificadorTopico } });
  const [sessoes, tentativas] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId: usuario.id, moduloId: modulo.id }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { usuarioId: usuario.id, moduloId: modulo.id } }),
  ]);
  return {
    usuario,
    modulo,
    topico,
    analise: calcularAnaliseTopico(
      topico.id,
      sessoes.map((sessao) => ({ id: sessao.id, topicoId: sessao.topicoId, formato: sessao.recurso.formato, encerradaEm: sessao.encerradaEm, duracaoMinutos: sessao.duracaoMinutos, situacao: sessao.situacao })),
      tentativas.map((tentativa) => ({ id: tentativa.id, topicoId: tentativa.topicoId, concluidaEm: tentativa.concluidaEm, notaNormalizada: tentativa.notaNormalizada })),
    ),
  };
}

async function principal() {
  const [usuarios, modulos, rascunhos, topicos, topicosRascunho, recursos, materiaisComTexto, avaliacoes, sessoesConcluidas, sessoesInvalidas, sessoesComContexto, tentativas, tentativasSemNumero, notasInvalidas, desafios, sessoesComDesafio, metodos, respostasClassificadas, ana] = await Promise.all([
    prisma.usuario.count(),
    prisma.moduloAprendizagem.count({ where: { arquivado: false, rascunho: false } }),
    prisma.moduloAprendizagem.count({ where: { rascunho: true } }),
    prisma.topico.count({ where: { ativo: true, rascunho: false } }),
    prisma.topico.count({ where: { rascunho: true } }),
    prisma.recursoConteudo.count({ where: { ativo: true } }),
    prisma.recursoConteudo.count({ where: { ativo: true, conteudoTexto: { not: null } } }),
    prisma.avaliacao.findMany({ where: { identificador: "quiz-basico" }, include: { questoes: true } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.CONCLUIDA } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.INVALIDADA } }),
    prisma.sessaoEstudo.count({ where: { metodo: { not: null }, dificuldadePercebida: { gte: 1, lte: 5 }, compreensaoPercebida: { gte: 1, lte: 5 }, observacao: { not: null } } }),
    prisma.tentativaAvaliacao.count(),
    prisma.tentativaAvaliacao.count({ where: { numeroTentativa: { lt: 1 } } }),
    prisma.tentativaAvaliacao.count({ where: { OR: [{ notaNormalizada: { lt: 0 } }, { notaNormalizada: { gt: 100 } }] } }),
    prisma.desafioExperimentacao.findMany({ orderBy: { criadoEm: "asc" } }),
    prisma.sessaoEstudo.count({ where: { desafioId: { not: null } } }),
    prisma.sessaoEstudo.findMany({ where: { metodo: { not: null } }, select: { metodo: true } }),
    prisma.respostaQuestao.findMany({ where: { questao: { nivelBloom: { not: null } } }, include: { questao: { select: { nivelBloom: true } }, tentativa: { select: { concluidaEm: true } } } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
  ]);

  afirmar(usuarios === 5, "esperadas 5 contas pessoais sintéticas.");
  afirmar(modulos === 6, "esperados 6 módulos pessoais ativos, incluindo o segundo módulo de demonstração.");
  afirmar(rascunhos === 0, "módulos existentes após a migração devem permanecer configurados, sem rascunho.");
  afirmar(topicosRascunho === 0, "tópicos sintéticos existentes após a migração devem permanecer configurados, sem rascunho.");
  afirmar(topicos === 16, "esperados 16 tópicos ativos, todos com módulo obrigatório.");
  afirmar(recursos === 16, "esperados 16 materiais ativos, próprios de cada conta.");
  afirmar(materiaisComTexto === 16, "os materiais sintéticos devem possuir conteúdo textual próprio.");
  afirmar(avaliacoes.length === 5 && avaliacoes.every((avaliacao) => avaliacao.questoes.length === 5 && avaliacao.questoes.every((questao) => questao.nivelBloom !== null)), "cada conta deve possuir quiz de Loops com 5 questões classificadas por Bloom.");
  afirmar(sessoesConcluidas === 18 && sessoesInvalidas === 1, "esperadas 18 sessões concluídas e 1 inválida.");
  afirmar(sessoesComContexto === 19, "todas as sessões sintéticas devem registrar método, escalas e observação limitada.");
  afirmar(tentativas === 18 && tentativasSemNumero === 0 && notasInvalidas === 0, "esperadas 18 tentativas numeradas com notas entre 0 e 100.");
  afirmar(desafios.length === 2 && desafios.some((desafio) => desafio.metodo === MetodoEstudo.FEYNMAN && desafio.situacao === "ATIVO") && desafios.some((desafio) => desafio.metodo === MetodoEstudo.POMODORO && desafio.situacao === "CANCELADO"), "esperados um desafio Feynman ativo e um Pomodoro cancelado, ambos sintéticos.");
  afirmar(sessoesComDesafio === 2, "duas sessões sintéticas devem manter vínculo explícito com o desafio ativo.");
  const metodosEntregaB = new Set(metodos.map((sessao) => sessao.metodo));
  afirmar([MetodoEstudo.FEYNMAN, MetodoEstudo.RECUPERACAO_ATIVA, MetodoEstudo.REPETICAO_ESPACADA, MetodoEstudo.POMODORO, MetodoEstudo.INTERCALAMENTO, MetodoEstudo.PRATICA_DISTRIBUIDA].every((metodo) => metodosEntregaB.has(metodo)), "os seis métodos da Entrega B devem estar presentes no cenário sintético.");
  afirmar(respostasClassificadas.length === 87, "tentativas sintéticas devem fornecer 87 respostas classificadas por Bloom.");
  afirmar(verificarSenha("Laboratorio@2026", ana.senhaHash), "a credencial sintética da conta A deve ser válida.");

  const contaAna = await obterAnaliseDaConta("ana.souza", "javascript", "loops");
  const resumoPraticaAna = contaAna.analise.resumosFormatos.find((resumo) => resumo.formato === FormatoConteudo.EXERCICIO_PRATICO);
  afirmar(resumoPraticaAna?.quantidadeEvidencias === 3, "a conta A deve possuir 3 evidências após exercícios práticos.");
  afirmar(Math.abs((resumoPraticaAna?.mediaNotas ?? 0) - 78.66666666666667) < 0.01, "a média da conta A após exercícios práticos deve ser aproximadamente 78,7%.");

  const contaCarla = await obterAnaliseDaConta("carla.rocha", "javascript", "loops");
  afirmar(contaCarla.analise.evidencias.length === 1, "a sessão inválida da conta C não pode compor evidência.");
  afirmar(contaCarla.analise.resumosFormatos[0]?.nivelEvidencia === NivelEvidencia.INSUFICIENTE, "a conta C deve permanecer com evidência insuficiente.");

  const recursosLoops = await prisma.recursoConteudo.findMany({ where: { topicoId: contaCarla.topico.id, ativo: true } });
  const recomendacaoCarla = gerarRecomendacao(contaCarla.analise, recursosLoops.map((recurso) => ({ id: recurso.id, formato: recurso.formato, titulo: recurso.titulo, aprovadoProfessor: false })));
  afirmar(recomendacaoCarla?.nivelEvidencia === NivelEvidencia.INSUFICIENTE, "a conta C deve receber recomendação exploratória.");

  const desafioAna = desafios.find((desafio) => desafio.usuarioId === contaAna.usuario.id && desafio.metodo === MetodoEstudo.FEYNMAN);
  afirmar(desafioAna, "a conta A deve possuir o desafio Feynman ativo.");
  const [sessoesAna, tentativasAna] = await Promise.all([
    prisma.sessaoEstudo.findMany({ where: { usuarioId: contaAna.usuario.id, moduloId: desafioAna.moduloId }, include: { recurso: { select: { formato: true } } } }),
    prisma.tentativaAvaliacao.findMany({ where: { usuarioId: contaAna.usuario.id, moduloId: desafioAna.moduloId } }),
  ]);
  const comparacao = calcularComparacaoDesafio(desafioAna, sessoesAna.map((sessao) => ({ id: sessao.id, moduloId: sessao.moduloId, topicoId: sessao.topicoId, formato: sessao.recurso.formato, metodo: sessao.metodo, desafioId: sessao.desafioId, encerradaEm: sessao.encerradaEm, duracaoMinutos: sessao.duracaoMinutos, situacao: sessao.situacao })), tentativasAna.map((tentativa) => ({ id: tentativa.id, moduloId: tentativa.moduloId, topicoId: tentativa.topicoId, concluidaEm: tentativa.concluidaEm, notaNormalizada: tentativa.notaNormalizada, numeroTentativa: tentativa.numeroTentativa, respostasCorretas: tentativa.respostasCorretas, totalQuestoes: tentativa.totalQuestoes })));
  afirmar(comparacao.comparavel && comparacao.desafio.quantidadeEvidencias === 2 && comparacao.contextoExterno.quantidadeEvidencias === 2, "o desafio de Ana deve ter duas evidências próprias e duas externas no mesmo método.");
  const bloom = calcularAnaliseBloom(respostasClassificadas.map((resposta) => ({ nivelBloom: resposta.questao.nivelBloom, correta: resposta.correta, concluidaEm: resposta.tentativa.concluidaEm })));
  afirmar(bloom.quantidadeNiveisComEvidencia >= 3, "o cenário deve fornecer amostra suficiente em ao menos três níveis de Bloom.");

  console.log("Cenário sintético pessoal verificado: propriedade, módulos, notas e resultados analíticos esperados estão consistentes.");
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
