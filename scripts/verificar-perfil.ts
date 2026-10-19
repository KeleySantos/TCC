import "dotenv/config";
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const pasta = mkdtempSync(join(tmpdir(), "tcc-perfil-"));
process.env.DATABASE_URL = `file:${join(pasta, "teste.db")}`;
process.env.DIRETORIO_ARQUIVOS_MATERIAIS = join(pasta, "arquivos");
process.env["CHAVE_MESTRA_CREDENCIAIS_IA"] = randomBytes(32).toString("base64");
execFileSync(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/migrar-banco.ts"], { env: process.env, stdio: "pipe" });
const { prisma } = await import("../src/biblioteca/prisma");
const perfil = await import("../src/servidor/perfil");
const salas = await import("../src/servidor/salas");
const { criarHashSenha, verificarSenha } = await import("../src/servidor/senhas");
const { provisionarAdministradorIa } = await import("../src/servidor/ia/conta-admin");
const arquivos = await import("../src/servidor/arquivos-materiais");

try {
  const [a, b] = await Promise.all(["a", "b"].map((nome) => prisma.usuario.create({ data: { nome: `Conta ${nome}`, nomeUsuario: `conta.${nome}`, senhaHash: criarHashSenha("SenhaSintetica2026") } })));
  const [moduloA, moduloB] = await Promise.all([a, b].map((usuario) => prisma.moduloAprendizagem.create({ data: { usuarioId: usuario.id, identificador: "teste-perfil", titulo: "Módulo sintético", descricao: "Dados isolados de teste." } })));
  const chaveArquivo = arquivos.criarChaveArmazenamentoArquivo();
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toBuffer();
  await arquivos.gravarArquivoMaterial(chaveArquivo, png);
  const material = await prisma.recursoConteudo.create({ data: {
    moduloId: moduloA.id, identificador: "arquivo-perfil", titulo: "Imagem sintética", descricao: "Arquivo para teste de exclusão.", formato: "IMAGEM", minutosEstimados: 10,
    arquivo: { create: { nomeOriginal: "foto.png", tipoMime: "image/png", tamanhoBytes: png.length, chaveArmazenamento: chaveArquivo, extensaoNormalizada: "png" } },
  } });
  for (const [usuario, modulo] of [[a, moduloA], [b, moduloB]] as const) {
    await prisma.sessaoEstudo.create({ data: {
      usuarioId: usuario.id, moduloId: modulo.id, descricao: "Sessão sintética", modoRegistro: "MANUAL", situacao: "CONCLUIDA",
      iniciadaEm: new Date("2026-10-01T10:00:00Z"), encerradaEm: new Date("2026-10-01T10:30:00Z"), duracaoMinutos: 30, compreensaoPercebida: 3,
      metodos: { create: { metodo: "FEYNMAN" } }, formatos: { create: { formato: "TEXTO" } },
      ...(usuario.id === a.id ? { materiais: { create: { recursoId: material.id } } } : {}),
    } });
  }
  const criarSala = (usuarioId: string) => salas.criarSala(usuarioId, { nome: "Sala de teste", descricao: "Sala para teste de exclusão.", tituloModuloInicial: "Módulo coletivo", descricaoModuloInicial: "Agrupamento sintético." });
  const salaA = await criarSala(a.id);
  const salaB = await criarSala(b.id);
  for (const [sala, dono, membro, modulo] of [[salaA, a, b, moduloB], [salaB, b, a, moduloA]] as const) {
    const convite = await salas.gerarConviteSala(dono.id, { salaId: sala.id });
    await salas.entrarSalaComCodigo(membro.id, { codigo: convite.codigo });
    const moduloSala = await prisma.moduloSala.findFirstOrThrow({ where: { salaId: sala.id } });
    await salas.vincularInstanciaModuloSala(membro.id, { moduloSalaId: moduloSala.id, moduloPessoalId: modulo.id, criarInstancia: false });
  }

  await perfil.atualizarNomePerfil(a.id, { nome: "Nome Atualizado", nomeUsuario: "novo.login" });
  assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: a.id } })).nomeUsuario, "novo.login");
  assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: b.id } })).nomeUsuario, "conta.b");
  await assert.rejects(() => perfil.atualizarNomePerfil(a.id, { nome: "Duplicado", nomeUsuario: "conta.b" }), /NOME_EXISTENTE/);
  await assert.rejects(() => perfil.atualizarNomePerfil(a.id, { nome: "Inválido", nomeUsuario: "nome com espaços" }), /DADOS_INVALIDOS/);
  await assert.rejects(() => perfil.atualizarNomePerfil(a.id, { nome: "ADMIN", nomeUsuario: "admin" }), /NOME_EXISTENTE/);
  await assert.rejects(() => perfil.alterarSenhaPerfil(a.id, { senhaAtual: "errada", novaSenha: "NovaSenha2026", confirmarSenha: "NovaSenha2026" }), /SENHA_INCORRETA/);
  await perfil.alterarSenhaPerfil(a.id, { senhaAtual: "SenhaSintetica2026", novaSenha: "NovaSenha2026", confirmarSenha: "NovaSenha2026" });
  const hash = (await prisma.usuario.findUniqueOrThrow({ where: { id: a.id } })).senhaHash;
  assert(verificarSenha("NovaSenha2026", hash));
  assert(!verificarSenha("SenhaSintetica2026", hash));
  await perfil.alterarFotoPerfil(a.id, new File([new Uint8Array(png)], "foto.png", { type: "image/png" }));
  const comFoto = await prisma.usuario.findUniqueOrThrow({ where: { id: a.id } });
  assert.equal((await sharp(comFoto.fotoPerfil!).metadata()).format, "webp");
  assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: b.id } })).fotoPerfil, null);
  assert((await perfil.obterPerfil(a.id)).fotoVersao);
  assert(!Object.hasOwn(await perfil.obterPerfil(a.id), "fotoPerfil"));

  await provisionarAdministradorIa("SenhaAdminSintetica2026");
  const admin = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "admin" } });
  await assert.rejects(() => perfil.atualizarNomePerfil(admin.id, { nome: "ADMIN", nomeUsuario: "outro.admin" }), /ADMIN_PROTEGIDO/);
  await assert.rejects(() => perfil.excluirContaPessoal(admin.id, { senhaAtual: "SenhaAdminSintetica2026", confirmacao: "EXCLUIR" }), /ADMIN_PROTEGIDO/);
  await assert.rejects(() => perfil.excluirContaPessoal(a.id, { senhaAtual: "errada", confirmacao: "EXCLUIR" }), /SENHA_INCORRETA/);
  await assert.rejects(() => perfil.excluirContaPessoal(a.id, { senhaAtual: "NovaSenha2026", confirmacao: "sim" }), /DADOS_INVALIDOS/);
  assert(await arquivos.lerArquivoMaterial(chaveArquivo));
  await perfil.excluirContaPessoal(a.id, { senhaAtual: "NovaSenha2026", confirmacao: "EXCLUIR" });
  assert.equal(await prisma.usuario.findUnique({ where: { id: a.id } }), null);
  assert.equal(await arquivos.lerArquivoMaterial(chaveArquivo), null);
  assert.equal(await prisma.sala.findUnique({ where: { id: salaA.id } }), null);
  assert(await prisma.sala.findUnique({ where: { id: salaB.id } }));
  assert(await prisma.moduloAprendizagem.findUnique({ where: { id: moduloB.id } }));
  assert.equal(await prisma.sessaoEstudo.count({ where: { usuarioId: b.id } }), 1);
  assert.equal(await prisma.evidenciaHistoricaModuloSala.count({ where: { moduloSala: { salaId: salaB.id } } }), 1);
  assert.equal((await prisma.$queryRawUnsafe<unknown[]>("PRAGMA foreign_key_check")).length, 0);
  console.log("Perfil verificado em base isolada: login, nome, senha, foto válida e privada, ADMIN protegido, exclusão confirmada, limpeza de arquivos, preservação de terceiros e histórico pseudonimizado. Nenhuma API externa chamada.");
} finally {
  await prisma.$disconnect();
  // Somente os arquivos da pasta temporária criada por este teste são removidos.
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) { for (const arquivo of readdirSync(caminho)) unlinkSync(join(caminho, arquivo)); rmdirSync(caminho); }
    else unlinkSync(caminho);
  }
  rmdirSync(pasta);
}
