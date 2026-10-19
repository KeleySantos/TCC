import BancoDados from "better-sqlite3";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "../../src/gerado/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const diretorio = mkdtempSync(join(tmpdir(), "tcc-compartilhamento-"));
const caminho = join(diretorio, "teste.db");
const sqlite = new BancoDados(caminho);
for (const nome of readdirSync(resolve("prisma/migrations")).sort()) {
  sqlite.exec(readFileSync(resolve("prisma/migrations", nome, "migration.sql"), "utf8"));
}
sqlite.pragma("foreign_keys = ON");
sqlite.close();
export const bancoTeste = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${caminho}` }) });
export async function fecharBancoTeste() {
  await bancoTeste.$disconnect();
  // Caminho absoluto criado exclusivamente por mkdtemp; nunca remover o banco do projeto.
  rmSync(diretorio, { recursive: true, force: true });
}
