CREATE TABLE "CompartilhamentoModulo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloId" TEXT NOT NULL,
  "codigoHash" TEXT,
  "chaveCifrada" TEXT,
  "vetorInicializacao" TEXT,
  "etiquetaAutenticacao" TEXT,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "CompartilhamentoModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CompartilhamentoModulo_moduloId_key" ON "CompartilhamentoModulo"("moduloId");
CREATE UNIQUE INDEX "CompartilhamentoModulo_codigoHash_key" ON "CompartilhamentoModulo"("codigoHash");

CREATE TABLE "AcessoModuloCompartilhado" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloId" TEXT NOT NULL,
  "convidadoId" TEXT NOT NULL,
  "vaga" INTEGER CHECK ("vaga" IS NULL OR (typeof("vaga") = 'integer' AND "vaga" BETWEEN 1 AND 3)),
  "concedidoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revogadoEm" DATETIME,
  CONSTRAINT "AcessoModuloCompartilhado_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AcessoModuloCompartilhado_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AcessoModuloCompartilhado_moduloId_convidadoId_key" ON "AcessoModuloCompartilhado"("moduloId", "convidadoId");
CREATE UNIQUE INDEX "AcessoModuloCompartilhado_moduloId_vaga_key" ON "AcessoModuloCompartilhado"("moduloId", "vaga");
CREATE INDEX "AcessoModuloCompartilhado_convidadoId_vaga_idx" ON "AcessoModuloCompartilhado"("convidadoId", "vaga");
