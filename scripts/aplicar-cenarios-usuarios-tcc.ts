import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { PapelUsuario } from "../src/gerado/prisma/enums";
import { criarHashSenha } from "../src/servidor/senhas";
import { aplicarCenariosAvaliacaoTcc } from "../prisma/cenarios-avaliacao-tcc";
import { identificadorModuloCenarioTcc, usuariosCenariosTcc } from "../testes/fixtures/cenarios-tcc";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function principal() {
  const senhaHash = criarHashSenha("Laboratorio@2026");
  const usuarios = [];
  for (const atribuicao of usuariosCenariosTcc) {
    usuarios.push(await prisma.usuario.upsert({
      where: { nomeUsuario: atribuicao.nomeUsuario },
      create: { nome: atribuicao.nome, nomeUsuario: atribuicao.nomeUsuario, email: `${atribuicao.nomeUsuario}@exemplo.test`, senhaHash, papel: PapelUsuario.ALUNO },
      update: { nome: atribuicao.nome },
    }));
  }

  await aplicarCenariosAvaliacaoTcc(prisma, usuarios);
  const identificadores = usuariosCenariosTcc.flatMap((atribuicao) => [0, 1, 2].map((numero) => identificadorModuloCenarioTcc(atribuicao.cenario, numero)));
  const modulos = await prisma.moduloAprendizagem.findMany({
    where: { identificador: { in: identificadores } },
    select: { id: true, identificador: true, usuario: { select: { nome: true, nomeUsuario: true } }, _count: { select: { sessoesEstudo: true, evidencias: true } } },
    orderBy: [{ usuario: { nomeUsuario: "asc" } }, { identificador: "asc" }],
  });
  if (modulos.length !== 15 || modulos.some((modulo) => modulo._count.sessoesEstudo !== 10 || modulo._count.evidencias !== 10)) {
    throw new Error("Os cenários vinculados não produziram 15 módulos com dez sessões e dez evidências cada.");
  }
  console.log(JSON.stringify({
    usuarios: usuariosCenariosTcc.map((atribuicao) => ({ nome: atribuicao.nome, nomeUsuario: atribuicao.nomeUsuario, cenario: atribuicao.cenario })),
    modulos: modulos.length,
    sessoes: modulos.reduce((soma, modulo) => soma + modulo._count.sessoesEstudo, 0),
    evidencias: modulos.reduce((soma, modulo) => soma + modulo._count.evidencias, 0),
  }));
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
