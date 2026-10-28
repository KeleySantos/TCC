-- A Sala passa a organizar módulos; participação e convite tornam-se modulares.
-- Registros legados são preservados, mas MembroSala deixa de autorizar novos acessos.
PRAGMA foreign_keys=OFF;

CREATE TABLE "ParticipacaoModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "papel" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
  "situacao" TEXT NOT NULL DEFAULT 'ATIVA',
  "entrouEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "encerrouEm" DATETIME,
  CONSTRAINT "ParticipacaoModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ParticipacaoModuloSala_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ParticipacaoModuloSala_moduloSalaId_usuarioId_key" ON "ParticipacaoModuloSala"("moduloSalaId", "usuarioId");
CREATE INDEX "ParticipacaoModuloSala_usuarioId_situacao_idx" ON "ParticipacaoModuloSala"("usuarioId", "situacao");
CREATE INDEX "ParticipacaoModuloSala_moduloSalaId_situacao_idx" ON "ParticipacaoModuloSala"("moduloSalaId", "situacao");

CREATE TABLE "ConviteModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "criadoPorId" TEXT NOT NULL,
  "codigoHash" TEXT NOT NULL,
  "expiraEm" DATETIME NOT NULL,
  "revogadoEm" DATETIME,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConviteModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConviteModuloSala_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ConviteModuloSala_codigoHash_key" ON "ConviteModuloSala"("codigoHash");
CREATE INDEX "ConviteModuloSala_moduloSalaId_revogadoEm_expiraEm_idx" ON "ConviteModuloSala"("moduloSalaId", "revogadoEm", "expiraEm");

-- O proprietário administra cada módulo existente, mesmo sem instância pessoal vinculada.
INSERT INTO "ParticipacaoModuloSala" (
  "id", "moduloSalaId", "usuarioId", "papel", "situacao", "entrouEm"
)
SELECT
  'participacao-admin-' || m."id", m."id", s."proprietarioId", 'ADMINISTRADOR', 'ATIVA', m."criadoEm"
FROM "ModuloSala" m
JOIN "Sala" s ON s."id" = m."salaId";

-- Todo vínculo legado recebe uma participação correspondente. Quando o usuário
-- já é o administrador do módulo, a participação administrativa é reutilizada.
INSERT INTO "ParticipacaoModuloSala" (
  "id", "moduloSalaId", "usuarioId", "papel", "situacao", "entrouEm", "encerrouEm"
)
SELECT
  'participacao-vinculo-' || v."id",
  v."moduloSalaId",
  v."usuarioId",
  'PARTICIPANTE',
  CASE WHEN v."situacao" = 'ATIVO' THEN 'ATIVA' ELSE 'SAIU' END,
  v."vinculadoEm",
  CASE WHEN v."situacao" = 'ATIVO' THEN NULL ELSE COALESCE(v."desvinculadoEm", v."vinculadoEm") END
FROM "VinculoModuloSala" v
WHERE NOT EXISTS (
  SELECT 1 FROM "ParticipacaoModuloSala" p
  WHERE p."moduloSalaId" = v."moduloSalaId" AND p."usuarioId" = v."usuarioId"
);

CREATE TABLE "nova_VinculoModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "participacaoModuloSalaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "moduloPessoalId" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "compartilharDashboard" BOOLEAN NOT NULL DEFAULT true,
  "vinculadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dadosDesde" DATETIME,
  "desvinculadoEm" DATETIME,
  CONSTRAINT "VinculoModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_participacaoModuloSalaId_fkey" FOREIGN KEY ("participacaoModuloSalaId") REFERENCES "ParticipacaoModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_moduloPessoalId_fkey" FOREIGN KEY ("moduloPessoalId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "nova_VinculoModuloSala" (
  "id", "moduloSalaId", "participacaoModuloSalaId", "usuarioId", "moduloPessoalId",
  "situacao", "compartilharDashboard", "vinculadoEm", "dadosDesde", "desvinculadoEm"
)
SELECT
  v."id", v."moduloSalaId", p."id", v."usuarioId", v."moduloPessoalId",
  v."situacao", v."compartilharDashboard", v."vinculadoEm", v."dadosDesde", v."desvinculadoEm"
FROM "VinculoModuloSala" v
JOIN "ParticipacaoModuloSala" p
  ON p."moduloSalaId" = v."moduloSalaId" AND p."usuarioId" = v."usuarioId";

DROP TABLE "VinculoModuloSala";
ALTER TABLE "nova_VinculoModuloSala" RENAME TO "VinculoModuloSala";
CREATE UNIQUE INDEX "VinculoModuloSala_participacaoModuloSalaId_key" ON "VinculoModuloSala"("participacaoModuloSalaId");
CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_usuarioId_key" ON "VinculoModuloSala"("moduloSalaId", "usuarioId");
CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_moduloPessoalId_key" ON "VinculoModuloSala"("moduloSalaId", "moduloPessoalId");
CREATE INDEX "VinculoModuloSala_participacaoModuloSalaId_situacao_idx" ON "VinculoModuloSala"("participacaoModuloSalaId", "situacao");
CREATE INDEX "VinculoModuloSala_usuarioId_situacao_idx" ON "VinculoModuloSala"("usuarioId", "situacao");
CREATE INDEX "VinculoModuloSala_moduloPessoalId_situacao_idx" ON "VinculoModuloSala"("moduloPessoalId", "situacao");

-- Convites genéricos não possuem escopo modular inferível e deixam de ser aceitos.
UPDATE "ConviteSala" SET "revogadoEm" = CURRENT_TIMESTAMP WHERE "revogadoEm" IS NULL;

PRAGMA foreign_keys=ON;
