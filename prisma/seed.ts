import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { EscopoComentarioSala, FormatoConteudo, MetodoEstudo, ModoRegistroSessao, PapelMembroSala, PapelUsuario, SituacaoSessao } from "../src/gerado/prisma/enums";
import { criarHashSenha } from "../src/servidor/senhas";

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
const referencia = new Date("2026-09-01T12:00:00.000Z");
const diasAntes = (dias: number) => new Date(referencia.getTime() - dias * 86_400_000);

type Conta = {
  usuario: { id: string };
  modulo: { id: string };
  recursos: Record<"pdf" | "video" | "pratica", { id: string; formato: FormatoConteudo }>;
};

async function criarConta(nome: string, nomeUsuario: string, perfil: string): Promise<Conta> {
  const usuario = await prisma.usuario.create({ data: { nome, nomeUsuario, email: `${nomeUsuario}@exemplo.test`, senhaHash: criarHashSenha("Laboratorio@2026"), papel: PapelUsuario.ALUNO } });
  const modulo = await prisma.moduloAprendizagem.create({ data: { usuarioId: usuario.id, identificador: "javascript", titulo: "JavaScript", descricao: `Módulo pessoal sintético do perfil ${perfil}.` } });
  const [pdf, video, pratica] = await Promise.all([
    prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "guia-visual", titulo: "JavaScript: guia visual", descricao: "Leitura estruturada com exemplos.", formato: FormatoConteudo.PDF, minutosEstimados: 18, conteudoTexto: "Material sintético sobre estruturas fundamentais de JavaScript." } }),
    prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "passo-a-passo", titulo: "JavaScript passo a passo", descricao: "Vídeo demonstrativo do módulo.", formato: FormatoConteudo.VIDEO, minutosEstimados: 12, conteudoTexto: "Roteiro sintético para acompanhar exemplos de JavaScript." } }),
    prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "laboratorio", titulo: "Laboratório de JavaScript", descricao: "Exercícios práticos progressivos.", formato: FormatoConteudo.EXERCICIO_PRATICO, minutosEstimados: 22, conteudoTexto: "Prática sintética com pequenos problemas de programação." } }),
  ]);
  return { usuario, modulo, recursos: { pdf, video, pratica } };
}

async function criarSessao(conta: Conta, recurso: { id: string; formato: FormatoConteudo }, dias: number, minutos: number, metodo: MetodoEstudo, compreensao: number, desafioId: string | null = null) {
  const iniciadaEm = diasAntes(dias);
  await prisma.sessaoEstudo.create({ data: {
    usuarioId: conta.usuario.id, moduloId: conta.modulo.id,
    descricao: "Estudo sintético do conteúdo descrito para validar a jornada por sessões.", modoRegistro: ModoRegistroSessao.MANUAL,
    dificuldadePercebida: compreensao <= 2 ? 4 : compreensao === 3 ? 3 : 2, compreensaoPercebida: compreensao,
    observacao: "Registro sintético para validação do laboratório.", desafioId, iniciadaEm,
    encerradaEm: new Date(iniciadaEm.getTime() + minutos * 60_000), duracaoMinutos: minutos, situacao: SituacaoSessao.CONCLUIDA,
    metodos: { create: { metodo } }, formatos: { create: { formato: recurso.formato } }, materiais: { create: { recursoId: recurso.id } },
  } });
}

async function criarSegundoModulo(conta: Conta) {
  const modulo = await prisma.moduloAprendizagem.create({ data: { usuarioId: conta.usuario.id, identificador: "logica", titulo: "Lógica", descricao: "Segundo módulo sintético para verificar recorrência entre módulos." } });
  const recurso = await prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: "pratica-proposicoes", titulo: "Prática de proposições", descricao: "Exercícios de lógica proposicional.", formato: FormatoConteudo.EXERCICIO_PRATICO, minutosEstimados: 15, conteudoTexto: "Material sintético sobre conectivos e valores lógicos." } });
  const iniciadaEm = diasAntes(16);
  await prisma.sessaoEstudo.create({ data: {
    usuarioId: conta.usuario.id, moduloId: modulo.id,
    descricao: "Explicação de proposições com as próprias palavras.", modoRegistro: ModoRegistroSessao.MANUAL,
    dificuldadePercebida: 3, compreensaoPercebida: 4, iniciadaEm, encerradaEm: new Date(iniciadaEm.getTime() + 15 * 60_000),
    duracaoMinutos: 15, situacao: SituacaoSessao.CONCLUIDA, metodos: { create: { metodo: MetodoEstudo.FEYNMAN } },
    formatos: { create: { formato: recurso.formato } }, materiais: { create: { recursoId: recurso.id } },
  } });
}

async function limpar() {
  await prisma.eventoAuditoria.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.sessaoEstudo.deleteMany(); await prisma.desafioExperimentacao.deleteMany(); await prisma.aprovacaoRecurso.deleteMany();
  await prisma.recursoConteudo.deleteMany(); await prisma.moduloAprendizagem.deleteMany();
  await prisma.matricula.deleteMany(); await prisma.turma.deleteMany(); await prisma.perfilAluno.deleteMany();
  await prisma.perfilProfessor.deleteMany(); await prisma.usuario.deleteMany();
}

