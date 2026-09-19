-- Rascunhos preservam a primeira configuração sem gravar títulos ou descrições artificiais.
-- O valor padrão mantém todos os módulos existentes como configurados durante a migração.
ALTER TABLE "ModuloAprendizagem" ADD COLUMN "rascunho" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "ModuloAprendizagem_usuario_arquivado_rascunho_indice" ON "ModuloAprendizagem"("usuarioId", "arquivado", "rascunho");
