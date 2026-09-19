-- Transição aditiva para conta pessoal. As referências legadas são preservadas
-- somente para conferir os dados sintéticos já existentes durante a migração.
PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

ALTER TABLE "Usuario" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "Usuario_email_chave" ON "Usuario"("email");

CREATE TABLE "ModuloAprendizagem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "identificador" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "arquivado" BOOLEAN NOT NULL DEFAULT false,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "ModuloAprendizagem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ModuloAprendizagem_usuario_identificador_chave" ON "ModuloAprendizagem"("usuarioId", "identificador");
CREATE INDEX "ModuloAprendizagem_usuario_arquivado_indice" ON "ModuloAprendizagem"("usuarioId", "arquivado");

-- O acervo global anterior não tinha proprietário. Como o banco é apenas sintético,
-- ele é associado de modo determinístico à primeira conta criada, sem excluir dados.
INSERT INTO "ModuloAprendizagem" ("id", "usuarioId", "identificador", "titulo", "descricao", "arquivado", "criadoEm", "atualizadoEm")
SELECT 'modulo-legado-' || "id", "id", 'acervo-legado', 'Acervo sintético migrado', 'Conteúdo global do cenário anterior, preservado para conferência da migração.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Usuario"
ORDER BY "criadoEm", "id"
LIMIT 1;

ALTER TABLE "Topico" RENAME TO "_TopicoLegadoF2";
CREATE TABLE "Topico" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloId" TEXT NOT NULL,
  "identificador" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Topico_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Topico" ("id", "moduloId", "identificador", "nome", "descricao", "ativo", "criadoEm")
SELECT "id", (SELECT "id" FROM "ModuloAprendizagem" ORDER BY "criadoEm", "id" LIMIT 1), "identificador", "nome", "descricao", "ativo", "criadoEm"
FROM "_TopicoLegadoF2";
DROP TABLE "_TopicoLegadoF2";
CREATE UNIQUE INDEX "Topico_modulo_identificador_chave" ON "Topico"("moduloId", "identificador");
CREATE INDEX "Topico_modulo_ativo_indice" ON "Topico"("moduloId", "ativo");

ALTER TABLE "RecursoConteudo" RENAME TO "_RecursoConteudoLegadoF2";
CREATE TABLE "RecursoConteudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identificador" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "formato" TEXT NOT NULL,
  "minutosEstimados" INTEGER NOT NULL,
  "topicoId" TEXT NOT NULL,
  "url" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "RecursoConteudo_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "RecursoConteudo" ("id", "identificador", "titulo", "descricao", "formato", "minutosEstimados", "topicoId", "url", "ativo", "criadoEm", "atualizadoEm")
SELECT "id", "identificador", "titulo", "descricao", "formato", "minutosEstimados", "topicoId", "url", "ativo", "criadoEm", "atualizadoEm"
FROM "_RecursoConteudoLegadoF2";
DROP TABLE "_RecursoConteudoLegadoF2";
CREATE UNIQUE INDEX "RecursoConteudo_topico_identificador_chave" ON "RecursoConteudo"("topicoId", "identificador");
CREATE INDEX "RecursoConteudo_topico_formato_indice" ON "RecursoConteudo"("topicoId", "formato");

ALTER TABLE "Avaliacao" RENAME TO "_AvaliacaoLegadaF2";
CREATE TABLE "Avaliacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "identificador" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "topicoId" TEXT NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Avaliacao_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Avaliacao" ("id", "identificador", "titulo", "descricao", "topicoId", "ativa", "criadaEm")
SELECT "id", "identificador", "titulo", "descricao", "topicoId", "ativa", "criadaEm"
FROM "_AvaliacaoLegadaF2";
DROP TABLE "_AvaliacaoLegadaF2";
CREATE UNIQUE INDEX "Avaliacao_topico_identificador_chave" ON "Avaliacao"("topicoId", "identificador");
CREATE INDEX "Avaliacao_topico_ativa_indice" ON "Avaliacao"("topicoId", "ativa");

ALTER TABLE "SessaoEstudo" RENAME TO "_SessaoEstudoLegadaF2";
CREATE TABLE "SessaoEstudo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "alunoId" TEXT,
  "topicoId" TEXT NOT NULL,
  "recursoId" TEXT NOT NULL,
  "iniciadaEm" DATETIME NOT NULL,
  "encerradaEm" DATETIME,
  "duracaoMinutos" INTEGER,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVA',
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessaoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "PerfilAluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SessaoEstudo_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "SessaoEstudo" ("id", "usuarioId", "moduloId", "alunoId", "topicoId", "recursoId", "iniciadaEm", "encerradaEm", "duracaoMinutos", "situacao", "criadaEm")
SELECT "sessao"."id", "perfil"."usuarioId", "topico"."moduloId", "sessao"."alunoId", "sessao"."topicoId", "sessao"."recursoId", "sessao"."iniciadaEm", "sessao"."encerradaEm", "sessao"."duracaoMinutos", "sessao"."situacao", "sessao"."criadaEm"
FROM "_SessaoEstudoLegadaF2" AS "sessao"
JOIN "PerfilAluno" AS "perfil" ON "perfil"."id" = "sessao"."alunoId"
JOIN "Topico" AS "topico" ON "topico"."id" = "sessao"."topicoId";
DROP TABLE "_SessaoEstudoLegadaF2";
CREATE INDEX "SessaoEstudo_usuario_modulo_topico_situacao_indice" ON "SessaoEstudo"("usuarioId", "moduloId", "topicoId", "situacao");
CREATE INDEX "SessaoEstudo_aluno_topico_situacao_indice" ON "SessaoEstudo"("alunoId", "topicoId", "situacao");
CREATE INDEX "SessaoEstudo_recurso_indice" ON "SessaoEstudo"("recursoId");

