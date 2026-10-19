import { afterAll, beforeAll, expect, it, vi } from "vitest";
vi.mock("@/biblioteca/prisma", async () => ({ prisma: (await import("../../../testes/utilitarios/banco-compartilhamento")).bancoTeste }));
vi.mock("./configuracoes", () => ({ listarCredenciaisAtivas: async () => [] }));
import { bancoTeste as banco, fecharBancoTeste } from "../../../testes/utilitarios/banco-compartilhamento";
import { aceitarCodigoModulo, gerarCodigoCompartilhamentoModulo, removerAcessoModulo } from "../compartilhamento-modulos";
import { criarDtoCompartilhado, gerarInterpretacaoCompartilhada } from "./interpretacao-compartilhada";
import { gerarRespostaLocal } from "@/dominio/interpretacoes/resposta-local";
import { interpretarDtoAutorizado } from "./interpretacoes";
let dono: string, convidado: string, moduloId: string;
beforeAll(async () => {
  const usuarios = await Promise.all(["Dono", "Convidado"].map((nome) => banco.usuario.create({ data: { nome, nomeUsuario: nome, senhaHash: "sintetica" } })));
  [dono, convidado] = usuarios.map((u) => u.id);
  moduloId = (await banco.moduloAprendizagem.create({ data: { usuarioId: dono, identificador: "teste", titulo: "Estudo", descricao: "Privado" } })).id;
  await banco.sessaoEstudo.create({ data: { usuarioId: dono, moduloId, descricao: "SESSAO_PRIVADA", iniciadaEm: new Date("2026-10-01T10:00Z"), encerradaEm: new Date("2026-10-01T11:00Z"), duracaoMinutos: 60, modoRegistro: "MANUAL", situacao: "CONCLUIDA" } });
  await banco.recursoConteudo.create({ data: { moduloId, identificador: "privado", titulo: "MATERIAL_PRIVADO_IA", descricao: "Privado", formato: "TEXTO", minutosEstimados: 10, conteudoTexto: "CONTEUDO_PRIVADO_IA" } });
  const convite = await gerarCodigoCompartilhamentoModulo(dono, moduloId);
  await aceitarCodigoModulo(convidado, { codigo: convite.codigo });
});
afterAll(fecharBancoTeste);
it("DTO usa os dados do módulo e exclui descrições, títulos de materiais e recomendações privadas", async () => {
  const dto = await criarDtoCompartilhado(convidado, moduloId);
  expect(dto.minutosValidos).toBe(60);
  expect(dto.descricoesSessoes).toEqual([]);
  expect(dto.recomendacoes).toEqual([]);
  expect(dto.aprendizagemModulo?.eventosRecentes).toEqual([]);
  expect(JSON.stringify(dto)).not.toContain("SESSAO_PRIVADA");
  expect(JSON.stringify(dto)).not.toContain(dono);
  expect(JSON.stringify(dto)).not.toContain("MATERIAL_PRIVADO_IA");
  expect(JSON.stringify(dto)).not.toContain("CONTEUDO_PRIVADO_IA");
});
it("nega acesso antes da IA e usa contingência existente sem chamar provedor real", async () => {
  await expect(gerarInterpretacaoCompartilhada("intruso", moduloId)).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
  expect((await gerarInterpretacaoCompartilhada(convidado, moduloId)).origem).toBe("LOCAL");
});
it("a cota do solicitante não consome a cota do proprietário", async () => {
  const dto = await criarDtoCompartilhado(convidado, moduloId);
  let ultima;
  for (let indice = 0; indice < 6; indice++) ultima = await interpretarDtoAutorizado(convidado, dto);
  expect(ultima?.motivoContingencia).toBe("COTA_LOCAL");
  expect((await interpretarDtoAutorizado(dono, dto)).motivoContingencia).toBe("SEM_CHAVE");
});
it("revogação enquanto o provedor aguarda impede a entrega da resposta", async () => {
  let liberar!: () => void;
  let iniciou!: () => void;
  const iniciado = new Promise<void>((resolver) => { iniciou = resolver; });
  const aguardar = new Promise<void>((resolver) => { liberar = resolver; });
  const pedido = gerarInterpretacaoCompartilhada(convidado, moduloId, {}, async (solicitante, dto) => {
    expect(solicitante).toBe(convidado);
    iniciou(); await aguardar;
    return gerarRespostaLocal(dto, "SEM_CHAVE");
  });
  const negado = expect(pedido).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
  await iniciado;
  await removerAcessoModulo(dono, moduloId, convidado);
  liberar();
  await negado;
});
it("revogar e reativar no mesmo milissegundo não valida uma geração iniciada no vínculo anterior", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-18T20:00:00Z"));
  try {
    const convite = await gerarCodigoCompartilhamentoModulo(dono, moduloId);
    await aceitarCodigoModulo(convidado, { codigo: convite.codigo });
    let liberar!: () => void;
    let iniciou!: () => void;
    const iniciado = new Promise<void>((r) => { iniciou = r; });
    const aguardar = new Promise<void>((r) => { liberar = r; });
    const pedido = gerarInterpretacaoCompartilhada(convidado, moduloId, {}, async (_solicitante, dto) => { iniciou(); await aguardar; return gerarRespostaLocal(dto, "SEM_CHAVE"); });
    // A expectativa é registrada antes de resolver a promessa para capturar a falha assíncrona.
    const negado = expect(pedido).rejects.toMatchObject({ codigo: "ACESSO_REVOGADO" });
    await iniciado;
    await removerAcessoModulo(dono, moduloId, convidado);
    await aceitarCodigoModulo(convidado, { codigo: convite.codigo });
    liberar();
    await negado;
  } finally { vi.useRealTimers(); }
});
