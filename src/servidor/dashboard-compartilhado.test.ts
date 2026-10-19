import { afterAll, beforeAll, expect, it, vi } from "vitest";
vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));
import { bancoTeste as banco, fecharBancoTeste } from "../../testes/utilitarios/banco-compartilhamento";
import { aceitarCodigoModulo, gerarCodigoCompartilhamentoModulo, removerAcessoModulo } from "./compartilhamento-modulos";
import { obterDashboardCompartilhado } from "./dashboard-compartilhado";
let dono: string, convidado: string, estranho: string, moduloId: string;
beforeAll(async () => {
  const usuarios = await Promise.all(["Proprietário", "Convidado", "Estranho"].map((nome) => banco.usuario.create({ data: { nome, nomeUsuario: nome, senhaHash: "sintetica" } })));
  [dono, convidado, estranho] = usuarios.map((u) => u.id);
  const modulo = await banco.moduloAprendizagem.create({ data: { usuarioId: dono, identificador: "algoritmos", titulo: "Algoritmos", descricao: "DESCRICAO_PRIVADA" } });
  moduloId = modulo.id;
  await banco.sessaoEstudo.create({ data: { usuarioId: dono, moduloId, descricao: "SESSAO_PRIVADA", iniciadaEm: new Date("2026-10-01T10:00Z"), encerradaEm: new Date("2026-10-01T10:30Z"), duracaoMinutos: 30, modoRegistro: "MANUAL", situacao: "CONCLUIDA", compreensaoPercebida: 4, dificuldadePercebida: 2 } });
  await banco.recursoConteudo.create({ data: { moduloId, identificador: "segredo", titulo: "MATERIAL_PRIVADO", descricao: "PRIVADO", formato: "TEXTO", minutosEstimados: 10, conteudoTexto: "CONTEUDO_PRIVADO" } });
  const convite = await gerarCodigoCompartilhamentoModulo(dono, moduloId);
  await aceitarCodigoModulo(convidado, { codigo: convite.codigo });
});
afterAll(fecharBancoTeste);
it("mostra indicadores do proprietário sem devolver os registros privados", async () => {
  const dados = await obterDashboardCompartilhado(convidado, moduloId);
  expect(dados.modulo).toEqual({ id: moduloId, titulo: "Algoritmos", proprietarioNome: "Proprietário" });
  expect(dados.metricas.tempoEstudo.minutosTotais).toBe(30);
  expect(dados.metricas.tempoEstudo.quantidadeSessoesValidas).toBe(1);
  const json = JSON.stringify(dados);
  for (const privado of ["SESSAO_PRIVADA", "MATERIAL_PRIVADO", "CONTEUDO_PRIVADO", "DESCRICAO_PRIVADA", dono]) expect(json).not.toContain(privado);
});
it("rejeita estranho e outro módulo, filtra período e bloqueia acesso removido", async () => {
  await expect(obterDashboardCompartilhado(estranho, moduloId)).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
  await expect(obterDashboardCompartilhado(convidado, "outro-modulo")).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
  const vazio = await obterDashboardCompartilhado(convidado, moduloId, { inicio: new Date("2026-10-02"), fim: new Date("2026-10-03") });
  expect(vazio.metricas.tempoEstudo.quantidadeSessoesValidas).toBe(0);
  await removerAcessoModulo(dono, moduloId, convidado);
  await expect(obterDashboardCompartilhado(convidado, moduloId)).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
});
