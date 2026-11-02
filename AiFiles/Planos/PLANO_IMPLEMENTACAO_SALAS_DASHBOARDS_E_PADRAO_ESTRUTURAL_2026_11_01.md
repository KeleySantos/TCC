# Salas, Dashboards e Padrão Estrutural — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar cabeçalhos e bordas, refinar Dashboard/Módulos/Métodos/Salas e completar o ciclo seguro de edição, desvinculação e remoção de participantes de instâncias compartilhadas.

**Architecture:** Separar tokens/componentes visuais estruturais das regras de domínio. Instâncias de Sala continuam módulos pessoais; vínculos ativos determinam apenas estado compartilhado e acesso. Dashboards individuais reutilizam a composição do módulo e a comparação consome a série temporal já calculada.

**Tech Stack:** Next.js 16.3.3, React, TypeScript, CSS Modules, Prisma, Vitest, Recharts.

**Spec:** `AiFiles/Planos/DESENHO_SALAS_DASHBOARDS_E_PADRAO_ESTRUTURAL_2026_11_01.md`

## Global Constraints

- Ler a documentação local relevante em `node_modules/next/dist/docs/` antes de alterar código Next.js.
- Aplicar `--cor-borda-estrutural: #d3d5d8` e `--espessura-borda-estrutural: 1.5px` apenas a cards/divisores estruturais.
- Preservar inputs, tabelas, foco e estados semânticos com seus estilos atuais.
- Toda Server Action autentica, valida entrada e deriva propriedade/papel/vínculo do banco.
- Parar compartilhamento ou remover participante nunca apaga o módulo pessoal nem evidências históricas.
- Implementar cada comportamento em ciclo RED → GREEN → REFACTOR.

## Review Focus

- Participante não pode editar instância alheia nem remover terceiros.
- Proprietário não pode remover a si próprio da Sala.
- Usuário removido perde acesso à Sala, mas mantém módulo pessoal sem estado compartilhado.
- Dashboard não aparece antes da seleção explícita de participante.
- Bordas novas não podem engrossar inputs, tabelas, modais ou indicadores de foco.

---

### Task 1: Primitivo de cabeçalho e bordas estruturais

**Files:**
- Create: `src/componentes/cabecalho-pagina.tsx`
- Create: `src/componentes/cabecalho-pagina.module.css`
- Create: `src/componentes/cabecalho-pagina.test.tsx`
- Modify: `src/app/globais.css`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/page.module.css`
- Modify: `src/app/modulos/page.tsx`
- Modify: `src/app/modulos/page.module.css`
- Modify: `src/app/desafios/page.tsx`
- Modify: `src/app/desafios/page.module.css`
- Modify: `src/app/salas/page.tsx`
- Modify: `src/app/salas/page.module.css`

**Interfaces:**
- Produces: `CabecalhoPagina({ titulo, preTitulo?, descricao?, acoes? })` com trilha superior reservada e linha-base comum do `h1`.

- [ ] Escrever teste falhando que verifica estrutura semântica, slot reservado sem `preTitulo` e renderização de ações.
- [ ] Executar o teste isolado e confirmar falha pela ausência do componente.
- [ ] Implementar o componente e os tokens estruturais; migrar os quatro cabeçalhos e apenas cards/divisores estruturais dessas páginas.
- [ ] Adicionar “Módulos registrados” com a tipografia de “Métodos disponíveis”.
- [ ] Executar teste isolado e testes das quatro páginas; confirmar aprovação.

### Task 2: Refinamentos do Dashboard e Materiais

**Files:**
- Modify: `src/app/dashboard/page.module.css`
- Modify: `src/componentes/interpretacao-automatica.module.css`
- Modify: `src/app/modulos/[identificador]/painel-materiais-modulo.tsx`
- Test: `src/app/modulos/[identificador]/painel-materiais-modulo.test.tsx`

**Interfaces:**
- Consumes: tokens visuais da Task 1.

- [ ] Escrever teste falhando que confirma o cabeçalho Materiais sem ícone decorativo.
- [ ] Confirmar RED no teste isolado.
- [ ] Aplicar `--cor-navegacao` ao título, Base das análises e botão IA; aplicar `--cor-dados-azul` à saudação; remover o ícone Materiais.
- [ ] Confirmar GREEN e executar testes do Dashboard e Materiais.

### Task 3: Contratos da instância vinculada

**Files:**
- Modify: `src/servidor/salas.ts`
- Modify: `src/servidor/modulos.ts`
- Modify: `src/app/salas/acoes.ts`
- Modify: `src/app/modulos/page.tsx`
- Test: `src/servidor/salas-participacoes.test.ts`
- Test: `src/servidor/modulos.test.ts`

**Interfaces:**
- Produces: `atualizarInstanciaVinculada(usuarioId, entrada)` e `pararCompartilhamentoInstancia(usuarioId, entrada)`.
- Produces: `vinculoSalaAtivo` na listagem de módulos pessoais.

- [ ] Escrever testes falhando para edição autorizada, bloqueio de instância alheia, preservação do módulo ao desvincular e remoção do estado compartilhado.
- [ ] Confirmar RED nos testes direcionados.
- [ ] Implementar serviços, schemas/actions e revalidações de Sala, `/modulos` e módulo pessoal.
- [ ] Atualizar a origem do ícone compartilhado para vínculo ativo de Sala, sem misturar compartilhamento direto de dashboard.
- [ ] Confirmar GREEN nos testes direcionados e suíte de serviços.

### Task 4: Modal da instância na Sala

**Files:**
- Create: `src/app/salas/modal-instancia-vinculada.tsx`
- Create: `src/app/salas/modal-instancia-vinculada.module.css`
- Create: `src/app/salas/modal-instancia-vinculada.test.tsx`
- Modify: `src/app/salas/cartoes-salas.tsx`
- Modify: `src/app/salas/[identificador]/page.tsx`

**Interfaces:**
- Consumes: actions e DTO da Task 3.

- [ ] Escrever testes falhando: clique não navega, modal oferece Editar/Parar compartilhamento, edição envia nome/descrição e parada exige confirmação.
- [ ] Confirmar RED.
- [ ] Implementar card acionável e modal acessível com foco, Escape e fechamento explícito.
- [ ] Confirmar GREEN e executar testes dos cards de Sala.

### Task 5: Remoção de participante no nível da Sala

**Files:**
- Modify: `src/servidor/salas.ts`
- Modify: `src/app/salas/acoes.ts`
- Modify: `src/app/salas/[identificador]/page.tsx`
- Create: `src/app/salas/[identificador]/remover-participante-sala.tsx`
- Test: `src/servidor/salas-participacoes.test.ts`
- Test: `src/app/salas/permissoes-obrigatorias.test.ts`

**Interfaces:**
- Produces: `removerUsuarioDaSala(proprietarioId, { salaId, usuarioId })`.

- [ ] Escrever testes falhando para autorização, proibição de auto-remoção, encerramento de todos os vínculos e preservação das instâncias.
- [ ] Confirmar RED.
- [ ] Implementar transação, action e botão de menos com confirmação.
- [ ] Remover handles da lista e revalidar todas as rotas afetadas.
- [ ] Confirmar GREEN e executar suíte de permissões/participações.

### Task 6: Participantes e dashboards do módulo da Sala

**Files:**
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.test.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.module.css`
- Modify: `src/app/salas/dashboard-sala.module.css`

