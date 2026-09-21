import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, MetodoEstudo, ModoRegistroSessao, SituacaoSessao } from "../src/gerado/prisma/enums";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(mensagem);
}

async function principal() {
  const sessoesMigradas = await prisma.sessaoEstudo.findMany({
    include: { metodos: true, formatos: true, materiais: true },
  });

  afirmar(sessoesMigradas.length > 0, "O cenário deve possuir sessões sintéticas migradas.");
  for (const sessao of sessoesMigradas) {
    afirmar(sessao.descricao.trim().length > 0, `A sessão migrada ${sessao.id} deve possuir descrição.`);
    afirmar(sessao.metodos.length > 0, `A sessão ${sessao.id} deve possuir ao menos um método normalizado.`);
    afirmar(sessao.formatos.length > 0, `A sessão ${sessao.id} deve possuir ao menos um formato normalizado.`);
  }

  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({
    where: { arquivado: false, rascunho: false },
    select: { id: true, usuarioId: true },
  });
  const idsTemporarios: string[] = [];

  try {
    const planejada = await prisma.sessaoEstudo.create({
      data: {
        usuarioId: modulo.usuarioId,
        moduloId: modulo.id,
        descricao: "Sessão sintética futura para validar o novo modelo.",
        modoRegistro: ModoRegistroSessao.MANUAL,
        iniciadaEm: new Date("2030-01-10T12:00:00.000Z"),
        encerradaEm: new Date("2030-01-10T13:30:00.000Z"),
        duracaoMinutos: 90,
        situacao: SituacaoSessao.PLANEJADA,
        metodos: { create: [{ metodo: MetodoEstudo.FEYNMAN }, { metodo: MetodoEstudo.RECUPERACAO_ATIVA }] },
        formatos: { create: [{ formato: FormatoConteudo.TEXTO }, { formato: FormatoConteudo.VIDEO }] },
      },
      include: { metodos: true, formatos: true, materiais: true },
    });
    idsTemporarios.push(planejada.id);

    afirmar(planejada.metodos.length === 2, "A sessão deve aceitar vários métodos sem duplicidade.");
    afirmar(planejada.formatos.length === 2, "A sessão deve aceitar vários formatos sem duplicidade.");
    afirmar(planejada.materiais.length === 0, "O vínculo com materiais deve ser opcional.");
    afirmar(planejada.dificuldadePercebida === null && planejada.compreensaoPercebida === null, "A sessão planejada ainda não deve exigir percepções de conclusão.");

    const cronometro = await prisma.sessaoEstudo.create({
      data: {
        usuarioId: modulo.usuarioId,
        moduloId: modulo.id,
        descricao: "Sessão sintética ativa para validar o cronômetro.",
        modoRegistro: ModoRegistroSessao.CRONOMETRO,
        iniciadaEm: new Date("2030-01-11T12:00:00.000Z"),
        situacao: SituacaoSessao.ATIVA,
        metodos: { create: { metodo: MetodoEstudo.POMODORO } },
        formatos: { create: { formato: FormatoConteudo.EXERCICIO_PRATICO } },
      },
    });
    idsTemporarios.push(cronometro.id);
    afirmar(cronometro.encerradaEm === null && cronometro.duracaoMinutos === null, "O cronômetro ativo ainda não deve possuir encerramento ou duração.");
  } finally {
    if (idsTemporarios.length) await prisma.sessaoEstudo.deleteMany({ where: { id: { in: idsTemporarios } } });
  }

  console.log(`Modelo de sessões validado: ${sessoesMigradas.length} registro(s), múltiplos métodos e formatos, materiais opcionais, planejamento e cronômetro.`);
}

principal().catch((erro) => { console.error(erro); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
