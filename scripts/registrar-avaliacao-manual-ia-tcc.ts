import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calcularAvaliacaoManual, calcularResumoAvaliacaoIaTcc, esquemaAvaliacaoManualIaTcc, esquemaDocumentoAvaliacaoIaTcc } from "../src/dominio/avaliacao-ia-tcc";

function argumento(nome: string) {
  const indice = process.argv.indexOf(nome);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

const [arquivo, cenario, numero, arquivoAvaliacao] = [argumento("--arquivo"), argumento("--cenario"), argumento("--execucao"), argumento("--avaliacao")];
if (!arquivo || !cenario || !numero || !arquivoAvaliacao) {
  throw new Error("Informe --arquivo, --cenario, --execucao e --avaliacao.");
}
const caminho = resolve(arquivo);
let documento = esquemaDocumentoAvaliacaoIaTcc.parse(JSON.parse(readFileSync(caminho, "utf8")));
const indice = documento.execucoes.findIndex((item) => item.cenario === cenario && item.numeroExecucao === Number(numero));
if (indice < 0) throw new Error("Execução não encontrada.");
if (!documento.execucoes[indice].validacaoAutomatica.validaParaExperimento) throw new Error("Uma falha ou contingência não pode receber avaliação qualitativa como resposta real.");

const recebida = esquemaAvaliacaoManualIaTcc.parse(JSON.parse(readFileSync(resolve(arquivoAvaliacao), "utf8")));
const calculada = calcularAvaliacaoManual({ ...recebida, avaliadaEm: recebida.avaliadaEm ?? new Date().toISOString() });
if (calculada.situacao === "PENDENTE") throw new Error("Preencha resultado e justificativa de C1 a C5 antes de registrar a avaliação.");

documento = {
  ...documento,
  experimento: { ...documento.experimento, atualizadoEm: new Date().toISOString() },
  execucoes: documento.execucoes.map((item, posicao) => posicao === indice ? { ...item, avaliacao: calculada } : item),
};
documento.resumo = calcularResumoAvaliacaoIaTcc(documento.execucoes);
const temporario = `${caminho}.temporario`;
writeFileSync(temporario, `${JSON.stringify(documento, null, 2)}\n`);
renameSync(temporario, caminho);

console.log(JSON.stringify({ arquivo: caminho, execucao: `${cenario}-${numero}`, situacao: calculada.situacao, resumo: documento.resumo }));
