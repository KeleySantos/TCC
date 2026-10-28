# Autorização modular das Salas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. O projeto exige um único agente ativo; a execução será nativa pelo Guanabara.

**Estado:** executado em 2026-10-28  
**Origem:** desenho funcional aprovado em 2026-10-28  
**Escopo:** banco, autorização, convites, ciclo de participação, dashboards modulares, interface, migração e rastreabilidade  
**Evidência inicial:** comportamento atual e contratos existentes inspecionados em `prisma/schema.prisma`, `src/servidor/salas.ts`, `src/servidor/paineis-salas.ts` e `src/app/salas/`

**Goal:** Transformar a Sala em uma pasta organizadora, com convites, participação, autorização e dashboards definidos individualmente por módulo.

**Architecture:** `ParticipacaoModuloSala` será a fonte de verdade de acesso, independente do `VinculoModuloSala` que conecta a instância pessoal. O proprietário administra todos os módulos; participantes comuns recebem somente os módulos com participação ativa. Convites genéricos de Sala deixam de ser emitidos e dashboards passam a ser consultados diretamente por módulo.

**Tech Stack:** TypeScript estrito, Next.js 16.3.3, React 19.2.8, Prisma 7.10.0, SQLite, Zod, Vitest e Testing Library.

**Spec:** `AiFiles/Planos/DESENHO_REFORMULACAO_SALA_MODULOS.md`

## Global Constraints

- Todo código, domínio, teste e texto de interface próprio permanece em português do Brasil.
- Autorização é verificada no servidor antes de carregar metadados ou indicadores do módulo.
- Módulos não autorizados usam resposta indistinguível de recurso inexistente.
- Materiais, descrições de sessões e dados brutos continuam privados.
- Somente vínculos ativos alimentam dados vivos; participações sem vínculo não entram nas métricas.
- A migração preserva vínculos, módulos pessoais e evidências históricas existentes.
- O compartilhamento direto de módulos (`CompartilhamentoModulo`) permanece independente deste fluxo.
- Antes de editar Next.js, consultar em `node_modules/next/dist/docs/` os guias de App Router, Server Components, Server Actions e rotas dinâmicas aplicáveis.
- Antes de implementar, registrar o requisito e os critérios em `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`.
- Preservar as alterações não relacionadas existentes no worktree.

## Review Focus

- Código de convite de Sala legado ou de compartilhamento direto usado na entrada modular deve falhar sem revelar o recurso; coberto na Tarefa 3.
- Participante aceito, mas sem instância pessoal, deve acessar somente o módulo convidado e aparecer como `Aguardando vínculo`; coberto nas Tarefas 2 e 6.
- Saída do último módulo deve retirar a Sala da listagem e negar sua rota na mesma transação; coberto na Tarefa 4.
- Módulo arquivado entre a geração e o aceite do convite deve recusar entrada; coberto na Tarefa 3.
- Falha durante saída de todos os módulos deve reverter participações, vínculos e preservação histórica como uma unidade; coberto na Tarefa 4.

---

### Task 1: Modelo modular, migração e rastreabilidade inicial

**Files:**
- Modify: `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261028120000_participacao_modular_salas/migration.sql`
- Create: `src/servidor/modelo-participacao-modular-salas.test.ts`

**Interfaces:**
- Produces: enums `PapelParticipacaoModuloSala` e `SituacaoParticipacaoModuloSala`; models `ParticipacaoModuloSala` e `ConviteModuloSala`; relation `VinculoModuloSala.participacaoModuloSalaId`.
- Produces: requisito `RVS-003` com os dez critérios de aceitação do desenho aprovado.

- [x] **Step 1: Registrar `RVS-003` na matriz antes do código**

Adicionar uma linha funcional com aceite para convite por módulo, ocultamento integral, primeiro acesso, saída derivada, ausência de dashboard da Sala e visibilidade administrativa.

- [x] **Step 2: Escrever o teste estrutural inicialmente falho**

