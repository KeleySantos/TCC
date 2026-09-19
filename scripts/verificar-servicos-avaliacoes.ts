import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { concluirTentativaPessoal, ErroAvaliacao } from "../src/servidor/avaliacoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de serviços de avaliações falhou: ${mensagem}`);
}

function opcoes(questao: { opcoesJson: string }) {
  const valores = JSON.parse(questao.opcoesJson) as unknown;
  if (!Array.isArray(valores) || !valores.every((valor) => typeof valor === "string")) throw new Error("Questão sintética sem opções válidas.");
  return valores;
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const avaliacao = await prisma.avaliacao.findFirstOrThrow({
    where: { identificador: "quiz-basico", topico: { modulo: { usuarioId: ana.id } } },
    include: { questoes: { orderBy: { posicao: "asc" } } },
  });
  const anterior = await prisma.tentativaAvaliacao.findFirst({
    where: { usuarioId: ana.id, avaliacaoId: avaliacao.id },
    orderBy: { numeroTentativa: "desc" },
    select: { numeroTentativa: true },
  });
  const idsTentativas: string[] = [];
  let avaliacaoSemQuestoesId: string | null = null;
  try {
    const respostasZero = Object.fromEntries(avaliacao.questoes.map((questao) => [questao.id, opcoes(questao).find((opcao) => opcao !== questao.opcaoCorreta)!]));
    const tentativaZero = await concluirTentativaPessoal(ana.id, { avaliacaoId: avaliacao.id, respostas: respostasZero });
    idsTentativas.push(tentativaZero.id);
    afirmar(tentativaZero.notaNormalizada === 0 && tentativaZero.respostasCorretas === 0, "respostas erradas devem produzir nota 0%.");
    afirmar(tentativaZero.numeroTentativa === (anterior?.numeroTentativa ?? 0) + 1, "a primeira tentativa criada deve continuar a sequência da conta.");

    const respostasIntermediarias = Object.fromEntries(avaliacao.questoes.map((questao, indice) => [questao.id, indice < 2 ? questao.opcaoCorreta : opcoes(questao).find((opcao) => opcao !== questao.opcaoCorreta)!]));
    const tentativaIntermediaria = await concluirTentativaPessoal(ana.id, { avaliacaoId: avaliacao.id, respostas: respostasIntermediarias });
    idsTentativas.push(tentativaIntermediaria.id);
    afirmar(tentativaIntermediaria.notaNormalizada > 0 && tentativaIntermediaria.notaNormalizada < 100 && tentativaIntermediaria.respostasCorretas === 2, "duas respostas corretas devem produzir resultado intermediário.");
    afirmar(tentativaIntermediaria.numeroTentativa === tentativaZero.numeroTentativa + 1, "a segunda tentativa deve receber o próximo número.");

    const respostasCorretas = Object.fromEntries(avaliacao.questoes.map((questao) => [questao.id, questao.opcaoCorreta]));
    const tentativaCompleta = await concluirTentativaPessoal(ana.id, { avaliacaoId: avaliacao.id, respostas: respostasCorretas });
    idsTentativas.push(tentativaCompleta.id);
    afirmar(tentativaCompleta.notaNormalizada === 100 && tentativaCompleta.respostasCorretas === avaliacao.questoes.length, "todas as respostas corretas devem produzir nota 100%.");
    afirmar(tentativaCompleta.numeroTentativa === tentativaIntermediaria.numeroTentativa + 1, "a terceira tentativa deve receber o próximo número.");

    let bloqueouRespostasIncompletas = false;
    try {
      await concluirTentativaPessoal(ana.id, { avaliacaoId: avaliacao.id, respostas: { [avaliacao.questoes[0]!.id]: avaliacao.questoes[0]!.opcaoCorreta } });
    } catch (erro) {
      bloqueouRespostasIncompletas = erro instanceof ErroAvaliacao && erro.codigo === "DADOS_INVALIDOS";
    }
    afirmar(bloqueouRespostasIncompletas, "respostas incompletas devem ser rejeitadas.");

    let bloqueouOutraConta = false;
    try {
      await concluirTentativaPessoal(bruno.id, { avaliacaoId: avaliacao.id, respostas: respostasCorretas });
    } catch (erro) {
      bloqueouOutraConta = erro instanceof ErroAvaliacao && erro.codigo === "NAO_ENCONTRADA";
    }
    afirmar(bloqueouOutraConta, "uma conta não pode concluir a avaliação de outra.");

    const avaliacaoSemQuestoes = await prisma.avaliacao.create({
      data: { topicoId: avaliacao.topicoId, identificador: `sem-questoes-${Date.now()}`, titulo: "Avaliação sem questões", descricao: "Cenário temporário para validar total zero." },
    });
    avaliacaoSemQuestoesId = avaliacaoSemQuestoes.id;
    const tentativaSemQuestoes = await concluirTentativaPessoal(ana.id, { avaliacaoId: avaliacaoSemQuestoes.id, respostas: {} });
    idsTentativas.push(tentativaSemQuestoes.id);
    afirmar(tentativaSemQuestoes.totalQuestoes === 0 && tentativaSemQuestoes.notaNormalizada === 0 && tentativaSemQuestoes.numeroTentativa === 1, "avaliação sem questões deve registrar total e nota zero sem divisão inválida.");

    console.log("Serviços de avaliações verificados: notas, sequência, total zero, validação e isolamento.");
  } finally {
    if (idsTentativas.length) await prisma.tentativaAvaliacao.deleteMany({ where: { id: { in: idsTentativas } } });
    if (avaliacaoSemQuestoesId) await prisma.avaliacao.deleteMany({ where: { id: avaliacaoSemQuestoesId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
