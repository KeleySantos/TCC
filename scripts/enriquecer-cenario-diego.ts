import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { aplicarCenarioSinteticoDiego } from "../prisma/cenario-diego";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

async function principal() {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "diego.alves" }, select: { id: true } });
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({
    where: { usuarioId: usuario.id, identificador: "javascript", arquivado: false, rascunho: false },
    select: { id: true },
  });
  const resultado = await aplicarCenarioSinteticoDiego(prisma, { usuario, modulo }, new Date("2026-09-01T12:00:00.000Z"));
  console.log(`Cenário de Diego atualizado: ${resultado.quantidadeSessoes} sessões, ${resultado.quantidadeMateriais} arquivos e ${resultado.quantidadeEvidencias} evidências.`);
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