Em `modelo-participacao-modular-salas.test.ts`, ler schema e migração e afirmar: unicidade `moduloSalaId + usuarioId`, convite ligado a `moduloSalaId`, vínculo ligado a `participacaoModuloSalaId`, criação de participações para proprietários e vínculos ativos, e revogação de convites de Sala ativos.

- [x] **Step 3: Executar o teste e confirmar a falha**

Run: `npm.cmd run testar -- src/servidor/modelo-participacao-modular-salas.test.ts`  
Expected: FAIL porque os novos enums, models e migração ainda não existem.

- [x] **Step 4: Implementar schema e migração**

Definir:

- `PapelParticipacaoModuloSala = ADMINISTRADOR | PARTICIPANTE`;
- `SituacaoParticipacaoModuloSala = ATIVA | SAIU | REMOVIDA`;
- `ParticipacaoModuloSala` com `id`, `moduloSalaId`, `usuarioId`, `papel`, `situacao`, `entrouEm`, `encerrouEm` e unicidade por módulo/usuário;
- `ConviteModuloSala` com `moduloSalaId`, `criadoPorId`, `codigoHash`, `expiraEm`, `revogadoEm` e `criadoEm`;
- `VinculoModuloSala.participacaoModuloSalaId` obrigatório e único após o preenchimento da migração, removendo sua dependência relacional de `membroSalaId` sem apagar dados de `MembroSala`.

A migração deve criar participação administrativa para cada módulo, participação comum para cada vínculo ativo, associar todos os vínculos preservados e marcar convites de Sala ativos como revogados.

- [x] **Step 5: Gerar o cliente e executar o teste**

Run: `npm.cmd run banco:gerar`  
Expected: Prisma Client gerado sem erro.  
Run: `npm.cmd run testar -- src/servidor/modelo-participacao-modular-salas.test.ts`  
Expected: PASS.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `feat: adicionar participacao modular nas salas`

### Task 2: Consultas e autorização derivadas das participações

**Files:**
- Modify: `src/servidor/salas.ts`
- Create: `src/servidor/salas-participacoes.test.ts`
- Modify: `scripts/verificar-servicos-salas.ts`

**Interfaces:**
- Produces: `obterModuloSalaDaConta(usuarioId: string, identificadorSala: string, moduloSalaId: string)` retornando o módulo autorizado, papel modular, participações e vínculo próprio mínimo, ou `null`.
- Changes: `listarSalasDaConta(usuarioId: string)` deriva acesso por propriedade ou participação ativa.
- Changes: `obterSalaDaConta(usuarioId: string, identificador: string)` retorna todos os módulos ao proprietário, apenas módulos autorizados ao participante e `participantes` somente ao proprietário.

- [x] **Step 1: Escrever testes de autorização inicialmente falhos**

Criar cenário com Sala e módulos A, B e C. Afirmar que participante somente de A lista a Sala e recebe apenas A; abrir B retorna `null`; proprietário recebe A/B/C; participação ativa sem vínculo também autoriza A; a lista geral deduplica usuários e associa os módulos corretos; participante comum não recebe `participantes`.

- [x] **Step 2: Executar os testes e confirmar a falha**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts`  
Expected: FAIL porque as consultas ainda usam `MembroSala` e expõem todos os módulos da Sala.

- [x] **Step 3: Implementar as consultas mínimas autorizadas**

Substituir `exigirMembroAtivo` por verificadores de propriedade/participação. Consultar autorização antes de selecionar metadados. O DTO do proprietário deve conter `participantes: Array<{ usuarioId; nome; nomeUsuario; modulos: Array<{ id; titulo }> }>`; o DTO comum deve omitir essa propriedade.

- [x] **Step 4: Atualizar o verificador de serviços para A/B/C**

Trocar as asserções baseadas em `MembroSala` por participações modulares e acrescentar a negação de metadados de B/C.

- [x] **Step 5: Executar testes unitários e de serviço**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts`  
Expected: PASS.  
Run: `npm.cmd run testar:salas`  
Expected: PASS e mensagem confirmando isolamento modular.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `refactor: autorizar salas pelas participacoes modulares`

