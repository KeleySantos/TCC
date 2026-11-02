# Refinamento de cabeçalhos e Salas — plano de implementação

> **Execução:** implementar no workspace atual com TDD, preservando alterações existentes.

**Objetivo:** aplicar `#Subtitulo`, compactar o cabeçalho do Dashboard e alinhar as ações e o painel lateral de Salas.

**Arquitetura:** o componente `Subtitulo` ganha uma opção semântica para parágrafo e é consumido diretamente pelas três páginas. `AbasSalas` recebe uma área de ações acima do divisor. A Sala interna reutiliza o padrão de barra superior da tela de Módulo e mantém seus formulários nos mesmos componentes `details`.

**Tecnologias:** React 19, Next.js 16, TypeScript, CSS Modules e Vitest.

**Especificação:** `AiFiles/Planos/DESENHO_REFINO_CABECALHOS_SALAS_2026_10_31.md`.

## Tarefas

- [x] Criar testes falhos para `Subtitulo` como parágrafo e sua adoção em Módulos, Métodos e Salas.
- [x] Criar teste falho para reduzir a distância entre o título e o subtítulo do Dashboard.
- [x] Criar testes falhos para mover as ações gerais de Salas à faixa das abas e remover o formulário duplicado da aba compartilhada.
- [x] Criar testes falhos para a barra superior, “Adicionar módulo” acima do divisor e expansão do painel de participantes.
- [x] Implementar o mínimo necessário e aprovar os testes focados.
- [x] Executar `npm.cmd run validar` e atualizar rastreabilidade.
