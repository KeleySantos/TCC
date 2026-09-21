import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { ErroDesafio, cancelarDesafioPessoal, criarDesafioPessoal } from "../src/servidor/desafios";
import { ErroSessao, iniciarSessaoPessoal } from "../src/servidor/sessoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de desafios falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const [recursoAna, recursoBruno] = await Promise.all([
    prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, modulo: { usuarioId: ana.id, arquivado: false, rascunho: false } }, select: { id: true, moduloId: true } }),
    prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, modulo: { usuarioId: bruno.id, arquivado: false, rascunho: false } }, select: { id: true, moduloId: true } }),
  ]);
  let desafioId: string | null = null;
  let sessaoId: string | null = null;
  try {
    let bloqueouMetaInvalida = false;
    try {
      await criarDesafioPessoal(ana.id, { moduloId: recursoAna.moduloId, metodo: "FEYNMAN", meta: "x" });
    } catch (erro) {
      bloqueouMetaInvalida = erro instanceof ErroDesafio && erro.codigo === "DADOS_INVALIDOS";
    }
    afirmar(bloqueouMetaInvalida, "meta com menos de três caracteres deve ser rejeitada.");

    let bloqueouMetodoHistorico = false;
    try {
      await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "LEITURA_ATIVA" });
    } catch (erro) {
      bloqueouMetodoHistorico = erro instanceof ErroSessao && erro.codigo === "DADOS_INVALIDOS";
    }
    afirmar(bloqueouMetodoHistorico, "novos registros não podem usar método histórico fora do catálogo controlado.");

    const desafio = await criarDesafioPessoal(ana.id, { moduloId: recursoAna.moduloId, metodo: "FEYNMAN", meta: "Explicar o conceito com minhas próprias palavras ao final da sessão." });
    desafioId = desafio.id;
    afirmar(desafio.situacao === "ATIVO" && desafio.metodo === "FEYNMAN", "desafio próprio deve iniciar ativo com método controlado.");

    const sessao = await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "FEYNMAN", desafioId }, new Date("2026-09-15T12:00:00.000Z"));
    sessaoId = sessao.id;
    afirmar(sessao.desafioId === desafioId, "sessão deve preservar o vínculo explícito com o desafio.");

    let bloqueouMetodoDivergente = false;
    try {
      await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "POMODORO", desafioId });
    } catch (erro) {
      bloqueouMetodoDivergente = erro instanceof ErroSessao && erro.codigo === "DADOS_INVALIDOS";
    }
    afirmar(bloqueouMetodoDivergente, "sessão não pode vincular desafio com método diferente.");

    let bloqueouOutraConta = false;
    try {
      await iniciarSessaoPessoal(bruno.id, { recursoId: recursoBruno.id, metodo: "FEYNMAN", desafioId });
    } catch (erro) {
      bloqueouOutraConta = erro instanceof ErroSessao && erro.codigo === "NAO_ENCONTRADA";
    }
    afirmar(bloqueouOutraConta, "uma conta não pode vincular desafio de outra conta.");

    const cancelado = await cancelarDesafioPessoal(ana.id, desafioId, new Date("2026-09-15T13:00:00.000Z"));
    afirmar(cancelado.situacao === "CANCELADO" && cancelado.canceladoEm !== null, "cancelamento deve registrar estado e data.");
    const sessaoAposCancelamento = await prisma.sessaoEstudo.findUniqueOrThrow({ where: { id: sessaoId } });
    afirmar(sessaoAposCancelamento.desafioId === desafioId, "cancelamento deve preservar o vínculo da sessão anterior.");

    let bloqueouDesafioCancelado = false;
    try {
      await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "FEYNMAN", desafioId });
    } catch (erro) {
      bloqueouDesafioCancelado = erro instanceof ErroSessao && erro.codigo === "NAO_ENCONTRADA";
    }
    afirmar(bloqueouDesafioCancelado, "desafio cancelado não pode receber nova sessão.");
    console.log("Desafios verificados: validação, vínculo explícito, propriedade e cancelamento sem perda de histórico.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.delete({ where: { id: sessaoId } });
    if (desafioId) await prisma.desafioExperimentacao.delete({ where: { id: desafioId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
