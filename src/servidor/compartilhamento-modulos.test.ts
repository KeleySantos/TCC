import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));
import { bancoTeste as banco, fecharBancoTeste } from "../../testes/utilitarios/banco-compartilhamento";
import * as servico from "./compartilhamento-modulos";
import { criarSala, gerarConviteSala, entrarSalaComCodigo } from "./salas";

let dono: string;
let modulo: string;
let convidados: string[];
let codigo: string;
beforeAll(async () => {
  const contas = await Promise.all(["Dono", "Ana", "Bruno", "Carla", "Diego", "Elisa"].map((nome) => banco.usuario.create({ data: { nome, nomeUsuario: nome, senhaHash: "sintetica" } })));
  dono = contas[0].id;
  convidados = contas.slice(1).map((conta) => conta.id);
  modulo = (await banco.moduloAprendizagem.create({ data: { usuarioId: dono, identificador: "teste", titulo: "Módulo teste", descricao: "Sintético" } })).id;
});
afterAll(fecharBancoTeste);
describe.sequential("Compartilhamento de módulos", () => {
  it("consulta sem criar convite e gera código recuperável apenas pelo proprietário", async () => {
    expect((await servico.obterCompartilhamentoModulo(dono, modulo)).codigo).toBeNull();
    const resumo = await servico.gerarCodigoCompartilhamentoModulo(dono, modulo);
    expect(resumo.codigo).toMatch(/^MOD-/);
    codigo = resumo.codigo!;
    expect((await servico.gerarCodigoCompartilhamentoModulo(dono, modulo)).codigo).toBe(codigo);
    await expect(servico.obterCompartilhamentoModulo(convidados[0], modulo)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });
  it("rejeita código inválido, de sala e do próprio dono", async () => {
    for (const entrada of ["INVALIDO", "SALA-CODIGO", ""]) await expect(servico.aceitarCodigoModulo(convidados[0], { codigo: entrada })).rejects.toMatchObject({ codigo: "CODIGO_INVALIDO" });
    await expect(servico.aceitarCodigoModulo(dono, { codigo })).rejects.toMatchObject({ codigo: "MODULO_PROPRIO" });
    const sala = await criarSala(dono, { nome: "Sala de teste", descricao: "Preservar contexto das salas", tituloModuloInicial: "Módulo coletivo", descricaoModuloInicial: "Contexto independente de teste" });
    const conviteSala = await gerarConviteSala(dono, { salaId: sala.id });
    await expect(servico.aceitarCodigoModulo(convidados[0], { codigo: conviteSala.codigo })).rejects.toMatchObject({ codigo: "CODIGO_INVALIDO" });
    await expect(entrarSalaComCodigo(convidados[0], { codigo })).rejects.toMatchObject({ codigo: "CONVITE_INVALIDO" });
    await entrarSalaComCodigo(convidados[0], { codigo: conviteSala.codigo });
    expect(await banco.membroSala.count({ where: { salaId: sala.id, usuarioId: convidados[0], situacao: "ATIVO" } })).toBe(1);
  });
  it("adesão repetida não consome vaga e duas adesões simultâneas só ocupam a última vaga uma vez", async () => {
    expect((await servico.aceitarCodigoModulo(convidados[0], { codigo: codigo.toLowerCase() })).jaPossuiAcesso).toBe(false);
    expect((await servico.aceitarCodigoModulo(convidados[0], { codigo })).jaPossuiAcesso).toBe(true);
    await servico.aceitarCodigoModulo(convidados[1], { codigo });
    const resultados = await Promise.allSettled(convidados.slice(2, 4).map((id) => servico.aceitarCodigoModulo(id, { codigo })));
    expect(resultados.filter((item) => item.status === "fulfilled")).toHaveLength(1);
    const rejeitado = resultados.find((item) => item.status === "rejected");
    expect(rejeitado?.status === "rejected" && rejeitado.reason.codigo).toBe("CAPACIDADE_COMPLETA");
    expect((await servico.obterCompartilhamentoModulo(dono, modulo)).quantidadeAtivos).toBe(3);
  });
  it("remoção nega leitura e libera vaga, sem permitir a outro convidado revogar", async () => {
    await expect(servico.removerAcessoModulo(convidados[1], modulo, convidados[0])).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await servico.removerAcessoModulo(dono, modulo, convidados[0]);
    expect(await servico.listarModulosCompartilhados(convidados[0])).toEqual([]);
    await expect(servico.exigirAcessoDashboardCompartilhado(convidados[0], modulo)).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
    await servico.aceitarCodigoModulo(convidados[4], { codigo });
    expect((await servico.listarModulosCompartilhados(convidados[4]))[0]).toMatchObject({ titulo: "Módulo teste", proprietarioNome: "Dono" });
  });
  it("encerramento invalida o código e novo código não reativa convidados", async () => {
    await servico.encerrarCompartilhamentoModulo(dono, modulo);
    await expect(servico.aceitarCodigoModulo(convidados[0], { codigo })).rejects.toMatchObject({ codigo: "CODIGO_INVALIDO" });
    expect(await servico.listarModulosCompartilhados(convidados[4])).toEqual([]);
    const novo = await servico.gerarCodigoCompartilhamentoModulo(dono, modulo);
    expect(novo.codigo).not.toBe(codigo);
    expect(novo.quantidadeAtivos).toBe(0);
    codigo = novo.codigo!;
    await servico.aceitarCodigoModulo(convidados[0], { codigo });
  });
  it("arquivamento impede acesso; exclusão remove vínculos por cascade", async () => {
    await banco.moduloAprendizagem.update({ where: { id: modulo }, data: { arquivado: true } });
    expect(await servico.listarModulosCompartilhados(convidados[0])).toEqual([]);
    await expect(servico.exigirAcessoDashboardCompartilhado(convidados[0], modulo)).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
    await banco.moduloAprendizagem.delete({ where: { id: modulo } });
    expect(await banco.acessoModuloCompartilhado.count()).toBe(0);
    expect(await banco.compartilhamentoModulo.count()).toBe(0);
  });
  it("banco recusa quarta posição e elimina o acesso quando o convidado é excluído", async () => {
    const outro = await banco.moduloAprendizagem.create({ data: { usuarioId: dono, identificador: "integridade", titulo: "Integridade", descricao: "Fixture adicional" } });
    await expect(banco.acessoModuloCompartilhado.create({ data: { moduloId: outro.id, convidadoId: convidados[0], vaga: 4 } })).rejects.toBeTruthy();
    const convite = await servico.gerarCodigoCompartilhamentoModulo(dono, outro.id);
    await servico.aceitarCodigoModulo(convidados[4], { codigo: convite.codigo });
    await banco.usuario.delete({ where: { id: convidados[4] } });
    expect((await servico.obterCompartilhamentoModulo(dono, outro.id)).quantidadeAtivos).toBe(0);
    await banco.moduloAprendizagem.update({ where: { id: outro.id }, data: { rascunho: true } });
    await expect(servico.aceitarCodigoModulo(convidados[0], { codigo: convite.codigo })).rejects.toMatchObject({ codigo: "CODIGO_INVALIDO" });
  });
});
