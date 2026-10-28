import BancoDados from "better-sqlite3";
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

const nomeMigracao = "20261028120000_participacao_modular_salas";

it("migra autorização de Sala para participações modulares sem ampliar acesso", () => {
  const diretorio = mkdtempSync(join(tmpdir(), "tcc-participacao-modular-"));
  const banco = new BancoDados(join(diretorio, "teste.db"));

  try {
    const migracoesAnteriores = readdirSync(resolve("prisma/migrations"))
      .filter((nome) => nome < nomeMigracao)
      .sort();
    for (const nome of migracoesAnteriores) {
      banco.exec(readFileSync(resolve("prisma/migrations", nome, "migration.sql"), "utf8"));
    }

    banco.exec(`
      INSERT INTO "Usuario" ("id", "nome", "nomeUsuario", "senhaHash", "administradorIa", "papel", "criadoEm", "atualizadoEm")
      VALUES ('dono', 'Dono', 'dono-modular', 'sintetica', false, 'ALUNO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
             ('membro', 'Membro', 'membro-modular', 'sintetica', false, 'ALUNO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      INSERT INTO "Sala" ("id", "proprietarioId", "identificador", "nome", "descricao", "situacao", "criadaEm", "atualizadaEm")
      VALUES ('sala', 'dono', 'sala-modular', 'Sala', 'Fixture modular', 'ATIVA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      INSERT INTO "MembroSala" ("id", "salaId", "usuarioId", "papel", "situacao", "entrouEm")
      VALUES ('membro-dono', 'sala', 'dono', 'PROPRIETARIO', 'ATIVO', CURRENT_TIMESTAMP),
             ('membro-comum', 'sala', 'membro', 'MEMBRO', 'ATIVO', CURRENT_TIMESTAMP);
      INSERT INTO "ModuloAprendizagem" ("id", "usuarioId", "identificador", "titulo", "descricao", "arquivado", "rascunho", "criadoEm", "atualizadoEm")
      VALUES ('pessoal', 'membro', 'pessoal', 'Pessoal', 'Fixture pessoal', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      INSERT INTO "ModuloSala" ("id", "salaId", "titulo", "descricao", "posicao", "situacao", "criadoEm", "atualizadoEm")
      VALUES ('modulo-sala', 'sala', 'Módulo A', 'Fixture compartilhada', 1, 'ATIVO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      INSERT INTO "VinculoModuloSala" ("id", "moduloSalaId", "membroSalaId", "usuarioId", "moduloPessoalId", "situacao", "compartilharDashboard", "vinculadoEm")
      VALUES ('vinculo', 'modulo-sala', 'membro-comum', 'membro', 'pessoal', 'ATIVO', true, CURRENT_TIMESTAMP);
      INSERT INTO "ConviteSala" ("id", "salaId", "criadoPorId", "codigoHash", "expiraEm", "criadoEm")
      VALUES ('convite-legado', 'sala', 'dono', 'hash-legado', '2027-01-01T00:00:00.000Z', CURRENT_TIMESTAMP);
    `);

    const caminhoMigracao = resolve("prisma/migrations", nomeMigracao, "migration.sql");
    expect(existsSync(caminhoMigracao), "a migração modular deve existir").toBe(true);
    banco.exec(readFileSync(caminhoMigracao, "utf8"));

    const participacoes = banco.prepare(`
      SELECT "usuarioId", "papel", "situacao"
      FROM "ParticipacaoModuloSala"
      WHERE "moduloSalaId" = 'modulo-sala'
      ORDER BY "usuarioId"
    `).all();
    expect(participacoes).toEqual([
      { usuarioId: "dono", papel: "ADMINISTRADOR", situacao: "ATIVA" },
      { usuarioId: "membro", papel: "PARTICIPANTE", situacao: "ATIVA" },
    ]);

    const vinculo = banco.prepare(`
      SELECT p."usuarioId"
      FROM "VinculoModuloSala" v
      JOIN "ParticipacaoModuloSala" p ON p."id" = v."participacaoModuloSalaId"
      WHERE v."id" = 'vinculo'
    `).get();
    expect(vinculo).toEqual({ usuarioId: "membro" });

    const convite = banco.prepare('SELECT "revogadoEm" FROM "ConviteSala" WHERE "id" = ?').get("convite-legado") as { revogadoEm: string | null };
    expect(convite.revogadoEm).not.toBeNull();
    expect(banco.pragma("foreign_key_check")).toEqual([]);
  } finally {
    banco.close();
    rmSync(diretorio, { recursive: true, force: true });
  }
});
