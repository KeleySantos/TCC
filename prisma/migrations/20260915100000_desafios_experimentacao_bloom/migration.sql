-- A Entrega B preserva sessões existentes: o vínculo com desafio é opcional e começa nulo.
CREATE TABLE "DesafioExperimentacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "metodo" TEXT NOT NULL,
  "meta" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "canceladoEm" DATETIME,
  CONSTRAINT "DesafioExperimentacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DesafioExperimentacao_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DesafioExperimentacao_usuario_modulo_situacao_indice" ON "DesafioExperimentacao"("usuarioId", "moduloId", "situacao");
CREATE INDEX "DesafioExperimentacao_modulo_metodo_situacao_indice" ON "DesafioExperimentacao"("moduloId", "metodo", "situacao");

ALTER TABLE "SessaoEstudo" ADD COLUMN "desafioId" TEXT REFERENCES "DesafioExperimentacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "SessaoEstudo_usuario_desafio_situacao_indice" ON "SessaoEstudo"("usuarioId", "desafioId", "situacao");
