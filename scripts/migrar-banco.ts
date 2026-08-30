import "dotenv/config";
import BancoDados from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco?.startsWith("file:")) throw new Error("DATABASE_URL deve usar o protocolo file: para o SQLite local.");
const caminhoBanco = resolve(process.cwd(), urlBanco.slice("file:".length));
const caminhoMigracao = resolve(process.cwd(), "prisma/migrations/20260830160000_init/migration.sql");
if (!existsSync(caminhoMigracao)) throw new Error(`Migração inicial não encontrada: ${caminhoMigracao}`);

const banco = new BancoDados(caminhoBanco);
banco.pragma("foreign_keys = ON");
const inicializado = banco.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Usuario'").get();
if (inicializado) console.log("Banco SQLite já possui a migração inicial.");
else { banco.exec(readFileSync(caminhoMigracao, "utf8")); console.log("Migração inicial aplicada ao SQLite local."); }
banco.close();
