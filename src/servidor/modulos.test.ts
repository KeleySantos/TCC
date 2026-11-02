import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));

import { bancoTeste as banco, fecharBancoTeste } from "../../testes/utilitarios/banco-compartilhamento";
import { listarModulosPessoais } from "./modulos";
import { criarSala, entrarModuloSalaComCodigo, gerarConviteModuloSala, vincularInstanciaModuloSala } from "./salas";

let usuarioId: string;
let convidadoId: string;
let moduloVinculadoId: string;
let moduloDiretoId: string;

beforeAll(async () => {
  const [usuario, convidado, proprietarioSala] = await Promise.all([
    banco.usuario.create({ data: { nome: "Usuário", nomeUsuario: "usuario-listagem-modulos", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Convidado", nomeUsuario: "convidado-listagem-modulos", senhaHash: "sintetica" } }),
    banco.usuario.create({ data: { nome: "Proprietário", nomeUsuario: "proprietario-listagem-modulos", senhaHash: "sintetica" } }),
  ]);
  usuarioId = usuario.id;
  convidadoId = convidado.id;
  moduloVinculadoId = (await banco.moduloAprendizagem.create({ data: {
    usuarioId,
    identificador: "instancia-vinculada",
    titulo: "Instância vinculada",
    descricao: "Módulo conectado a uma Sala.",
  } })).id;
  moduloDiretoId = (await banco.moduloAprendizagem.create({ data: {
    usuarioId,
    identificador: "compartilhamento-direto",
    titulo: "Compartilhamento direto",
    descricao: "Módulo compartilhado diretamente.",
  } })).id;
  await banco.acessoModuloCompartilhado.create({ data: { moduloId: moduloDiretoId, convidadoId, vaga: 1 } });

  const sala = await criarSala(proprietarioSala.id, {
    nome: "Sala da listagem",
    descricao: "Sala usada para distinguir as duas origens.",
    tituloModuloInicial: "Módulo compartilhado",
    descricaoModuloInicial: "Módulo da Sala para o vínculo ativo.",
  });
  const moduloSala = await banco.moduloSala.findFirstOrThrow({ where: { salaId: sala.id } });
  const convite = await gerarConviteModuloSala(proprietarioSala.id, { moduloSalaId: moduloSala.id });
  await entrarModuloSalaComCodigo(usuarioId, { codigo: convite.codigo });
  await vincularInstanciaModuloSala(usuarioId, { moduloSalaId: moduloSala.id, moduloPessoalId: moduloVinculadoId, criarInstancia: false });
});

afterAll(fecharBancoTeste);

describe.sequential("listagem de módulos pessoais", () => {
  it("distingue compartilhamento direto de vínculo ativo com Sala", async () => {
    const modulos = await listarModulosPessoais(usuarioId);
    const vinculado = modulos.find((modulo) => modulo.id === moduloVinculadoId);
    const direto = modulos.find((modulo) => modulo.id === moduloDiretoId);

    expect(vinculado).toMatchObject({
      quantidadeCompartilhamentosDiretosAtivos: 0,
      vinculoSalaAtivo: {
        moduloPessoalId: moduloVinculadoId,
        situacao: "ATIVO",
      },
    });
    expect(direto).toMatchObject({
      quantidadeCompartilhamentosDiretosAtivos: 1,
      vinculoSalaAtivo: null,
    });
  });

  it("mantém o módulo após desligamento e remove somente seu estado de Sala compartilhada", async () => {
    const vinculo = await banco.vinculoModuloSala.findFirstOrThrow({ where: { moduloPessoalId: moduloVinculadoId, situacao: "ATIVO" } });
    await banco.vinculoModuloSala.update({ where: { id: vinculo.id }, data: { situacao: "DESVINCULADO", compartilharDashboard: false, desvinculadoEm: new Date() } });

    const modulos = await listarModulosPessoais(usuarioId);
    expect(modulos.find((modulo) => modulo.id === moduloVinculadoId)).toMatchObject({
      id: moduloVinculadoId,
      quantidadeCompartilhamentosDiretosAtivos: 0,
      vinculoSalaAtivo: null,
    });
  });
});
