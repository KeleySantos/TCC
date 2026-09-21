import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const NOME_VARIAVEL_MESTRA = "CHAVE_MESTRA_CREDENCIAIS_IA";
const CAMINHO_CHAVE_LOCAL = path.join(process.cwd(), ".dados", "segredos", "chave-mestra-ia");

export type SegredoCifrado = {
  chaveCifrada: string;
  vetorInicializacao: string;
  etiquetaAutenticacao: string;
};

function decodificarChave(valor: string) {
  const chave = Buffer.from(valor.trim(), "base64");
  if (chave.length !== 32) throw new Error("CHAVE_MESTRA_INVALIDA");
  return chave;
}

async function obterChaveLocal() {
  try {
    await access(CAMINHO_CHAVE_LOCAL, constants.R_OK);
    return decodificarChave(await readFile(CAMINHO_CHAVE_LOCAL, "utf8"));
  } catch (erro) {
    if (erro instanceof Error && erro.message === "CHAVE_MESTRA_INVALIDA") throw erro;
  }

  await mkdir(path.dirname(CAMINHO_CHAVE_LOCAL), { recursive: true, mode: 0o700 });
  const chave = randomBytes(32).toString("base64");
  try {
    await writeFile(CAMINHO_CHAVE_LOCAL, chave, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return decodificarChave(chave);
  } catch (erro) {
    if (!(erro instanceof Error) || !("code" in erro) || erro.code !== "EEXIST") throw erro;
    return decodificarChave(await readFile(CAMINHO_CHAVE_LOCAL, "utf8"));
  }
}

export async function obterChaveMestraCredenciais() {
  const configurada = process.env[NOME_VARIAVEL_MESTRA];
  if (configurada) return decodificarChave(configurada);
  if (process.env.NODE_ENV === "production") throw new Error("CHAVE_MESTRA_AUSENTE");
  return obterChaveLocal();
}

export function cifrarCredencial(segredo: string, contexto: string, chaveMestra: Buffer): SegredoCifrado {
  const vetor = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", chaveMestra, vetor);
  cifrador.setAAD(Buffer.from(contexto, "utf8"));
  const cifrado = Buffer.concat([cifrador.update(segredo, "utf8"), cifrador.final()]);
  return {
    chaveCifrada: cifrado.toString("base64"),
    vetorInicializacao: vetor.toString("base64"),
    etiquetaAutenticacao: cifrador.getAuthTag().toString("base64"),
  };
}

export function decifrarCredencial(segredo: SegredoCifrado, contexto: string, chaveMestra: Buffer) {
  const decifrador = createDecipheriv("aes-256-gcm", chaveMestra, Buffer.from(segredo.vetorInicializacao, "base64"));
  decifrador.setAAD(Buffer.from(contexto, "utf8"));
  decifrador.setAuthTag(Buffer.from(segredo.etiquetaAutenticacao, "base64"));
  return Buffer.concat([decifrador.update(Buffer.from(segredo.chaveCifrada, "base64")), decifrador.final()]).toString("utf8");
}
