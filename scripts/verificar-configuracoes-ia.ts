import "dotenv/config";
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Base e chave mestra isoladas: nenhuma configuração real é alterada pelo teste.
const pasta = mkdtempSync(join(tmpdir(), "tcc-ia-global-"));
process.env.DATABASE_URL = `file:${join(pasta, "teste.db")}`;
process.env["CHAVE_MESTRA_CREDENCIAIS_IA"] = randomBytes(32).toString("base64");
execFileSync(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/migrar-banco.ts"], { cwd: process.cwd(), env: process.env, stdio: "pipe" });

const { prisma } = await import("../src/biblioteca/prisma");
const configuracoes = await import("../src/servidor/ia/configuracoes");
const { provisionarAdministradorIa } = await import("../src/servidor/ia/conta-admin");
const { contextoCredencial } = await import("../src/servidor/ia/catalogo-provedores");
const { cifrarCredencial, obterChaveMestraCredenciais } = await import("../src/servidor/ia/cofre-credenciais");
const { verificarSenha } = await import("../src/servidor/senhas");

try {
  const [a, b] = await Promise.all(["A", "B"].map((nome) => prisma.usuario.create({ data: { nome: `Conta ${nome}`, nomeUsuario: `conta.${nome.toLowerCase()}`, senhaHash: "hash-sintetico" } })));
  const segredoAntigo = "credencial-ficticia-anterior";
  const mestra = await obterChaveMestraCredenciais();
  await prisma.configuracaoIa.create({ data: { usuarioId: a.id, provedor: "GROQ", ...cifrarCredencial(segredoAntigo, contextoCredencial(a.id, "GROQ"), mestra), estadoUltimoTeste: "FUNCIONANDO" } });
  assert.equal((await configuracoes.listarCredenciaisAtivas()).length, 0, "Credenciais pessoais antigas não devem ser usadas globalmente.");

  const criada = await provisionarAdministradorIa("SenhaSintetica.Admin2026");
  const admin = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "admin" } });
  assert.equal(criada.criada, true);
  assert.equal(criada.chaveMigrada, true);
  assert.equal(admin.nome, "ADMIN");
  assert.equal(admin.administradorIa, true);
  assert(verificarSenha("SenhaSintetica.Admin2026", admin.senhaHash));
  assert.equal((await configuracoes.listarCredenciaisAtivas())[0]?.chave, segredoAntigo);
  assert.equal((await provisionarAdministradorIa()).criada, false, "Reprovisionar não deve trocar senha nem chave.");

  for (const operacao of [
    () => configuracoes.salvarConfiguracaoIa(a.id, "GROQ", "credencial-ficticia-indevida"),
    () => configuracoes.listarConfiguracoesIaSeguras(a.id),
    () => configuracoes.obterCredencialConfigurada(b.id, "GROQ"),
    () => configuracoes.definirConfiguracaoIaAtiva(b.id, "GROQ", false),
    () => configuracoes.removerConfiguracaoIa(a.id, "GROQ"),
    () => configuracoes.desativarTodasConfiguracoesIa(b.id),
  ]) await assert.rejects(operacao, /CONFIGURACAO_IA_RESTRITA_ADMIN/);

  const segredoNovo = "credencial-ficticia-global-atualizada";
  await configuracoes.salvarConfiguracaoIa(admin.id, "GROQ", segredoNovo);
  const persistida = await prisma.configuracaoIa.findUniqueOrThrow({ where: { usuarioId_provedor: { usuarioId: admin.id, provedor: "GROQ" } } });
  assert(!JSON.stringify(persistida).includes(segredoNovo));
  assert.equal(await configuracoes.obterCredencialConfigurada(admin.id, "GROQ"), segredoNovo);
  const segura = await configuracoes.listarConfiguracoesIaSeguras(admin.id);
  assert(segura[0]?.configurada && !JSON.stringify(segura).includes(segredoNovo));
  assert.equal((await configuracoes.listarCredenciaisAtivas())[0]?.chave, segredoNovo);

  process.env.GROQ_API_KEY = "valor-ficticio";
  await configuracoes.definirConfiguracaoIaAtiva(admin.id, "GROQ", false);
  assert.equal((await configuracoes.listarCredenciaisAtivas()).length, 0, "Ambiente ou configuração pessoal não podem contornar a desativação global.");
  await configuracoes.definirConfiguracaoIaAtiva(admin.id, "GROQ", true);
  await configuracoes.registrarEstadoConfiguracaoIa(b.id, "GROQ", "LIMITADA", new Date(Date.now() + 60_000));
  assert.equal((await configuracoes.listarCredenciaisAtivas()).length, 0, "Falhas da chave global devem ser respeitadas por todas as contas.");
  await configuracoes.registrarEstadoConfiguracaoIa(a.id, "GROQ", "FUNCIONANDO");
  assert.equal((await configuracoes.listarCredenciaisAtivas())[0]?.chave, segredoNovo);
  await configuracoes.desativarTodasConfiguracoesIa(admin.id);
  assert.equal((await configuracoes.listarCredenciaisAtivas()).length, 0);
  await configuracoes.removerConfiguracaoIa(admin.id, "GROQ");
  assert.equal(await configuracoes.obterCredencialConfigurada(admin.id, "GROQ"), null);
  assert.equal((await configuracoes.listarCredenciaisAtivas()).length, 0);
  console.log("Configuração global de IA verificada em banco isolado: ADMIN, senha com hash, migração cifrada, autorização, chave atualizada, bloqueio, desativação e remoção. Nenhuma API externa chamada.");
} finally {
  await prisma.$disconnect();
  for (const arquivo of readdirSync(pasta)) unlinkSync(resolve(pasta, arquivo));
  rmdirSync(pasta);
}