ALTER TABLE "TentativaAvaliacao" RENAME TO "_TentativaAvaliacaoLegadaF2";
CREATE TABLE "TentativaAvaliacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "alunoId" TEXT,
  "avaliacaoId" TEXT NOT NULL,
  "topicoId" TEXT NOT NULL,
  "iniciadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "concluidaEm" DATETIME,
  "respostasCorretas" INTEGER NOT NULL DEFAULT 0,
  "totalQuestoes" INTEGER NOT NULL DEFAULT 0,
  "notaNormalizada" REAL,
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TentativaAvaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TentativaAvaliacao_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TentativaAvaliacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "PerfilAluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "TentativaAvaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TentativaAvaliacao_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "TentativaAvaliacao" ("id", "usuarioId", "moduloId", "alunoId", "avaliacaoId", "topicoId", "iniciadaEm", "concluidaEm", "respostasCorretas", "totalQuestoes", "notaNormalizada", "criadaEm")
SELECT "tentativa"."id", "perfil"."usuarioId", "topico"."moduloId", "tentativa"."alunoId", "tentativa"."avaliacaoId", "tentativa"."topicoId", "tentativa"."iniciadaEm", "tentativa"."concluidaEm", "tentativa"."respostasCorretas", "tentativa"."totalQuestoes", "tentativa"."notaNormalizada", "tentativa"."criadaEm"
FROM "_TentativaAvaliacaoLegadaF2" AS "tentativa"
JOIN "PerfilAluno" AS "perfil" ON "perfil"."id" = "tentativa"."alunoId"
JOIN "Topico" AS "topico" ON "topico"."id" = "tentativa"."topicoId";
DROP TABLE "_TentativaAvaliacaoLegadaF2";
CREATE INDEX "TentativaAvaliacao_usuario_modulo_topico_conclusao_indice" ON "TentativaAvaliacao"("usuarioId", "moduloId", "topicoId", "concluidaEm");
CREATE INDEX "TentativaAvaliacao_aluno_topico_conclusao_indice" ON "TentativaAvaliacao"("alunoId", "topicoId", "concluidaEm");

ALTER TABLE "Recomendacao" RENAME TO "_RecomendacaoLegadaF2";
CREATE TABLE "Recomendacao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT NOT NULL,
  "moduloId" TEXT NOT NULL,
  "alunoId" TEXT,
  "topicoId" TEXT NOT NULL,
  "recursoId" TEXT,
  "formatoSugerido" TEXT NOT NULL,
  "justificativa" TEXT NOT NULL,
  "nivelEvidencia" TEXT NOT NULL,
  "quantidadeEvidencias" INTEGER NOT NULL,
  "notaComparada" REAL,
  "versaoAlgoritmo" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'PENDENTE',
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiraEm" DATETIME,
  CONSTRAINT "Recomendacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Recomendacao_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Recomendacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "PerfilAluno" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Recomendacao_topicoId_fkey" FOREIGN KEY ("topicoId") REFERENCES "Topico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Recomendacao_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "Recomendacao" ("id", "usuarioId", "moduloId", "alunoId", "topicoId", "recursoId", "formatoSugerido", "justificativa", "nivelEvidencia", "quantidadeEvidencias", "notaComparada", "versaoAlgoritmo", "situacao", "criadaEm", "expiraEm")
SELECT "recomendacao"."id", "perfil"."usuarioId", "topico"."moduloId", "recomendacao"."alunoId", "recomendacao"."topicoId", "recomendacao"."recursoId", "recomendacao"."formatoSugerido", "recomendacao"."justificativa", "recomendacao"."nivelEvidencia", "recomendacao"."quantidadeEvidencias", "recomendacao"."notaComparada", "recomendacao"."versaoAlgoritmo", "recomendacao"."situacao", "recomendacao"."criadaEm", "recomendacao"."expiraEm"
FROM "_RecomendacaoLegadaF2" AS "recomendacao"
JOIN "PerfilAluno" AS "perfil" ON "perfil"."id" = "recomendacao"."alunoId"
JOIN "Topico" AS "topico" ON "topico"."id" = "recomendacao"."topicoId";
DROP TABLE "_RecomendacaoLegadaF2";
CREATE INDEX "Recomendacao_usuario_modulo_topico_situacao_indice" ON "Recomendacao"("usuarioId", "moduloId", "topicoId", "situacao");
CREATE INDEX "Recomendacao_aluno_topico_situacao_indice" ON "Recomendacao"("alunoId", "topicoId", "situacao");

PRAGMA foreign_keys = ON;
