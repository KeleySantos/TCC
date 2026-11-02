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

function servicosInstanciaVinculada() {
  const modulo = salas as typeof salas & {
    atualizarInstanciaVinculada: (usuarioId: string, entrada: { vinculoId: string; titulo: string; descricao: string }) => Promise<{ moduloPessoalId: string; identificador: string }>;
    pararCompartilhamentoInstancia: (usuarioId: string, entrada: { vinculoId: string }) => Promise<{ moduloPessoalId: string }>;
  };
  for (const nome of ["atualizarInstanciaVinculada", "pararCompartilhamentoInstancia"] as const) {
    expect(typeof modulo[nome], `${nome} deve existir`).toBe("function");
  }
  return modulo;
}

function servicosRemocaoDaSala() {
  const modulo = salas as typeof salas & {
    removerUsuarioDaSala: (proprietarioId: string, entrada: { salaId: string; usuarioId: string }) => Promise<{
      participacoesEncerradas: string[];
      modulosPessoaisPreservados: { id: string; identificador: string }[];
    }>;
  };
  expect(typeof modulo.removerUsuarioDaSala, "removerUsuarioDaSala deve existir").toBe("function");
  return modulo;
}

let sequenciaConcorrencia = 0;

async function criarInstanciaParaConcorrencia() {
  sequenciaConcorrencia += 1;
  const usuario = await banco.usuario.create({ data: {
    nome: `Concorrente ${sequenciaConcorrencia}`,
    nomeUsuario: `concorrente-${sequenciaConcorrencia}`,
    senhaHash: "sintetica",
  } });
  const [moduloOriginal, moduloReativado] = await Promise.all([
    banco.moduloAprendizagem.create({ data: {
      usuarioId: usuario.id,
      identificador: `original-${sequenciaConcorrencia}`,
      titulo: `Original ${sequenciaConcorrencia}`,
      descricao: "Instância vista pela requisição antes da intercalação.",
    } }),
    banco.moduloAprendizagem.create({ data: {
      usuarioId: usuario.id,
      identificador: `reativado-${sequenciaConcorrencia}`,
      titulo: `Reativado ${sequenciaConcorrencia}`,
      descricao: "Instância ligada por uma reentrada concorrente.",
    } }),
  ]);
  const participacao = await banco.participacaoModuloSala.create({ data: { moduloSalaId: moduloAId, usuarioId: usuario.id, papel: "PARTICIPANTE" } });
  const vinculo = await banco.vinculoModuloSala.create({ data: {
    moduloSalaId: moduloAId,
    participacaoModuloSalaId: participacao.id,
    usuarioId: usuario.id,
    moduloPessoalId: moduloOriginal.id,
  } });
  return { usuario, moduloOriginal, moduloReativado, participacao, vinculo };
}

