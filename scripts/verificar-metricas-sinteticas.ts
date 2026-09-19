import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo } from "../src/gerado/prisma/enums";
import { obterMetricasModuloPessoal, obterMetricasPessoais } from "../src/servidor/metricas";
import { criarRascunhoModuloPessoal } from "../src/servidor/modulos";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de métricas sintéticas falhou: ${mensagem}`);
}

async function metricasDaConta(nomeUsuario: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario } });
  const metricas = await obterMetricasModuloPessoal(usuario.id, "javascript");
  if (!metricas) throw new Error(`Módulo JavaScript não encontrado para ${nomeUsuario}.`);
  return { usuario, metricas };
}

async function principal() {
  try {
    const [ana, bruno, carla, diego, elisa] = await Promise.all([
      metricasDaConta("ana.souza"),
      metricasDaConta("bruno.lima"),
      metricasDaConta("carla.rocha"),
      metricasDaConta("diego.alves"),
      metricasDaConta("elisa.martins"),
    ]);
    afirmar(ana.metricas.quantidadeTentativas === 4 && ana.metricas.tempoEstudo.minutosTotais === 82, "a conta A deve manter quatro tentativas e 82 minutos válidos.");
    afirmar(Math.abs((ana.metricas.desempenhoPorFormato.find((item) => item.chave === FormatoConteudo.EXERCICIO_PRATICO)?.mediaNotas ?? 0) - 78.66666666666667) < 0.01, "a conta A deve manter média observada de aproximadamente 78,7% em exercício prático.");
    afirmar(bruno.metricas.quantidadeTentativas === 4 && bruno.metricas.desempenhoPorFormato.find((item) => item.chave === FormatoConteudo.VIDEO)?.quantidadeEvidencias === 3, "a conta B deve ter três evidências de vídeo.");
    afirmar(carla.metricas.quantidadeTentativas === 1 && carla.metricas.evolucao.variacao === null && carla.metricas.tempoEstudo.minutosTotais === 17, "a conta C deve manter uma observação, sem tendência, e excluir a sessão inválida do tempo.");
    afirmar(diego.metricas.quantidadeTentativas === 3 && diego.metricas.mediaNotas !== null && diego.metricas.mediaNotas < 55, "a conta D deve manter seu padrão de notas baixas sem receber rótulo fixo.");
    afirmar(elisa.metricas.quantidadeTentativas === 5 && elisa.metricas.tempoEstudo.minutosTotais === 77, "a conta E deve manter cinco tentativas e 77 minutos válidos.");
    const [agregadasAna, agregadasBruno] = await Promise.all([obterMetricasPessoais(ana.usuario.id), obterMetricasPessoais(bruno.usuario.id)]);
    afirmar(agregadasAna.metricasPorModulo.length >= 2 && agregadasAna.recorrencias.some((item) => item.tipo === "FORMATO" && item.chave === FormatoConteudo.EXERCICIO_PRATICO && item.quantidadeModulos === 2), "a conta A deve demonstrar recorrência contextual apenas após dois módulos com evidência.");
    afirmar(agregadasAna.taxaAcertoGeral.totalQuestoes > 0 && agregadasAna.taxaAcertoGeral.taxaAcerto !== null && agregadasAna.taxaAcertoGeral.quantidadeModulosComEvidencia === 2, "a conta A deve expor taxa geral ponderada pelos dois módulos com questões.");
    afirmar(agregadasAna.metodoComMaiorMediaObservada?.chave === "FEYNMAN" && agregadasAna.metodoComMaiorMediaObservada.quantidadeModulos === 2, "a conta A deve expor o método recorrente com maior média observada.");
    const rascunho = await criarRascunhoModuloPessoal(ana.usuario.id);
    try {
      const agregadasComRascunho = await obterMetricasPessoais(ana.usuario.id);
      afirmar(agregadasComRascunho.metricasPorModulo.length === agregadasAna.metricasPorModulo.length && agregadasComRascunho.taxaAcertoGeral.taxaAcerto === agregadasAna.taxaAcertoGeral.taxaAcerto && agregadasComRascunho.metodoComMaiorMediaObservada?.chave === agregadasAna.metodoComMaiorMediaObservada?.chave, "rascunho não pode alterar métricas gerais, recorrências ou método observado.");
    } finally {
      await prisma.moduloAprendizagem.deleteMany({ where: { id: rascunho.id } });
    }
    afirmar(agregadasBruno.metricasPorModulo.length === 1 && agregadasBruno.recorrencias.length === 0, "uma conta com um único módulo não pode gerar recorrência geral.");
    afirmar(agregadasBruno.metodoComMaiorMediaObservada === null, "uma conta com um único módulo não pode receber método recorrente geral.");
    console.log("Métricas sintéticas verificadas: perfis A–E, amostra única, exposição contextual, taxa ponderada, recorrência em dois módulos e ausência de generalização indevida.");
  } finally {
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
