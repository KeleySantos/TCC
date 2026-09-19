-- Numeração de tentativa é derivada no servidor; Bloom é armazenável, mas a
-- análise por nível permanece fora da Entrega A.
ALTER TABLE "Questao" ADD COLUMN "nivelBloom" TEXT;
ALTER TABLE "TentativaAvaliacao" ADD COLUMN "numeroTentativa" INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX "TentativaAvaliacao_usuario_avaliacao_numero_chave" ON "TentativaAvaliacao"("usuarioId", "avaliacaoId", "numeroTentativa");
