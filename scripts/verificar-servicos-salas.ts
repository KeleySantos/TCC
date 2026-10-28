import "dotenv/config";
import { strict as assert } from "node:assert";
import { prisma } from "../src/biblioteca/prisma";
import { FormatoConteudo, MetodoEstudo, ModoRegistroSessao, SituacaoSessao } from "../src/gerado/prisma/enums";
import {
  criarModuloSala,
  criarSala,
  entrarModuloSalaComCodigo,
  ErroSala,
  excluirSala,
  gerarConviteModuloSala,
  listarSalasDaConta,
  obterModuloSalaDaConta,
  obterSalaDaConta,
  removerParticipanteModuloSala,
  revogarConviteModuloSala,
  sairDoModuloSala,
  vincularInstanciaModuloSala,
} from "../src/servidor/salas";

const sufixo = Date.now().toString(36);
const idsUsuarios: string[] = [];
let salaId = "";

async function deveFalhar(codigo: string, operacao: () => Promise<unknown>) {
  await assert.rejects(operacao, (erro: unknown) => erro instanceof ErroSala && erro.codigo === codigo);
}

try {
  const [proprietario, membro, terceiro] = await Promise.all(["proprietario", "membro", "terceiro"].map(async (papel) => {
    const usuario = await prisma.usuario.create({ data: { nome: `Conta ${papel}`, nomeUsuario: `salas-${papel}-${sufixo}`, senhaHash: "sintetica" } });
    idsUsuarios.push(usuario.id);
    return usuario;
  }));
  const moduloExistente = await prisma.moduloAprendizagem.create({ data: { usuarioId: membro.id, identificador: `java-${sufixo}`, titulo: "Estudos de Java", descricao: "Módulo pessoal com histórico anterior." } });
  await prisma.recursoConteudo.create({ data: { moduloId: moduloExistente.id, identificador: `segredo-${sufixo}`, titulo: "Material privado inconfundível", descricao: "Não pode aparecer para o proprietário.", formato: FormatoConteudo.TEXTO, minutosEstimados: 10, conteudoTexto: "CONTEUDO_PRIVADO_SALA" } });
  await prisma.sessaoEstudo.create({ data: {
    usuarioId: membro.id, moduloId: moduloExistente.id, descricao: "SESSAO_PRIVADA_SALA", modoRegistro: ModoRegistroSessao.MANUAL,
    iniciadaEm: new Date("2030-01-01T10:00:00.000Z"), encerradaEm: new Date("2030-01-01T10:30:00.000Z"), duracaoMinutos: 30,
    dificuldadePercebida: 3, compreensaoPercebida: 4, situacao: SituacaoSessao.CONCLUIDA,
    metodos: { create: [{ metodo: MetodoEstudo.FEYNMAN }] }, formatos: { create: [{ formato: FormatoConteudo.TEXTO }] },
  } });

  const sala = await criarSala(proprietario.id, { nome: "Estudos em grupo", descricao: "Sala sintética para autorização modular.", tituloModuloInicial: "Java", descricaoModuloInicial: "Módulo-pai de Java." });
  salaId = sala.id;
  const moduloA = await prisma.moduloSala.findFirstOrThrow({ where: { salaId: sala.id, posicao: 1 } });
  const moduloB = await criarModuloSala(proprietario.id, { salaId: sala.id, titulo: "Banco de dados", descricao: "Módulo privado B." });
  assert.equal(await obterSalaDaConta(membro.id, sala.identificador), null);

  const conviteA = await gerarConviteModuloSala(proprietario.id, { moduloSalaId: moduloA.id });
  const convitePersistido = await prisma.conviteModuloSala.findUniqueOrThrow({ where: { id: conviteA.id } });
  assert.notEqual(convitePersistido.codigoHash, conviteA.codigo);
  await entrarModuloSalaComCodigo(membro.id, { codigo: conviteA.codigo.toLowerCase() });
  await deveFalhar("SOLICITACAO_DUPLICADA", () => entrarModuloSalaComCodigo(membro.id, { codigo: conviteA.codigo }));
  assert.deepEqual((await obterSalaDaConta(membro.id, sala.identificador))?.modulos.map((modulo) => modulo.id), [moduloA.id]);
  assert.equal(await obterModuloSalaDaConta(membro.id, sala.identificador, moduloB.id), null);
  assert((await listarSalasDaConta(membro.id)).some((item) => item.id === sala.id));

  const vinculo = await vincularInstanciaModuloSala(membro.id, { moduloSalaId: moduloA.id, moduloPessoalId: moduloExistente.id, criarInstancia: false });
  const moduloDepoisDoVinculo = await prisma.moduloAprendizagem.findUniqueOrThrow({ where: { id: moduloExistente.id }, include: { sessoesEstudo: true, materiais: true } });
  assert.equal(moduloDepoisDoVinculo.sessoesEstudo.length, 1);
  assert.equal(moduloDepoisDoVinculo.materiais.length, 1);
  const serializado = JSON.stringify(await obterSalaDaConta(proprietario.id, sala.identificador));
  assert(!serializado.includes("CONTEUDO_PRIVADO_SALA"));
  assert(!serializado.includes("SESSAO_PRIVADA_SALA"));
  assert(!serializado.includes("Material privado inconfundível"));

  for (let numero = 3; numero <= 5; numero += 1) await criarModuloSala(proprietario.id, { salaId: sala.id, titulo: `Módulo ${numero}`, descricao: `Descrição sintética ${numero}.` });
  await deveFalhar("LIMITE_MODULOS", () => criarModuloSala(proprietario.id, { salaId: sala.id, titulo: "Módulo 6", descricao: "Não deve ser criado." }));

  await sairDoModuloSala(membro.id, { moduloSalaId: moduloA.id });
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: moduloExistente.id } }));
  assert.equal(await obterSalaDaConta(membro.id, sala.identificador), null);
  assert((await prisma.evidenciaHistoricaModuloSala.count({ where: { moduloSalaId: moduloA.id } })) > 0);

  const conviteB = await gerarConviteModuloSala(proprietario.id, { moduloSalaId: moduloB.id });
  await entrarModuloSalaComCodigo(terceiro.id, { codigo: conviteB.codigo });
  const vinculoTerceiro = await vincularInstanciaModuloSala(terceiro.id, { moduloSalaId: moduloB.id, criarInstancia: true });
  const participacaoTerceiro = await prisma.participacaoModuloSala.findUniqueOrThrow({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloB.id, usuarioId: terceiro.id } } });
  await removerParticipanteModuloSala(proprietario.id, { moduloSalaId: moduloB.id, participacaoId: participacaoTerceiro.id });
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: vinculoTerceiro.moduloPessoalId } }));
  assert.equal(await obterSalaDaConta(terceiro.id, sala.identificador), null);

  await revogarConviteModuloSala(proprietario.id, conviteB.id);
  await deveFalhar("CONVITE_INVALIDO", () => entrarModuloSalaComCodigo(membro.id, { codigo: conviteB.codigo }));
  await excluirSala(proprietario.id, { salaId: sala.id });
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: moduloExistente.id } }));
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: vinculoTerceiro.moduloPessoalId } }));
  assert(vinculo);

  console.log("Serviços de salas verificados: autorização, convite, vínculo, saída e remoção estritamente por módulo, com isolamento e preservação das instâncias.");
} finally {
  if (salaId) await prisma.sala.deleteMany({ where: { id: salaId } });
  if (idsUsuarios.length) {
    await prisma.eventoAuditoria.deleteMany({ where: { atorId: { in: idsUsuarios } } });
    await prisma.usuario.deleteMany({ where: { id: { in: idsUsuarios } } });
  }
  await prisma.$disconnect();
}
