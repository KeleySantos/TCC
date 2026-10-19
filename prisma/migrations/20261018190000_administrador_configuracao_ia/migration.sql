-- Permissão específica de configuração global; contas pessoais não a recebem.
ALTER TABLE "Usuario" ADD COLUMN "administradorIa" BOOLEAN NOT NULL DEFAULT false;
