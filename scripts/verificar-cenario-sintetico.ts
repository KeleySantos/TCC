import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { MetodoEstudo, SituacaoSessao } from "../src/gerado/prisma/enums";
import { calcularComparacaoDesafio } from "../src/dominio/analises/comparar-desafio";
import { verificarSenha } from "../src/servidor/senhas";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Cenário sintético inválido: ${mensagem}`); }

async function principal() {
  const [usuarios, modulos, materiais, concluidas, invalidas, desafios, vinculadas, ana, tabelasRemovidas, salas, membrosSala, vinculosSala] = await Promise.all([
    prisma.usuario.count(), prisma.moduloAprendizagem.count({ where: { arquivado: false, rascunho: false } }),
    prisma.recursoConteudo.count({ where: { ativo: true } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.CONCLUIDA } }), prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.INVALIDADA } }),
    prisma.desafioExperimentacao.findMany(), prisma.sessaoEstudo.count({ where: { desafioId: { not: null } } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.$queryRawUnsafe<Array<{ name: string }>>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('Topico', 'Avaliacao', 'Questao', 'TentativaAvaliacao', 'RespostaQuestao', 'Recomendacao')`),
    prisma.sala.count(), prisma.membroSala.count(), prisma.vinculoModuloSala.count(),
  ]);
  afirmar(usuarios === 5, "devem existir cinco contas."); afirmar(modulos === 6, "devem existir seis módulos ativos.");
  afirmar(materiais === 16, "os 16 materiais devem pertencer diretamente aos módulos.");
  afirmar(tabelasRemovidas.length === 0, "tabelas de tópicos, avaliações e recomendações antigas não devem existir.");
  afirmar(concluidas === 18 && invalidas === 1, "devem existir 18 sessões concluídas e uma invalidada.");
  afirmar(desafios.length === 2 && vinculadas === 2, "devem existir dois desafios e duas sessões vinculadas.");
  afirmar(salas === 1 && membrosSala === 3 && vinculosSala === 3, "a sala sintética deve possuir três membros e três instâncias vinculadas.");
  afirmar(verificarSenha("Laboratorio@2026", ana.senhaHash), "a senha da conta de demonstração deve ser válida.");

  const sessoes = await prisma.sessaoEstudo.findMany({ where: { usuarioId: ana.id }, include: { metodos: true, formatos: true, materiais: true } });
  afirmar(sessoes.every((sessao) => sessao.metodos.length >= 1 && sessao.formatos.length >= 1 && sessao.materiais.length >= 1), "toda sessão deve registrar método, formato e material.");
  const metodos = new Set((await prisma.metodoSessaoEstudo.findMany()).map((item) => item.metodo));
  afirmar([MetodoEstudo.FEYNMAN, MetodoEstudo.RECUPERACAO_ATIVA, MetodoEstudo.REPETICAO_ESPACADA, MetodoEstudo.POMODORO, MetodoEstudo.INTERCALAMENTO, MetodoEstudo.PRATICA_DISTRIBUIDA].every((metodo) => metodos.has(metodo)), "os seis métodos atuais devem estar representados.");

  const desafio = desafios.find((item) => item.usuarioId === ana.id && item.metodo === MetodoEstudo.FEYNMAN);
  afirmar(desafio, "Ana deve possuir o desafio Feynman.");
  const comparacao = calcularComparacaoDesafio(desafio, sessoes.map((sessao) => ({
    id: sessao.id, moduloId: sessao.moduloId, desafioId: sessao.desafioId, encerradaEm: sessao.encerradaEm,
    duracaoMinutos: sessao.duracaoMinutos, situacao: sessao.situacao, dificuldadePercebida: sessao.dificuldadePercebida,
    compreensaoPercebida: sessao.compreensaoPercebida, metodos: sessao.metodos.map((item) => item.metodo),
  })));
  afirmar(comparacao.comparavel && comparacao.desafio.quantidadeSessoes === 2 && comparacao.contextoExterno.quantidadeSessoes === 2, "a comparação deve usar duas sessões em cada grupo.");
  console.log("Cenário sintético verificado: módulos, sessões, desafios e vínculos de sala estão consistentes sem tópicos ou avaliações.");
}

principal().catch((erro) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
