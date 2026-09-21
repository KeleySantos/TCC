-- A sessão passa a ser a unidade principal do módulo. As referências antigas
-- permanecem anuláveis durante a transição para preservar o cenário sintético
-- e permitir que os consumidores sejam migrados de forma incremental.
PRAGMA foreign_keys=OFF;

CREATE TABLE "nova_SessaoEstudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "alunoId" TEXT,
  "topicoId" TEXT,
  "recursoId" TEXT,
  "metodo" TEXT,
  "descricao" TEXT NOT NULL DEFAULT '',
  "modoRegistro" TEXT NOT NULL DEFAULT 'CRONOMETRO',
  "dificuldadePercebida" INTEGER,
  "compreensaoPercebida" INTEGER,
  "observacao" TEXT,
  "desafioId" TEXT,
  "iniciadaEm" DATETIME NOT NULL,
  "encerradaEm" DATETIME,
  "duracaoMinutos" INTEGER,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVA',
  "arquivada" BOOLEAN NOT NULL DEFAULT false,
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessaoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "PerfilAluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "DesafioExperimentacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "nova_SessaoEstudo" (
  "id", "usuarioId", "moduloId", "alunoId", "topicoId", "recursoId", "metodo",
  "descricao", "modoRegistro", "dificuldadePercebida", "compreensaoPercebida",
  "observacao", "desafioId", "iniciadaEm", "encerradaEm", "duracaoMinutos",
  "situacao", "arquivada", "criadaEm", "atualizadaEm"
)
SELECT
  sessao."id",
  sessao."usuarioId",
  sessao."moduloId",
  sessao."alunoId",
  sessao."topicoId",
  sessao."recursoId",
  sessao."metodo",
  CASE
    WHEN topico."nome" IS NOT NULL AND recurso."titulo" IS NOT NULL
      THEN 'Estudo de ' || topico."nome" || ' com o material ' || recurso."titulo" || '.'
    WHEN recurso."titulo" IS NOT NULL
      THEN 'Estudo com o material ' || recurso."titulo" || '.'
    ELSE 'Sessão migrada do histórico anterior.'
  END,
  'CRONOMETRO',
  sessao."dificuldadePercebida",
  sessao."compreensaoPercebida",
  sessao."observacao",
  sessao."desafioId",
  sessao."iniciadaEm",
  sessao."encerradaEm",
  sessao."duracaoMinutos",
  sessao."situacao",
  false,
  sessao."criadaEm",
  sessao."criadaEm"
FROM "SessaoEstudo" AS sessao
LEFT JOIN "Topico" AS topico ON topico."id" = sessao."topicoId"
LEFT JOIN "RecursoConteudo" AS recurso ON recurso."id" = sessao."recursoId";

DROP TABLE "SessaoEstudo";
ALTER TABLE "nova_SessaoEstudo" RENAME TO "SessaoEstudo";

CREATE INDEX "SessaoEstudo_usuario_modulo_topico_situacao_indice" ON "SessaoEstudo"("usuarioId", "moduloId", "topicoId", "situacao");
CREATE INDEX "SessaoEstudo_aluno_topico_situacao_indice" ON "SessaoEstudo"("alunoId", "topicoId", "situacao");
CREATE INDEX "SessaoEstudo_recurso_indice" ON "SessaoEstudo"("recursoId");
CREATE INDEX "SessaoEstudo_usuario_desafio_situacao_indice" ON "SessaoEstudo"("usuarioId", "desafioId", "situacao");
CREATE INDEX "SessaoEstudo_usuario_modulo_situacao_inicio_indice" ON "SessaoEstudo"("usuarioId", "moduloId", "situacao", "iniciadaEm");
CREATE INDEX "SessaoEstudo_usuario_arquivada_situacao_indice" ON "SessaoEstudo"("usuarioId", "arquivada", "situacao");

CREATE TABLE "MetodoSessaoEstudo" (
  "sessaoId" TEXT NOT NULL,
  "metodo" TEXT NOT NULL,
  PRIMARY KEY ("sessaoId", "metodo"),
  CONSTRAINT "MetodoSessaoEstudo_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoEstudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MetodoSessaoEstudo_metodo_indice" ON "MetodoSessaoEstudo"("metodo");

INSERT INTO "MetodoSessaoEstudo" ("sessaoId", "metodo")
SELECT "id", "metodo" FROM "SessaoEstudo" WHERE "metodo" IS NOT NULL;

CREATE TABLE "FormatoSessaoEstudo" (
  "sessaoId" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  PRIMARY KEY ("sessaoId", "formato"),
  CONSTRAINT "FormatoSessaoEstudo_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoEstudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FormatoSessaoEstudo_formato_indice" ON "FormatoSessaoEstudo"("formato");

INSERT INTO "FormatoSessaoEstudo" ("sessaoId", "formato")
SELECT sessao."id", recurso."formato"
FROM "SessaoEstudo" AS sessao
INNER JOIN "RecursoConteudo" AS recurso ON recurso."id" = sessao."recursoId";

CREATE TABLE "MaterialSessaoEstudo" (
  "sessaoId" TEXT NOT NULL,
  "recursoId" TEXT NOT NULL,
  PRIMARY KEY ("sessaoId", "recursoId"),
  CONSTRAINT "MaterialSessaoEstudo_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoEstudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MaterialSessaoEstudo_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MaterialSessaoEstudo_recurso_indice" ON "MaterialSessaoEstudo"("recursoId");

INSERT INTO "MaterialSessaoEstudo" ("sessaoId", "recursoId")
SELECT "id", "recursoId" FROM "SessaoEstudo" WHERE "recursoId" IS NOT NULL;

PRAGMA foreign_keys=ON;
