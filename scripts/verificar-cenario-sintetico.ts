import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { MetodoEstudo, SituacaoSessao } from "../src/gerado/prisma/enums";
import { calcularComparacaoDesafio } from "../src/dominio/analises/comparar-desafio";
import { criarDtoInterpretacaoModulo } from "../src/servidor/ia/interpretacoes";
import { obterPainelConceitosModulo } from "../src/servidor/analises-materiais";
import { obterDashboardObservacionalPessoal } from "../src/servidor/dashboard-observacional";
import { obterMetricasSessoesModuloPessoal } from "../src/servidor/metricas";
import { verificarSenha } from "../src/servidor/senhas";
import { MARCADOR_CENARIO_DIEGO } from "../prisma/cenario-diego";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Cenário sintético inválido: ${mensagem}`); }

async function principal() {
  const [usuarios, modulos, materiais, concluidas, invalidas, desafios, vinculadas, ana, bruno, carla, tabelasRemovidas, salas, membrosSala, vinculosSala, salaSintetica] = await Promise.all([
    prisma.usuario.count(), prisma.moduloAprendizagem.count({ where: { arquivado: false, rascunho: false } }),
    prisma.recursoConteudo.count({ where: { ativo: true } }),
    prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.CONCLUIDA } }), prisma.sessaoEstudo.count({ where: { situacao: SituacaoSessao.INVALIDADA } }),
    prisma.desafioExperimentacao.findMany(), prisma.sessaoEstudo.count({ where: { desafioId: { not: null } } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "carla.rocha" } }),
    prisma.$queryRawUnsafe<Array<{ name: string }>>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('Topico', 'Avaliacao', 'Questao', 'TentativaAvaliacao', 'RespostaQuestao', 'Recomendacao')`),
    prisma.sala.count(), prisma.membroSala.count(), prisma.vinculoModuloSala.count(),
    prisma.sala.findUniqueOrThrow({ where: { identificador: "sala-sintetica-grupo-programacao" }, select: { id: true, proprietarioId: true } }),
  ]);
  afirmar(usuarios === 5, "devem existir cinco contas."); afirmar(modulos === 6, "devem existir seis módulos ativos.");
  afirmar(materiais === 21, "os 21 materiais devem pertencer diretamente aos módulos.");
  afirmar(tabelasRemovidas.length === 0, "tabelas de tópicos, avaliações e recomendações antigas não devem existir.");
  afirmar(concluidas === 39 && invalidas === 1, "devem existir 39 sessões concluídas e uma invalidada.");
  afirmar(desafios.length === 2 && vinculadas === 2, "devem existir dois desafios e duas sessões vinculadas.");
  afirmar(salas === 1 && membrosSala === 1 && vinculosSala === 1, "a sala sintética deve nascer vinculada somente à proprietária.");
  afirmar(salaSintetica.proprietarioId === ana.id, "Ana deve ser a única proprietária da sala sintética.");
  afirmar(await prisma.membroSala.count({ where: { salaId: salaSintetica.id, usuarioId: { in: [bruno.id, carla.id] } } }) === 0, "outras contas não devem receber a sala antes de usar um convite.");
  afirmar(verificarSenha("Laboratorio@2026", ana.senhaHash), "a senha da conta de demonstração deve ser válida.");

  const sessoes = await prisma.sessaoEstudo.findMany({ where: { usuarioId: ana.id }, include: { metodos: true, formatos: true, materiais: true } });
  afirmar(sessoes.every((sessao) => sessao.metodos.length >= 1 && sessao.formatos.length >= 1 && sessao.materiais.length >= 1), "toda sessão deve registrar método, formato e material.");
  const metodos = new Set((await prisma.metodoSessaoEstudo.findMany()).map((item) => item.metodo));
  afirmar([MetodoEstudo.FEYNMAN, MetodoEstudo.RECUPERACAO_ATIVA, MetodoEstudo.REPETICAO_ESPACADA, MetodoEstudo.POMODORO, MetodoEstudo.INTERCALAMENTO, MetodoEstudo.PRATICA_DISTRIBUIDA].every((metodo) => metodos.has(metodo)), "os seis métodos atuais devem estar representados.");

  const diego = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "diego.alves" } });
  const moduloDiego = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: diego.id, identificador: "javascript" } });
  const sessoesDiego = await prisma.sessaoEstudo.findMany({
    where: { usuarioId: diego.id, situacao: SituacaoSessao.CONCLUIDA },
    include: { metodos: true, formatos: true }, orderBy: { iniciadaEm: "asc" },
  });
  const sessoesRicasDiego = sessoesDiego.filter((sessao) => sessao.observacao === MARCADOR_CENARIO_DIEGO);
  const metodosDiego = new Set(sessoesRicasDiego.flatMap((sessao) => sessao.metodos.map((item) => item.metodo)));
  const formatosDiego = new Set(sessoesRicasDiego.flatMap((sessao) => sessao.formatos.map((item) => item.formato)));
  afirmar(sessoesRicasDiego.length === 24 && sessoesDiego.length >= 24, "Diego deve possuir as 24 sessões ricas concluídas.");
  afirmar(metodosDiego.size === 4, "as sessões de Diego devem usar quatro métodos distintos.");
  afirmar(formatosDiego.size === 10 && sessoesRicasDiego.every((sessao) => sessao.formatos.length >= 2), "Diego deve combinar dez formatos, com dois ou mais por sessão.");
  afirmar(sessoesRicasDiego.every((sessao) => sessao.dificuldadePercebida !== null && sessao.compreensaoPercebida !== null), "todas as sessões ricas de Diego devem registrar as duas percepções.");
  afirmar(new Set(sessoesRicasDiego.map((sessao) => sessao.compreensaoPercebida)).size === 5, "a compreensão percebida de Diego deve cobrir a escala de 1 a 5.");

  const [painelConceitos, dashboardDiego, metricasDiego] = await Promise.all([
    obterPainelConceitosModulo(diego.id, moduloDiego.id),
    obterDashboardObservacionalPessoal(diego.id, new Date("2026-09-22T12:00:00.000Z")),
    obterMetricasSessoesModuloPessoal(diego.id, "javascript"),
  ]);
  afirmar(painelConceitos.comparacao.length >= 20 && painelConceitos.comparacao.every((item) => item.quantidadeSessoes >= 2), "o módulo de Diego deve mostrar pelo menos 20 conceitos com menções recorrentes.");
  afirmar(dashboardDiego.periodoRecente.quantidadeSessoes === 24 && dashboardDiego.conceitos.length >= 20, "o Dashboard de Diego deve receber as 24 sessões recentes e o mapa de conceitos preenchido.");
  afirmar(dashboardDiego.pontoAtencao?.moduloId === moduloDiego.id, "o card de maior dificuldade percebida deve possuir amostra para o módulo de Diego.");
  afirmar(metricasDiego, "as métricas do módulo de Diego devem estar disponíveis.");
  const dtoIa = criarDtoInterpretacaoModulo(metricasDiego.metricas, sessoesDiego);
  afirmar(dtoIa.descricoesSessoes.length >= 24 && dtoIa.modulos[0]?.metodos.length >= 4 && dtoIa.modulos[0]?.formatos.length >= 7, "o DTO da IA deve receber descrições, métodos e formatos variados de Diego.");

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
