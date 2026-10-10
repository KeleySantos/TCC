# Plano de implementação do redesign minimalista 19576

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa por tarefa. Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** aplicar às 13 superfícies atuais a linguagem visual minimalista aprovada, sem remover, adicionar ou alterar funcionalidades.

**Arquitetura:** consolidar primeiro tokens e padrões globais, adaptar a casca autenticada e então migrar os módulos CSS por grupos de telas. Componentes React, consultas, ações e contratos permanecem como fonte funcional; alterações de marcação serão limitadas à hierarquia semântica necessária ao layout.

**Stack:** Next.js 16.3.3, React 19.2.8, TypeScript 5.9.3, CSS Modules, Tailwind CSS 4, Recharts 3.10.1, Vitest e Testing Library.

**Especificação:** `AiFiles/Planos/DESENHO_REDESIGN_MINIMALISTA_19576.md`

## Restrições globais

- A alteração é exclusivamente de Front End.
- Não remover nem adicionar páginas, links, botões, formulários, campos, filtros, gráficos, séries, tabelas, estados ou mensagens.
- Não alterar consultas, ações de servidor, DTOs, regras analíticas, autorização, significado, cálculo ou período de métricas.
- Não ocultar amostra, insuficiência, erro, privacidade ou limites científicos.
- Não adicionar dependências, fontes externas, serviços ou assets licenciados.
- Código, identificadores próprios, interface e documentação permanecem em português do Brasil.
- Preservar operação por teclado, foco visível, alternativas tabulares dos gráficos e `prefers-reduced-motion`.
- O documento não pode apresentar overflow horizontal em 360 CSS px; verificar também reflow em 320 CSS px.
- Preservar todas as alterações preexistentes no worktree.

## Foco da revisão

- Conteúdo longo em títulos, descrições e nomes deve quebrar linha sem invadir ações ou provocar overflow.
- Estados vazios, insuficientes, de erro e sucesso devem permanecer legíveis com a nova hierarquia.
- Barra recolhida, barra expandida e navegação móvel devem expor os mesmos destinos e a ação de saída.
- Tabelas e gráficos devem permanecer operáveis em 320–360 px, com rolagem restrita ao contêiner quando necessária.
- Painéis sobrepostos — filtro temporal, detalhes e formulários — devem manter foco, limites da viewport e ordem de empilhamento.

---

### Tarefa 1: contrato visual, tokens e casca autenticada

**Arquivos:**
- Criar: `src/componentes/sistema-visual.test.ts`
- Modificar: `src/app/globais.css`
- Modificar: `src/componentes/estrutura-autenticada.tsx`
- Modificar: `src/componentes/estrutura-autenticada.module.css`

**Interfaces:**
- Consome: estrutura atual de `EstruturaAutenticada({ children, usuarioNome })` e os sete destinos de `ITENS_NAVEGACAO`.
- Produz: tokens CSS `--cor-*`, `--espaco-*`, `--raio-*`, `--sombra-*`, `--largura-conteudo` e `--foco`; casca autenticada com estado compacto de 88 px e expandido de 248 px, mantendo a chave `learning-lab:barra-lateral-recolhida`.

- [ ] **Passo 1: escrever os testes inicialmente falhos do contrato visual**

Em `sistema-visual.test.ts`, ler os arquivos com `readFileSync` e criar testes que confirmem:

- tokens semânticos para fundo, superfície, navegação, texto, texto secundário, ação, ação suave e borda;
- escala de espaço 4/8/12/16/24/32/48, raio de cartão e sombra suave;
- barra compacta com 88 px, expandida com 248 px e fundo carvão sem gradiente estrutural;
- presença dos sete rótulos de navegação e da ação `Sair` no componente;
- media query móvel, foco visível e `prefers-reduced-motion`.

- [ ] **Passo 2: executar o teste e confirmar a falha**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts`

Esperado: falhar por ausência dos novos tokens e das dimensões da casca.

- [ ] **Passo 3: implementar tokens globais e padrões base**

Em `globais.css`, substituir o conjunto estrutural azul/roxo por tokens semânticos de fundo `#f4f7fb`, superfície `#ffffff`, navegação `#202326`, texto `#111827`, texto secundário `#718096`, ação `#1976ed`, ação suave `#eaf4ff` e borda `#e2e8f0`. Unificar cartão, botão, campo, aviso, tabela, foco, largura e espaçamento sem remover as classes globais existentes.

