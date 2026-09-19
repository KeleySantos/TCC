-- Conteúdo textual próprio para materiais pessoais. O campo é opcional porque
-- um material pode ser representado por link validado no servidor.
ALTER TABLE "RecursoConteudo" ADD COLUMN "conteudoTexto" TEXT;
