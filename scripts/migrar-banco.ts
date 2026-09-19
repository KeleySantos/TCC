import "dotenv/config";
import BancoDados from "better-sqlite3";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco?.startsWith("file:")) throw new Error("DATABASE_URL deve usar o protocolo file: para o SQLite local.");
const caminhoBanco = resolve(process.cwd(), urlBanco.slice("file:".length));
const pastaMigracoes = resolve(process.cwd(), "prisma/migrations");
if (!existsSync(pastaMigracoes)) throw new Error(`Pasta de migrações não encontrada: ${pastaMigracoes}`);

const migracoes = readdirSync(pastaMigracoes, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name)
  .sort()
  .map((nome) => ({ nome, caminho: resolve(pastaMigracoes, nome, "migration.sql") }));

if (!migracoes.length || migracoes.some((migracao) => !existsSync(migracao.caminho))) {
  throw new Error("Cada diretório de prisma/migrations deve conter migration.sql.");
}

const banco = new BancoDados(caminhoBanco);
banco.pragma("foreign_keys = ON");
try {
  banco.exec('CREATE TABLE IF NOT EXISTS "_MigracoesAplicadas" ("nome" TEXT NOT NULL PRIMARY KEY, "aplicadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  const registrar = banco.prepare('INSERT INTO "_MigracoesAplicadas" ("nome") VALUES (?)');
  const jaAplicada = banco.prepare('SELECT 1 FROM "_MigracoesAplicadas" WHERE "nome" = ?');
  const possuiTabelaInicial = banco.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'Usuario'").get();

  for (const migracao of migracoes) {
    if (jaAplicada.get(migracao.nome)) continue;

    if (migracao.nome === "20260830160000_init" && possuiTabelaInicial) {
      registrar.run(migracao.nome);
      console.log(`Migração inicial legada registrada no controle local.`);
      continue;
    }

    banco.exec(readFileSync(migracao.caminho, "utf8"));
    const violacoes = banco.prepare("PRAGMA foreign_key_check").all();
    if (violacoes.length) throw new Error(`A migração ${migracao.nome} criou ${violacoes.length} violação(ões) de chave estrangeira.`);
    registrar.run(migracao.nome);
    console.log(`Migração aplicada: ${migracao.nome}.`);
  }
} finally {
  banco.close();
}
