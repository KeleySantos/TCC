import "dotenv/config";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { prisma } from "../src/biblioteca/prisma";
import { gerarCodigoCompartilhamentoModulo } from "../src/servidor/compartilhamento-modulos";

const nomeUsuario = "compartilhamento-interface-temporario";
const marcador = "fixture-interface-sem-login";
try {
  if (process.argv.includes("--preparar-interface")) {
    if (await prisma.usuario.findUnique({ where: { nomeUsuario } })) throw new Error("A conta de teste já existe; confira a fixture antes de repetir.");
    const usuario = await prisma.usuario.create({ data: { nomeUsuario, nome: "Proprietário sintético de teste", senhaHash: marcador } });
    const modulo = await prisma.moduloAprendizagem.create({ data: { usuarioId: usuario.id, identificador: "dashboard-temporario-de-teste", titulo: "Dashboard temporário de teste", descricao: "Fixture descartável; não pertence ao corpus do TCC." } });
    await prisma.sessaoEstudo.create({ data: { usuarioId: usuario.id, moduloId: modulo.id, descricao: "DESCRICAO_PRIVADA_NAO_COMPARTILHAR", iniciadaEm: new Date("2026-10-01T10:00Z"), encerradaEm: new Date("2026-10-01T10:30Z"), duracaoMinutos: 30, modoRegistro: "MANUAL", situacao: "CONCLUIDA", dificuldadePercebida: 2, compreensaoPercebida: 4 } });
    const convite = await gerarCodigoCompartilhamentoModulo(usuario.id, modulo.id);
    console.log(JSON.stringify({ moduloId: modulo.id, codigoTemporario: convite.codigo, descarte: "Executar novamente com --limpar-interface após o teste." }));
  } else if (process.argv.includes("--limpar-interface")) {
    const usuario = await prisma.usuario.findUnique({ where: { nomeUsuario }, select: { id: true, senhaHash: true, modulos: { select: { identificador: true } } } });
    if (usuario && (usuario.senhaHash !== marcador || usuario.modulos.some((modulo) => modulo.identificador !== "dashboard-temporario-de-teste"))) throw new Error("Conta não corresponde exclusivamente à fixture; limpeza recusada.");
    if (usuario) await prisma.usuario.delete({ where: { id: usuario.id } });
    console.log("Fixture temporária removida com seus módulos, sessões e vínculos por cascade; demais contas preservadas.");
  } else {
    execFileSync(process.execPath, [resolve("node_modules/vitest/vitest.mjs"), "run", "--maxWorkers=2", "src/servidor/compartilhamento-modulos.test.ts", "src/servidor/dashboard-compartilhado.test.ts", "src/servidor/ia/interpretacao-compartilhada.test.ts", "src/servidor/api-compartilhamentos.test.ts"], { stdio: "inherit" });
  }
} finally { await prisma.$disconnect(); }
