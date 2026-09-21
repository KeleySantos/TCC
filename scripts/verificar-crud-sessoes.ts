import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import {
  ErroSessao,
  arquivarSessaoPessoal,
  concluirSessaoPessoal,
  desarquivarSessaoPessoal,
  editarSessaoPessoal,
  iniciarCronometroPessoal,
  listarSessoesModuloPessoal,
  obterSessaoPessoal,
  registrarSessaoManualPessoal,
} from "../src/servidor/sessoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação do CRUD de sessões falhou: ${mensagem}`);
}

async function esperarErro(codigo: ErroSessao["codigo"], operacao: () => Promise<unknown>, mensagem: string) {
  try {
    await operacao();
  } catch (erro) {
    afirmar(erro instanceof ErroSessao && erro.codigo === codigo, mensagem);
    return;
  }
  throw new Error(`Verificação do CRUD de sessões falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const modulosAna = await prisma.moduloAprendizagem.findMany({ where: { usuarioId: ana.id, arquivado: false, rascunho: false }, orderBy: { id: "asc" }, take: 2 });
  const moduloBruno = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: bruno.id, arquivado: false, rascunho: false } });
  afirmar(modulosAna.length >= 2, "o cenário precisa de dois módulos da conta A.");
  const [moduloAna, outroModuloAna] = modulosAna;
  const [materialAna, materialOutroModulo, materialBruno] = await Promise.all([
    prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, moduloId: moduloAna.id } }),
    prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, moduloId: outroModuloAna.id } }),
    prisma.recursoConteudo.findFirstOrThrow({ where: { ativo: true, moduloId: moduloBruno.id } }),
  ]);

  const ids: string[] = [];
  const contexto = {
    moduloId: moduloAna.id,
    descricao: "Revisão sintética de conceitos do módulo.",
    metodos: ["FEYNMAN", "RECUPERACAO_ATIVA"],
    formatos: ["TEXTO", "PDF"],
    materialIds: [materialAna.id],
  };

  try {
    const manual = await registrarSessaoManualPessoal(ana.id, {
      ...contexto,
      iniciadaEm: "2001-01-10T10:00:00.000Z",
      encerradaEm: "2001-01-10T10:40:59.000Z",
      dificuldadePercebida: 3,
      compreensaoPercebida: 4,
    }, new Date("2026-09-19T12:00:00.000Z"));
    ids.push(manual.id);
    afirmar(manual.situacao === "CONCLUIDA" && manual.duracaoMinutos === 40, "registro manual deve concluir e calcular minutos inteiros.");
    afirmar(manual.metodos.length === 2 && manual.formatos.length === 2 && manual.materiais.length === 1, "registro manual deve persistir contexto múltiplo.");

    await esperarErro("SOBREPOSICAO", () => registrarSessaoManualPessoal(ana.id, {
      ...contexto, materialIds: [], iniciadaEm: "2001-01-10T10:20:00.000Z", encerradaEm: "2001-01-10T10:50:00.000Z",
      dificuldadePercebida: 2, compreensaoPercebida: 3,
    }), "períodos sobrepostos da mesma conta devem ser bloqueados.");

    const mesmaFaixaOutraConta = await registrarSessaoManualPessoal(bruno.id, {
      ...contexto, moduloId: moduloBruno.id, materialIds: [materialBruno.id],
      iniciadaEm: "2001-01-10T10:20:00.000Z", encerradaEm: "2001-01-10T10:50:00.000Z",
      dificuldadePercebida: 2, compreensaoPercebida: 3,
    });
    ids.push(mesmaFaixaOutraConta.id);

    await esperarErro("NAO_ENCONTRADA", () => registrarSessaoManualPessoal(ana.id, {
      ...contexto, materialIds: [materialOutroModulo.id],
      iniciadaEm: "2001-01-11T10:00:00.000Z", encerradaEm: "2001-01-11T10:30:00.000Z",
      dificuldadePercebida: 2, compreensaoPercebida: 3,
    }), "material de outro módulo deve ser recusado.");

    await esperarErro("DADOS_INVALIDOS", () => registrarSessaoManualPessoal(ana.id, {
      ...contexto, materialIds: [], iniciadaEm: "2001-01-12T10:00:00.000Z", encerradaEm: "2001-01-12T10:30:00.000Z",
    }), "sessão concluída deve exigir as duas percepções.");

    const planejada = await registrarSessaoManualPessoal(ana.id, {
      ...contexto, metodos: ["POMODORO"], formatos: ["AUDIO"], materialIds: [],
      iniciadaEm: "2035-01-10T10:00:00.000Z", encerradaEm: "2035-01-10T11:00:00.000Z",
    }, new Date("2026-09-19T12:00:00.000Z"));
    ids.push(planejada.id);
    afirmar(planejada.situacao === "PLANEJADA" && planejada.dificuldadePercebida === null, "sessão futura deve nascer planejada sem exigir percepções.");
    await esperarErro("ESTADO_INVALIDO", () => concluirSessaoPessoal(ana.id, planejada.id, { dificuldadePercebida: 2, compreensaoPercebida: 4 }, new Date("2035-01-10T10:30:00.000Z")), "planejamento não deve ser concluído antes do fim.");
    const planejamentoConcluido = await concluirSessaoPessoal(ana.id, planejada.id, { dificuldadePercebida: 2, compreensaoPercebida: 4 }, new Date("2035-01-10T11:01:00.000Z"));
    afirmar(planejamentoConcluido.situacao === "CONCLUIDA" && planejamentoConcluido.duracaoMinutos === 60, "planejamento vencido deve poder ser concluído.");

    const cronometro = await iniciarCronometroPessoal(ana.id, {
      ...contexto, metodos: ["INTERCALAMENTO"], formatos: ["VIDEO"], materialIds: [],
    }, new Date("2002-02-01T10:00:00.000Z"));
    ids.push(cronometro.id);
    afirmar(cronometro.situacao === "ATIVA" && cronometro.encerradaEm === null && cronometro.modoRegistro === "CRONOMETRO", "cronômetro deve persistir sessão ativa.");
    await esperarErro("SOBREPOSICAO", () => iniciarCronometroPessoal(ana.id, { ...contexto, materialIds: [] }, new Date("2002-02-01T10:01:00.000Z")), "a conta não pode manter dois cronômetros ativos.");
    const cronometroConcluido = await concluirSessaoPessoal(ana.id, cronometro.id, { dificuldadePercebida: 4, compreensaoPercebida: 3 }, new Date("2002-02-01T10:25:30.000Z"));
    afirmar(cronometroConcluido.situacao === "CONCLUIDA" && cronometroConcluido.duracaoMinutos === 25, "cronômetro deve usar o fim informado pelo servidor e recalcular duração.");

    const editada = await editarSessaoPessoal(ana.id, manual.id, {
      descricao: "Descrição corrigida integralmente.",
      metodos: ["PRATICA_DISTRIBUIDA", "PRATICA_DISTRIBUIDA"],
      formatos: ["IMAGEM", "IMAGEM"],
      materialIds: [],
      iniciadaEm: "2001-01-10T12:00:00.000Z",
      encerradaEm: "2001-01-10T13:15:00.000Z",
      dificuldadePercebida: 2,
      compreensaoPercebida: 5,
    });
    afirmar(editada.duracaoMinutos === 75 && editada.metodos.length === 1 && editada.formatos.length === 1 && editada.materiais.length === 0, "edição deve recalcular duração e normalizar relações duplicadas.");

    await esperarErro("NAO_ENCONTRADA", () => obterSessaoPessoal(bruno.id, manual.id), "outra conta não deve detalhar sessão alheia.");
    await esperarErro("NAO_ENCONTRADA", () => arquivarSessaoPessoal(bruno.id, manual.id), "outra conta não deve arquivar sessão alheia.");

    const arquivada = await arquivarSessaoPessoal(ana.id, manual.id);
    afirmar(arquivada.arquivada, "arquivamento deve ser lógico.");
    const listaPadrao = await listarSessoesModuloPessoal(ana.id, moduloAna.id);
    const listaCompleta = await listarSessoesModuloPessoal(ana.id, moduloAna.id, { incluirArquivadas: true });
    afirmar(!listaPadrao.some((sessao) => sessao.id === manual.id) && listaCompleta.some((sessao) => sessao.id === manual.id), "listagem deve ocultar arquivadas por padrão e recuperá-las sob opção explícita.");
    const restaurada = await desarquivarSessaoPessoal(ana.id, manual.id);
    afirmar(!restaurada.arquivada, "sessão arquivada deve poder ser restaurada.");

    console.log("CRUD de sessões verificado: manual, planejamento, cronômetro, edição, sobreposição, arquivamento e isolamento.");
  } finally {
    if (ids.length) await prisma.sessaoEstudo.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
