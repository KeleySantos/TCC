import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { ErroModulo, arquivarModuloPessoal, atualizarModuloPessoal, criarMaterialPessoal, criarRascunhoModuloPessoal, obterModuloPessoal } from "../src/servidor/modulos";
import { obterMetricasSessoesPessoais } from "../src/servidor/metricas";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Verificação de módulos falhou: ${mensagem}`); }

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  let moduloId: string | null = null;
  try {
    const antes = await obterMetricasSessoesPessoais(ana.id);
    const rascunho = await criarRascunhoModuloPessoal(ana.id);
    moduloId = rascunho.id;
    const durante = await obterMetricasSessoesPessoais(ana.id);
    afirmar(durante.metricasPorModulo.length === antes.metricasPorModulo.length, "rascunho não pode entrar nas métricas.");

    let bloqueouOutraConta = false;
    try { await atualizarModuloPessoal(bruno.id, rascunho.id, { titulo: "Tentativa indevida", descricao: "Outra conta não pode editar este módulo." }); }
    catch (erro) { bloqueouOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO"; }
    afirmar(bloqueouOutraConta, "outra conta não pode editar módulo alheio.");

    const modulo = await atualizarModuloPessoal(ana.id, rascunho.id, { titulo: `Módulo temporário ${Date.now()}`, descricao: "Módulo direto para validar propriedade e materiais." });
    const material = await criarMaterialPessoal(ana.id, { moduloId: modulo.id, titulo: "Material direto", descricao: "Material pertencente diretamente ao módulo.", formato: "TEXTO", minutosEstimados: 10, conteudoTexto: "Conteúdo sintético.", url: "" });
    const leitura = await obterModuloPessoal(ana.id, modulo.identificador);
    afirmar(leitura?.materiais.some((item) => item.id === material.id), "material deve aparecer diretamente no módulo.");
    afirmar(await obterModuloPessoal(bruno.id, modulo.identificador) === null, "outra conta não pode ler módulo alheio.");
    await arquivarModuloPessoal(ana.id, { id: modulo.id });
    afirmar(await obterModuloPessoal(ana.id, modulo.identificador) === null, "módulo arquivado não deve permanecer disponível.");
    console.log("Serviços de módulos verificados: rascunho, propriedade, material direto e arquivamento sem tópicos.");
  } finally {
    if (moduloId) await prisma.moduloAprendizagem.deleteMany({ where: { id: moduloId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro) => { console.error(erro); process.exit(1); });