- [ ] **Passo 4: adaptar a casca autenticada**

Em `estrutura-autenticada.tsx` e seu CSS Module, manter os mesmos links, controles e armazenamento; tornar o estado compacto o padrão visual de 88 px no desktop, permitir expansão para 248 px e simplificar marca, fundo, seleção, conta e saída. No móvel, preservar todos os destinos em uma faixa navegável e a saída acessível.

- [ ] **Passo 5: executar teste focado, lint e tipos**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts && npm.cmd run verificar-estilo && npm.cmd run verificar-tipos`

Esperado: teste aprovado, lint sem erros e TypeScript com código 0.

- [ ] **Passo 6: registrar checkpoint**

Registrar no ledger os arquivos alterados e a evidência do teste. Não criar commit sem autorização específica do usuário, pois o worktree contém alterações preexistentes não isoladas.

### Tarefa 2: entrada, histórico, perfil e configurações de IA

**Arquivos:**
- Modificar: `src/app/entrar/page.tsx`
- Modificar: `src/app/entrar/page.module.css`
- Modificar: `src/app/historico/page.tsx`
- Modificar: `src/app/perfil/page.tsx`
- Modificar: `src/app/configuracoes/ia/page.tsx`
- Modificar: `src/app/configuracoes/ia/page.module.css`
- Modificar: `src/componentes/sistema-visual.test.ts`

**Interfaces:**
- Consome: tokens e padrões globais da Tarefa 1; ações atuais de login, perfil, senha e configuração de provedores.
- Produz: composições minimalistas para as quatro superfícies simples, sem nova propriedade ou contrato de servidor.

- [ ] **Passo 1: ampliar os testes do contrato visual**

Adicionar testes que confirmem a presença de classes estruturais para cabeçalho simples, superfície principal, tabela rolável, grade de dois formulários e cartão de provedor; confirmar por leitura de JSX que todos os campos e ações atuais continuam presentes.

- [ ] **Passo 2: executar e observar a falha**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts`

Esperado: falhar por ausência das novas classes e do uso uniforme dos tokens.

- [ ] **Passo 3: adaptar a entrada**

Manter campos, submissão e mensagens. Reorganizar apenas wrappers semânticos necessários para uma composição clara: apresentação discreta, formulário dominante, fundo luminoso e nenhuma grande área saturada.

- [ ] **Passo 4: adaptar histórico e perfil**

Manter tabela, colunas, formulários, campos e avisos. Aplicar cabeçalho compacto, cartões claros, mais espaço entre grupos e rolagem horizontal somente no contêiner da tabela.

- [ ] **Passo 5: adaptar configurações de IA**

Manter fila, selo, aviso, provedores, campos e ações. Usar lista vertical arejada, botões secundários discretos e hierarquia clara entre status, chave e ações.

- [ ] **Passo 6: executar testes focados, lint e tipos**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/servidor/ia/interpretacoes.test.ts && npm.cmd run verificar-estilo && npm.cmd run verificar-tipos`

Esperado: todos os testes aprovados, lint sem erros e TypeScript com código 0.

### Tarefa 3: Dashboard e visualizações compartilhadas

**Arquivos:**
- Modificar: `src/app/dashboard/page.tsx`
- Modificar: `src/app/dashboard/page.module.css`
- Modificar: `src/componentes/graficos-dashboard.module.css`
- Modificar: `src/componentes/cartoes-insights-dashboard.module.css`
- Modificar: `src/componentes/mapa-conceitos-dashboard.module.css`
- Modificar: `src/componentes/interpretacao-automatica.tsx`
- Modificar: `src/componentes/sistema-visual.test.ts`

**Interfaces:**
- Consome: tokens da Tarefa 1 e dados/props atuais de todos os componentes analíticos.
- Produz: grade analítica com indicadores compactos, gráfico principal dominante e coluna secundária para associação e IA; não altera assinaturas públicas.

- [ ] **Passo 1: escrever testes de preservação e composição**

Estender o contrato visual para conferir uso dos tokens nos módulos CSS e adicionar às renderizações existentes asserções de presença do filtro, indicadores, títulos analíticos, IA e alternativas `Ver dados em tabela`.

- [ ] **Passo 2: executar e confirmar a falha visual estrutural**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/componentes/graficos-dashboard.test.ts src/componentes/cartoes-insights-dashboard.test.ts src/componentes/mapa-conceitos-dashboard.test.ts`