async function principal() {
  await limpar();
  const [ana, bruno, carla, diego, elisa] = await Promise.all([
    criarConta("Ana Souza", "ana.souza", "A"), criarConta("Bruno Lima", "bruno.lima", "B"),
    criarConta("Carla Rocha", "carla.rocha", "C"), criarConta("Diego Alves", "diego.alves", "D"), criarConta("Elisa Martins", "elisa.martins", "E"),
  ]);
  const [desafioAna] = await Promise.all([
    prisma.desafioExperimentacao.create({ data: { usuarioId: ana.usuario.id, moduloId: ana.modulo.id, metodo: MetodoEstudo.FEYNMAN, meta: "Explicar estruturas de repetição com minhas próprias palavras ao final da sessão." } }),
    prisma.desafioExperimentacao.create({ data: { usuarioId: bruno.usuario.id, moduloId: bruno.modulo.id, metodo: MetodoEstudo.POMODORO, meta: "Organizar blocos curtos de estudo para revisar o módulo.", situacao: "CANCELADO", canceladoEm: diasAntes(40) } }),
  ]);
  const dados: Array<[Conta, { id: string; formato: FormatoConteudo }, number, number, MetodoEstudo, number, string | null]> = [
    [ana, ana.recursos.pdf, 180, 25, MetodoEstudo.FEYNMAN, 2, desafioAna.id], [ana, ana.recursos.pratica, 172, 21, MetodoEstudo.FEYNMAN, 4, desafioAna.id], [ana, ana.recursos.pratica, 164, 19, MetodoEstudo.FEYNMAN, 4, null], [ana, ana.recursos.pratica, 156, 17, MetodoEstudo.FEYNMAN, 4, null],
    [bruno, bruno.recursos.video, 148, 16, MetodoEstudo.RECUPERACAO_ATIVA, 4, null], [bruno, bruno.recursos.video, 140, 14, MetodoEstudo.RECUPERACAO_ATIVA, 4, null], [bruno, bruno.recursos.video, 132, 13, MetodoEstudo.REPETICAO_ESPACADA, 4, null], [bruno, bruno.recursos.pdf, 124, 18, MetodoEstudo.REPETICAO_ESPACADA, 3, null],
    [carla, carla.recursos.pdf, 116, 17, MetodoEstudo.POMODORO, 2, null],
    [diego, diego.recursos.pratica, 108, 20, MetodoEstudo.INTERCALAMENTO, 2, null], [diego, diego.recursos.video, 100, 13, MetodoEstudo.PRATICA_DISTRIBUIDA, 3, null], [diego, diego.recursos.pratica, 92, 19, MetodoEstudo.INTERCALAMENTO, 2, null],
    [elisa, elisa.recursos.pdf, 84, 16, MetodoEstudo.POMODORO, 4, null], [elisa, elisa.recursos.video, 76, 12, MetodoEstudo.REPETICAO_ESPACADA, 4, null], [elisa, elisa.recursos.pdf, 68, 18, MetodoEstudo.RECUPERACAO_ATIVA, 4, null], [elisa, elisa.recursos.video, 60, 11, MetodoEstudo.PRATICA_DISTRIBUIDA, 4, null], [elisa, elisa.recursos.pratica, 52, 20, MetodoEstudo.INTERCALAMENTO, 4, null],
  ];
  for (const item of dados) await criarSessao(...item);
  await criarSegundoModulo(ana);
  const sala = await prisma.sala.create({ data: { proprietarioId: ana.usuario.id, identificador: "sala-sintetica-grupo-programacao", nome: "Grupo de Programação", descricao: "Sala sintética para acompanhar módulos pessoais sem expor materiais ou sessões." } });
  const [membroAna, membroBruno, membroCarla] = await Promise.all([
    prisma.membroSala.create({ data: { salaId: sala.id, usuarioId: ana.usuario.id, papel: PapelMembroSala.PROPRIETARIO } }),
    prisma.membroSala.create({ data: { salaId: sala.id, usuarioId: bruno.usuario.id } }),
    prisma.membroSala.create({ data: { salaId: sala.id, usuarioId: carla.usuario.id } }),
  ]);
  const moduloSala = await prisma.moduloSala.create({ data: { salaId: sala.id, titulo: "JavaScript", descricao: "Módulo-pai sintético para consolidar dashboards autorizados.", posicao: 1 } });
  await Promise.all([
    prisma.vinculoModuloSala.create({ data: { moduloSalaId: moduloSala.id, membroSalaId: membroAna.id, usuarioId: ana.usuario.id, moduloPessoalId: ana.modulo.id, permitirComparacao: true } }),
    prisma.vinculoModuloSala.create({ data: { moduloSalaId: moduloSala.id, membroSalaId: membroBruno.id, usuarioId: bruno.usuario.id, moduloPessoalId: bruno.modulo.id, permitirComparacao: true, permitirIa: true } }),
    prisma.vinculoModuloSala.create({ data: { moduloSalaId: moduloSala.id, membroSalaId: membroCarla.id, usuarioId: carla.usuario.id, moduloPessoalId: carla.modulo.id } }),
    prisma.comentarioSala.create({ data: { salaId: sala.id, autorId: ana.usuario.id, escopo: EscopoComentarioSala.SALA, conteudo: "Comentário sintético: registrem suas sessões normalmente; somente os dashboards autorizados serão consolidados." } }),
  ]);
  const inicio = diasAntes(2);
  await prisma.sessaoEstudo.create({ data: {
    usuarioId: carla.usuario.id, moduloId: carla.modulo.id,
    descricao: "Sessão curta sintética invalidada.", modoRegistro: ModoRegistroSessao.MANUAL, dificuldadePercebida: 4, compreensaoPercebida: 2,
    iniciadaEm: inicio, encerradaEm: new Date(inicio.getTime() + 60_000), duracaoMinutos: 1, situacao: SituacaoSessao.INVALIDADA,
    metodos: { create: { metodo: MetodoEstudo.POMODORO } }, formatos: { create: { formato: FormatoConteudo.VIDEO } }, materiais: { create: { recursoId: carla.recursos.video.id } },
  } });
  console.log("Cenário sintético centrado em sessões e compartilhamento seguro criado com sucesso.");
}

principal().catch((erro) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
