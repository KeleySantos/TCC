import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { esquemaDocumentoAvaliacaoIaTcc, gerarCsvAvaliacaoIaTcc, gerarRelatorioMarkdownAvaliacaoIaTcc, normalizarDocumentoAvaliacaoIaTcc } from "../src/dominio/avaliacao-ia-tcc";

function argumento(nome: string) {
  const indice = process.argv.indexOf(nome);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

function gravarAtomicamente(caminho: string, conteudo: string) {
  const temporario = `${caminho}.temporario`;
  writeFileSync(temporario, conteudo);
  renameSync(temporario, caminho);
}

const arquivo = argumento("--arquivo");
if (!arquivo) throw new Error("Informe --arquivo com o JSON do experimento.");
const caminhoJson = resolve(arquivo);
const documento = normalizarDocumentoAvaliacaoIaTcc(esquemaDocumentoAvaliacaoIaTcc.parse(JSON.parse(readFileSync(caminhoJson, "utf8"))));
const base = caminhoJson.slice(0, -extname(caminhoJson).length);
const caminhoMarkdown = resolve(argumento("--saida-md") ?? `${base}.md`);
const caminhoCsv = resolve(argumento("--saida-csv") ?? `${base}.csv`);

if (dirname(caminhoMarkdown) !== dirname(caminhoJson) || dirname(caminhoCsv) !== dirname(caminhoJson)) {
  throw new Error("Por segurança e organização, os relatórios devem ficar na mesma pasta do JSON do experimento.");
}

gravarAtomicamente(caminhoJson, `${JSON.stringify(documento, null, 2)}\n`);
gravarAtomicamente(caminhoMarkdown, gerarRelatorioMarkdownAvaliacaoIaTcc(documento));
gravarAtomicamente(caminhoCsv, gerarCsvAvaliacaoIaTcc(documento));

console.log(JSON.stringify({ arquivo: caminhoJson, markdown: caminhoMarkdown, csv: caminhoCsv, resumo: documento.resumo }));