### Task 3: Convites exclusivos de módulo

**Files:**
- Modify: `src/servidor/salas.ts`
- Modify: `src/app/salas/acoes.ts`
- Modify: `src/app/salas/convite/[codigo]/page.tsx`
- Modify: `src/app/salas/gerador-convite.tsx`
- Modify: `src/app/salas/page.tsx`
- Modify: `src/app/salas/page.test.ts`
- Modify: `src/servidor/compartilhamento-modulos.test.ts`
- Modify: `src/servidor/salas-participacoes.test.ts`

**Interfaces:**
- Produces: `gerarConviteModuloSala(usuarioId: string, entrada: { moduloSalaId: string })`.
- Produces: `revogarConviteModuloSala(usuarioId: string, conviteId: string)`.
- Produces: `obterContextoConviteModuloSala(codigo: string): Promise<{ nomeSala: string; tituloModulo: string } | null>` sem retornar IDs ou participantes.
- Produces: `entrarModuloSalaComCodigo(usuarioId: string, entrada: { codigo: string }): Promise<{ identificadorSala: string; moduloSalaId: string }>`.
- Changes: `gerarNovoConvite` exige `moduloSalaId`; `entrarEmSala` redireciona para `/salas/[identificador]/modulos/[moduloSalaId]`.

- [x] **Step 1: Escrever testes inicialmente falhos do convite modular**

Cobrir: somente proprietário gera convite; hash persistido sem código puro; aceite cria somente participação no módulo alvo; aceite repetido retorna `SOLICITACAO_DUPLICADA`; convite revogado, expirado ou de módulo arquivado retorna `CONVITE_INVALIDO`; códigos de Sala legados e do compartilhamento direto falham no fluxo modular sem revelar Sala ou módulo.

- [x] **Step 2: Executar testes e confirmar a falha**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts src/servidor/compartilhamento-modulos.test.ts`  
Expected: FAIL porque o convite ainda é de Sala.

- [x] **Step 3: Implementar os serviços de convite**

Reutilizar normalização, SHA-256 e validade de sete dias. Registrar eventos `CONVITE_MODULO_SALA_GERADO`, `CONVITE_MODULO_SALA_REVOGADO` e `ENTRADA_MODULO_SALA_POR_CODIGO`, sem persistir o segredo.

- [x] **Step 4: Adaptar actions e página de aceite**

Alterar textos para `Convite para módulo`, mostrar Sala e módulo somente após validação segura do código e confirmar que a entrada autoriza apenas aquele módulo. Remover da página geral de Salas qualquer promessa de entrada genérica por código; o código modular continua podendo ser colado ali e redireciona ao módulo.

- [x] **Step 5: Executar testes de serviço e interface**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts src/servidor/compartilhamento-modulos.test.ts src/app/salas/page.test.ts`  
Expected: PASS.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `feat: vincular convites aos modulos da sala`

### Task 4: Primeiro acesso, vínculo e saída transacional

**Files:**
- Modify: `src/servidor/salas.ts`
- Modify: `src/app/salas/acoes.ts`
- Modify: `src/servidor/salas-participacoes.test.ts`
- Modify: `scripts/verificar-servicos-salas.ts`
- Modify: `scripts/verificar-dashboards-salas.ts`

**Interfaces:**
- Changes: `vincularInstanciaModuloSala` exige participação ativa e mantém as entradas `{ moduloSalaId; moduloPessoalId?; criarInstancia }`.
- Produces: `sairDoModuloSala(usuarioId: string, entrada: { moduloSalaId: string })`.
- Produces: `removerParticipanteModuloSala(usuarioId: string, entrada: { moduloSalaId: string; participacaoId: string })` restrito ao proprietário.
- Changes: `sairDaSala(usuarioId: string, entrada: { salaId: string })` encerra todas as participações modulares comuns do usuário.
- Produces: action `sairModulo(formulario: FormData)`.