Esperado: o novo contrato de classes/tokens falha e os testes funcionais existentes permanecem verdes.

- [ ] **Passo 3: adaptar composição do Dashboard**

Manter a ordem semântica e todos os painéis. Aplicar faixa de indicadores, uma área principal de evolução, coluna secundária em desktop e empilhamento em telas menores. Subordinar contexto e detalhes sem escondê-los.

- [ ] **Passo 4: adaptar gráficos, insights, mapa e interpretação**

Unificar cartões, cabeçalhos, legendas, filtros, eixos, estados vazios e detalhes de tabela. Usar azul como ação/seleção, preservando cores distintas quando necessárias para séries e estados.

- [ ] **Passo 5: executar testes analíticos e verificações estáticas**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/componentes/graficos-dashboard.test.ts src/componentes/cartoes-insights-dashboard.test.ts src/componentes/mapa-conceitos-dashboard.test.ts src/componentes/consistencia-metodos-dashboard.test.ts && npm.cmd run verificar-estilo && npm.cmd run verificar-tipos`

Esperado: testes aprovados, lint sem erros e TypeScript com código 0.

### Tarefa 4: módulos e três sub-abas

**Arquivos:**
- Modificar: `src/app/modulos/page.tsx`
- Modificar: `src/app/modulos/page.module.css`
- Modificar: `src/app/modulos/[identificador]/page.tsx`
- Modificar: `src/app/modulos/[identificador]/page.module.css`
- Modificar: `src/app/modulos/[identificador]/painel-metricas-sessoes.module.css`
- Modificar: `src/app/modulos/[identificador]/painel-sessoes.module.css`
- Modificar: `src/app/modulos/[identificador]/subabas-modulo.tsx`
- Modificar: `src/app/modulos/[identificador]/filtro-periodo-modulo.tsx`
- Modificar: `src/componentes/sistema-visual.test.ts`

**Interfaces:**
- Consome: tokens e gráficos das Tarefas 1 e 3; contratos atuais de módulos, sessões, materiais, filtro e análise.
- Produz: catálogo de módulos e página interna coerentes com os protótipos; preserva assinaturas, nomes e quantidade das três sub-abas.

- [ ] **Passo 1: escrever testes de estrutura e preservação**

Adicionar ao contrato visual asserções dos estilos de catálogo, cabeçalho do módulo, abas, filtro, cartões analíticos, linha do tempo, sessões e materiais. Manter testes de que as três abas e suas áreas existem e de que ações/formulários continuam renderizados.

- [ ] **Passo 2: executar e observar a falha**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/app/modulos/[identificador]/subabas-modulo.test.ts src/app/modulos/[identificador]/conteudo-modulo-organizado.test.ts`

Esperado: falhar apenas no novo contrato visual.

- [ ] **Passo 3: adaptar catálogo e cabeçalho do módulo**

Aplicar lista/grade arejada e ações compactas em `/modulos`. Na página interna, simplificar cabeçalho, ações, abas e filtro sem alterar ordem de teclado ou rotas.

- [ ] **Passo 4: adaptar Dashboard, linha do tempo, sessões e materiais**

Usar indicadores compactos, gráfico principal dominante, painéis auxiliares leves, linha do tempo simples e formulários claros. Preservar detalhes, estados, upload, cronômetro, planejamento, edição, arquivamento e análise automática.

