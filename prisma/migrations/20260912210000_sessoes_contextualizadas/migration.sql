-- Campos de contexto preenchidos pelas novas sessões pessoais. Permanecem
-- anuláveis para conservar sessões sintéticas pré-transição durante a migração.
ALTER TABLE "SessaoEstudo" ADD COLUMN "metodo" TEXT;
ALTER TABLE "SessaoEstudo" ADD COLUMN "dificuldadePercebida" INTEGER;
ALTER TABLE "SessaoEstudo" ADD COLUMN "compreensaoPercebida" INTEGER;
ALTER TABLE "SessaoEstudo" ADD COLUMN "observacao" TEXT;
