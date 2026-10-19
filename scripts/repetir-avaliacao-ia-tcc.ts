import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calcularResumoAvaliacaoIaTcc, criarAvaliacaoManualPendente, esquemaDocumentoAvaliacaoIaTcc, type ExecucaoAvaliacaoIaTcc } from "../src/dominio/avaliacao-ia-tcc";
import type { DtoInterpretacao } from "../src/dominio/interpretacoes/esquema";
import { validarConteudoInterpretacao } from "../src/dominio/interpretacoes/esquema";
import { criarInstrucaoInterpretacao } from "../src/servidor/ia/contrato-provedores";
import { interpretarComFila } from "../src/servidor/ia/interpretacoes";

function argumento(nome: string) {
  const indice = process.argv.indexOf(nome);
  return indice >= 0 ? process.argv[indice + 1] : undefined;
}

if (!process.argv.includes("--autorizar-consumo")) throw new Error("A repetição real exige --autorizar-consumo.");
const arquivo = argumento("--arquivo");
if (!arquivo) throw new Error("Informe --arquivo com o JSON do experimento real.");
if (!process.env.TCC_IA_CHAVE || !process.env.TCC_IA_MODELO || process.env.TCC_IA_PROVEDOR !== "GROQ") {
  throw new Error("Defina TCC_IA_CHAVE, TCC_IA_MODELO e TCC_IA_PROVEDOR.");
}

const caminho = resolve(arquivo);
let documento = esquemaDocumentoAvaliacaoIaTcc.parse(JSON.parse(readFileSync(caminho, "utf8")));
if (documento.experimento.modo !== "REAL") throw new Error("Somente experimentos reais podem ser repetidos.");
if (documento.experimento.provedorPlanejado !== process.env.TCC_IA_PROVEDOR || documento.experimento.modeloPlanejado !== process.env.TCC_IA_MODELO) {
  throw new Error("O provedor e o modelo configurados devem ser exatamente os mesmos do experimento original.");
}

const cenario = argumento("--cenario");
const numeroExecucao = argumento("--execucao");
const selecionadas = documento.execucoes.filter((item) => !item.validacaoAutomatica.validaParaExperimento && (!cenario || item.cenario === cenario) && (!numeroExecucao || item.numeroExecucao === Number(numeroExecucao)));
if (!selecionadas.length) throw new Error("Nenhuma execução inválida corresponde aos filtros informados.");

for (const anterior of selecionadas) {
  const entrada = anterior.entrada as DtoInterpretacao;
  const prompt = criarInstrucaoInterpretacao(entrada);
  if (createHash("sha256").update(prompt).digest("hex") !== anterior.hashPrompt) throw new Error(`A entrada de ${anterior.id} não reproduz o prompt original.`);
  const resposta = await interpretarComFila(entrada, [{ provedor: documento.experimento.provedorPlanejado, modelo: documento.experimento.modeloPlanejado, chave: process.env.TCC_IA_CHAVE }]);
  const estruturaValida = validarConteudoInterpretacao(resposta) !== null;
  const respostaExterna = resposta.origem !== "LOCAL";
  const provedorEsperado = resposta.origem === documento.experimento.provedorPlanejado;
  const modeloEsperado = resposta.modelo === documento.experimento.modeloPlanejado;
  const motivos = [
    ...(!estruturaValida ? ["RESPOSTA_REJEITADA_PELA_VALIDACAO_AUTOMATICA"] : []),
    ...(!respostaExterna ? [`CONTINGENCIA_${resposta.motivoContingencia ?? "LOCAL"}`] : []),
    ...(respostaExterna && !provedorEsperado ? ["PROVEDOR_DIFERENTE_DO_PLANEJADO"] : []),
    ...(respostaExterna && !modeloEsperado ? ["MODELO_DIFERENTE_DO_PLANEJADO"] : []),
  ];
  const atualizada: ExecucaoAvaliacaoIaTcc = {
    ...anterior,
    geradaEm: new Date().toISOString(),
    resposta,
    origemResposta: resposta.origem,
    modeloEfetivo: resposta.modelo,
    tentativasProvedores: resposta.tentativas,
    validacaoAutomatica: { estruturaValida, respostaExterna, provedorEsperado, modeloEsperado, validaParaExperimento: estruturaValida && respostaExterna && provedorEsperado && modeloEsperado, motivos },
    erroOuContingencia: resposta.motivoContingencia,
    historicoGeracoes: [...anterior.historicoGeracoes, { geradaEm: anterior.geradaEm, resposta: anterior.resposta, validacaoAutomatica: anterior.validacaoAutomatica, erroOuContingencia: anterior.erroOuContingencia }],
    avaliacao: criarAvaliacaoManualPendente(),
  };
  documento = {
    ...documento,
    experimento: { ...documento.experimento, atualizadoEm: new Date().toISOString() },
    execucoes: documento.execucoes.map((item) => item.id === atualizada.id ? atualizada : item),
  };
  documento.resumo = calcularResumoAvaliacaoIaTcc(documento.execucoes);
  const temporario = `${caminho}.temporario`;
  writeFileSync(temporario, `${JSON.stringify(documento, null, 2)}\n`);
  renameSync(temporario, caminho);
}

console.log(JSON.stringify({ arquivo: caminho, repetidas: selecionadas.map((item) => item.id), resumo: documento.resumo }));
