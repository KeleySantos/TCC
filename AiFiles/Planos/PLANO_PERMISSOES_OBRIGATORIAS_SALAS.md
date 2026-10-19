# Permissões obrigatórias de comparação e IA nas Salas

**Objetivo:** remover a escolha individual sobre comparação e interpretação por IA, tornando ambas consequências automáticas de um vínculo ativo com dashboard compartilhado.

**Arquitetura:** a autorização continuará baseada na propriedade da Sala, na participação ativa e no vínculo ativo. Os dois booleanos opcionais serão removidos do Prisma e de todos os DTOs; comparação e IA usarão diretamente os vínculos já autorizados a compartilhar o dashboard.

**Tecnologias:** Next.js 16, React 19, TypeScript, Prisma 7, SQLite e Vitest.

**Especificação:** aprovação do desenho registrada nesta conversa em 2026-10-18.

## Restrições globais

- Preservar autenticação, propriedade da Sala, revogação de participação e desvinculação.
- Não ampliar o DTO da IA: materiais e descrições das sessões continuam excluídos.
- Não alterar cálculos, amostra mínima, ausência de ranking ou histórico pseudonimizado.
- Preservar as alterações não relacionadas já existentes no checkout.

## Foco de revisão

- Vínculos existentes não podem ser perdidos na migração.
- Vínculo ativo deve sempre entrar na comparação e permitir IA.
- Vínculo encerrado deve continuar inacessível.
- A interface não pode manter formulário, checkbox ou texto de consentimento opcional.
- A rota de IA deve continuar restrita ao proprietário da Sala e ao DTO métrico mínimo.

### Tarefa 1: Contrato obrigatório e regressão

- Criar um teste de contrato para confirmar a ausência dos dois controles e dos campos opcionais.
- Executar o teste e observar a falha no código atual.
- Remover os campos do schema Prisma, serviços, painéis, interpretação, ações, interface, seed e verificadores.
- Criar migração SQLite que elimine somente as duas colunas.
- Gerar o cliente Prisma e executar os testes focados.

### Tarefa 2: Linguagem e rastreabilidade

- Atualizar textos da comparação e da interpretação para refletir funcionamento automático.
- Atualizar contratos, arquitetura, modelo de dados, decisões, riscos, matriz e acompanhamento.
- Confirmar por busca que não restaram controles ou regras opcionais ativas.

### Tarefa 3: Verificação integral

- Aplicar/testar a migração em uma cópia do banco atual e verificar contagens de vínculos.
- Executar verificadores de serviços e dashboards de Salas.
- Executar scanner, lint, tipos, suíte completa e build.
- Revisar o diff restrito antes da entrega.
