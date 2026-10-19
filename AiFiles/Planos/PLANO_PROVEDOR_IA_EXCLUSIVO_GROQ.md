# Provedor de IA exclusivo Groq — plano de implementação

> **Para agentes executores:** usar `superpowers:executing-plans` e `superpowers:test-driven-development`; o checkout contém alterações anteriores que devem ser preservadas.

**Objetivo:** remover as integrações ativas de Gemini e Qwen e manter Groq como único provedor externo, seguido apenas pela contingência local.

**Arquitetura:** o catálogo e os contratos ativos aceitarão somente `GROQ`. O enum persistido do Prisma manterá valores históricos para evitar migração destrutiva, mas consultas, interface e filas ignorarão esses registros. Os adaptadores e endpoints sem uso serão excluídos.

**Tecnologias:** TypeScript, Next.js, React, Vitest, Prisma e SQLite.

**Especificação:** solicitação aprovada pelo autor nesta sessão em 2026-10-17.

## Restrições globais

- Não apagar registros históricos de credenciais nem migrações existentes.
- Não acessar, imprimir ou alterar chaves reais do `.env`.
- Manter a resposta local como contingência sem API externa.
- Preservar as alterações preexistentes do checkout.
- Atualizar fontes canônicas, matriz e acompanhamento sem reescrever relatórios históricos.

## Foco da revisão

- Uma configuração legada Gemini/Qwen não pode reaparecer na interface nem entrar na fila.
- Falha do Groq deve produzir resposta local sem tentar outro endpoint.
- A análise de materiais deve chamar exclusivamente o endpoint Groq.
- A avaliação do TCC deve rejeitar um provedor planejado diferente de Groq.
- O build não pode manter importações dos adaptadores removidos.

---

### Tarefa 1: Fixar o contrato ativo em Groq

**Arquivos:**
- Modificar: `src/servidor/ia/insights-aprendizagem.test.ts`
- Modificar: `src/servidor/ia/interpretacoes.test.ts`
- Modificar: `src/servidor/ia/catalogo-provedores.ts`
- Modificar: `src/servidor/ia/configuracoes.ts`
- Modificar: `src/servidor/ia/interpretacoes.ts`
- Modificar: `src/dominio/interpretacoes/esquema.ts`
- Excluir: `src/servidor/ia/gemini.ts`
- Excluir: `src/servidor/ia/qwen.ts`

- [x] Criar testes que comprovem catálogo exclusivo Groq e contingência local imediata após falha.
- [x] Executar os testes e confirmar falha pelo comportamento antigo.
- [x] Simplificar tipos, catálogo, carregamento de credenciais e criação do provedor.
- [x] Excluir adaptadores inativos e executar os testes novamente.

### Tarefa 2: Remover opções e endpoints inativos dos fluxos auxiliares

**Arquivos:**
- Modificar: `src/app/configuracoes/ia/acoes.ts`
- Modificar: `src/app/configuracoes/ia/page.tsx`
- Modificar: `src/componentes/interpretacao-automatica.tsx`
- Modificar: `src/app/salas/interpretacao-membro.tsx`
- Modificar: `src/servidor/ia/analise-materiais.ts`
- Modificar: `src/dominio/avaliacao-ia-tcc.ts`
- Modificar: `scripts/avaliar-tcc.ts`
- Modificar: `scripts/repetir-avaliacao-ia-tcc.ts`
- Modificar: `scripts/verificar-provedores-insights.ts`
- Modificar: `.env.example`

- [x] Restringir ações, rótulos e scripts ao Groq.
- [x] Simplificar a análise de materiais para o endpoint Groq.
- [x] Restringir a avaliação reproduzível do TCC ao Groq.
- [x] Executar testes focados, tipos e verificações de configuração.

### Tarefa 3: Atualizar documentação e validar o conjunto

**Arquivos:**
- Modificar: `README.md`
- Modificar: fontes canônicas indicadas por `AiFiles/INDICE.md`
- Modificar: `AiFiles/Memoria/DECISOES_DO_PROJETO.md`
- Modificar: `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- Modificar: `AiFiles/Memoria/ACOMPANHAMENTO.md`

- [x] Registrar a decisão que substitui a fila antiga sem apagar o histórico.
- [x] Atualizar arquitetura, contratos, privacidade, requisito e rastreabilidade.
- [x] Confirmar por busca que menções restantes são apenas históricas, testes de bloqueio ou compatibilidade do banco.
- [x] Executar `npm run validar` e registrar o resultado real.
