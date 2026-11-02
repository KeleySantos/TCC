# Reformulação da Sala por módulos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar uma Sala centrada em cards de módulos e páginas próprias com Dashboard e Membros para o proprietário.

**Architecture:** A rota atual vira a visão geral e preserva a gestão da Sala. Uma rota dinâmica aninhada carrega o módulo e os DTOs já autorizados no servidor; um componente cliente pequeno controla abas e seleção do membro, recebendo painéis renderizados pelo servidor.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript estrito, CSS Modules, Vitest e Testing Library.

**Spec:** `AiFiles/Planos/DESENHO_REFORMULACAO_SALA_MODULOS.md`

## Global Constraints

- preservar todas as ações atuais de Sala e de vínculo;
- vínculo ativo habilita dashboard, comparação e IA conjuntamente, sem controles de consentimento;
- proprietário nunca recebe materiais, sessões, descrições ou conteúdo bruto;
- usar português do Brasil e componentes visuais existentes;
- não alterar schema nem cálculos analíticos;
- funcionar por teclado e sem rolagem horizontal em 360 px.

## Review Focus

- módulo inexistente ou pertencente a outra Sala deve resultar em `notFound()`;
- membro comum não pode receber dashboards de terceiros no HTML;
- módulo sem participantes deve manter abas e estados vazios utilizáveis;
- Sala arquivada deve ocultar ações mutáveis sem perder consulta;
- nomes e descrições longos devem refluír sem estourar cards ou o mestre-detalhe.

---

### Task 1: Contrato visual dos cards e da visão geral

**Files:**
- Modify: `src/app/salas/cartoes-salas.tsx`
- Modify: `src/app/salas/cartoes-salas.test.ts`
- Modify: `src/app/salas/[identificador]/page.tsx`
- Create: `src/app/salas/[identificador]/page.test.tsx`
- Modify: `src/app/salas/page.module.css`

**Interfaces:**
- Produces: `CartaoModuloSala({ href, titulo, descricao, resumo })` como link acessível para a página própria.

- [ ] Escrever testes que exijam o `href` aninhado, cards sem listas internas, botão `+` discreto e preservação dos formulários administrativos.
- [ ] Executar os testes e confirmar falha pela ausência da nova navegação/composição.
- [ ] Implementar a grade de cards e a gestão secundária da Sala, mantendo as ações existentes.
- [ ] Executar os testes específicos até passarem.

### Task 2: Abas e mestre-detalhe do módulo da Sala

**Files:**
- Create: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.tsx`
- Create: `src/app/salas/[identificador]/modulos/[moduloId]/abas-modulo-sala.test.tsx`
- Create: `src/app/salas/[identificador]/modulos/[moduloId]/page.module.css`

**Interfaces:**
- Produces: `AbasModuloSala({ dashboard, membros })`, em que cada membro possui `id`, `nome`, `resumo` e `conteudo: ReactNode`.

- [ ] Escrever testes de abas, setas/Home/End, seleção inicial, troca de membro e estado vazio.
- [ ] Executar o teste e confirmar falha porque o componente não existe.
- [ ] Implementar o menor componente cliente que satisfaça navegação e seleção acessíveis.
- [ ] Executar o teste específico até passar.

### Task 3: Rota própria autorizada

**Files:**
- Create: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx`
- Create: `src/app/salas/[identificador]/modulos/[moduloId]/page.test.tsx`
- Modify: `src/app/salas/dashboard-sala.module.css`

**Interfaces:**
- Consumes: `obterSalaDaConta`, `obterDashboardsSalaDoProprietario`, `serializarMetricasSala` e `AbasModuloSala`.
- Produces: rota `/salas/[identificador]/modulos/[moduloId]` com visão administrativa ou visão restrita do membro.

- [ ] Escrever testes para proprietário, membro comum, módulo inválido, agregado insuficiente e ausência de participantes.
- [ ] Executar os testes e confirmar falha porque a rota não existe.
- [ ] Implementar a página Server Component, sem serializar dados de terceiros para membros comuns.
- [ ] Executar testes da rota e das permissões de Sala até passarem.

### Task 4: Rastreabilidade e validação completa

**Files:**
- Modify: `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- Modify: `AiFiles/Memoria/ACOMPANHAMENTO.md`

- [ ] Registrar requisito, aceite e evidências reais.
- [ ] Executar testes específicos de Salas e dashboards.
- [ ] Executar `npm.cmd run validar` e corrigir regressões relacionadas.
- [ ] Verificar a rota em desktop e 360 px, incluindo teclado, abas, membro selecionado e estados vazios.
- [ ] Confirmar servidor local saudável em `http://localhost:3000`.