**Interfaces:**
- Consumes: dashboards individuais já autorizados por `obterPainelModuloSala`.

- [ ] Escrever testes falhando para aba “Participantes”, seleção inicial nula, placeholder e troca isolada entre usuários.
- [ ] Confirmar RED.
- [ ] Implementar seleção explícita, cards escuros e reutilização do visual do Dashboard do Módulo.
- [ ] Remover somente a linha/descrição “Turma …”, preservando o título.
- [ ] Confirmar GREEN.

### Task 7: Comparação por percepção e evidências

**Files:**
- Modify: `src/app/salas/comparacao-membros.tsx`
- Modify: `src/app/salas/comparacao-membros.test.tsx`
- Modify: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx`
- Modify: `src/app/salas/dashboard-sala.module.css`

**Interfaces:**
- Consumes: `individual.aprendizagem.evolucaoPercepcaoEvidencia`.
- Produces: barras verticais agrupadas por usuário, escala 0–100, séries “Percepção” e “Evidências”.

- [ ] Escrever testes falhando para gráfico sempre visível, ausência do toggle, transformação por usuário e exclusão de removidos.
- [ ] Confirmar RED.
- [ ] Propagar a série existente, agregar pelo período atual e renderizar BarChart vertical com tabela acessível.
- [ ] Remover borda/fundo/card do wrapper comparativo.
- [ ] Confirmar GREEN e executar testes dos painéis de Sala.

### Task 8: Cópias e cartões compartilhados

**Files:**
- Modify: `src/app/salas/modulos-compartilhados.tsx`
- Modify: `src/app/salas/page.tsx`
- Test: `src/app/salas/modulos-compartilhados.test.tsx`

**Interfaces:**
- Consumes: nome do proprietário já presente no DTO de compartilhamento.

- [ ] Escrever teste falhando para “Compartilhado por {nome}” sem linha duplicada.
- [ ] Confirmar RED.
- [ ] Implementar a cópia única e remover handles residuais nos cartões abrangidos.
- [ ] Confirmar GREEN.

### Task 9: Verificação integrada

**Files:**
- Modify: `AiFiles/Memoria/MATRIZ_RASTREABILIDADE_REQUISITOS.md`
- Modify: documentação de contexto/memória exigida pelas diretrizes, se aplicável.

- [ ] Registrar requisito e evidências na matriz de rastreabilidade.
- [ ] Executar testes direcionados de todas as tasks.
- [ ] Executar suíte completa, typecheck e lint; registrar qualquer falha preexistente pelo nome.
- [ ] Inspecionar visualmente desktop e mobile: alinhamento dos quatro títulos, bordas, modal, seleção de participante, comparação e remoção.
- [ ] Fazer revisão final independente do diff completo.
