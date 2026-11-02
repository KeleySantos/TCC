# Module Sessions and Materials Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar a subaba de sessões e materiais com linhas expansíveis, biblioteca plana e estado visual de compartilhamento ativo.

**Architecture:** Manter os componentes atuais e suas APIs de negócio, acrescentando somente estado de interface e propriedades serializáveis vindas da página servidor. CSS Modules concentram a mudança visual; testes de componentes verificam os comportamentos interativos e o conteúdo inicial.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Vitest, Testing Library.

**Spec:** `AiFiles/Planos/DESENHO_REFINO_SESSOES_MATERIAIS_MODULO.md`

## Global Constraints

- Preservar regras e endpoints existentes de sessões, materiais e compartilhamento.
- Sessões usam somente divisores horizontais finos; materiais não usam divisores nem cartões individuais.
- Componentes cliente recebem apenas propriedades serializáveis.
- Não alterar mudanças preexistentes e não relacionadas no worktree.

## Review Focus

- Uma ação do menu não pode abrir ou fechar a sessão involuntariamente.
- Sessões arquivadas devem oferecer Restaurar, não Arquivar.
- O botão deve voltar a “Compartilhar” quando o último acesso for removido.
- A descrição longa do módulo deve quebrar linha sem deslocar as ações do cabeçalho.
- A biblioteca vazia e o formulário flutuante devem continuar legíveis sobre o painel escuro.

---

### Task 1: Cabeçalho do módulo e compartilhamento

**Files:**
- Modify: `src/app/modulos/[identificador]/editores.tsx`
- Modify: `src/app/modulos/[identificador]/page.tsx`
- Modify: `src/app/modulos/[identificador]/page.module.css`
- Modify: `src/componentes/compartilhamento-modulo.tsx`
- Modify: `src/componentes/compartilhamento-modulo.module.css`
- Test: `src/app/modulos/[identificador]/ajustes-visuais-modulo.test.ts`
- Test: `src/componentes/compartilhamento-modulo.test.ts`

**Interfaces:**
- Consumes: descrição do módulo e resumo inicial de compartilhamento obtidos na página servidor.
- Produces: `CompartilhamentoModulo` com propriedade booleana serializável de estado ativo e rótulo visual reativo.

- [ ] Escrever testes que exijam a descrição visível e os estados “Compartilhar”/“Compartilhado”.
- [ ] Executar os testes focados e confirmar falha pelo comportamento ausente.
- [ ] Renderizar a descrição no estado de leitura e fornecer o estado inicial de compartilhamento pelo servidor.
- [ ] Atualizar o rótulo do botão após gerar ou revogar compartilhamento.
- [ ] Executar novamente os testes focados e confirmar aprovação.

### Task 2: Linhas expansíveis de sessões

**Files:**
- Modify: `src/app/modulos/[identificador]/painel-sessoes.tsx`
- Modify: `src/app/modulos/[identificador]/painel-sessoes.module.css`
- Create: `src/app/modulos/[identificador]/painel-sessoes.test.ts`

**Interfaces:**
- Consumes: `SessaoModulo` e operações existentes de edição e arquivamento.
- Produces: linha expansível acessível e menu contextual de três pontos por sessão.

- [ ] Escrever testes para contexto inicialmente oculto, expansão da linha, menu de ações e rótulo Restaurar.
- [ ] Executar o teste e confirmar falha pelo comportamento ausente.
- [ ] Implementar a linha expansível, mover o intervalo para os detalhes e remover a data isolada.
- [ ] Implementar o menu de três pontos sem propagação para a expansão.
- [ ] Aplicar divisores horizontais finos e remover o visual de cartão.
- [ ] Executar novamente o teste focado e confirmar aprovação.

### Task 3: Biblioteca de materiais plana e escura

**Files:**
- Modify: `src/app/modulos/[identificador]/page.module.css`
- Test: `src/app/modulos/[identificador]/painel-materiais-modulo.test.ts`

**Interfaces:**
- Consumes: marcação existente de `PainelMateriaisModulo` e `FormularioMaterial`.
- Produces: painel escuro, itens empilhados sem separação visual e rolagem minimalista.

- [ ] Acrescentar as asserções comportamentais/semânticas úteis para preservar a lista expansível e o botão de adicionar.
- [ ] Executar o teste focado antes das mudanças visuais.
- [ ] Alterar somente os estilos do painel, lista, itens, detalhes, estados vazios e formulário flutuante.
- [ ] Executar novamente os testes da biblioteca.

### Task 4: Verificação integrada e memória

**Files:**
- Modify: `AiFiles/Memoria/ACOMPANHAMENTO.md`

**Interfaces:**
- Consumes: entregas das Tasks 1–3.
- Produces: registro permanente e evidência de validação integral.

- [ ] Verificar a tela em largura desktop e 360 px, incluindo expansão, menu e biblioteca com rolagem.
- [ ] Rodar `npm.cmd run validar` e corrigir qualquer regressão pertencente ao escopo.
- [ ] Registrar a entrega e os comandos de validação em `AiFiles/Memoria/ACOMPANHAMENTO.md`.