function intercalarAntesDaProximaTransacao(mutacao: () => Promise<void>) {
  type ClienteTransacionavel = { $transaction: <T>(operacao: (transacao: unknown) => Promise<T>) => Promise<T> };
  const cliente = banco as unknown as ClienteTransacionavel;
  const executarTransacao = cliente.$transaction.bind(cliente);
  return vi.spyOn(cliente, "$transaction").mockImplementationOnce(async (operacao) => {
    await mutacao();
    return executarTransacao(operacao);
  });
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

  it("edita somente a instância vinculada ativa pertencente ao usuário", async () => {
    const servicos = servicosInstanciaVinculada();
    const vinculo = await banco.vinculoModuloSala.findUniqueOrThrow({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloAId, usuarioId: anaId } } });

    await expect(servicos.atualizarInstanciaVinculada(brunoId, {
      vinculoId: vinculo.id,
      titulo: "Instância indevida",
      descricao: "Outro participante não pode alterar este módulo.",
    })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });

    await expect(servicos.atualizarInstanciaVinculada(anaId, {
      vinculoId: vinculo.id,
      titulo: "Cálculo aplicado",
      descricao: "Instância pessoal atualizada pela participante.",
    })).resolves.toEqual({ moduloPessoalId: moduloPessoalAnaId, identificador: "calculo-aplicado" });
    expect(await banco.moduloAprendizagem.findUnique({ where: { id: moduloPessoalAnaId }, select: { titulo: true, descricao: true } })).toEqual({
      titulo: "Cálculo aplicado",
      descricao: "Instância pessoal atualizada pela participante.",
    });
  });

  it("não edita a instância quando o vínculo deixa de estar ativo antes da autorização transacional", async () => {
    const servicos = servicosInstanciaVinculada();
    const cenario = await criarInstanciaParaConcorrencia();
    const transacao = intercalarAntesDaProximaTransacao(async () => {
      await banco.vinculoModuloSala.update({ where: { id: cenario.vinculo.id }, data: { situacao: "DESVINCULADO", compartilharDashboard: false, desvinculadoEm: new Date() } });
      await banco.participacaoModuloSala.update({ where: { id: cenario.participacao.id }, data: { situacao: "SAIU", encerrouEm: new Date() } });
    });
    try {
      await expect(servicos.atualizarInstanciaVinculada(cenario.usuario.id, {
        vinculoId: cenario.vinculo.id,
        titulo: "Edição obsoleta",
        descricao: "Não pode alcançar o módulo depois do desligamento intercalado.",
      })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    } finally {
      transacao.mockRestore();
    }
    expect(await banco.moduloAprendizagem.findUniqueOrThrow({ where: { id: cenario.moduloOriginal.id }, select: { titulo: true } })).toEqual({ titulo: cenario.moduloOriginal.titulo });
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

  it("para o compartilhamento preservando módulo e evidências da instância", async () => {
    const servicos = servicosInstanciaVinculada();
    const vinculo = await banco.vinculoModuloSala.findUniqueOrThrow({ where: { moduloSalaId_usuarioId: { moduloSalaId: moduloAId, usuarioId: anaId } } });
    const iniciadaEm = new Date("2026-10-20T12:00:00.000Z");
    await banco.sessaoEstudo.create({
      data: {
        usuarioId: anaId,
        moduloId: moduloPessoalAnaId,
        descricao: "Sessão preservada após o desligamento.",
        iniciadaEm,
        encerradaEm: new Date("2026-10-20T12:30:00.000Z"),
        duracaoMinutos: 30,
        situacao: "CONCLUIDA",
      },
    });

    await expect(servicos.pararCompartilhamentoInstancia(brunoId, { vinculoId: vinculo.id })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(servicos.pararCompartilhamentoInstancia(anaId, { vinculoId: vinculo.id })).resolves.toEqual({ moduloPessoalId: moduloPessoalAnaId });
    expect(await banco.moduloAprendizagem.findUnique({ where: { id: moduloPessoalAnaId } })).not.toBeNull();
    expect(await banco.vinculoModuloSala.findUnique({ where: { id: vinculo.id }, select: { situacao: true, compartilharDashboard: true } })).toEqual({
      situacao: "DESVINCULADO",
      compartilharDashboard: false,
    });
    expect(await banco.evidenciaHistoricaModuloSala.count({ where: { moduloSalaId: moduloAId } })).toBeGreaterThan(0);
    await expect(servicos.atualizarInstanciaVinculada(anaId, {
      vinculoId: vinculo.id,
      titulo: "Edição após saída",
      descricao: "Vínculos inativos não podem mais editar pelo contexto da Sala.",
    })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });

  it("retorna o módulo realmente encerrado após uma reentrada intercalada", async () => {
    const servicos = servicosInstanciaVinculada();
    const cenario = await criarInstanciaParaConcorrencia();
    const transacao = intercalarAntesDaProximaTransacao(async () => {
      await banco.vinculoModuloSala.update({
        where: { id: cenario.vinculo.id },
        data: { moduloPessoalId: cenario.moduloReativado.id, vinculadoEm: new Date(), dadosDesde: null },
      });
    });
    try {
      await expect(servicos.pararCompartilhamentoInstancia(cenario.usuario.id, { vinculoId: cenario.vinculo.id })).resolves.toEqual({ moduloPessoalId: cenario.moduloReativado.id });
    } finally {
      transacao.mockRestore();
    }
    expect(await banco.vinculoModuloSala.findUniqueOrThrow({ where: { id: cenario.vinculo.id }, select: { moduloPessoalId: true, situacao: true } })).toEqual({
      moduloPessoalId: cenario.moduloReativado.id,
      situacao: "DESVINCULADO",
    });
  });

  it("não sobrescreve uma remoção intercalada com uma saída obsoleta", async () => {
    const servicos = servicosInstanciaVinculada();
    const cenario = await criarInstanciaParaConcorrencia();
    const transacao = intercalarAntesDaProximaTransacao(async () => {
      await banco.vinculoModuloSala.update({ where: { id: cenario.vinculo.id }, data: { situacao: "DESVINCULADO", compartilharDashboard: false, desvinculadoEm: new Date() } });
      await banco.participacaoModuloSala.update({ where: { id: cenario.participacao.id }, data: { situacao: "REMOVIDA", encerrouEm: new Date() } });
    });
    try {
      await expect(servicos.pararCompartilhamentoInstancia(cenario.usuario.id, { vinculoId: cenario.vinculo.id })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    } finally {
      transacao.mockRestore();
    }
    expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: cenario.participacao.id }, select: { situacao: true } })).toEqual({ situacao: "REMOVIDA" });
  });

  it("remove o usuário da Sala inteira, preserva instâncias/evidências e protege autorização", async () => {
    const servicos = servicosRemocaoDaSala();
    const salaId = (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId }, select: { salaId: true } })).salaId;
    const alvo = await banco.usuario.create({ data: { nome: "Alvo da remoção", nomeUsuario: "alvo-remocao-sala", senhaHash: "sintetica" } });
    const [pessoalA, pessoalB] = await Promise.all([
      banco.moduloAprendizagem.create({ data: { usuarioId: alvo.id, identificador: "preservado-a", titulo: "Preservado A", descricao: "Instância do primeiro módulo." } }),
      banco.moduloAprendizagem.create({ data: { usuarioId: alvo.id, identificador: "preservado-b", titulo: "Preservado B", descricao: "Instância do segundo módulo." } }),
    ]);
    const [participacaoA, participacaoB] = await Promise.all([
      banco.participacaoModuloSala.create({ data: { moduloSalaId: moduloAId, usuarioId: alvo.id, papel: "PARTICIPANTE" } }),
      banco.participacaoModuloSala.create({ data: { moduloSalaId: moduloBId, usuarioId: alvo.id, papel: "PARTICIPANTE" } }),
    ]);
    const [vinculoA, vinculoB] = await Promise.all([
      banco.vinculoModuloSala.create({ data: { moduloSalaId: moduloAId, participacaoModuloSalaId: participacaoA.id, usuarioId: alvo.id, moduloPessoalId: pessoalA.id } }),
      banco.vinculoModuloSala.create({ data: { moduloSalaId: moduloBId, participacaoModuloSalaId: participacaoB.id, usuarioId: alvo.id, moduloPessoalId: pessoalB.id } }),
    ]);
    await Promise.all([
      banco.sessaoEstudo.create({ data: { usuarioId: alvo.id, moduloId: pessoalA.id, descricao: "Evidência A", iniciadaEm: new Date("2026-10-21T10:00:00.000Z"), encerradaEm: new Date("2026-10-21T10:30:00.000Z"), duracaoMinutos: 30, situacao: "CONCLUIDA" } }),
      banco.sessaoEstudo.create({ data: { usuarioId: alvo.id, moduloId: pessoalB.id, descricao: "Evidência B", iniciadaEm: new Date("2026-10-22T10:00:00.000Z"), encerradaEm: new Date("2026-10-22T10:40:00.000Z"), duracaoMinutos: 40, situacao: "CONCLUIDA" } }),
    ]);

    await expect(servicos.removerUsuarioDaSala(anaId, { salaId, usuarioId: alvo.id })).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(servicos.removerUsuarioDaSala(proprietarioId, { salaId, usuarioId: proprietarioId })).rejects.toMatchObject({ codigo: "ESTADO_INVALIDO" });
    await expect(servicos.removerUsuarioDaSala(proprietarioId, { salaId, usuarioId: alvo.id })).resolves.toEqual({
      participacoesEncerradas: expect.arrayContaining([participacaoA.id, participacaoB.id]),
      modulosPessoaisPreservados: expect.arrayContaining([
        { id: pessoalA.id, identificador: pessoalA.identificador },
        { id: pessoalB.id, identificador: pessoalB.identificador },
      ]),
    });
    expect(await banco.participacaoModuloSala.findMany({ where: { id: { in: [participacaoA.id, participacaoB.id] } }, select: { situacao: true } })).toEqual([
      { situacao: "REMOVIDA" },
      { situacao: "REMOVIDA" },
    ]);
    expect(await banco.vinculoModuloSala.findMany({ where: { id: { in: [vinculoA.id, vinculoB.id] } }, select: { situacao: true, compartilharDashboard: true } })).toEqual([
      { situacao: "DESVINCULADO", compartilharDashboard: false },
      { situacao: "DESVINCULADO", compartilharDashboard: false },
    ]);
    expect(await banco.moduloAprendizagem.count({ where: { id: { in: [pessoalA.id, pessoalB.id] } } })).toBe(2);
    expect(await banco.sessaoEstudo.count({ where: { usuarioId: alvo.id, moduloId: { in: [pessoalA.id, pessoalB.id] } } })).toBe(2);
    expect(await banco.evidenciaHistoricaModuloSala.count({ where: { contribuinteAnonimoHash: salas.criarReferenciaContribuinteAnonimo(salaId, alvo.id) } })).toBe(2);
    expect(await salas.obterSalaDaConta(alvo.id, identificadorSala)).toBeNull();
    const salaAposRemocao = await salas.obterSalaDaConta(proprietarioId, identificadorSala);
    if (salaAposRemocao?.papel !== "PROPRIETARIO") throw new Error("Sala deveria estar disponível ao proprietário.");
    expect(salaAposRemocao.participantes.some((participante) => participante.usuarioId === alvo.id)).toBe(false);
  });

  it("encerra também participações sem instância e preserva a participação em outra Sala", async () => {
    const cenario = await criarInstanciaParaConcorrencia();
    const salaId = (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId } })).salaId;
    const semInstancia = await banco.participacaoModuloSala.create({ data: { moduloSalaId: moduloBId, usuarioId: cenario.usuario.id } });
    const outraSala = await salas.criarSala(proprietarioId, { nome: "Outra Sala da remoção", descricao: "Contexto que deve permanecer autorizado.", tituloModuloInicial: "Outro módulo", descricaoModuloInicial: "Fora do escopo da remoção." });
    const outroModulo = await banco.moduloSala.findFirstOrThrow({ where: { salaId: outraSala.id } });
    const outraParticipacao = await banco.participacaoModuloSala.create({ data: { moduloSalaId: outroModulo.id, usuarioId: cenario.usuario.id } });
    const resultado = await salas.removerUsuarioDaSala(proprietarioId, { salaId, usuarioId: cenario.usuario.id });
    expect(resultado.participacoesEncerradas).toHaveLength(2);
    expect(resultado.participacoesEncerradas).toContain(semInstancia.id);
    expect(resultado.modulosPessoaisPreservados).toEqual([{ id: cenario.moduloOriginal.id, identificador: cenario.moduloOriginal.identificador }]);
    expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: semInstancia.id } })).toMatchObject({ situacao: "REMOVIDA" });
    expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: outraParticipacao.id } })).toMatchObject({ situacao: "ATIVA", encerrouEm: null });
  });

  it("reverte participações, vínculos, membro e evidências se a transação falhar ao auditar", async () => {
    const cenario = await criarInstanciaParaConcorrencia();
    const salaId = (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId } })).salaId;
    const membro = await banco.membroSala.create({ data: { salaId, usuarioId: cenario.usuario.id } });
    await banco.sessaoEstudo.create({ data: { usuarioId: cenario.usuario.id, moduloId: cenario.moduloOriginal.id, descricao: "Evidência preservada após falha", iniciadaEm: new Date("2026-10-21T10:00:00.000Z"), encerradaEm: new Date("2026-10-21T10:30:00.000Z"), duracaoMinutos: 30, situacao: "CONCLUIDA" } });
    // Falha real no SQLite de teste, depois das alterações e antes do commit.
    await banco.$executeRawUnsafe(`CREATE TRIGGER impedir_auditoria_remocao BEFORE INSERT ON "EventoAuditoria" WHEN NEW."acao" = 'USUARIO_REMOVIDO_DA_SALA' BEGIN SELECT RAISE(ABORT, 'falha sintética de auditoria'); END`);
    try {
      await expect(salas.removerUsuarioDaSala(proprietarioId, { salaId, usuarioId: cenario.usuario.id })).rejects.toThrow();
    } finally {
      await banco.$executeRawUnsafe("DROP TRIGGER impedir_auditoria_remocao");
    }
    expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: cenario.participacao.id } })).toMatchObject({ situacao: "ATIVA", encerrouEm: null });
    expect(await banco.vinculoModuloSala.findUniqueOrThrow({ where: { id: cenario.vinculo.id } })).toMatchObject({ situacao: "ATIVO", compartilharDashboard: true, desvinculadoEm: null });
    expect(await banco.membroSala.findUniqueOrThrow({ where: { id: membro.id } })).toMatchObject({ situacao: "ATIVO", encerrouEm: null });
    expect(await banco.evidenciaHistoricaModuloSala.count({ where: { contribuinteAnonimoHash: salas.criarReferenciaContribuinteAnonimo(salaId, cenario.usuario.id) } })).toBe(0);
    expect(await banco.eventoAuditoria.count({ where: { alvo: cenario.participacao.id } })).toBe(0);
    expect(await banco.sessaoEstudo.count({ where: { usuarioId: cenario.usuario.id } })).toBe(1);
  });

  it("sair da Sala encerra todas as participações modulares do participante", async () => {
    const salaId = (await banco.moduloSala.findUniqueOrThrow({ where: { id: moduloAId } })).salaId;
    await salas.sairDaSala(evaId, { salaId });
    expect(await banco.participacaoModuloSala.count({ where: { usuarioId: evaId, situacao: "ATIVA" } })).toBe(0);
    expect(await salas.obterSalaDaConta(evaId, identificadorSala)).toBeNull();
  });
});
