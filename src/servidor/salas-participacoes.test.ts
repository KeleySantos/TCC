import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));

import { bancoTeste as banco, fecharBancoTeste } from "../../testes/utilitarios/banco-compartilhamento";
import * as salas from "./salas";

let proprietarioId: string;
let anaId: string;
let brunoId: string;
let carlaId: string;
let danielId: string;
let evaId: string;
let moduloPessoalAnaId: string;
let identificadorSala: string;
let moduloAId: string;
let moduloBId: string;
let moduloCId: string;
let codigoModuloA: string;

function servicosConviteModulo() {
  const modulo = salas as typeof salas & {
    gerarConviteModuloSala: (usuarioId: string, entrada: { moduloSalaId: string }) => Promise<{ id: string; codigo: string; expiraEm: Date }>;
    revogarConviteModuloSala: (usuarioId: string, conviteId: string) => Promise<void>;
    obterContextoConviteModuloSala: (codigo: string) => Promise<{ nomeSala: string; tituloModulo: string } | null>;
    entrarModuloSalaComCodigo: (usuarioId: string, entrada: { codigo: string }) => Promise<{ identificadorSala: string; moduloSalaId: string }>;
  };
  for (const nome of ["gerarConviteModuloSala", "revogarConviteModuloSala", "obterContextoConviteModuloSala", "entrarModuloSalaComCodigo"] as const) {
    expect(typeof modulo[nome], `${nome} deve existir`).toBe("function");
  }
  return modulo;
}

function servicosCicloParticipacao() {
  const modulo = salas as typeof salas & {
    sairDoModuloSala: (usuarioId: string, entrada: { moduloSalaId: string }) => Promise<void>;
    removerParticipanteModuloSala: (usuarioId: string, entrada: { moduloSalaId: string; participacaoId: string }) => Promise<void>;
  };
  for (const nome of ["sairDoModuloSala", "removerParticipanteModuloSala"] as const) {
    expect(typeof modulo[nome], `${nome} deve existir`).toBe("function");
  }
  return modulo;
}

