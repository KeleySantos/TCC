import "dotenv/config";
import { strict as assert } from "node:assert";
import { prisma } from "../src/biblioteca/prisma";
import { EscopoComentarioSala, FormatoConteudo, MetodoEstudo, ModoRegistroSessao, SituacaoSessao } from "../src/gerado/prisma/enums";
import {
  alterarConsentimentosVinculo,
  criarModuloSala,
  criarSala,
  decidirSolicitacaoSala,
  desvincularInstanciaModuloSala,
  ErroSala,
  excluirSala,
  gerarConviteSala,
  obterSalaDaConta,
  publicarComentarioSala,
  removerMembroSala,
  revogarConviteSala,
  solicitarEntradaSala,
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
  await prisma.sessaoEstudo.create({
    data: {
      usuarioId: membro.id, moduloId: moduloExistente.id, descricao: "SESSAO_PRIVADA_SALA", modoRegistro: ModoRegistroSessao.MANUAL,
      iniciadaEm: new Date("2030-01-01T10:00:00.000Z"), encerradaEm: new Date("2030-01-01T10:30:00.000Z"), duracaoMinutos: 30,
      dificuldadePercebida: 3, compreensaoPercebida: 4, situacao: SituacaoSessao.CONCLUIDA,
      metodos: { create: [{ metodo: MetodoEstudo.FEYNMAN }] }, formatos: { create: [{ formato: FormatoConteudo.TEXTO }] },
    },
  });

  const sala = await criarSala(proprietario.id, { nome: "Estudos em grupo", descricao: "Sala sintética para autorização.", tituloModuloInicial: "Java", descricaoModuloInicial: "Módulo-pai de Java." });
  salaId = sala.id;
  let detalheProprietario = await obterSalaDaConta(proprietario.id, sala.identificador);
  assert(detalheProprietario);
  assert.equal(detalheProprietario.modulos.length, 1);

  const convite = await gerarConviteSala(proprietario.id, { salaId: sala.id });
  const convitePersistido = await prisma.conviteSala.findUniqueOrThrow({ where: { id: convite.id } });
  assert.notEqual(convitePersistido.codigoHash, convite.codigo);
  await solicitarEntradaSala(membro.id, { codigo: convite.codigo.toLowerCase() });
  detalheProprietario = await obterSalaDaConta(proprietario.id, sala.identificador);
  assert.equal(detalheProprietario?.solicitacoes.length, 1);
  await decidirSolicitacaoSala(proprietario.id, { solicitacaoId: detalheProprietario?.solicitacoes[0].id, aprovar: true });
  assert.equal((await obterSalaDaConta(membro.id, sala.identificador))?.papel, "MEMBRO");
  assert.equal(await obterSalaDaConta(terceiro.id, sala.identificador), null);

  const moduloSalaId = detalheProprietario?.modulos[0].id ?? "";
  const vinculo = await vincularInstanciaModuloSala(membro.id, { moduloSalaId, moduloPessoalId: moduloExistente.id, criarInstancia: false });
  const moduloDepoisDoVinculo = await prisma.moduloAprendizagem.findUniqueOrThrow({ where: { id: moduloExistente.id }, include: { sessoesEstudo: true, materiais: true } });
  assert.equal(moduloDepoisDoVinculo.sessoesEstudo.length, 1);
  assert.equal(moduloDepoisDoVinculo.materiais.length, 1);
  detalheProprietario = await obterSalaDaConta(proprietario.id, sala.identificador);
  const serializado = JSON.stringify(detalheProprietario);
  assert(!serializado.includes("CONTEUDO_PRIVADO_SALA"));
  assert(!serializado.includes("SESSAO_PRIVADA_SALA"));
  assert(!serializado.includes("Material privado inconfundível"));

  await alterarConsentimentosVinculo(membro.id, { vinculoId: vinculo.id, permitirComparacao: true, permitirIa: true });
  await deveFalhar("NAO_ENCONTRADO", () => alterarConsentimentosVinculo(proprietario.id, { vinculoId: vinculo.id, permitirComparacao: false, permitirIa: false }));
  await publicarComentarioSala(proprietario.id, { salaId: sala.id, escopo: EscopoComentarioSala.SALA, conteudo: "Comentário geral" });
  await publicarComentarioSala(proprietario.id, { salaId: sala.id, escopo: EscopoComentarioSala.MODULO, moduloSalaId, conteudo: "Comentário do módulo" });
  await publicarComentarioSala(proprietario.id, { salaId: sala.id, escopo: EscopoComentarioSala.MEMBRO, destinatarioId: membro.id, conteudo: "Comentário individual" });
  assert.equal((await obterSalaDaConta(membro.id, sala.identificador))?.comentarios.length, 3);

  for (let numero = 2; numero <= 5; numero += 1) await criarModuloSala(proprietario.id, { salaId: sala.id, titulo: `Módulo ${numero}`, descricao: `Descrição sintética ${numero}.` });
  await deveFalhar("LIMITE_MODULOS", () => criarModuloSala(proprietario.id, { salaId: sala.id, titulo: "Módulo 6", descricao: "Não deve ser criado." }));

  await desvincularInstanciaModuloSala(membro.id, vinculo.id);
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: moduloExistente.id } }));
  const novoVinculo = await vincularInstanciaModuloSala(membro.id, { moduloSalaId, criarInstancia: true });
  const instanciaNovaId = novoVinculo.moduloPessoalId;
  detalheProprietario = await obterSalaDaConta(proprietario.id, sala.identificador);
  const membroSala = detalheProprietario?.membros.find((item) => item.usuarioId === membro.id);
  assert(membroSala);
  await removerMembroSala(proprietario.id, { salaId: sala.id, membroId: membroSala.id });
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: instanciaNovaId } }));
  assert.equal(await obterSalaDaConta(membro.id, sala.identificador), null);

  await revogarConviteSala(proprietario.id, convite.id);
  await deveFalhar("CONVITE_INVALIDO", () => solicitarEntradaSala(terceiro.id, { codigo: convite.codigo }));
  await excluirSala(proprietario.id, { salaId: sala.id });
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: moduloExistente.id } }));
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: instanciaNovaId } }));

  console.log("Serviços de salas verificados: convite aprovado, isolamento, consentimentos, comentários, limite e preservação das instâncias.");
} finally {
  if (salaId) await prisma.sala.deleteMany({ where: { id: salaId } });
  if (idsUsuarios.length) {
    await prisma.eventoAuditoria.deleteMany({ where: { atorId: { in: idsUsuarios } } });
    await prisma.usuario.deleteMany({ where: { id: { in: idsUsuarios } } });
  }
  await prisma.$disconnect();
}
