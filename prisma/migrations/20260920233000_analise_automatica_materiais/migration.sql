CREATE TABLE "AnaliseMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recursoId" TEXT NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'PENDENTE',
    "versao" TEXT NOT NULL DEFAULT 'analise-material-v1',
    "resumo" TEXT,
    "conceitosJson" TEXT NOT NULL DEFAULT '[]',
    "pontosRevisaoJson" TEXT NOT NULL DEFAULT '[]',
    "metodosSugeridosJson" TEXT NOT NULL DEFAULT '[]',
    "proximasSessoesJson" TEXT NOT NULL DEFAULT '[]',
    "perguntasReflexaoJson" TEXT NOT NULL DEFAULT '[]',
    "origem" TEXT,
    "modelo" TEXT,
    "caracteresExtraidos" INTEGER NOT NULL DEFAULT 0,
    "conteudoTruncado" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "codigoFalha" TEXT,
    "hashConteudo" TEXT,
    "analisadaEm" DATETIME,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadaEm" DATETIME NOT NULL,
    CONSTRAINT "AnaliseMaterial_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AnaliseMaterial_recursoId_key" ON "AnaliseMaterial"("recursoId");
CREATE INDEX "AnaliseMaterial_situacao_atualizadaEm_idx" ON "AnaliseMaterial"("situacao", "atualizadaEm");

INSERT INTO "AnaliseMaterial" (
    "id", "recursoId", "situacao", "atualizadaEm"
)
SELECT
    lower(hex(randomblob(12))),
    r."id",
    CASE
      WHEN lower(a."extensaoNormalizada") IN ('pdf', 'txt', 'docx', 'csv', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'gif') THEN 'PENDENTE'
      ELSE 'NAO_SUPORTADA'
    END,
    CURRENT_TIMESTAMP
FROM "RecursoConteudo" r
JOIN "ArquivoMaterial" a ON a."recursoId" = r."id"
WHERE r."origem" = 'ARQUIVO';