beforeAll(async () => {
  const [proprietario, ana, bruno, carla, daniel, eva] = await Promise.all([
    banco.usuario.create({ data: { nome: "Proprietário", nomeUsuario: "proprietario-participacoes", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Ana", nomeUsuario: "ana-participacoes", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Bruno", nomeUsuario: "bruno-participacoes", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Carla", nomeUsuario: "carla-participacoes", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Daniel", nomeUsuario: "daniel-participacoes", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Eva", nomeUsuario: "eva-participacoes", senhaHash: "sintetica" } }),
  ]);
  proprietarioId = proprietario.id;
  anaId = ana.id;
  brunoId = bruno.id;
  carlaId = carla.id;
  danielId = daniel.id;
  evaId = eva.id;
  moduloPessoalAnaId = (await banco.moduloAprendizagem.create({ data: {
    usuarioId: anaId,
    identificador: "modulo-ana",
    titulo: "Módulo pessoal de Ana",
    descricao: "Fixture pessoal para vínculo.",
  } })).id;

  const sala = await salas.criarSala(proprietarioId, {
    nome: "Sala modular",
    descricao: "Fixture de autorização modular.",
    tituloModuloInicial: "Módulo A",
    descricaoModuloInicial: "Somente participantes autorizados.",
  });
  identificadorSala = sala.identificador;
  moduloAId = (await banco.moduloSala.findFirstOrThrow({ where: { salaId: sala.id, posicao: 1 } })).id;
  moduloBId = (await salas.criarModuloSala(proprietarioId, { salaId: sala.id, titulo: "Módulo B", descricao: "Segundo contexto privado." })).id;
  moduloCId = (await salas.criarModuloSala(proprietarioId, { salaId: sala.id, titulo: "Módulo C", descricao: "Terceiro contexto privado." })).id;

  await banco.participacaoModuloSala.createMany({ data: [
    { moduloSalaId: moduloAId, usuarioId: anaId, papel: "PARTICIPANTE" },
    { moduloSalaId: moduloAId, usuarioId: brunoId, papel: "PARTICIPANTE" },
    { moduloSalaId: moduloBId, usuarioId: brunoId, papel: "PARTICIPANTE" },
    { moduloSalaId: moduloAId, usuarioId: evaId, papel: "PARTICIPANTE" },
    { moduloSalaId: moduloBId, usuarioId: evaId, papel: "PARTICIPANTE" },
  ] });
});

afterAll(fecharBancoTeste);

describe.sequential("autorização modular das Salas", () => {
  it("lista a Sala a partir de uma participação ativa sem exigir instância vinculada", async () => {
    const listagem = await salas.listarSalasDaConta(anaId);
    expect(listagem).toHaveLength(1);
    expect(listagem[0]).toMatchObject({ identificador: identificadorSala, papel: "MEMBRO" });
  });

  it("entrega ao participante somente o módulo autorizado e omite a lista geral", async () => {
    const detalhe = await salas.obterSalaDaConta(anaId, identificadorSala);
    expect(detalhe?.modulos.map((modulo) => modulo.id)).toEqual([moduloAId]);
    expect(detalhe && Object.hasOwn(detalhe, "participantes")).toBe(false);
  });

  it("entrega ao proprietário todos os módulos e participantes deduplicados", async () => {
    const detalhe = await salas.obterSalaDaConta(proprietarioId, identificadorSala);
    expect(detalhe?.modulos.map((modulo) => modulo.id)).toEqual([moduloAId, moduloBId, moduloCId]);
    expect(detalhe && "participantes" in detalhe ? detalhe.participantes : null).toEqual([
      { usuarioId: anaId, nome: "Ana", nomeUsuario: "ana-participacoes", modulos: [{ id: moduloAId, titulo: "Módulo A" }] },
      { usuarioId: brunoId, nome: "Bruno", nomeUsuario: "bruno-participacoes", modulos: [{ id: moduloAId, titulo: "Módulo A" }, { id: moduloBId, titulo: "Módulo B" }] },
      { usuarioId: evaId, nome: "Eva", nomeUsuario: "eva-participacoes", modulos: [{ id: moduloAId, titulo: "Módulo A" }, { id: moduloBId, titulo: "Módulo B" }] },
    ]);
  });

  it("nega metadados de um módulo da mesma Sala sem participação", async () => {
    expect(typeof (salas as Record<string, unknown>).obterModuloSalaDaConta).toBe("function");
    const obterModulo = (salas as typeof salas & { obterModuloSalaDaConta: (usuarioId: string, identificador: string, moduloId: string) => Promise<unknown> }).obterModuloSalaDaConta;
    await expect(obterModulo(anaId, identificadorSala, moduloBId)).resolves.toBeNull();
    await expect(obterModulo(proprietarioId, identificadorSala, moduloCId)).resolves.toMatchObject({ id: moduloCId, papel: "ADMINISTRADOR" });
  });

  it("gera convite com hash somente para o módulo administrado", async () => {
    const servicos = servicosConviteModulo();
    await expect(servicos.gerarConviteModuloSala(anaId, { moduloSalaId: moduloAId })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    const convite = await servicos.gerarConviteModuloSala(proprietarioId, { moduloSalaId: moduloAId });
    codigoModuloA = convite.codigo;
    const persistido = await banco.conviteModuloSala.findUniqueOrThrow({ where: { id: convite.id } });
    expect(persistido.codigoHash).not.toBe(codigoModuloA);
    expect(await servicos.obterContextoConviteModuloSala(codigoModuloA.toLowerCase())).toEqual({ nomeSala: "Sala modular", tituloModulo: "Módulo A" });
  });

  it("aceita somente o módulo do convite e rejeita adesão repetida", async () => {
    const servicos = servicosConviteModulo();
    await expect(servicos.entrarModuloSalaComCodigo(carlaId, { codigo: codigoModuloA })).resolves.toEqual({ identificadorSala, moduloSalaId: moduloAId });
    expect((await salas.obterSalaDaConta(carlaId, identificadorSala))?.modulos.map((modulo) => modulo.id)).toEqual([moduloAId]);
    await expect(servicos.entrarModuloSalaComCodigo(carlaId, { codigo: codigoModuloA })).rejects.toMatchObject({ codigo: "SOLICITACAO_DUPLICADA" });
  });

  it("recusa convites revogados, expirados, de módulo arquivado ou de Sala legada", async () => {
    const servicos = servicosConviteModulo();
    const revogado = await servicos.gerarConviteModuloSala(proprietarioId, { moduloSalaId: moduloBId });
    await servicos.revogarConviteModuloSala(proprietarioId, revogado.id);
    await expect(servicos.entrarModuloSalaComCodigo(danielId, { codigo: revogado.codigo })).rejects.toMatchObject({ codigo: "CONVITE_INVALIDO" });

    const expirado = await servicos.gerarConviteModuloSala(proprietarioId, { moduloSalaId: moduloBId });
    await banco.conviteModuloSala.update({ where: { id: expirado.id }, data: { expiraEm: new Date("2020-01-01T00:00:00.000Z") } });
    await expect(servicos.obterContextoConviteModuloSala(expirado.codigo)).resolves.toBeNull();

    const arquivado = await servicos.gerarConviteModuloSala(proprietarioId, { moduloSalaId: moduloCId });
    await banco.moduloSala.update({ where: { id: moduloCId }, data: { situacao: "ARQUIVADO" } });
    await expect(servicos.entrarModuloSalaComCodigo(danielId, { codigo: arquivado.codigo })).rejects.toMatchObject({ codigo: "CONVITE_INVALIDO" });

    const conviteLegado = await banco.conviteSala.create({ data: {
      salaId: (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId } })).salaId,
      criadoPorId: proprietarioId,
      codigoHash: "hash-legado-novo",
      expiraEm: new Date("2027-01-01T00:00:00.000Z"),
    } });
    await expect(servicos.obterContextoConviteModuloSala(conviteLegado.codigoHash)).resolves.toBeNull();
    await expect(servicos.entrarModuloSalaComCodigo(danielId, { codigo: conviteLegado.codigoHash })).rejects.toMatchObject({ codigo: "CONVITE_INVALIDO" });
  });

  it("vincula módulo pessoal existente ou cria instância somente para participante ativo", async () => {
    const vinculoAna = await salas.vincularInstanciaModuloSala(anaId, { moduloSalaId: moduloAId, moduloPessoalId: moduloPessoalAnaId, criarInstancia: false });
    const participacaoAna = await banco.participacaoModuloSala.findUniqueOrThrow({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloAId, usuarioId: anaId } } });
    expect(vinculoAna.participacaoModuloSalaId).toBe(participacaoAna.id);

    const vinculoCarla = await salas.vincularInstanciaModuloSala(carlaId, { moduloSalaId: moduloAId, criarInstancia: true });
    const pessoalCarla = await banco.moduloAprendizagem.findUniqueOrThrow({ where: { id: vinculoCarla.moduloPessoalId } });
    expect(pessoalCarla).toMatchObject({ usuarioId: carlaId, titulo: "Módulo A" });

    const pessoalDaniel = await banco.moduloAprendizagem.create({ data: { usuarioId: danielId, identificador: "daniel", titulo: "Daniel", descricao: "Sem participação." } });
    await expect(salas.vincularInstanciaModuloSala(danielId, { moduloSalaId: moduloAId, moduloPessoalId: pessoalDaniel.id, criarInstancia: false })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });

  it("sair do último módulo remove o acesso à Sala, mas sair de um preserva os demais", async () => {
    const servicos = servicosCicloParticipacao();
    await servicos.sairDoModuloSala(brunoId, { moduloSalaId: moduloAId });
    expect((await salas.obterSalaDaConta(brunoId, identificadorSala))?.modulos.map((modulo) => modulo.id)).toEqual([moduloBId]);
    await servicos.sairDoModuloSala(brunoId, { moduloSalaId: moduloBId });
    expect(await salas.obterSalaDaConta(brunoId, identificadorSala)).toBeNull();
    expect(await salas.listarSalasDaConta(brunoId)).toEqual([]);
  });

  it("remoção administrativa afeta somente o módulo e preserva a instância pessoal", async () => {
    const servicos = servicosCicloParticipacao();
    const participacao = await banco.participacaoModuloSala.findUniqueOrThrow({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloAId, usuarioId: carlaId } } });
    const vinculo = await banco.vinculoModuloSala.findUniqueOrThrow({ where: { participacaoModuloSalaId: participacao.id } });
    await servicos.removerParticipanteModuloSala(proprietarioId, { moduloSalaId: moduloAId, participacaoId: participacao.id });
    expect((await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: participacao.id } })).situacao).toBe("REMOVIDA");
    expect((await banco.vinculoModuloSala.findUniqueOrThrow({ where: { id: vinculo.id } })).situacao).toBe("DESVINCULADO");
    expect(await banco.moduloAprendizagem.findUnique({ where: { id: vinculo.moduloPessoalId } })).not.toBeNull();
  });

  it("sair da Sala encerra todas as participações modulares do participante", async () => {
    const salaId = (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId } })).salaId;
    await salas.sairDaSala(evaId, { salaId });
    expect(await banco.participacaoModuloSala.count({ where: { usuarioId: evaId, situacao: "ATIVA" } })).toBe(0);
    expect(await salas.obterSalaDaConta(evaId, identificadorSala)).toBeNull();
  });
});
