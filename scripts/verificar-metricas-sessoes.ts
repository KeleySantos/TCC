import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { arquivarSessaoPessoal, registrarSessaoManualPessoal } from "../src/servidor/sessoes";
import { obterMetricasSessoesModuloPessoal, obterMetricasSessoesPessoais } from "../src/servidor/metricas";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação das métricas por sessões falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const javascript = await obterMetricasSessoesModuloPessoal(ana.id, "javascript");
  afirmar(javascript?.metricas.versaoAlgoritmo === "metricas-sessoes-v1", "o módulo deve usar o algoritmo oficial versionado.");
  afirmar(javascript.metricas.tempoEstudo.quantidadeSessoesValidas === 4 && javascript.metricas.tempoEstudo.minutosTotais === 82, "JavaScript da conta A deve consolidar quatro sessões e 82 minutos.");
  afirmar(javascript.metricas.porMetodo.find((item) => item.chave === "FEYNMAN")?.quantidadeSessoes === 4, "métodos devem ser agregados diretamente das sessões.");
  afirmar(javascript.metricas.porFormato.find((item) => item.chave === "EXERCICIO_PRATICO")?.quantidadeSessoes === 3, "formatos devem ser agregados diretamente das sessões.");
  afirmar(javascript.metricas.evolucaoSemanal.pontos.length === 4, "a evolução deve registrar as quatro semanas com estudo.");
  afirmar(javascript.metricas.percepcoes.amostra === 4 && javascript.metricas.percepcoes.mediaDificuldadePercebida !== null, "percepções devem usar amostra explícita suficiente.");

  const logicaAntes = await obterMetricasSessoesModuloPessoal(ana.id, "logica");
  afirmar(logicaAntes?.metricas.tempoEstudo.quantidadeSessoesValidas === 1 && logicaAntes.metricas.tempoEstudo.minutosTotais === 15, "planejadas e invalidadas adicionais não podem alterar as métricas de Lógica.");
  afirmar(await obterMetricasSessoesModuloPessoal(bruno.id, "logica") === null, "outra conta não pode consultar métricas do módulo alheio.");

  const gerais = await obterMetricasSessoesPessoais(ana.id);
  afirmar(gerais.metricasPorModulo.length === 2 && gerais.consolidado.tempoEstudo.quantidadeSessoesValidas === 5 && gerais.consolidado.tempoEstudo.minutosTotais === 97, "consolidação deve somar somente sessões válidas dos módulos ativos.");

  let sessaoId: string | null = null;
  try {
    const sessao = await registrarSessaoManualPessoal(ana.id, {
      moduloId: logicaAntes.modulo.id,
      descricao: "Sessão temporária para validar métricas oficiais.",
      metodos: ["POMODORO", "RECUPERACAO_ATIVA"],
      formatos: ["AUDIO", "TEXTO"],
      materialIds: [],
      iniciadaEm: "1998-01-10T10:00:00.000Z",
      encerradaEm: "1998-01-10T10:30:00.000Z",
      dificuldadePercebida: 3,
      compreensaoPercebida: 4,
    });
    sessaoId = sessao.id;
    await arquivarSessaoPessoal(ana.id, sessao.id);
    const logicaDepois = await obterMetricasSessoesModuloPessoal(ana.id, "logica");
    afirmar(logicaDepois?.metricas.tempoEstudo.quantidadeSessoesValidas === 2 && logicaDepois.metricas.tempoEstudo.minutosTotais === 45, "sessão concluída deve contar mesmo arquivada.");
    afirmar(logicaDepois.metricas.porMetodo.some((item) => item.chave === "POMODORO") && logicaDepois.metricas.porFormato.some((item) => item.chave === "AUDIO"), "contextos múltiplos devem aparecer sem material vinculado.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.deleteMany({ where: { id: sessaoId } });
    await prisma.$disconnect();
  }

  console.log("Métricas por sessões verificadas: tempo, frequência, evolução, métodos, formatos, percepções, arquivamento, estados e propriedade.");
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
