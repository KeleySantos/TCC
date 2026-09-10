# Arquitetura e decisões técnicas

## Visão geral

```text
Navegador
  ├─ páginas Next.js (aluno, professor e entrada)
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

### ADR-004 — Autenticação de demonstração

**Decisão:** usar formulário local de usuário e senha sintéticos, senha armazenada como hash e cookie HTTP-only apenas com identificador de conta.

**Motivo:** o autor solicitou uma experiência de login comum, com roteamento automático conforme o papel autenticado.

**Consequência:** permanece inadequado para produção pública, mas evita armazenar senha em texto simples e permite validar autorização por papel no servidor.

### ADR-006 — Administração sintética de professores

**Decisão:** disponibilizar `/administrador` para criar somente contas fictícias de professor.

**Motivo:** o autor solicitou que um administrador seja responsável pelo cadastro de professores.

**Consequência:** a ação valida dados, exige papel `ADMINISTRADOR`, cria `PerfilProfessor` e registra auditoria; cadastro de alunos e dados reais continuam fora do escopo.

### ADR-005 — Recomendador determinístico

**Decisão:** implementar regras auditáveis, sem machine learning.

**Motivo:** transparência, reprodutibilidade e adequação metodológica ao escopo atual.

**Consequência:** toda recomendação deve declarar a versão `regras-base-v1`, o nível e a quantidade de evidências.

### ADR-006 — Exposição mista não é atribuída

**Decisão:** excluir do cálculo simples uma tentativa que possua mais de uma sessão elegível na janela.

**Motivo:** evitar atribuir resultado de uma avaliação a um único formato quando o estudante usou mais de um recurso.

## Fluxos essenciais

### Sessão de estudo

```text
Aluno → POST /api/sessoes → valida recurso e papel → cria SessaoEstudo ATIVA
Aluno → POST /api/sessoes/{id}/concluir → calcula duração → CONCLUIDA ou INVALIDADA
```

### Quiz

```text
Aluno → POST /api/tentativas → valida respostas → busca gabarito no servidor
      → calcula pontos e nota → cria TentativaAvaliacao + RespostaQuestao
```

### Recomendação

```text
Sessões + tentativas → construir evidências → resumir por formato
→ classificar nível → escolher recurso → construir justificativa contextual
```

### Curadoria

```text
Professor → ação de servidor → valida papel → atualiza AprovacaoRecurso
→ grava EventoAuditoria → invalida painel do professor
```

## Fronteiras de responsabilidade

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| Página | Compor interface e obter dados necessários | Calcular métricas ou corrigir quiz |
| Componente cliente | Interação e estado visual | Acessar Prisma ou confiar em autorização visual |
| Rota/API ou ação de servidor | Validar entrada, autorizar e orquestrar caso de uso | Construir visualização |
| Domínio | Fórmulas, evidências e recomendação | Acessar HTTP, cookie ou React |
| Prisma | Persistência tipada | Decidir regra pedagógica |

## Observabilidade atual e evolução

O evento de auditoria já registra curadoria. Próximo incremento: logs estruturados de falha de API, correlação por requisição e política de retenção, sem incluir respostas completas de quiz, cookies ou dados pessoais desnecessários.
