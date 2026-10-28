import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));

import { bancoTeste as banco, fecharBancoTeste } from "../../testes/utilitarios/banco-compartilhamento";
import { criarModuloSala, criarSala, vincularInstanciaModuloSala } from "./salas";
import { obterDashboardIndividualAutorizado, obterDashboardModuloSalaDoProprietario } from "./paineis-salas";

let proprietarioId: string;
let participanteId: string;
let aguardandoId: string;
let terceiroId: string;
let identificadorSala: string;
let moduloAId: string;
let moduloBId: string;
let vinculoParticipanteId: string;

async function criarModuloPessoalComSessao(usuarioId: string, identificador: string, minutos: number) {
  const modulo = await banco.moduloAprendizagem.create({ data: { usuarioId, identificador, titulo: identificador, descricao: "Fixture analítica." } });
  await banco.sessaoEstudo.create({ data: {
    usuarioId,
    moduloId: modulo.id,
    descricao: `Sessão ${identificador}`,
    modoRegistro: "MANUAL",
    iniciadaEm: new Date("2026-01-10T10:00:00.000Z"),
    encerradaEm: new Date(1768039200000 + minutos * 60_000),
    duracaoMinutos: minutos,
    dificuldadePercebida: 2,
    compreensaoPercebida: 4,
    situacao: "CONCLUIDA",
  } });
  return modulo;
}

beforeAll(async () => {
  const [proprietario, participante, aguardando, terceiro] = await Promise.all([
    banco.usuario.create({ data: { nome: "Proprietário painel", nomeUsuario: "proprietario-painel-modular", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Ana painel", nomeUsuario: "ana-painel-modular", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Bruno aguardando", nomeUsuario: "bruno-painel-modular", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Terceiro painel", nomeUsuario: "terceiro-painel-modular", senhaHash: "sintetica" } }),
  ]);
  proprietarioId = proprietario.id;
  participanteId = participante.id;
  aguardandoId = aguardando.id;
  terceiroId = terceiro.id;

  const sala = await criarSala(proprietarioId, { nome: "Sala painel modular", descricao: "Isolamento por módulo.", tituloModuloInicial: "Módulo A", descricaoModuloInicial: "Painel A." });
  identificadorSala = sala.identificador;
  moduloAId = (await banco.moduloSala.findFirstOrThrow({ where: { salaId: sala.id, posicao: 1 } })).id;
  moduloBId = (await criarModuloSala(proprietarioId, { salaId: sala.id, titulo: "Módulo B", descricao: "Painel B." })).id;
  await banco.participacaoModuloSala.createMany({ data: [
    { moduloSalaId: moduloAId, usuarioId: participanteId, papel: "PARTICIPANTE" },
    { moduloSalaId: moduloAId, usuarioId: aguardandoId, papel: "PARTICIPANTE" },
  ] });

  const [pessoalProprietarioA, pessoalParticipanteA, pessoalProprietarioB] = await Promise.all([
    criarModuloPessoalComSessao(proprietarioId, "pessoal-a-admin", 10),
    criarModuloPessoalComSessao(participanteId, "pessoal-a-ana", 20),
    criarModuloPessoalComSessao(proprietarioId, "pessoal-b-admin", 90),
  ]);
  await vincularInstanciaModuloSala(proprietarioId, { moduloSalaId: moduloAId, moduloPessoalId: pessoalProprietarioA.id, criarInstancia: false });
  vinculoParticipanteId = (await vincularInstanciaModuloSala(participanteId, { moduloSalaId: moduloAId, moduloPessoalId: pessoalParticipanteA.id, criarInstancia: false })).id;
  await vincularInstanciaModuloSala(proprietarioId, { moduloSalaId: moduloBId, moduloPessoalId: pessoalProprietarioB.id, criarInstancia: false });
  await banco.evidenciaHistoricaModuloSala.create({ data: {
    moduloSalaId: moduloBId,
    contribuinteAnonimoHash: "historico-b",
    referenciaSessaoHash: "sessao-b",
    encerradaEm: new Date("2026-01-11T10:00:00.000Z"),
    duracaoMinutos: 120,
    dificuldadePercebida: 1,
    compreensaoPercebida: 5,
    metodosJson: "[]",
    formatosJson: "[]",
  } });
});

afterAll(fecharBancoTeste);

describe.sequential("dashboard estritamente modular", () => {
  it("calcula somente vínculos e históricos do módulo solicitado", async () => {
    const painel = await obterDashboardModuloSalaDoProprietario(proprietarioId, identificadorSala, moduloAId);
    expect(painel?.id).toBe(moduloAId);
    expect(painel?.individuais.map((individual) => individual.nome).sort()).toEqual(["Ana painel", "Proprietário painel"]);
    expect(painel?.individuais.reduce((total, individual) => total + individual.metricas.tempoEstudo.minutosTotais, 0)).toBe(30);
    expect(painel?.agregado.quantidadeContribuidores).toBe(2);
  });

  it("autoriza somente o proprietário e não transforma participação sem vínculo em contribuição", async () => {
    await expect(obterDashboardModuloSalaDoProprietario(participanteId, identificadorSala, moduloAId)).resolves.toBeNull();
    await expect(obterDashboardModuloSalaDoProprietario(terceiroId, identificadorSala, moduloAId)).resolves.toBeNull();
    expect(await banco.participacaoModuloSala.findUnique({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloAId, usuarioId: aguardandoId } } })).not.toBeNull();
    expect((await obterDashboardModuloSalaDoProprietario(proprietarioId, identificadorSala, moduloAId))?.agregado.quantidadeContribuidores).toBe(2);
  });

  it("autoriza dashboard individual somente para vínculo ativo do módulo administrado", async () => {
    await expect(obterDashboardIndividualAutorizado(proprietarioId, identificadorSala, vinculoParticipanteId)).resolves.toMatchObject({ modulo: { id: moduloAId }, individual: { vinculoId: vinculoParticipanteId } });
    await expect(obterDashboardIndividualAutorizado(participanteId, identificadorSala, vinculoParticipanteId)).resolves.toBeNull();
    await banco.vinculoModuloSala.update({ where: { id: vinculoParticipanteId }, data: { situacao: "DESVINCULADO" } });
    await expect(obterDashboardIndividualAutorizado(proprietarioId, identificadorSala, vinculoParticipanteId)).resolves.toBeNull();
  });
});
