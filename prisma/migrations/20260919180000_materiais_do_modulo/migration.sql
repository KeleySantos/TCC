-- Materiais passam a pertencer diretamente ao módulo. O tópico anterior fica
-- anulável apenas como referência histórica, sem participar de novos fluxos.
PRAGMA foreign_keys=OFF;

CREATE TABLE "nova_RecursoConteudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identificador" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  "minutosEstimados" INTEGER NOT NULL,
  "moduloId" TEXT NOT NULL,
  "topicoId" TEXT,
  "conteudoTexto" TEXT,
  "url" TEXT,
  "origem" TEXT NOT NULL DEFAULT 'TEXTO',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "RecursoConteudo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecursoConteudo_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "nova_RecursoConteudo" (
  "id", "identificador", "titulo", "descricao", "formato", "minutosEstimados",
  "moduloId", "topicoId", "conteudoTexto", "url", "origem", "ativo", "criadoEm", "atualizadoEm"
)
SELECT
  recurso."id",
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM "RecursoConteudo" AS duplicado
      INNER JOIN "Topico" AS topicoDuplicado ON topicoDuplicado."id" = duplicado."topicoId"
      WHERE topicoDuplicado."moduloId" = topico."moduloId"
        AND duplicado."identificador" = recurso."identificador"
        AND duplicado."id" < recurso."id"
    ) THEN substr(recurso."identificador", 1, 60) || '-' || substr(recurso."id", -8)
    ELSE recurso."identificador"
  END,
  recurso."titulo", recurso."descricao", recurso."formato", recurso."minutosEstimados",
  topico."moduloId", recurso."topicoId", recurso."conteudoTexto", recurso."url",
  recurso."origem", recurso."ativo", recurso."criadoEm", recurso."atualizadoEm"
FROM "RecursoConteudo" AS recurso
INNER JOIN "Topico" AS topico ON topico."id" = recurso."topicoId";

DROP TABLE "RecursoConteudo";
ALTER TABLE "nova_RecursoConteudo" RENAME TO "RecursoConteudo";

CREATE UNIQUE INDEX "RecursoConteudo_modulo_identificador_chave" ON "RecursoConteudo"("moduloId", "identificador");
CREATE INDEX "RecursoConteudo_modulo_formato_indice" ON "RecursoConteudo"("moduloId", "formato");
CREATE INDEX "RecursoConteudo_modulo_origem_ativo_indice" ON "RecursoConteudo"("moduloId", "origem", "ativo");
CREATE INDEX "RecursoConteudo_topico_indice" ON "RecursoConteudo"("topicoId");

PRAGMA foreign_keys=ON;
