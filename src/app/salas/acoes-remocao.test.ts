import { afterAll, beforeEach, expect, it, vi } from "vitest";

vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));
const fronteiras = vi.hoisted(() => ({
  usuarioId: "",
  revalidar: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: fronteiras.revalidar }));
vi.mock("next/navigation", () => ({ redirect: (caminho: string) => { throw new Error(`redirecionamento:${caminho}`); } }));
vi.mock("@/servidor/autenticacao", () => ({ exigirUsuario: async () => ({ id: fronteiras.usuarioId }) }));

import { bancoTeste as banco, fecharBancoTeste } from "../../../testes/utilitarios/banco-compartilhamento";
import { criarSala } from "@/servidor/salas";
import { removerParticipanteDaSala } from "./acoes";

afterAll(fecharBancoTeste);
beforeEach(() => { fronteiras.revalidar.mockClear(); });
let sequencia = 0;

async function criarCenario() {
  sequencia += 1;
  const proprietario = await banco.usuario.create({ data: { nome: "Proprietário sintético", nomeUsuario: `dono-action-${sequencia}`, senhaHash: "sintetica" } });
  const participante = await banco.usuario.create({ data: { nome: "Participante sintético", nomeUsuario: `alvo-action-${sequencia}`, senhaHash: "sintetica" } });
  const sala = await criarSala(proprietario.id, { nome: `Sala action ${sequencia}`, descricao: "Cenário sintético da action de remoção.", tituloModuloInicial: "Módulo inicial", descricaoModuloInicial: "Módulo compartilhado." });
  const moduloSala = await banco.moduloSala.findFirstOrThrow({ where: { salaId: sala.id } });
  const pessoal = await banco.moduloAprendizagem.create({ data: { usuarioId: participante.id, titulo: "Pessoal preservado", identificador: `pessoal-action-${sequencia}`, descricao: "Instância pessoal." } });
  const participacao = await banco.participacaoModuloSala.create({ data: { usuarioId: participante.id, moduloSalaId: moduloSala.id } });
  await banco.vinculoModuloSala.create({ data: { usuarioId: participante.id, moduloSalaId: moduloSala.id, participacaoModuloSalaId: participacao.id, moduloPessoalId: pessoal.id } });
  const formulario = new FormData();
  formulario.set("salaId", sala.id);
  formulario.set("usuarioId", participante.id);
  formulario.set("identificadorSala", sala.identificador);
  return { proprietario, participante, sala, pessoal, participacao, formulario };
}

it("autentica, remove no banco e revalida Sala, bibliotecas e módulo pessoal antes de redirecionar", async () => {
  const cenario = await criarCenario();
  fronteiras.usuarioId = cenario.proprietario.id;
  await expect(removerParticipanteDaSala(cenario.formulario)).rejects.toThrow(`redirecionamento:/salas/${cenario.sala.identificador}?sucesso=participante-removido`);
  expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: cenario.participacao.id } })).toMatchObject({ situacao: "REMOVIDA" });
  expect(await banco.moduloAprendizagem.count({ where: { id: cenario.pessoal.id } })).toBe(1);
  expect(fronteiras.revalidar.mock.calls).toEqual([
    ["/salas", "layout"],
    [`/salas/${cenario.sala.identificador}`],
    ["/modulos", "layout"],
    [`/modulos/${cenario.pessoal.identificador}`],
  ]);
});

it("recusa uma requisição forjada pelo participante e não revalida nem altera a participação", async () => {
  const cenario = await criarCenario();
  fronteiras.usuarioId = cenario.participante.id;
  cenario.formulario.set("proprietarioId", cenario.proprietario.id);
  await expect(removerParticipanteDaSala(cenario.formulario)).rejects.toThrow(`redirecionamento:/salas/${cenario.sala.identificador}?erro=indisponivel`);
  expect(await banco.participacaoModuloSala.findUniqueOrThrow({ where: { id: cenario.participacao.id } })).toMatchObject({ situacao: "ATIVA" });
  expect(fronteiras.revalidar).not.toHaveBeenCalled();
});
