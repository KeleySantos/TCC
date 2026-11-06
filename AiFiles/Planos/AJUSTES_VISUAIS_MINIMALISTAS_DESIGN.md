# Especificação — ajustes visuais minimalistas e objetivos

**Estado:** aguardando revisão do usuário  
**Data:** 2026-11-05  
**Origem:** comentários visuais do navegador sobre Dashboard, módulos, salas e interpretação da IA

## 1. Intenção

Reduzir ruído visual e tornar as telas mais rápidas de compreender, preservando os dados observacionais, as métricas, as regras de autorização e as ações de servidor existentes. A mudança é incremental: reutiliza componentes e tokens atuais e altera somente apresentação, conteúdo redundante e estados vazios.

## 2. Critérios de aceite

1. O Dashboard não exibe a linha de saudação acima de “DASHBOARD” e o conteúdo fica visualmente mais próximo do topo sem criar um espaço reservado vazio.
2. Os cards de conceitos exibem somente nome do conceito, dificuldade percebida e compreensão percebida; não exibem índice exploratório, desempenho médio, `n=...` nem `/5`.
3. O dashboard de sala sem contribuidores válidos exibe uma mensagem direta orientando adicionar participantes e registrar sessões; o estado de proteção para um ou dois contribuidores continua preservado.
4. A linha do tempo do módulo mantém somente a tag do evento e o título, removendo resumo e lista de conceitos da apresentação.
5. O detalhe visual de materiais não exibe a descrição do material.
6. A interface não exibe os comandos “Substituir arquivo” e “Arquivar material”; as rotas de backend correspondentes não serão removidas nesta etapa.
7. Os botões de ajuda “Ver explicação sobre Evolução da percepção” e “Ver explicação sobre Percepção × evidências” deixam de aparecer nos gráficos do Dashboard.
8. A interpretação da IA deixa de ser um bloco contínuo de texto e passa a usar uma composição compartilhada e minimalista em todas as ocorrências: cabeçalho curto, origem compacta, insights separados, evidências, próximos passos e limitação final.
9. O rótulo longo “Insights da IA” e o selo “Reflexão local de contingência” deixam de dominar a tela; Groq e contingência local continuam distinguíveis por um rótulo curto de origem.
10. A interpretação compartilhada em salas usa a mesma composição visual da interpretação pessoal, sem expor materiais ou descrições privadas.
11. Os testes de renderização e de contrato visual são atualizados para refletir os textos removidos e os novos estados.

## 3. Abordagens consideradas

### A. Ajuste incremental nos componentes existentes — escolhida

Alterar `CabecalhoPagina`, `PainelConceitosDestaque`, `PainelLinhaTempoModulo`, `PainelMateriaisModulo`, `AcoesArquivoMaterial`, `GraficosDashboard`, o dashboard de sala e a interpretação compartilhada. Criar apenas uma pequena visualização reutilizável para o conteúdo da interpretação, mantendo as ações, consultas e DTOs atuais.

**Vantagens:** menor risco de regressão, preserva o comportamento existente e permite validar cada comentário com testes focados.  
**Limite:** estilos antigos não relacionados permanecem no projeto.

### B. Nova camada de componentes de design

Criar uma biblioteca visual nova para cards, painéis vazios, metadados e interpretações e migrar as telas para ela.

**Vantagem:** maior uniformidade futura.  
**Limites:** escopo maior, mais alterações simultâneas e risco de reabrir decisões visuais já estabilizadas.

### C. Sobrescritas apenas em CSS

Esconder elementos e reduzir espaçamentos somente por seletores CSS, sem ajustar a árvore semântica.

**Vantagem:** implementação rápida.  
**Limites:** mantém conteúdo redundante no HTML, piora acessibilidade e cria dependência de seletores frágeis; não atende bem aos estados vazios e à interpretação da IA.

## 4. Composição escolhida

### Dashboard

O `CabecalhoPagina` receberá somente o título `DASHBOARD` nessa página. O bloco de topo não reservará altura para uma trilha vazia. O espaçamento superior será reduzido no escopo do Dashboard, mantendo a hierarquia do título e as ações de período/interpretação.

### Conceitos em destaque

Cada item terá o nome em destaque e uma grade de duas métricas:

```text
nome do conceito
Dificuldade percebida       4,0
Compreensão percebida       3,0
```

Os valores continuam sendo os mesmos cálculos do servidor; apenas a escala e a amostra deixam de ser repetidas no card.

### Estados vazios

O dashboard de sala exibirá um painel vazio com título curto, explicação de que o dashboard será liberado após participantes adicionarem sessões válidas e uma orientação prática para convidar participantes. A mensagem de privacidade para grupos com dados insuficientes continuará distinta do estado sem dados.

### Módulo e materiais

A linha do tempo será um feed compacto de `tag + título`. O detalhe de material manterá ícone, título, função, metadados do arquivo, análise, download, exclusão e links, mas não renderizará a descrição nem os dois comandos removidos nos comentários.

### Interpretação da IA

Será extraída uma visualização compartilhada de conteúdo, usada por `InterpretacaoAutomatica` e `InterpretacaoMembroSala`:

- cabeçalho com título curto “Interpretação” e botão de fechar quando estiver no modal;
- uma linha de metadados com origem curta (`Groq` ou `Local`) e modelo quando disponível;
- cada insight em um cartão semântico com nível de evidência, título, observação e resumo de evidências;
- pergunta reflexiva e experiência sugerida agrupadas como “Próximo passo”, quando presentes;
- limitação em uma área destacada no final, seguida da amostra em texto secundário;
- fallback local representado pelo mesmo layout e apenas pela origem curta, sem bloco textual redundante.

O conteúdo continuará sendo produzido pelo DTO existente e escapado pelo React. Nenhum material, descrição de sessão ou identificador será adicionado à fronteira da interpretação.

### Gráficos

Os dois componentes `AjudaMetrica` indicados nos comentários serão removidos de `GraficosDashboard`, junto com suas descrições locais. O componente continuará disponível para outros pontos que ainda tenham requisito explícito de explicação contextual.

## 5. Não objetivos

- não alterar métricas, fórmulas, amostras ou linguagem científica do backend;
- não remover rotas ou ações de servidor, além de ocultar os comandos visuais solicitados;
- não alterar dados do banco ou seed;
- não redesenhar a navegação lateral, formulários ou telas não mencionadas;
- não integrar uma biblioteca externa de UI;
- não eliminar a limitação metodológica da interpretação da IA.

## 6. Validação

- escrever ou ajustar testes de renderização antes das alterações de produção;
- verificar estados com dados e sem dados nos componentes afetados;
- executar os testes focados dos componentes e depois a suíte completa;
- executar verificação de tipos, lint e build;
- revisar visualmente Dashboard, detalhe de módulo, materiais, sala sem dados e modal de interpretação em viewport desktop e estreito;
- confirmar que as rotas e ações de servidor continuam compilando mesmo quando seus botões não são exibidos.

## 7. Arquivos previstos

- `src/app/dashboard/page.tsx` e `src/app/dashboard/page.module.css`;
- `src/componentes/cabecalho-pagina.*`, `graficos-dashboard.*`, `interpretacao-automatica.*` e novo componente visual compartilhado da interpretação;
- `src/app/modulos/[identificador]/painel-conceitos-destaque.*`, `painel-linha-tempo-modulo.*`, `painel-materiais-modulo.*`, `acoes-arquivo-material.*` e `page.module.css`;
- `src/app/salas/[identificador]/modulos/[moduloId]/page.*` e estilos de dashboard da sala;
- testes diretamente relacionados e memória de acompanhamento/matriz ao concluir a implementação.
