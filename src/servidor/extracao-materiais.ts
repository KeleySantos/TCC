import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import readXlsxFile from "read-excel-file/node";
import { createWorker } from "tesseract.js";
import dadosPortugues from "@tesseract.js-data/por";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

export const LIMITE_CARACTERES_ANALISE_MATERIAL = 60_000;
export const EXTENSOES_ANALISAVEIS = new Set(["pdf", "txt", "docx", "csv", "xlsx", "png", "jpg", "jpeg", "webp", "gif"]);

function limitar(texto: string) {
  const normalizado = texto.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return {
    texto: normalizado.slice(0, LIMITE_CARACTERES_ANALISE_MATERIAL),
    caracteresExtraidos: normalizado.length,
    conteudoTruncado: normalizado.length > LIMITE_CARACTERES_ANALISE_MATERIAL,
  };
}

async function extrairPdf(bytes: Uint8Array) {
  const analisador = new PDFParse({ data: bytes });
  try {
    return (await analisador.getText()).text;
  } finally {
    await analisador.destroy();
  }
}

async function extrairImagem(bytes: Uint8Array) {
  const cachePath = join(process.cwd(), ".dados", "tesseract");
  await mkdir(cachePath, { recursive: true });
  const trabalhador = await createWorker("por", 1, { langPath: dadosPortugues.langPath, gzip: dadosPortugues.gzip, cachePath });
  try {
    return (await trabalhador.recognize(Buffer.from(bytes))).data.text;
  } finally {
    await trabalhador.terminate();
  }
}

export async function extrairTextoMaterial(extensao: string, bytes: Uint8Array) {
  const tipo = extensao.toLowerCase();
  if (!EXTENSOES_ANALISAVEIS.has(tipo)) return null;
  let texto = "";
  if (tipo === "txt" || tipo === "csv") texto = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  else if (tipo === "pdf") texto = await extrairPdf(bytes);
  else if (tipo === "docx") texto = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
  else if (tipo === "xlsx") {
    const linhas = await readXlsxFile(Buffer.from(bytes));
    texto = linhas.map((linha) => linha.map((celula) => celula instanceof Date ? celula.toISOString() : String(celula ?? "")).join("\t")).join("\n");
  } else texto = await extrairImagem(bytes);
  const resultado = limitar(texto);
  if (resultado.texto.length < 10) throw new Error("CONTEUDO_INSUFICIENTE");
  return resultado;
}
