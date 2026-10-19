import "dotenv/config";
import { strict as assert } from "node:assert";
import { prisma } from "../src/biblioteca/prisma";
import { FormatoConteudo, MetodoEstudo, ModoRegistroSessao, PapelMembroSala, SituacaoSessao } from "../src/gerado/prisma/enums";
import { gerarInterpretacaoMembroSala, ErroInterpretacaoSala } from "../src/servidor/ia/interpretacoes";
import { obterDashboardIndividualAutorizado, obterDashboardsSalaDoProprietario } from "../src/servidor/paineis-salas";
import { criarSala, desvincularInstanciaModuloSala, vincularInstanciaModuloSala } from "../src/servidor/salas";

const sufixo = Date.now().toString(36);
const usuarios: string[] = [];
let salaId = "";

async function criarContaComSessao(indice: number) {
  const usuario = await prisma.usuario.create({ data: { nome: `Participante ${indice}`, nomeUsuario: `painel-sala-${indice}-${sufixo}`, senhaHash: "sintetica" } });
  usuarios.push(usuario.id);
  const modulo = await prisma.moduloAprendizagem.create({ data: { usuarioId: usuario.id, identificador: `modulo-${indice}-${sufixo}`, titulo: `Módulo pessoal ${indice}`, descricao: "Instância pessoal sintética." } });
  await prisma.recursoConteudo.create({ data: { moduloId: modulo.id, identificador: `privado-${indice}-${sufixo}`, titulo: `ARQUIVO_PRIVADO_DASHBOARD_${indice}`, descricao: "Não pode sair no painel administrativo.", formato: FormatoConteudo.TEXTO, minutosEstimados: 10, conteudoTexto: `CONTEUDO_PRIVADO_DASHBOARD_${indice}` } });
  const iniciadaEm = new Date(`2025-0${indice}-10T10:00:00.000Z`);
  await prisma.sessaoEstudo.create({ data: {
    usuarioId: usuario.id, moduloId: modulo.id, descricao: `DESCRICAO_PRIVADA_DASHBOARD_${indice}`, modoRegistro: ModoRegistroSessao.MANUAL,
    iniciadaEm, encerradaEm: new Date(iniciadaEm.getTime() + indice * 10 * 60_000), duracaoMinutos: indice * 10,
    dificuldadePercebida: indice, compreensaoPercebida: 6 - indice, situacao: SituacaoSessao.CONCLUIDA,
    metodos: { create: { metodo: MetodoEstudo.FEYNMAN } }, formatos: { create: { formato: FormatoConteudo.TEXTO } },
  } });
  return { usuario, modulo };
}

