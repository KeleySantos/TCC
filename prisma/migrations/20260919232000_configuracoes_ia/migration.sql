-- CreateTable
CREATE TABLE "ConfiguracaoIa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "chaveCifrada" TEXT NOT NULL,
    "vetorInicializacao" TEXT NOT NULL,
    "etiquetaAutenticacao" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "estadoUltimoTeste" TEXT NOT NULL DEFAULT 'NAO_TESTADA',
    "ultimoTesteEm" DATETIME,
    "bloqueadaAte" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "ConfiguracaoIa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoIa_usuarioId_provedor_key" ON "ConfiguracaoIa"("usuarioId", "provedor");

-- CreateIndex
CREATE INDEX "ConfiguracaoIa_usuarioId_ativa_idx" ON "ConfiguracaoIa"("usuarioId", "ativa");

-- CreateIndex
CREATE INDEX "ConfiguracaoIa_bloqueadaAte_idx" ON "ConfiguracaoIa"("bloqueadaAte");