- [ ] **Passo 5: executar a suíte focada do módulo**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/app/modulos/[identificador]/*.test.ts src/componentes/graficos-dashboard.test.ts && npm.cmd run verificar-estilo && npm.cmd run verificar-tipos`

Esperado: testes aprovados, lint sem erros e TypeScript com código 0.

### Tarefa 5: salas e dashboards compartilhados

**Arquivos:**
- Modificar: `src/app/salas/page.tsx`
- Modificar: `src/app/salas/page.module.css`
- Modificar: `src/app/salas/cartoes-salas.tsx`
- Modificar: `src/app/salas/[identificador]/page.tsx`
- Modificar: `src/app/salas/[identificador]/dashboard-geral-sala.tsx`
- Modificar: `src/app/salas/dashboard-sala.module.css`
- Modificar: `src/componentes/sistema-visual.test.ts`

**Interfaces:**
- Consome: tokens, casca e visualizações das Tarefas 1 e 3; DTOs e ações atuais de salas.
- Produz: lista, visão de membro e administração visualmente coerentes; mantém papéis, convites, vínculos, dashboards e interpretações.

- [ ] **Passo 1: escrever testes de preservação das salas**

Estender os testes existentes para confirmar papéis, contagens, ações, módulos e dashboards. Adicionar ao contrato visual a lista horizontal discreta, cartões administrativos, painéis agregados e estados móveis.

- [ ] **Passo 2: executar e confirmar a falha**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/app/salas/cartoes-salas.test.ts src/app/salas/[identificador]/dashboard-geral-sala.test.ts`

Esperado: falhar apenas nas novas expectativas visuais.

- [ ] **Passo 3: adaptar lista e interior das salas**

Aplicar cabeçalho leve, ações compactas e linhas de sala com papel e contagem. Reutilizar a linguagem do Dashboard nas visões agregada e individual; manter todos os controles administrativos e de convite.

- [ ] **Passo 4: executar testes de salas, lint e tipos**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/app/salas/cartoes-salas.test.ts src/app/salas/[identificador]/dashboard-geral-sala.test.ts src/dominio/analises/dashboard-sala.test.ts src/servidor/aprendizagem-sala.test.ts && npm.cmd run verificar-estilo && npm.cmd run verificar-tipos`

Esperado: testes aprovados, lint sem erros e TypeScript com código 0.

### Tarefa 6: desafios, acabamento transversal e validação visual

**Arquivos:**
- Modificar: `src/app/desafios/page.tsx`
- Modificar: `src/app/desafios/page.module.css`
- Modificar: `src/componentes/sistema-visual.test.ts`
- Modificar: `AiFiles/Memoria/ACOMPANHAMENTO.md`

**Interfaces:**
- Consome: todo o sistema visual das Tarefas 1–5 e os fluxos atuais de desafios.
- Produz: última tela redesenhada, evidência visual das 13 superfícies e registro canônico da entrega.

- [ ] **Passo 1: escrever teste de preservação e acabamento**

Adicionar asserções para catálogo, criação, comparação, cancelamento, explicações e estados de desafio. Completar o contrato visual com busca por cores estruturais antigas nos seletores principais, permitindo-as apenas em séries/estados justificados.

- [ ] **Passo 2: executar e confirmar a falha**

Executar: `npm.cmd run testar -- src/componentes/sistema-visual.test.ts src/dominio/analises/comparar-desafio.test.ts`

Esperado: falhar nas novas expectativas de estilo, mantendo o teste de domínio aprovado.

- [ ] **Passo 3: adaptar desafios e revisar consistência transversal**

Destacar criação e estado atual, reduzir peso do catálogo e das instruções, preservar toda informação científica e conferir que botões, campos, tabelas, cartões, avisos e vazios compartilham os tokens.

- [ ] **Passo 4: iniciar ou reutilizar o site local e inspecionar rotas autenticadas**

Inspecionar `/entrar`, `/dashboard`, `/modulos`, um módulo nas três sub-abas, `/salas`, uma sala como membro e como responsável, `/desafios`, `/historico`, `/configuracoes/ia` e `/perfil` em desktop, largura intermediária, 360 px e 320 px. Conferir conteúdo longo, vazio/insuficiente quando disponível, teclado, foco, sobreposições e overflow do documento.

Esperado: as 13 superfícies correspondem à linguagem dos protótipos, sem perda de ação ou informação e sem overflow horizontal do documento.

- [ ] **Passo 5: executar a validação completa**

Executar: `npm.cmd run validar`

Esperado: scanner de segredos, lint, tipos, todos os testes e build aprovados com código 0.

- [ ] **Passo 6: atualizar rastreabilidade**

Registrar em `AiFiles/Memoria/ACOMPANHAMENTO.md` os arquivos, verificações, resultados e limitações reais. Rodar `git diff --check` nos arquivos tocados.
