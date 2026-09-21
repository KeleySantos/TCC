-- Fase 9: a sessão e o módulo passam a ser o único domínio ativo de estudo.
-- As relações normalizadas já foram retropreenchidas nas migrações anteriores.
PRAGMA foreign_keys=OFF;

CREATE TABLE "nova_RecursoConteudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identificador" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  "minutosEstimados" INTEGER NOT NULL,
  "moduloId" TEXT NOT NULL,
  "conteudoTexto" TEXT,
  "url" TEXT,
  "origem" TEXT NOT NULL DEFAULT 'TEXTO',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "RecursoConteudo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "nova_RecursoConteudo" (
  "id", "identificador", "titulo", "descricao", "formato", "minutosEstimados",
  "moduloId", "conteudoTexto", "url", "origem", "ativo", "criadoEm", "atualizadoEm"
)
SELECT
  "id", "identificador", "titulo", "descricao", "formato", "minutosEstimados",
  "moduloId", "conteudoTexto", "url", "origem", "ativo", "criadoEm", "atualizadoEm"
FROM "RecursoConteudo";

DROP TABLE "RecursoConteudo";
ALTER TABLE "nova_RecursoConteudo" RENAME TO "RecursoConteudo";
CREATE UNIQUE INDEX "RecursoConteudo_modulo_identificador_chave" ON "RecursoConteudo"("moduloId", "identificador");
CREATE INDEX "RecursoConteudo_modulo_formato_indice" ON "RecursoConteudo"("moduloId", "formato");
CREATE INDEX "RecursoConteudo_modulo_origem_ativo_indice" ON "RecursoConteudo"("moduloId", "origem", "ativo");

CREATE TABLE "nova_SessaoEstudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "alunoId" TEXT,
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
  CONSTRAINT "SessaoEstudo_desafioId_fkey" FOREIGN KEY ("desafioId") REFERENCES "DesafioExperimentacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "nova_SessaoEstudo" (
  "id", "usuarioId", "moduloId", "alunoId", "descricao", "modoRegistro",
  "dificuldadePercebida", "compreensaoPercebida", "observacao", "desafioId",
  "iniciadaEm", "encerradaEm", "duracaoMinutos", "situacao", "arquivada", "criadaEm", "atualizadaEm"
)
SELECT
  "id", "usuarioId", "moduloId", "alunoId", "descricao", "modoRegistro",
  "dificuldadePercebida", "compreensaoPercebida", "observacao", "desafioId",
  "iniciadaEm", "encerradaEm", "duracaoMinutos", "situacao", "arquivada", "criadaEm", "atualizadaEm"
FROM "SessaoEstudo";

DROP TABLE "SessaoEstudo";
ALTER TABLE "nova_SessaoEstudo" RENAME TO "SessaoEstudo";
CREATE INDEX "SessaoEstudo_usuario_modulo_situacao_indice" ON "SessaoEstudo"("usuarioId", "moduloId", "situacao");
CREATE INDEX "SessaoEstudo_aluno_situacao_indice" ON "SessaoEstudo"("alunoId", "situacao");
CREATE INDEX "SessaoEstudo_usuario_desafio_situacao_indice" ON "SessaoEstudo"("usuarioId", "desafioId", "situacao");
CREATE INDEX "SessaoEstudo_usuario_modulo_situacao_inicio_indice" ON "SessaoEstudo"("usuarioId", "moduloId", "situacao", "iniciadaEm");
CREATE INDEX "SessaoEstudo_usuario_arquivada_situacao_indice" ON "SessaoEstudo"("usuarioId", "arquivada", "situacao");

DROP TABLE "RespostaQuestao";
DROP TABLE "TentativaAvaliacao";
DROP TABLE "Questao";
DROP TABLE "Avaliacao";
DROP TABLE "Recomendacao";
DROP TABLE "Topico";

PRAGMA foreign_keys=ON;
