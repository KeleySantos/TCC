CREATE TABLE "Sala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "proprietarioId" TEXT NOT NULL,
  "identificador" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVA',
  "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm" DATETIME NOT NULL,
  CONSTRAINT "Sala_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Sala_identificador_key" ON "Sala"("identificador");
CREATE INDEX "Sala_proprietarioId_situacao_idx" ON "Sala"("proprietarioId", "situacao");

CREATE TABLE "MembroSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "papel" TEXT NOT NULL DEFAULT 'MEMBRO',
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "entrouEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "encerrouEm" DATETIME,
  CONSTRAINT "MembroSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MembroSala_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "MembroSala_salaId_usuarioId_key" ON "MembroSala"("salaId", "usuarioId");
CREATE INDEX "MembroSala_usuarioId_situacao_idx" ON "MembroSala"("usuarioId", "situacao");
CREATE INDEX "MembroSala_salaId_situacao_idx" ON "MembroSala"("salaId", "situacao");

CREATE TABLE "ConviteSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salaId" TEXT NOT NULL,
  "criadoPorId" TEXT NOT NULL,
  "codigoHash" TEXT NOT NULL,
  "expiraEm" DATETIME NOT NULL,
  "revogadoEm" DATETIME,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConviteSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConviteSala_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ConviteSala_codigoHash_key" ON "ConviteSala"("codigoHash");
CREATE INDEX "ConviteSala_salaId_revogadoEm_expiraEm_idx" ON "ConviteSala"("salaId", "revogadoEm", "expiraEm");

CREATE TABLE "SolicitacaoEntradaSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salaId" TEXT NOT NULL,
  "conviteId" TEXT NOT NULL,
  "solicitanteId" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'PENDENTE',
  "solicitadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decididaEm" DATETIME,
  "decididaPorId" TEXT,
  CONSTRAINT "SolicitacaoEntradaSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolicitacaoEntradaSala_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "ConviteSala" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SolicitacaoEntradaSala_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SolicitacaoEntradaSala_decididaPorId_fkey" FOREIGN KEY ("decididaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SolicitacaoEntradaSala_salaId_situacao_solicitadaEm_idx" ON "SolicitacaoEntradaSala"("salaId", "situacao", "solicitadaEm");
CREATE INDEX "SolicitacaoEntradaSala_solicitanteId_situacao_idx" ON "SolicitacaoEntradaSala"("solicitanteId", "situacao");

CREATE TABLE "ModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "posicao" INTEGER NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  CONSTRAINT "ModuloSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ModuloSala_salaId_posicao_key" ON "ModuloSala"("salaId", "posicao");
CREATE INDEX "ModuloSala_salaId_situacao_idx" ON "ModuloSala"("salaId", "situacao");

CREATE TABLE "VinculoModuloSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "moduloSalaId" TEXT NOT NULL,
  "membroSalaId" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "moduloPessoalId" TEXT NOT NULL,
  "situacao" TEXT NOT NULL DEFAULT 'ATIVO',
  "compartilharDashboard" BOOLEAN NOT NULL DEFAULT true,
  "permitirComparacao" BOOLEAN NOT NULL DEFAULT false,
  "permitirIa" BOOLEAN NOT NULL DEFAULT false,
  "vinculadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "desvinculadoEm" DATETIME,
  CONSTRAINT "VinculoModuloSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_membroSalaId_fkey" FOREIGN KEY ("membroSalaId") REFERENCES "MembroSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VinculoModuloSala_moduloPessoalId_fkey" FOREIGN KEY ("moduloPessoalId") REFERENCES "ModuloAprendizagem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_usuarioId_key" ON "VinculoModuloSala"("moduloSalaId", "usuarioId");
CREATE UNIQUE INDEX "VinculoModuloSala_moduloSalaId_moduloPessoalId_key" ON "VinculoModuloSala"("moduloSalaId", "moduloPessoalId");
CREATE INDEX "VinculoModuloSala_membroSalaId_situacao_idx" ON "VinculoModuloSala"("membroSalaId", "situacao");
CREATE INDEX "VinculoModuloSala_usuarioId_situacao_idx" ON "VinculoModuloSala"("usuarioId", "situacao");
CREATE INDEX "VinculoModuloSala_moduloPessoalId_situacao_idx" ON "VinculoModuloSala"("moduloPessoalId", "situacao");

CREATE TABLE "ComentarioSala" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "salaId" TEXT NOT NULL,
  "autorId" TEXT NOT NULL,
  "escopo" TEXT NOT NULL,
  "moduloSalaId" TEXT,
  "destinatarioId" TEXT,
  "conteudo" TEXT NOT NULL,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComentarioSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ComentarioSala_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ComentarioSala_moduloSalaId_fkey" FOREIGN KEY ("moduloSalaId") REFERENCES "ModuloSala" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ComentarioSala_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ComentarioSala_salaId_criadoEm_idx" ON "ComentarioSala"("salaId", "criadoEm");
CREATE INDEX "ComentarioSala_moduloSalaId_criadoEm_idx" ON "ComentarioSala"("moduloSalaId", "criadoEm");
CREATE INDEX "ComentarioSala_destinatarioId_criadoEm_idx" ON "ComentarioSala"("destinatarioId", "criadoEm");
