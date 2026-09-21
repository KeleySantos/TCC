import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const endereco = process.env.URL_APLICACAO_DEMONSTRACAO ?? "http://localhost:3000";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação da API de sessões falhou: ${mensagem}`);
}

function cabecalhos(usuarioId: string) {
  return { Cookie: `usuario_demonstracao=${usuarioId}`, "Content-Type": "application/json" };
}

function objeto(valor: unknown): Record<string, unknown> {
  afirmar(typeof valor === "object" && valor !== null, "a resposta deve ser um objeto.");
  return valor as Record<string, unknown>;
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: ana.id, arquivado: false, rascunho: false } });
  let sessaoId: string | null = null;
  try {
    const semAutenticacao = await fetch(`${endereco}/api/sessoes?moduloId=${encodeURIComponent(modulo.id)}`);
    afirmar(semAutenticacao.status === 401, "listagem sem sessão deve retornar 401.");

    const outraConta = await fetch(`${endereco}/api/sessoes`, {
      method: "POST", headers: cabecalhos(bruno.id),
      body: JSON.stringify({
        tipo: "MANUAL", moduloId: modulo.id, descricao: "Planejamento indevido.", metodos: ["FEYNMAN"], formatos: ["TEXTO"], materialIds: [],
        iniciadaEm: "2044-03-01T10:00:00.000Z", encerradaEm: "2044-03-01T11:00:00.000Z",
      }),
    });
    afirmar(outraConta.status === 404, "outra conta não deve criar sessão no módulo alheio.");

    const criacao = await fetch(`${endereco}/api/sessoes`, {
      method: "POST", headers: cabecalhos(ana.id),
      body: JSON.stringify({
        tipo: "MANUAL", moduloId: modulo.id, descricao: "Planejamento sintético pela API.", metodos: ["FEYNMAN", "POMODORO"],
        formatos: ["TEXTO", "VIDEO"], materialIds: [], iniciadaEm: "2044-03-01T10:00:00.000Z", encerradaEm: "2044-03-01T11:00:00.000Z",
      }),
    });
    afirmar(criacao.status === 201, "criação planejada deve retornar 201.");
    const corpoCriacao = objeto(await criacao.json());
    const sessaoCriada = objeto(corpoCriacao.sessao);
    afirmar(typeof sessaoCriada.id === "string" && sessaoCriada.situacao === "PLANEJADA", "criação deve devolver a sessão planejada.");
    sessaoId = sessaoCriada.id;

    const detalheAlheio = await fetch(`${endereco}/api/sessoes/${encodeURIComponent(sessaoId)}`, { headers: cabecalhos(bruno.id) });
    afirmar(detalheAlheio.status === 404, "outra conta não deve obter detalhes.");

    const edicao = await fetch(`${endereco}/api/sessoes/${encodeURIComponent(sessaoId)}`, {
      method: "PATCH", headers: cabecalhos(ana.id),
      body: JSON.stringify({
        descricao: "Planejamento sintético corrigido pela API.", metodos: ["INTERCALAMENTO"], formatos: ["PDF"], materialIds: [],
        iniciadaEm: "2044-03-01T12:00:00.000Z", encerradaEm: "2044-03-01T13:30:00.000Z",
      }),
    });
    afirmar(edicao.status === 200, "edição própria deve retornar 200.");
    const sessaoEditada = objeto(objeto(await edicao.json()).sessao);
    afirmar(sessaoEditada.duracaoMinutos === 90, "edição deve devolver duração recalculada.");

    const arquivamento = await fetch(`${endereco}/api/sessoes/${encodeURIComponent(sessaoId)}/arquivar`, { method: "POST", headers: cabecalhos(ana.id) });
    afirmar(arquivamento.status === 200 && objeto(objeto(await arquivamento.json()).sessao).arquivada === true, "arquivamento próprio deve ser lógico.");
    const listaPadrao = objeto(await (await fetch(`${endereco}/api/sessoes?moduloId=${encodeURIComponent(modulo.id)}`, { headers: cabecalhos(ana.id) })).json()).sessoes;
    afirmar(Array.isArray(listaPadrao) && !listaPadrao.some((item) => objeto(item).id === sessaoId), "listagem padrão deve ocultar a arquivada.");
    const listaCompleta = objeto(await (await fetch(`${endereco}/api/sessoes?moduloId=${encodeURIComponent(modulo.id)}&incluirArquivadas=true`, { headers: cabecalhos(ana.id) })).json()).sessoes;
    afirmar(Array.isArray(listaCompleta) && listaCompleta.some((item) => objeto(item).id === sessaoId), "listagem completa deve incluir a arquivada.");

    const restauracao = await fetch(`${endereco}/api/sessoes/${encodeURIComponent(sessaoId)}/desarquivar`, { method: "POST", headers: cabecalhos(ana.id) });
    afirmar(restauracao.status === 200 && objeto(objeto(await restauracao.json()).sessao).arquivada === false, "restauração deve devolver a sessão visível.");
    console.log("API de sessões verificada: autenticação, propriedade, criação, edição, listagem e arquivamento.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.deleteMany({ where: { id: sessaoId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