- [x] **Step 1: Escrever testes inicialmente falhos do ciclo de participação**

Cobrir: participante sem vínculo cria instância homônima; pode vincular módulo pessoal existente elegível; não participante recebe `NAO_ENCONTRADO`; sair de A preserva acesso por B; sair de B quando é o último retira a Sala da listagem; `Sair da Sala` encerra A/B em uma transação; remoção administrativa afeta somente o módulo indicado; falha simulada na preservação reverte toda a saída; exclusão de conta, arquivamento e exclusão da Sala encerram participações e convites modulares; módulo pessoal nunca é apagado.

- [x] **Step 2: Executar os testes e confirmar a falha**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts`  
Expected: FAIL porque vínculo e saída ainda dependem de `MembroSala`.

- [x] **Step 3: Implementar vínculo e saídas**

Usar transações para preservar evidências, encerrar vínculo e participação e registrar `SAIDA_MODULO_SALA`, `PARTICIPANTE_MODULO_SALA_REMOVIDO` ou `SAIDA_SALA`. Adaptar `prepararExclusaoContaNasSalas`, `arquivarSala` e `excluirSala` para as novas relações. `desvincularInstanciaModuloSala` deixa de ser a ação exposta ao participante; o fluxo visível passa a sair do módulo.

- [x] **Step 4: Atualizar verificadores sintéticos**

Construir participações antes dos vínculos e confirmar histórico pseudonimizado, reativação sem duplicidade e acesso derivado.

- [x] **Step 5: Executar validações focadas**

Run: `npm.cmd run testar -- src/servidor/salas-participacoes.test.ts`  
Expected: PASS.  
Run: `npm.cmd run testar:salas`  
Expected: PASS.  
Run: `npm.cmd run testar:dashboards-salas`  
Expected: PASS com o provedor de IA isolado conforme o próprio script.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `feat: controlar instancia e saida por modulo da sala`

### Task 5: Página da Sala sem dashboard consolidado

**Files:**
- Modify: `src/app/salas/[identificador]/page.tsx`
- Modify: `src/app/salas/[identificador]/page.test.ts`
- Modify: `src/app/salas/page.module.css`
- Delete: `src/app/salas/[identificador]/dashboard-geral-sala.tsx`
- Delete: `src/app/salas/[identificador]/dashboard-geral-sala.test.ts`

**Interfaces:**
- Consumes: DTO autorizado de `obterSalaDaConta` da Tarefa 2.
- Produces: grade de módulos filtrada, lista administrativa deduplicada e controles de Sala sem convite genérico nem dashboard.

- [x] **Step 1: Atualizar o teste da página para falhar com a interface antiga**

Afirmar: proprietário vê cards A/B/C, botão `+`, lista geral e associações por módulo; participante de A vê somente A e não vê lista, B ou C; nenhuma variante contém `Dashboard geral da sala`, `DashboardGeralSala` ou convites de Sala.

- [x] **Step 2: Executar o teste e confirmar a falha**

Run: `npm.cmd run testar -- src/app/salas/[identificador]/page.test.ts`  
Expected: FAIL porque a página ainda renderiza dashboard e gestão de convite no nível da Sala.

- [x] **Step 3: Implementar a composição da Sala**

Remover consulta/renderização do dashboard geral e o gerador de convite. Manter cabeçalho, cards, criação discreta, controles administrativos e `Sair da Sala`. Renderizar lista geral somente quando `participantes` estiver presente no DTO do proprietário.

- [x] **Step 4: Remover componente e estilos mortos**

Excluir apenas o componente de dashboard geral da Sala e seletores sem uso comprovado; preservar componentes compartilhados pelos dashboards de módulo.

- [x] **Step 5: Executar testes de página**

Run: `npm.cmd run testar -- src/app/salas/[identificador]/page.test.ts src/app/salas/cartoes-salas.test.ts`  
Expected: PASS.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `refactor: tornar sala uma pasta de modulos`

### Task 6: Página do módulo com Membros e convites contextuais

**Files:**
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.test.ts`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.test.ts`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.module.css`
- Modify: `src/app/salas/gerador-convite.tsx`

