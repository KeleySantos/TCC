ALTER TABLE "VinculoModuloSala" ADD COLUMN "dadosDesde" DATETIME;

CREATE TABLE "EvidenciaHistoricaModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "referenciaSessaoHash" TEXT NOT NULL,
  "contribuinteAnonimoHash" TEXT NOT NULL,
  "encerradaEm" DATETIME NOT NULL,
  "duracaoMinutos" INTEGER NOT NULL,
  "dificuldadePercebida" INTEGER,
  "compreensaoPercebida" INTEGER,
  "metodosJson" TEXT NOT NULL,
  "formatosJson" TEXT NOT NULL,
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenciaHistoricaModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EvidenciaHistoricaModuloSala_referenciaSessaoHash_key" ON "EvidenciaHistoricaModuloSala"("referenciaSessaoHash");
CREATE INDEX "EvidenciaHistoricaModuloSala_moduloSalaId_encerradaEm_idx" ON "EvidenciaHistoricaModuloSala"("moduloSalaId", "encerradaEm");
CREATE INDEX "EvidenciaHistoricaModuloSala_moduloSalaId_contribuinteAnonimoHash_idx" ON "EvidenciaHistoricaModuloSala"("moduloSalaId", "contribuinteAnonimoHash");
