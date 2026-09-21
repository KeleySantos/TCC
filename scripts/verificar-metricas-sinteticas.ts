import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { MetodoEstudo } from "../src/gerado/prisma/enums";
import { obterMetricasSessoesModuloPessoal, obterMetricasSessoesPessoais } from "../src/servidor/metricas";
import { criarRascunhoModuloPessoal } from "../src/servidor/modulos";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Métricas sintéticas inválidas: ${mensagem}`); }

async function metricas(nomeUsuario: string) {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario } });
  const resultado = await obterMetricasSessoesModuloPessoal(usuario.id, "javascript");
  if (!resultado) throw new Error(`Módulo JavaScript ausente para ${nomeUsuario}.`);
  return { usuario, metricas: resultado.metricas };
}

async function principal() {
  try {
    const [ana, bruno, carla, diego, elisa] = await Promise.all([metricas("ana.souza"), metricas("bruno.lima"), metricas("carla.rocha"), metricas("diego.alves"), metricas("elisa.martins")]);
    const esperados = [[ana, 4, 82], [bruno, 4, 61], [carla, 1, 17], [diego, 3, 52], [elisa, 5, 77]] as const;
    for (const [conta, sessoes, minutos] of esperados) {
      afirmar(conta.metricas.tempoEstudo.quantidadeSessoesValidas === sessoes && conta.metricas.tempoEstudo.minutosTotais === minutos, `esperados ${sessoes} registros e ${minutos} minutos para ${conta.usuario.nomeUsuario}.`);
    }
    afirmar(carla.metricas.percepcoes.nivelAmostra === "INSUFICIENTE" && carla.metricas.percepcoes.mediaCompreensaoPercebida === null, "uma única sessão não deve publicar média de percepção.");
    afirmar(elisa.metricas.percepcoes.nivelAmostra === "RECORRENTE", "cinco sessões devem formar amostra recorrente.");

    const agregadas = await obterMetricasSessoesPessoais(ana.usuario.id);
    afirmar(agregadas.metricasPorModulo.length === 2 && agregadas.consolidado.tempoEstudo.quantidadeSessoesValidas === 5 && agregadas.consolidado.tempoEstudo.minutosTotais === 97, "Ana deve consolidar dois módulos, cinco sessões e 97 minutos.");
    const feynman = agregadas.consolidado.porMetodo.find((item) => item.chave === MetodoEstudo.FEYNMAN);
    afirmar(feynman?.quantidadeSessoes === 5 && feynman.minutosAssociados === 97, "Feynman deve ser descrito em cinco sessões e dois módulos.");

    const rascunho = await criarRascunhoModuloPessoal(ana.usuario.id);
    try {
      const depois = await obterMetricasSessoesPessoais(ana.usuario.id);
      afirmar(depois.metricasPorModulo.length === agregadas.metricasPorModulo.length && depois.consolidado.tempoEstudo.minutosTotais === 97, "rascunhos não podem alterar o painel.");
    } finally { await prisma.moduloAprendizagem.delete({ where: { id: rascunho.id } }); }
    console.log("Métricas de sessões verificadas: duração, frequência, percepções, contextos e consolidação por módulo.");
  } finally { await prisma.$disconnect(); }
}

principal().catch((erro) => { console.error(erro); process.exit(1); });