**Interfaces:**
- Consumes: `obterModuloSalaDaConta` da Tarefa 2, serviços de convite da Tarefa 3 e saída da Tarefa 4.
- Changes: `AbasModuloSala` aceita membros com estado `vinculado | aguardando_vinculo`; conteúdo individual é opcional no segundo estado.

- [x] **Step 1: Escrever testes inicialmente falhos das variantes administrativa e comum**

Cobrir: administrador recebe `Dashboard` e `Membros`; convite aparece somente em `Membros`; participante sem vínculo aparece como `Aguardando vínculo`; selecionar esse participante não tenta renderizar dashboard; administrador pode remover o participante somente daquele módulo; participante comum sem vínculo recebe as duas escolhas de instância; com vínculo recebe atalho pessoal e `Sair do módulo`; acesso a módulo não autorizado chama `notFound`.

- [x] **Step 2: Executar testes e confirmar a falha**

Run: `npm.cmd run testar -- src/app/salas/[identificador]/modulos/[moduloId]/page.test.ts src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.test.ts`  
Expected: FAIL nos estados sem vínculo, convite contextual e saída.

- [x] **Step 3: Implementar a página com consulta direta autorizada**

Parar de localizar o módulo dentro do DTO amplo da Sala. Para administrador, compor as duas abas e excluir sua própria participação da lista. Para participante, renderizar somente o próprio estado e nunca consultar dashboards alheios.

- [x] **Step 4: Implementar estados e convite dentro de `Membros`**

Adicionar convite/revogação no cabeçalho da aba, resumo `Aguardando vínculo` e painel direito vazio explicativo. Preservar teclado, `aria-selected`, `aria-pressed`, foco visível e empilhamento responsivo.

- [x] **Step 5: Executar testes da interface**

Run: `npm.cmd run testar -- src/app/salas/[identificador]/modulos/[moduloId]/page.test.ts src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.test.ts`  
Expected: PASS.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `feat: administrar membros dentro do modulo da sala`

### Task 7: Dashboard estritamente por módulo

