# Dashboard Minimalista Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplificar o Dashboard pessoal conforme os 15 comentários visuais aprovados, sem alterar funcionalidades.

**Architecture:** A alteração fica restrita à composição visual dos componentes existentes. Os dados e estados continuam intactos; somente textos redundantes, wrappers recolhíveis e estilos do card de IA mudam.

**Tech Stack:** Next.js 16, React, TypeScript, CSS Modules, Vitest, Testing Library/SSR markup.

**Spec:** `docs/superpowers/specs/2026-10-11-dashboard-minimalista.md`

## Global Constraints

- Não alterar regras de negócio nem contratos de API.
- Preservar todos os estados dinâmicos e dados úteis.
- Implementar com TDD e validar desktop e 360 px.
- Preservar alterações preexistentes do worktree compartilhado.

## Review Focus

- O cabeçalho deve continuar com um `h1` acessível.
- O card de IA deve manter contraste e foco visível em todos os estados.
- Os gráficos contextuais devem aparecer sem interação, inclusive em mobile.
- Estados vazios dos gráficos devem continuar visíveis.
- Tabelas alternativas e resultados gerados pela IA devem permanecer disponíveis.

---

### Task 1: Fixar o contrato visual simplificado

**Files:**
- Modify: `src/componentes/cartoes-insights-dashboard.test.ts`
- Modify: `src/componentes/consistencia-metodos-dashboard.test.ts`
- Modify: `src/componentes/graficos-dashboard.test.ts`
- Modify: `src/componentes/sistema-visual.test.ts`
- Create: `src/componentes/interpretacao-automatica.test.ts`

**Interfaces:**
- Consumes: marcação atual dos componentes do Dashboard.
- Produces: testes que exigem a remoção das cópias redundantes, a exposição dos gráficos e a preservação das ações.

- [ ] Escrever asserções que representem o design aprovado.
- [ ] Executar os testes focados e observar falha antes da implementação.

### Task 2: Simplificar a composição do Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/componentes/cartoes-insights-dashboard.tsx`
- Modify: `src/componentes/consistencia-metodos-dashboard.tsx`
- Modify: `src/componentes/graficos-dashboard.tsx`
- Modify: `src/componentes/interpretacao-automatica.tsx`

**Interfaces:**
- Consumes: mesmos dados e propriedades já usados pelos componentes.
- Produces: marcação mais curta, sem alterar contratos públicos.

- [ ] Remover apenas os textos e wrappers aprovados.
- [ ] Manter títulos, métricas, ações, estados vazios e resultados dinâmicos.
- [ ] Executar os testes focados até ficarem verdes.

### Task 3: Aplicar acabamento visual e validar

**Files:**
- Modify: `src/app/dashboard/page.module.css`
- Modify: `src/componentes/graficos-dashboard.module.css`
- Modify: `AiFiles/Memoria/ACOMPANHAMENTO.md`

**Interfaces:**
- Consumes: marcação simplificada da Task 2.
- Produces: card de IA escuro, gráficos visíveis e layout responsivo.

- [ ] Remover estilos órfãos e aplicar contraste do card da IA.
- [ ] Executar `npm.cmd run validar`.
- [ ] Conferir `/dashboard` em desktop e 360 px, sem overflow.
- [ ] Registrar a conclusão na memória operacional do projeto.
