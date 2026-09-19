-- Tópicos em rascunho preservam a primeira configuração sem nomes artificiais.
ALTER TABLE "Topico" ADD COLUMN "rascunho" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Topico_modulo_ativo_rascunho_indice" ON "Topico"("moduloId", "ativo", "rascunho");

-- A origem explícita evita que a interface infira texto, link ou arquivo a partir de campos opcionais.
ALTER TABLE "RecursoConteudo" ADD COLUMN "origem" TEXT NOT NULL DEFAULT 'TEXTO';
UPDATE "RecursoConteudo"
SET "origem" = CASE WHEN "url" IS NOT NULL THEN 'LINK' ELSE 'TEXTO' END;
CREATE INDEX "RecursoConteudo_topico_origem_ativo_indice" ON "RecursoConteudo"("topicoId", "origem", "ativo");

-- O conteúdo binário fica fora do banco. Esta tabela guarda somente metadados validados e uma chave opaca.
CREATE TABLE "ArquivoMaterial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recursoId" TEXT NOT NULL,
  "nomeOriginal" TEXT NOT NULL,
  "tipoMime" TEXT NOT NULL,
  "tamanhoBytes" INTEGER NOT NULL,
  "chaveArmazenamento" TEXT NOT NULL,
  "extensaoNormalizada" TEXT NOT NULL,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArquivoMaterial_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ArquivoMaterial_recursoId_chave" ON "ArquivoMaterial"("recursoId");
CREATE UNIQUE INDEX "ArquivoMaterial_chaveArmazenamento_chave" ON "ArquivoMaterial"("chaveArmazenamento");
