# Arquitetura e decisões técnicas

## Compartilhamento direto de módulos — implementado em 2026-10-18

Fluxo adicional, independente de Salas: proprietário gera código contextual cifrado → convidado autenticado adere → vínculo autoriza somente o dashboard daquele módulo → serviços consultam indicadores do proprietário e devolvem DTO mínimo → painéis existentes apresentam resultados. Até três vagas ativas são garantidas por transação, CHECK SQLite e índice único módulo/vaga. `CompartilhamentoModulo` e `AcessoModuloCompartilhado` não alteram a propriedade nem os vínculos de Salas.

As novas rotas ficam em `/api/compartilhamentos/modulos` e `/api/modulos/[identificador]/compartilhamento`; a página recebida é `/salas/compartilhados/[moduloId]`. A interpretação compartilhada usa a cota do convidado e a configuração global de IA, sem descrições privadas de sessões ou arquivos. Autorização é conferida antes e depois de operações demoradas, comparando a identidade da concessão. Remoção/encerramento negam novas consultas; atualização de interface ocorre em novas requisições e ao retomar foco, sem infraestrutura de mensagens adicional. Ver [relatório da implementação](../../RELATORIOS/IMPLEMENTACAO_COMPARTILHAMENTO_MODULOS.md).

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

**Decisão:** usar formulário local de usuário e senha sintéticos, senha armazenada como hash e cookie HTTP-only com conteúdo assinado por HMAC-SHA256 e validade de sete dias. A assinatura usa contexto separado da criptografia das credenciais. O identificador isolado ou um token adulterado não autentica. A conta reservada ADMIN recebe somente a permissão específica `administradorIa`; papéis legados não são reativados.

**Motivo:** o autor definiu uma única conta pessoal para todo o laboratório.

**Consequência:** permanece inadequado para produção pública, mas evita armazenar senha em texto simples e permite validar a propriedade dos dados no servidor. A conta autenticada é direcionada a `/dashboard`; `/painel` existe somente como redirecionamento de compatibilidade.

Desde 2026-10-18, Configurações IA exige ADMIN na página, nas ações e nos serviços de gestão. O runtime consulta a chave cifrada dessa conta em toda a plataforma, sem chaves individuais nem substituição por variável de ambiente. Alterações valem na próxima requisição. A identidade de quem solicita análise continua delimitando seus dados e sua cota; não determina a propriedade da chave global. Cookies antigos exigem novo login.

### ADR-005 — Métricas e recomendação oficial determinísticas

**Decisão:** implementar regras auditáveis, sem machine learning, para as métricas e recomendações oficiais.

**Motivo:** transparência, reprodutibilidade e adequação metodológica ao escopo atual.

**Consequência:** toda métrica e recomendação deve declarar a versão do algoritmo, o contexto, a amostra e a limitação. O Groq não pode substituí-las.

### ADR-006 — Exposição mista não é atribuída

**Decisão:** excluir do cálculo simples uma tentativa que possua mais de uma sessão elegível na janela.

**Motivo:** evitar atribuir resultado de uma avaliação a um único formato quando a pessoa usuária usou mais de um recurso.

**Consequência:** a interpretação por Groq recebe essa limitação no DTO e não pode tratá-la como padrão conclusivo.

### ADR-007 — Groq como intérprete opcional

**Decisão:** o Groq é o único provedor externo ativo e interpreta somente um DTO sintético e agregado de métricas oficiais, produzindo insights com observação, evidência, confiança, reflexão e experimento opcional.

**Motivo:** oferecer uma reflexão mais rica sem delegar cálculo, persistência ou autorização a serviço externo.

**Consequência:** a saída estruturada é validada contra schema e política de linguagem. O DTO usa referências opacas, métricas calculadas e no máximo dez descrições recentes compactadas. Timeout, cota, autenticação, modelo inválido, rede ou resposta inválida terminam em interpretação local, sem tentar outro provedor. A IA não pode afirmar causalidade, criar métricas, alterar dados, notas ou permissões. Resultados não são persistidos e as rotas usam `no-store`.

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
→ preparar DTO sintético agregado → Groq validado ou resposta local
```

### Propriedade pessoal

```text
Conta pessoal → ação ou rota de servidor → valida entrada e propriedade
→ cria ou altera somente módulos, tópicos, materiais e registros da própria conta
```

### Compartilhamento para salas

```text
Proprietário cria sala e módulo-pai → código/link válido cria associação ativa imediatamente
→ membro cria ou vincula módulo pessoal
→ vínculo expõe somente o dashboard compartilhado, nunca materiais ou sessões
→ comparação e IA ficam disponíveis enquanto o vínculo estiver ativo
→ saída, remoção, exclusão ou desvínculo encerram acesso sem apagar o módulo pessoal
```

`ModuloSala` é apenas um contexto de agregação. `VinculoModuloSala` não transfere propriedade do `ModuloAprendizagem`; consultas do proprietário selecionam somente a identidade mínima do vínculo. `paineis-salas.ts` compõe métricas vivas e evidências históricas pseudonimizadas, aplica a amostra mínima antes de devolver números e mantém dashboard individual separado do agregado. A IA recebe somente o DTO métrico do dashboard compartilhado.

```text
sessões válidas do vínculo ativo ─┐
                                 ├─ amostra mínima ─ dashboards de módulo e sala
evidências históricas anônimas ──┘

vínculo ativo com dashboard compartilhado ─ comparação nominal sem ranking
                                      └──── DTO métrico ─ Groq ou resposta local
```

## Fronteiras de responsabilidade

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| Página | Compor interface e obter dados necessários | Calcular métricas ou corrigir quiz |
| Componente cliente | Interação e estado visual | Acessar Prisma ou confiar em autorização visual |
| Rota/API ou ação de servidor | Validar entrada, conferir propriedade e orquestrar caso de uso | Construir visualização |
| Domínio | Fórmulas, evidências e recomendação | Acessar HTTP, cookie ou React |
| Adaptadores de IA | Interpretar DTO agregado com contrato compartilhado e retornar estrutura validável | Calcular métrica, acessar banco, decidir autorização ou aceitar dados livres |
| Prisma | Persistência tipada | Decidir regra pedagógica |

## Observabilidade atual e evolução

`EventoAuditoria` registra as ações sensíveis das salas sem armazenar códigos de convite, conteúdo de comentários, sessões, materiais ou credenciais. Logs e metadados não devem incluir cookies, chaves ou dados pessoais desnecessários.
