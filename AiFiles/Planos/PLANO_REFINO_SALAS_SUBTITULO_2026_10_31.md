# Refinamento de Salas e componente Subtitulo — plano de implementação

> **Execução:** aplicar incrementalmente com TDD no workspace atual, preservando alterações existentes.

**Objetivo:** simplificar a área compartilhada e a página interna de Sala, aproximar a saudação do Dashboard e criar o componente visual reutilizável `Subtitulo`.

**Arquitetura:** `Subtitulo` ficará em `src/componentes/` com CSS Module próprio e será usado inicialmente pelo cabeçalho de insights. Os controles da Sala serão preservados em um menu `details` no cabeçalho; o painel lateral ficará exclusivo para participantes. Os cards de módulo reutilizarão a mesma linguagem visual e proporções dos cards de Sala.

**Tecnologias:** React 19, Next.js 16, TypeScript, CSS Modules e Vitest.

## Restrições

- não alterar ações de arquivar, excluir ou sair da Sala;
- preservar links, autorização e estados arquivados;
- manter operação por teclado, nomes acessíveis e responsividade;
- registrar `#Subtitulo` como convenção duradoura do projeto.

## Tarefas

- [x] Criar testes falhos para remoção do cabeçalho redundante de “Compartilhado comigo”.
- [x] Criar testes falhos para o menu superior de ações, painel de participantes simplificado e card de módulo alinhado aos cards de Sala.
- [x] Criar teste falho para o componente `Subtitulo` e sua adoção no Dashboard.
- [x] Criar teste falho para saudação maior e menor espaçamento vertical.
- [x] Implementar o mínimo necessário e validar os testes focados. A inspeção automatizada pelo navegador foi interrompida porque a ferramenta não conseguiu confirmar com segurança a URL ativa no Windows.
- [x] Executar `npm.cmd run validar`, atualizar memória e rastreabilidade.
