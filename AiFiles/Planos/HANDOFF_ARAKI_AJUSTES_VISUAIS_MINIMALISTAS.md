# Handoff para Araki — ajustes visuais minimalistas

**Agente executor:** Araki  
**Estado:** pronto para implementação  
**Origem:** comentários visuais do navegador fornecidos pelo usuário  
**Especificação aprovada:** [`AJUSTES_VISUAIS_MINIMALISTAS_DESIGN.md`](./AJUSTES_VISUAIS_MINIMALISTAS_DESIGN.md)

## Objetivo

Aplicar uma revisão visual incremental nas telas existentes para remover ruído, reduzir textos redundantes e tornar a interface mais clean, minimalista e objetiva. Preserve métricas, DTOs, regras de negócio, autorização, banco, rotas e ações de servidor.

Não faça uma refatoração visual ampla. Reutilize os componentes e tokens atuais. Crie somente a visualização compartilhada necessária para a interpretação da IA.

## Regras obrigatórias

- Não alterar Prisma, migrações, seed, métricas ou contratos de servidor.
- Não remover endpoints nem ações de servidor; apenas deixe de renderizar os controles solicitados.
- Não mover regra de negócio para componentes React.
- Manter contexto, amostra e limitação analítica quando forem necessários para interpretar os dados.
- Usar português do Brasil e os padrões visuais existentes.
- Garantir teclado, foco visível, contraste, responsividade em 360 px e ausência de rolagem horizontal.
- Escrever ou ajustar o teste antes de cada alteração de produção e observar o teste falhar antes de implementar.

## Escopo de implementação

### 1. Dashboard principal

Arquivos principais: `src/app/dashboard/page.tsx`, `src/app/dashboard/page.module.css` e `src/componentes/cabecalho-pagina.*`.

- Remova a saudação `Olá, {primeiroNome}!` acima de `DASHBOARD`.
- Não deixe um container vazio reservando espaço para a saudação.
- Reduza o espaçamento superior e aproxime o conteúdo do título, sem esmagar as ações do cabeçalho.
- Preserve o filtro de período e o botão de interpretação.

### 2. Cards de conceitos

Arquivos principais: `src/app/modulos/[identificador]/painel-conceitos-destaque.tsx` e `page.module.css`.

Cada card deve conter somente:

- nome do conceito;
- `Dificuldade percebida` com o valor;
- `Compreensão percebida` com o valor.

Remova da apresentação:

- `Índice exploratório`;
- `Desempenho médio`;
- `n=...`;
- o sufixo `/5`.

Mantenha os dois agrupamentos (“Conceitos com maiores sinais de dificuldade” e “Conceitos com maiores sinais de compreensão”) e o estado vazio existente.

### 3. Dashboard de sala sem dados

Arquivo principal: `src/app/salas/[identificador]/modulos/[moduloId]/page.tsx` e estilos de dashboard da sala.

Quando `quantidadeContribuidores === 0`, substitua a mensagem técnica por um estado vazio amigável, por exemplo:

> Ainda não há dados para este dashboard. Adicione participantes e peça que registrem sessões de estudo para liberar a comparação.

Use título e texto com hierarquia visual clara. Não esconda o fato de que são necessários três participantes quando essa informação for relevante. Preserve a mensagem de proteção para um ou dois contribuidores válidos.

### 4. Linha do tempo do módulo

Arquivo principal: `src/app/modulos/[identificador]/painel-linha-tempo-modulo.tsx`.

Em cada evento, mantenha somente a tag do tipo e o título. Remova:

- resumo do evento;
- lista de conceitos;
- qualquer texto auxiliar equivalente.

Preserve data, ordenação, semântica do feed e estado vazio.

### 5. Materiais do módulo

Arquivos principais: `painel-materiais-modulo.tsx` e `acoes-arquivo-material.tsx`.

No detalhe expandido de um material:

- remova a descrição textual exibida logo após o summary;
- remova o botão “Substituir arquivo” e o input visual associado;
- remova o botão “Arquivar material”.

Preserve título, tag da função, ícone, metadados do arquivo, download, análise, tentativa de análise quando disponível, links e exclusão permanente. Não remova as ações de servidor nem as rotas nesta tarefa.

### 6. Ajuda dos gráficos

Arquivo principal: `src/componentes/graficos-dashboard.tsx`.

Remova os dois botões `AjudaMetrica` dos gráficos:

- “Evolução da percepção”;
- “Percepção × evidências”.

Remova também as descrições locais que ficarem sem consumidor. Não remova o componente `AjudaMetrica` do projeto se ele possuir outros consumidores válidos.

### 7. Redesign compartilhado da interpretação da IA

Arquivos principais: `src/componentes/interpretacao-automatica.tsx`, `interpretacao-automatica.module.css` e `src/app/salas/interpretacao-membro.tsx`.

Extraia uma visualização compartilhada para o conteúdo da interpretação e use-a nos dois fluxos: dashboard pessoal/módulo e salas.

A composição deve ser minimalista e escaneável:

1. cabeçalho curto “Interpretação”;
2. origem compacta (`Groq` ou `Local`) e modelo, quando houver;
3. insights separados em blocos/cartões leves;
4. nível de evidência, título, observação e resumo de evidências;
5. pergunta reflexiva e experiência sugerida agrupadas como “Próximo passo”;
6. limitação em área visual destacada;
7. amostra em texto secundário.

Remova a hierarquia redundante:

- não usar “Insights da IA” como título dominante;
- não usar o selo longo “Reflexão local de contingência”;
- não deixar a interpretação como um bloco contínuo de parágrafos.

Groq e fallback local devem usar a mesma composição e apenas uma origem curta diferente. Não adicione dados privados, materiais, descrições de sessão ou identificadores ao DTO ou à interface.

O modal lateral deve continuar acessível, fechar com retorno de foco e funcionar em viewport estreito. Os estados de processamento, erro e acesso perdido devem continuar visíveis e coerentes.

## Testes obrigatórios

Atualize ou crie testes focados antes da implementação:

- `src/app/dashboard/dashboard-minimalista.test.ts` para a remoção da saudação e o novo espaçamento;
- `painel-conceitos-destaque.test.ts` para ausência de índice, desempenho, `n=` e `/5`;
- `painel-linha-tempo-modulo.test.ts` para ausência de resumo/conceitos;
- `painel-materiais-modulo.test.ts` para ausência da descrição e dos comandos removidos;
- `src/app/salas/[identificador]/modulos/[moduloId]/page.test.ts` para o estado sem contribuidores;
- `src/componentes/graficos-dashboard.test.ts` para ausência dos dois botões de ajuda;
- `interpretacao-automatica.test.ts` e `interpretacao-compartilhada.test.ts` para a composição compartilhada e os rótulos curtos.

Depois execute:

```powershell
npm run testar -- --run
npm run verificar-tipos
npm run verificar-estilo
npm run compilar
```

## Revisão visual final

Verifique no navegador, com dados sintéticos:

- Dashboard principal em desktop e 360 px;
- detalhe do módulo e cards de conceitos;
- linha do tempo e biblioteca de materiais;
- sala com zero participantes válidos;
- interpretação Groq e contingência local;
- interpretação pessoal e interpretação compartilhada da sala.

Confirme que não há espaços vazios deixados pelos elementos removidos, que o modal não cria rolagem horizontal e que o foco permanece visível por teclado.

## Entrega esperada

Ao concluir, informe:

- arquivos alterados;
- componentes reutilizados, adaptados ou criados;
- testes executados e resultados;
- limitações ou pendências reais;
- evidência da revisão visual em desktop e mobile.
