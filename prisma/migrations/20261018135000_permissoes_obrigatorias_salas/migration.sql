-- Comparação e interpretação por IA passam a ser recursos obrigatórios de todo vínculo ativo.
-- A recriação da tabela preserva integralmente os vínculos e remove apenas os dois controles opcionais.
PRAGMA foreign_keys=OFF;

CREATE TABLE "nova_VinculoModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "membroSalaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "moduloPessoalId" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "compartilharDashboard" BOOLEAN NOT NULL DEFAULT true,
  "vinculadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dadosDesde" DATETIME,
  "desvinculadoEm" DATETIME,
  CONSTRAINT "VinculoModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_membroSalaId_fkey" FOREIGN KEY ("membroSalaId") REFERENCES "MembroSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_moduloPessoalId_fkey" FOREIGN KEY ("moduloPessoalId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "nova_VinculoModuloSala" (
  "id", "moduloSalaId", "membroSalaId", "usuarioId", "moduloPessoalId", "situacao",
  "compartilharDashboard", "vinculadoEm", "dadosDesde", "desvinculadoEm"
)
SELECT
  "id", "moduloSalaId", "membroSalaId", "usuarioId", "moduloPessoalId", "situacao",
  "compartilharDashboard", "vinculadoEm", "dadosDesde", "desvinculadoEm"
FROM "VinculoModuloSala";

DROP TABLE "VinculoModuloSala";
ALTER TABLE "nova_VinculoModuloSala" RENAME TO "VinculoModuloSala";
CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_usuarioId_key" ON "VinculoModuloSala"("moduloSalaId", "usuarioId");
CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_moduloPessoalId_key" ON "VinculoModuloSala"("moduloSalaId", "moduloPessoalId");
CREATE INDEX "VinculoModuloSala_membroSalaId_situacao_idx" ON "VinculoModuloSala"("membroSalaId", "situacao");
CREATE INDEX "VinculoModuloSala_usuarioId_situacao_idx" ON "VinculoModuloSala"("usuarioId", "situacao");
CREATE INDEX "VinculoModuloSala_moduloPessoalId_situacao_idx" ON "VinculoModuloSala"("moduloPessoalId", "situacao");

PRAGMA foreign_keys=ON;
