ALTER TABLE "RecursoConteudo" ADD COLUMN "funcao" TEXT NOT NULL DEFAULT 'REFERENCIA';
ALTER TABLE "RecursoConteudo" ADD COLUMN "dataEvento" DATETIME;
ALTER TABLE "RecursoConteudo" ADD COLUMN "dataEventoConfirmada" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AnaliseMaterial" ADD COLUMN "trechosConceitosJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AnaliseMaterial" ADD COLUMN "afirmacoesJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AnaliseMaterial" ADD COLUMN "interpretacaoVisualJson" TEXT NOT NULL DEFAULT '[]';

CREATE TABLE "ConceitoAprendizagem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "chave" TEXT NOT NULL,
  "aliasesJson" TEXT NOT NULL DEFAULT '[]',
  "origem" TEXT NOT NULL DEFAULT 'ANALISE_MATERIAL',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "ConceitoAprendizagem_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ConceitoAprendizagem_moduloId_chave_key" ON "ConceitoAprendizagem"("moduloId", "chave");
CREATE INDEX "ConceitoAprendizagem_moduloId_ativo_idx" ON "ConceitoAprendizagem"("moduloId", "ativo");

CREATE TABLE "ConceitoMaterial" (
  "conceitoId" TEXT NOT NULL,
  "recursoId" TEXT NOT NULL,
  "trechosJson" TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY ("conceitoId", "recursoId"),
  CONSTRAINT "ConceitoMaterial_conceitoId_fkey" FOREIGN KEY ("conceitoId") REFERENCES "ConceitoAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConceitoMaterial_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ConceitoMaterial_recursoId_idx" ON "ConceitoMaterial"("recursoId");

CREATE TABLE "ConceitoSessao" (
  "conceitoId" TEXT NOT NULL,
  "sessaoId" TEXT NOT NULL,
  PRIMARY KEY ("conceitoId", "sessaoId"),
  CONSTRAINT "ConceitoSessao_conceitoId_fkey" FOREIGN KEY ("conceitoId") REFERENCES "ConceitoAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConceitoSessao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoEstudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ConceitoSessao_sessaoId_idx" ON "ConceitoSessao"("sessaoId");

CREATE TABLE "EvidenciaAprendizagem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloId" TEXT NOT NULL,
  "recursoId" TEXT,
  "titulo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "dataEvento" DATETIME NOT NULL,
  "situacaoConfirmacao" TEXT NOT NULL DEFAULT 'PENDENTE',
  "desempenhoPercentual" REAL,
  "resumo" TEXT,
  "dadosOrigemJson" TEXT NOT NULL DEFAULT '{}',
  "confirmadaEm" DATETIME,
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" DATETIME NOT NULL,
  CONSTRAINT "EvidenciaAprendizagem_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EvidenciaAprendizagem_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoConteudo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EvidenciaAprendizagem_recursoId_key" ON "EvidenciaAprendizagem"("recursoId");
CREATE INDEX "EvidenciaAprendizagem_moduloId_dataEvento_idx" ON "EvidenciaAprendizagem"("moduloId", "dataEvento");
CREATE INDEX "EvidenciaAprendizagem_moduloId_situacaoConfirmacao_idx" ON "EvidenciaAprendizagem"("moduloId", "situacaoConfirmacao");

CREATE TABLE "QuestaoEvidencia" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "evidenciaId" TEXT NOT NULL,
  "identificador" TEXT NOT NULL,
  "resumo" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'OUTRA',
  "resultado" TEXT NOT NULL DEFAULT 'NAO_INFORMADO',
  "pontuacaoObtida" REAL,
  "pontuacaoMaxima" REAL,
  CONSTRAINT "QuestaoEvidencia_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "EvidenciaAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "QuestaoEvidencia_evidenciaId_identificador_key" ON "QuestaoEvidencia"("evidenciaId", "identificador");
CREATE INDEX "QuestaoEvidencia_evidenciaId_idx" ON "QuestaoEvidencia"("evidenciaId");

CREATE TABLE "ConceitoEvidencia" (
  "conceitoId" TEXT NOT NULL,
  "evidenciaId" TEXT NOT NULL,
  PRIMARY KEY ("conceitoId", "evidenciaId"),
  CONSTRAINT "ConceitoEvidencia_conceitoId_fkey" FOREIGN KEY ("conceitoId") REFERENCES "ConceitoAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConceitoEvidencia_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "EvidenciaAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ConceitoEvidencia_evidenciaId_idx" ON "ConceitoEvidencia"("evidenciaId");

CREATE TABLE "ConceitoQuestaoEvidencia" (
  "conceitoId" TEXT NOT NULL,
  "questaoId" TEXT NOT NULL,
  PRIMARY KEY ("conceitoId", "questaoId"),
  CONSTRAINT "ConceitoQuestaoEvidencia_conceitoId_fkey" FOREIGN KEY ("conceitoId") REFERENCES "ConceitoAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConceitoQuestaoEvidencia_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoEvidencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ConceitoQuestaoEvidencia_questaoId_idx" ON "ConceitoQuestaoEvidencia"("questaoId");

CREATE TABLE "VinculoEvidenciaSessao" (
  "evidenciaId" TEXT NOT NULL,
  "sessaoId" TEXT NOT NULL,
  "origem" TEXT NOT NULL DEFAULT 'MANUAL',
  "confirmado" BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY ("evidenciaId", "sessaoId"),
  CONSTRAINT "VinculoEvidenciaSessao_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "EvidenciaAprendizagem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoEvidenciaSessao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoEstudo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VinculoEvidenciaSessao_sessaoId_idx" ON "VinculoEvidenciaSessao"("sessaoId");
