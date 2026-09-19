import "dotenv/config";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco?.startsWith("file:")) throw new Error("DATABASE_URL deve usar o protocolo file: para o SQLite local.");
const caminhoBanco = resolve(process.cwd(), urlBanco.slice("file:".length));
const diretorioArquivosSinteticos = resolve(process.cwd(), ".dados", "arquivos-materiais");
if (existsSync(caminhoBanco)) rmSync(caminhoBanco);
if (existsSync(diretorioArquivosSinteticos)) rmSync(diretorioArquivosSinteticos, { recursive: true, force: true });
execFileSync(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/migrar-banco.ts"], { stdio: "inherit" });
execFileSync(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], { stdio: "inherit" });
