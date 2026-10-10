import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { CENARIO_SINTETICO_DIEGO } from "../src/dominio/cenarios/cenario-sintetico-diego";
import { obterPainelConceitosModulo } from "../src/servidor/analises-materiais";
import { obterDashboardObservacionalPessoal } from "../src/servidor/dashboard-observacional";
import { criarDtoInterpretacaoModulo } from "../src/servidor/ia/interpretacoes";
import { obterMetricasSessoesModuloPessoal } from "../src/servidor/metricas";
import { obterAprendizagemModuloPessoal } from "../src/servidor/aprendizagem-modulo";
import { lerArquivoMaterial } from "../src/servidor/arquivos-materiais";
import { MARCADOR_CENARIO_DIEGO } from "../prisma/cenario-diego";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Cenário rico de Diego inválido: ${mensagem}`); }

async function principal() {
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "diego.alves" } });
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: usuario.id, identificador: "javascript" } });
  const sessoes = await prisma.sessaoEstudo.findMany({
    where: { usuarioId: usuario.id, moduloId: modulo.id, observacao: MARCADOR_CENARIO_DIEGO },
    include: { metodos: true, formatos: true }, orderBy: { iniciadaEm: "asc" },
  });
  const materiais = await prisma.recursoConteudo.findMany({
    where: { moduloId: modulo.id, identificador: { in: CENARIO_SINTETICO_DIEGO.materiais.map((item) => item.identificador) } },
    include: { arquivo: true, analise: true },
  });
  afirmar(sessoes.length === 24, "devem existir 24 sessões identificadas do cenário.");
  afirmar(new Set(sessoes.flatMap((sessao) => sessao.metodos.map((item) => item.metodo))).size === 4, "devem existir quatro métodos recorrentes.");
  afirmar(new Set(sessoes.flatMap((sessao) => sessao.formatos.map((item) => item.formato))).size === 10, "devem existir dez formatos.");
  afirmar(sessoes.every((sessao) => sessao.formatos.length >= 2 && sessao.dificuldadePercebida !== null && sessao.compreensaoPercebida !== null), "cada sessão deve combinar formatos e registrar percepções.");
  afirmar(materiais.length === 5 && materiais.every((material) => material.arquivo && material.analise?.situacao === "CONCLUIDA"), "os cinco arquivos devem existir com análise concluída.");
  const arquivosFisicos = await Promise.all(materiais.map((material) => lerArquivoMaterial(material.arquivo!.chaveArmazenamento)));
  afirmar(arquivosFisicos.every((arquivo) => arquivo && arquivo.byteLength > 0), "os cinco arquivos sintéticos devem existir fisicamente e conter dados.");

  const [painel, dashboard, metricas, aprendizagem] = await Promise.all([
    obterPainelConceitosModulo(usuario.id, modulo.id),
    obterDashboardObservacionalPessoal(usuario.id, new Date("2026-09-22T12:00:00.000Z")),
    obterMetricasSessoesModuloPessoal(usuario.id, "javascript"),
    obterAprendizagemModuloPessoal(usuario.id, modulo.id, new Date("2026-09-22T12:00:00.000Z")),
  ]);
  afirmar(painel.comparacao.length >= 20 && painel.comparacao.every((item) => item.quantidadeSessoes >= 2), "o card Conceitos observados deve ter pelo menos 20 conceitos recorrentes.");
  afirmar(dashboard.periodoRecente.quantidadeSessoes >= 24 && dashboard.conceitos.length >= 20, "o Dashboard deve ter sessões recentes e mapa de conceitos preenchido.");
  afirmar(dashboard.pontoAtencao?.moduloId === modulo.id, "o card Maior dificuldade percebida deve estar preenchido.");
  afirmar(metricas, "as métricas do módulo devem estar disponíveis.");
  afirmar(aprendizagem, "a trajetória de aprendizagem do módulo deve estar disponível.");
  afirmar(aprendizagem.base.conceitos >= 20, "a trajetória deve possuir pelo menos 20 conceitos persistentes.");
  afirmar(aprendizagem.base.evidenciasConfirmadas === 6 && aprendizagem.base.evidenciasPendentes === 1, "devem existir seis evidências confirmadas e uma pendente.");
  afirmar(aprendizagem.linhaDoTempo.length >= 30, "a linha do tempo deve reunir sessões, materiais e evidências.");
  afirmar(aprendizagem.analises.conceitos.some((item) => item.tendencia === "EVOLUCAO_POSITIVA"), "deve existir evolução positiva explicável em pelo menos um conceito.");
  afirmar(aprendizagem.analises.padroes.length > 0, "os dados devem produzir padrões objetivos.");
  const todasAsSessoes = await prisma.sessaoEstudo.findMany({
    where: { usuarioId: usuario.id, moduloId: modulo.id, situacao: "CONCLUIDA" },
    select: { id: true, moduloId: true, descricao: true, iniciadaEm: true, encerradaEm: true, duracaoMinutos: true, situacao: true, dificuldadePercebida: true, compreensaoPercebida: true, metodos: { select: { metodo: true } }, formatos: { select: { formato: true } } },
    orderBy: { iniciadaEm: "asc" },
  });
  const dtoIa = criarDtoInterpretacaoModulo(metricas.metricas, todasAsSessoes, aprendizagem);
  afirmar(dtoIa.descricoesSessoes.length >= 24 && dtoIa.modulos[0]?.metodos.length >= 4 && dtoIa.modulos[0]?.formatos.length >= 7, "o DTO da IA deve receber descrições e contextos variados.");
  afirmar(dtoIa.aprendizagemModulo?.base.evidenciasConfirmadas === 6 && dtoIa.aprendizagemModulo.padroesObjetivos.length > 0, "o DTO da IA deve receber evidências confirmadas e padrões objetivos.");
  console.log(`Cenário de Diego verificado: ${sessoes.length} sessões, ${materiais.length} arquivos, ${aprendizagem.base.evidenciasConfirmadas} evidências confirmadas, ${aprendizagem.base.conceitos} conceitos e ${aprendizagem.linhaDoTempo.length} eventos na trajetória.`);
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
