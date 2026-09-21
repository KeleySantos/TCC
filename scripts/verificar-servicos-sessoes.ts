import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { ErroSessao, concluirSessaoPessoal, iniciarSessaoPessoal, listarHistoricoPessoal } from "../src/servidor/sessoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de serviços de sessões falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const recursoAna = await prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, modulo: { usuarioId: ana.id } } });
  const inicio = new Date("2026-09-02T12:00:00.000Z");
  const ids: string[] = [];
  try {
    const sessaoValida = await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "FEYNMAN" }, inicio);
    ids.push(sessaoValida.id);
    const concluida = await concluirSessaoPessoal(ana.id, sessaoValida.id, { dificuldadePercebida: 2, compreensaoPercebida: 4, observacao: "Registro temporário para teste de serviço." }, new Date(inicio.getTime() + 6 * 60_000));
    afirmar(concluida.situacao === "CONCLUIDA" && concluida.duracaoMinutos === 6, "sessão com seis minutos deve ser concluída com duração do servidor.");
    afirmar(concluida.metodos.some((item) => item.metodo === "FEYNMAN") && concluida.dificuldadePercebida === 2 && concluida.compreensaoPercebida === 4, "método e escalas devem ser persistidos.");
    const contextoMultiplo = await prisma.sessaoEstudo.findUniqueOrThrow({ where: { id: concluida.id }, include: { metodos: true, formatos: true, materiais: true } });
    afirmar(contextoMultiplo.metodos.some((item) => item.metodo === "FEYNMAN") && contextoMultiplo.formatos.length === 1 && contextoMultiplo.materiais.some((item) => item.recursoId === recursoAna.id), "o fluxo de compatibilidade deve preencher método, formato e material nas relações novas.");

    const sessaoCurta = await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "POMODORO" }, new Date(inicio.getTime() + 10 * 60_000));
    ids.push(sessaoCurta.id);
    const invalidada = await concluirSessaoPessoal(ana.id, sessaoCurta.id, { dificuldadePercebida: 3, compreensaoPercebida: 3, observacao: "" }, new Date(inicio.getTime() + 11 * 60_000));
    afirmar(invalidada.situacao === "INVALIDADA" && invalidada.duracaoMinutos === 1, "sessão curta deve ser invalidada pelo relógio do servidor.");

    let bloqueouOutraConta = false;
    try {
      await concluirSessaoPessoal(bruno.id, sessaoValida.id, { dificuldadePercebida: 3, compreensaoPercebida: 3, observacao: "Tentativa indevida." });
    } catch (erro) {
      bloqueouOutraConta = erro instanceof ErroSessao && erro.codigo === "NAO_ENCONTRADA";
    }
    afirmar(bloqueouOutraConta, "outra conta não pode concluir sessão alheia.");

    let bloqueouEscalaInvalida = false;
    const sessaoEscala = await iniciarSessaoPessoal(ana.id, { recursoId: recursoAna.id, metodo: "RECUPERACAO_ATIVA" }, new Date(inicio.getTime() + 20 * 60_000));
    ids.push(sessaoEscala.id);
    try {
      await concluirSessaoPessoal(ana.id, sessaoEscala.id, { dificuldadePercebida: 6, compreensaoPercebida: 1, observacao: "Escala inválida." });
    } catch (erro) {
      bloqueouEscalaInvalida = erro instanceof ErroSessao && erro.codigo === "DADOS_INVALIDOS";
    }
    afirmar(bloqueouEscalaInvalida, "escala fora de 1 a 5 deve ser rejeitada.");
    const historico = await listarHistoricoPessoal(ana.id);
    afirmar(historico.some((sessao) => sessao.id === sessaoValida.id) && historico.some((sessao) => sessao.id === sessaoCurta.id), "histórico deve conter sessões válidas e inválidas da própria conta.");
    console.log("Serviços de sessão verificados: duração oficial, contexto, escalas, histórico e isolamento.");
  } finally {
    if (ids.length) await prisma.sessaoEstudo.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
