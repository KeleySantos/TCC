# Arquitetura e decisões técnicas

> Estado de transição em 2026-09-12: o código e o banco ainda refletem o MVP anterior baseado em papéis. A arquitetura-alvo aprovada para a Entrega A usa uma única conta pessoal; a Fase 2 e a Fase 3 farão a migração incremental sem editar migrações existentes.

## Visão geral

```text
Navegador
  ├─ páginas Next.js (entrada, dashboard e módulos pessoais)
  ├─ componentes React (quiz, cronômetro e gráfico)
  └─ rotas de API
           ↓
Autenticação de demonstração e validação de entrada
           ↓
Serviços de consulta, domínio analítico e recomendador
           ↓
Prisma Client + adaptador better-sqlite3
           ↓
SQLite local + migração + seed sintético
```

## Decisões arquiteturais

### ADR-001 — Monólito modular em Next.js

**Decisão:** manter interface, rotas de API e acesso a dados no mesmo projeto Next.js.

**Motivo:** reduz infraestrutura para o TCC e permite demonstrar o fluxo completo localmente.

**Consequência:** módulos de domínio não podem acessar componentes React; páginas não acessam o banco sem passar pelas funções de consulta/servidor quando houver regra de negócio.

### ADR-002 — SQLite e Prisma

**Decisão:** SQLite local com Prisma Client e adaptador `better-sqlite3`.

**Motivo:** persistência reproduzível sem serviço externo.

**Consequência:** o cenário é apropriado para demonstração local; não deve ser tratado como arquitetura de alta concorrência ou produção institucional.

### ADR-003 — Migração local versionada

**Decisão:** aplicar a migração SQL versionada por script local `scripts/migrar-banco.ts`.

**Motivo:** a CLI `prisma migrate dev` retornou erro genérico do mecanismo de schema neste ambiente, apesar de schema válido.

**Consequência:** toda mudança de schema deve gerar e revisar nova migração SQL antes de alterar o banco. Não editar migração já usada em cenário de avaliação.

### ADR-004 — Autenticação de demonstração pessoal

**Decisão:** usar formulário local de usuário e senha sintéticos, senha armazenada como hash e cookie HTTP-only apenas com identificador de conta, sem papel associado ao fluxo do produto.

**Motivo:** o autor definiu uma única conta pessoal para todo o laboratório.

**Consequência:** permanece inadequado para produção pública, mas evita armazenar senha em texto simples e permite validar a propriedade dos dados no servidor. A conta autenticada é direcionada a `/dashboard`; `/painel` existe somente como redirecionamento de compatibilidade.

### ADR-005 — Métricas e recomendação oficial determinísticas

**Decisão:** implementar regras auditáveis, sem machine learning, para as métricas e recomendações oficiais.

**Motivo:** transparência, reprodutibilidade e adequação metodológica ao escopo atual.

**Consequência:** toda métrica e recomendação deve declarar a versão do algoritmo, o contexto, a amostra e a limitação. Gemini não pode substituí-las.

### ADR-006 — Exposição mista não é atribuída

**Decisão:** excluir do cálculo simples uma tentativa que possua mais de uma sessão elegível na janela.

**Motivo:** evitar atribuir resultado de uma avaliação a um único formato quando a pessoa usuária usou mais de um recurso.

**Consequência:** a interpretação por Gemini recebe essa limitação no DTO e não pode tratá-la como padrão conclusivo.

### ADR-007 — Gemini como interpretadora opcional

**Decisão:** Gemini interpreta somente um DTO sintético e agregado de métricas oficiais, produzindo padrões observados, feedbacks, conselhos e perguntas de reflexão.

**Motivo:** oferecer uma reflexão mais rica sem delegar cálculo, persistência ou autorização a serviço externo.

**Consequência:** a saída estruturada deve ser validada contra schema e política de linguagem; não recebe nomes, respostas, observações livres ou chave de API. Timeout, cota, rede ausente ou resposta inválida retornam uma interpretação local. A IA não pode afirmar causalidade, criar métricas, alterar dados, notas ou permissões.

## Fluxos essenciais

### Sessão de estudo

```text
Conta pessoal → POST /api/sessoes → valida recurso e propriedade → cria SessaoEstudo ATIVA
Conta pessoal → POST /api/sessoes/{id}/concluir → calcula duração → CONCLUIDA ou INVALIDADA
```

### Quiz

```text
Conta pessoal → POST /api/tentativas → valida respostas e propriedade → busca gabarito no servidor
      → calcula pontos e nota → cria TentativaAvaliacao + RespostaQuestao
```

### Recomendação

```text
Sessões + tentativas → construir evidências → resumir por módulo, tópico, método e formato
→ classificar nível → construir recomendação oficial e justificativa contextual
→ preparar DTO sintético agregado → Gemini validada ou resposta local
```

### Propriedade pessoal

```text
Conta pessoal → ação ou rota de servidor → valida entrada e propriedade
→ cria ou altera somente módulos, tópicos, materiais e registros da própria conta
```

## Fronteiras de responsabilidade

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| Página | Compor interface e obter dados necessários | Calcular métricas ou corrigir quiz |
| Componente cliente | Interação e estado visual | Acessar Prisma ou confiar em autorização visual |
| Rota/API ou ação de servidor | Validar entrada, conferir propriedade e orquestrar caso de uso | Construir visualização |
| Domínio | Fórmulas, evidências e recomendação | Acessar HTTP, cookie ou React |
| Adaptador Gemini | Interpretar DTO agregado e retornar estrutura validável | Calcular métrica, acessar banco, decidir autorização ou aceitar dados livres |
| Prisma | Persistência tipada | Decidir regra pedagógica |

## Observabilidade atual e evolução

O evento de auditoria legado registra curadoria e não integra a Entrega A. O próximo incremento inclui logs estruturados de falha de API e do adaptador Gemini, correlação por requisição e política de retenção, sem incluir respostas completas de quiz, cookies, observações livres, chaves ou dados pessoais desnecessários.