try {
  const [proprietario, membroDois, membroTres, terceiro] = await Promise.all([1, 2, 3, 4].map(criarContaComSessao));
  const sala = await criarSala(proprietario.usuario.id, { nome: "Sala de dashboards", descricao: "Validação sintética de agregados.", tituloModuloInicial: "Compiladores", descricaoModuloInicial: "Módulo-pai sintético." });
  salaId = sala.id;
  const moduloSala = await prisma.moduloSala.findFirstOrThrow({ where: { salaId: sala.id } });
  const [associacaoDois, associacaoTres] = await Promise.all([
    prisma.membroSala.create({ data: { salaId: sala.id, usuarioId: membroDois.usuario.id, papel: PapelMembroSala.MEMBRO } }),
    prisma.membroSala.create({ data: { salaId: sala.id, usuarioId: membroTres.usuario.id, papel: PapelMembroSala.MEMBRO } }),
  ]);
  assert(associacaoDois && associacaoTres);
  const vinculoUm = await vincularInstanciaModuloSala(proprietario.usuario.id, { moduloSalaId: moduloSala.id, moduloPessoalId: proprietario.modulo.id, criarInstancia: false });
  const vinculoDois = await vincularInstanciaModuloSala(membroDois.usuario.id, { moduloSalaId: moduloSala.id, moduloPessoalId: membroDois.modulo.id, criarInstancia: false });
  let painel = await obterDashboardsSalaDoProprietario(proprietario.usuario.id, sala.identificador);
  assert(painel);
  assert.equal(painel.geral.disponivel, false);
  assert.equal(painel.geral.quantidadeContribuidores, 2);
  assert.equal(await obterDashboardsSalaDoProprietario(membroDois.usuario.id, sala.identificador), null);
  assert.equal(await obterDashboardsSalaDoProprietario(terceiro.usuario.id, sala.identificador), null);

  const sessaoDois = await prisma.sessaoEstudo.findFirstOrThrow({ where: { usuarioId: membroDois.usuario.id, moduloId: membroDois.modulo.id }, select: { iniciadaEm: true } });
  await prisma.vinculoModuloSala.update({ where: { id: vinculoDois.id }, data: { dadosDesde: new Date(sessaoDois.iniciadaEm.getTime() + 5 * 60_000) } });
  painel = await obterDashboardsSalaDoProprietario(proprietario.usuario.id, sala.identificador);
  assert.equal(painel?.modulos[0].individuais.find((item) => item.vinculoId === vinculoDois.id)?.metricas.tempoEstudo.quantidadeSessoesValidas, 0, "sessão iniciada antes de dadosDesde não pode ser compartilhada");
  await prisma.vinculoModuloSala.update({ where: { id: vinculoDois.id }, data: { dadosDesde: null } });

  const vinculoTres = await vincularInstanciaModuloSala(membroTres.usuario.id, { moduloSalaId: moduloSala.id, moduloPessoalId: membroTres.modulo.id, criarInstancia: false });
  painel = await obterDashboardsSalaDoProprietario(proprietario.usuario.id, sala.identificador);
  assert(painel?.geral.disponivel);
  assert.equal(painel.geral.metricas?.tempoEstudo.quantidadeSessoesValidas, 3);
  assert.equal(painel.geral.metricas?.tempoEstudo.minutosTotais, 60);
  assert.equal(painel.geral.dados?.baseHistorica.quantidadeSessoes, 3);
  assert.equal(painel.geral.dados?.metodoMaiorCompreensao?.chave, MetodoEstudo.FEYNMAN);
  assert.equal(painel.geral.dados?.formatoMaiorCompreensao?.chave, FormatoConteudo.TEXTO);
  assert(painel.modulos.every((modulo) => modulo.individuais.every((individual) => individual.aprendizagem)));
  assert(!JSON.stringify(painel).includes("DESCRICAO_PRIVADA_DASHBOARD"));
  assert(!JSON.stringify(painel).includes("ARQUIVO_PRIVADO_DASHBOARD"));
  assert(!JSON.stringify(painel).includes("CONTEUDO_PRIVADO_DASHBOARD"));

  const individualDois = await obterDashboardIndividualAutorizado(proprietario.usuario.id, sala.identificador, vinculoDois.id);
  assert(individualDois);
  const interpretacaoAutorizada = await gerarInterpretacaoMembroSala(proprietario.usuario.id, sala.identificador, vinculoDois.id);
  assert.equal(interpretacaoAutorizada.origem, "LOCAL");
  assert.equal(interpretacaoAutorizada.contexto.quantidadeSessoesValidas, 1);
  const interpretacaoTres = await gerarInterpretacaoMembroSala(proprietario.usuario.id, sala.identificador, vinculoTres.id);
  assert.equal(interpretacaoTres.origem, "LOCAL", "todo vínculo ativo deve permitir interpretação por IA");

  await desvincularInstanciaModuloSala(membroTres.usuario.id, vinculoTres.id);
  await assert.rejects(() => gerarInterpretacaoMembroSala(proprietario.usuario.id, sala.identificador, vinculoTres.id), (erro: unknown) => erro instanceof ErroInterpretacaoSala);
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: membroTres.modulo.id } }));
  const historicas = await prisma.evidenciaHistoricaModuloSala.findMany({ where: { moduloSalaId: moduloSala.id } });
  assert.equal(historicas.length, 1);
  assert(!JSON.stringify(historicas).includes(membroTres.usuario.id));
  assert(!JSON.stringify(historicas).includes("DESCRICAO_PRIVADA_DASHBOARD"));
  painel = await obterDashboardsSalaDoProprietario(proprietario.usuario.id, sala.identificador);
  assert.equal(painel?.geral.disponivel, false, "o painel geral espelhado usa somente membros ativos com dashboard compartilhado");
  assert.equal(painel?.geral.dados, null);
  assert.equal(painel?.modulos[0].agregado.metricas?.tempoEstudo.minutosTotais, 60, "o agregado legado do módulo preserva o histórico anonimizado");
  assert.equal(painel.modulos[0].individuais.length, 2);

  await vincularInstanciaModuloSala(membroTres.usuario.id, { moduloSalaId: moduloSala.id, moduloPessoalId: membroTres.modulo.id, criarInstancia: false });
  painel = await obterDashboardsSalaDoProprietario(proprietario.usuario.id, sala.identificador);
  assert.equal(painel?.geral.disponivel, false, "a sessão histórica não pode contar como contribuição ativa após reativação");
  assert.equal(painel?.modulos[0].agregado.metricas?.tempoEstudo.minutosTotais, 60, "reativação não pode duplicar a sessão histórica");
  assert.equal(painel?.modulos[0].individuais.find((item) => item.nome === membroTres.usuario.nome)?.metricas.tempoEstudo.quantidadeSessoesValidas, 0);

  assert(vinculoUm);
  console.log("Dashboards de salas verificados: mínimo de grupo, isolamento, comparação e IA obrigatórias, histórico pseudonimizado e reativação sem duplicidade.");
} finally {
  if (salaId) await prisma.sala.deleteMany({ where: { id: salaId } });
  if (usuarios.length) {
    await prisma.eventoAuditoria.deleteMany({ where: { atorId: { in: usuarios } } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  }
  await prisma.$disconnect();
}