**Files:**
- Modify: `src/servidor/paineis-salas.ts`
- Create: `src/servidor/paineis-modulo-sala.test.ts`
- Modify: `src/servidor/ia/interpretacoes.ts`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx`
- Modify: `scripts/verificar-dashboards-salas.ts`

**Interfaces:**
- Produces: `obterDashboardModuloSalaDoProprietario(usuarioId: string, identificadorSala: string, moduloSalaId: string)` retornando um único painel modular ou `null`.
- Changes: `obterDashboardIndividualAutorizado(usuarioId: string, identificadorSala: string, vinculoId: string)` autoriza pela propriedade e participação modular, sem dashboard geral.
- Removes: consumo de `obterDashboardsSalaDoProprietario` e propriedade `geral`.

- [x] **Step 1: Escrever testes inicialmente falhos do isolamento analítico**

Cobrir: painel de A ignora vínculos e histórico de B; proprietário acessa A; participante comum e terceiro recebem `null`; participação sem vínculo aparece na lista administrativa, mas não altera contribuidores; dashboard individual exige vínculo ativo do módulo solicitado.

- [x] **Step 2: Executar testes e confirmar a falha**

Run: `npm.cmd run testar -- src/servidor/paineis-modulo-sala.test.ts`  
Expected: FAIL porque o serviço atual calcula todos os módulos e um agregado geral de Sala.

- [x] **Step 3: Implementar consulta e cálculo de um módulo**

Eliminar acumuladores `evidenciasSalaVivas`, `analisesSala` e `geral`. Selecionar diretamente o módulo autorizado e manter amostra mínima, histórico pseudonimizado, comparação descritiva e DTO sanitizado vigentes.

- [x] **Step 4: Atualizar IA e página para o serviço modular**

Fazer interpretação individual revalidar a identidade do vínculo ativo e a propriedade do módulo antes e depois da chamada externa. A página solicita somente o dashboard do `moduloId` da rota.

- [x] **Step 5: Executar validações analíticas**

Run: `npm.cmd run testar -- src/servidor/paineis-modulo-sala.test.ts src/app/salas/[identificador]/modulos/[moduloId]/page.test.ts`  
Expected: PASS.  
Run: `npm.cmd run testar:dashboards-salas`  
Expected: PASS sem depender de provedor externo ativo.

- [x] **Step 6: Commit de checkpoint**

Commit sugerido: `refactor: limitar dashboards da sala ao modulo`

### Task 8: Seed, compatibilidade, documentação e validação final

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `src/servidor/compartilhamento-modulos.test.ts`
- Modify: `src/app/salas/permissoes-obrigatorias.test.ts`
- Modify: `AiFiles/Contexto/Tecnico/MODELO_DE_DADOS.md`
- Modify: `AiFiles/Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`
- Modify: `AiFiles/Contexto/Tecnico/ARQUITETURA.md`
- Modify: `AiFiles/Contexto/Tecnico/DICIONARIO_DE_EVENTOS.md`
- Modify: `AiFiles/Memoria/DECISOES_DO_PROJETO.md`
- Modify: `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- Modify: `AiFiles/Memoria/ACOMPANHAMENTO.md`
- Modify: `AiFiles/Planos/DESENHO_REFORMULACAO_SALA_MODULOS.md`
- Modify: `AiFiles/Planos/PLANO_AUTORIZACAO_MODULAR_SALAS.md`

**Interfaces:**
- Consumes: todas as interfaces anteriores.
- Produces: seed reproduzível, fontes canônicas atualizadas, requisito `RVS-003` rastreado e aplicação local respondendo.

- [x] **Step 1: Atualizar testes estáticos de invariantes**

Afirmar ausência de controles opcionais de compartilhamento, ausência de dashboard da Sala, presença de convite modular e independência de `CompartilhamentoModulo`.

- [x] **Step 2: Atualizar o seed sintético**

Criar participações administrativas e comuns antes dos vínculos; incluir ao menos dois módulos na mesma Sala e um participante autorizado em apenas um deles para demonstrar ocultamento.

- [x] **Step 3: Executar testes focados e corrigir regressões relacionadas**

Run: `npm.cmd run testar:salas`  
Expected: PASS.  
Run: `npm.cmd run testar:dashboards-salas`  
Expected: PASS.  
Run: `npm.cmd run testar:compartilhamento-modulos`  
Expected: PASS, comprovando independência do compartilhamento direto.

- [x] **Step 4: Atualizar fontes canônicas e estados do plano**

Registrar a nova fonte de autorização, contratos dos convites e saídas, eventos de auditoria, decisão duradoura, arquivos alterados e evidências reais. Marcar desenho como aprovado e plano como executado somente após todas as validações.

- [x] **Step 5: Executar validação completa**

Run: `npm.cmd run validar`  
Expected: segredos, ESLint, TypeScript, todos os testes e build aprovados.

- [x] **Step 6: Confirmar a aplicação local**

Reutilizar o processo de desenvolvimento existente se saudável; caso contrário, iniciar `npm.cmd run desenvolver`. Confirmar resposta HTTP 200 em `http://localhost:3000/entrar` e manter um único servidor ativo.

- [x] **Step 7: Revisar o diff final**

Confirmar que não há arquivos não relacionados, convites genéricos de Sala ativos, consultas de autorização por `MembroSala` ou dashboard consolidado da Sala.

- [x] **Step 8: Commit final de documentação**

Commit sugerido: `docs: registrar autorizacao modular das salas`
