# Auditoria técnica — comparação entre implementação e TCC

**Data:** 10 de outubro de 2026
**Escopo:** comparação investigativa entre o documento acadêmico, o código atual e os testes relacionados a Learning Analytics, conceitos, evidências, recomendações e Inteligência Artificial.
**Natureza:** auditoria somente leitura; nenhum código, banco, migração ou dado foi alterado.

## 1. Resumo executivo

A implementação atual está significativamente mais avançada — e diferente — do que a metodologia descrita no TCC. O software migrou de um domínio centrado em tópicos, avaliações tradicionais, acertos, erros, tentativas e Bloom para um modelo observacional baseado em sessões, percepções, conceitos e evidências posteriores confirmadas.

O núcleo vigente calcula métricas de sessões, associa métodos e formatos a percepções e evidências posteriores, produz rankings compostos de conceitos e envia resultados estruturados para interpretação opcional por IA. Em contrapartida, não existe uma métrica operacional de taxa de acerto calculada a partir das questões, não existe uma métrica educacional de quantidade de tentativas e Bloom permanece apenas como estrutura opcional não alimentada pelo fluxo real.

O princípio arquitetural **“O sistema calcula; a IA interpreta”** é majoritariamente respeitado para os valores numéricos: as métricas são calculadas por funções determinísticas no backend e a IA recebe um DTO estruturado. Entretanto, a IA ainda seleciona quais observações destacar e pode formular experimentos sugeridos. Não existe um motor independente de recomendação de materiais.

Também foi encontrada uma divergência entre o roteiro de auditoria e o PDF: o roteiro afirma que a seção 3.4.1 estabelece nove indicadores, incluindo quantidade de tentativas e desempenho por Bloom. O PDF efetivamente lista apenas sete métricas nessa seção e não inclui esses dois itens.

## 2. Fontes examinadas

- Documento acadêmico: `C:\Users\keley\Downloads\TCC.pdf`, especialmente as páginas impressas 34 a 40, correspondentes à metodologia, arquitetura, etapas, métricas e avaliação.
- Roteiro de auditoria: `C:\Users\keley\.codex\attachments\4ca3a598-3623-41eb-8006-0d7b9acb0c84\Texto colado.txt`.
- Modelo físico: `prisma/schema.prisma`.
- Seed e cenário rico: `prisma/seed.ts` e `prisma/cenario-diego.ts`.
- Métricas de sessões: `src/dominio/analises/metricas-sessoes.ts`.
- Aprendizagem por módulo: `src/dominio/analises/aprendizagem-modulo.ts`.
- Dashboard observacional: `src/dominio/analises/dashboard-observacional.ts`.
- Consultas de servidor: `src/servidor/metricas.ts`, `src/servidor/aprendizagem-modulo.ts` e `src/servidor/dashboard-observacional.ts`.
- Integração de IA: `src/servidor/ia/interpretacoes.ts`, `src/servidor/ia/contrato-provedores.ts`, `src/servidor/ia/catalogo-provedores.ts`, `src/dominio/interpretacoes/esquema.ts` e `src/dominio/interpretacoes/resposta-local.ts`.
- Interfaces e testes diretamente relacionados às métricas e interpretações.

## 3. Comparação das métricas previstas

| Métrica do TCC ou do roteiro | Correspondência no código | Implementação atual | Classificação | Ação sugerida |
|---|---|---|---|---|
| Taxa de acerto | Questões de evidência armazenam `ACERTO`, `PARCIAL`, `ERRO` ou `NAO_INFORMADO` | Nenhuma função calcula `acertos / total de questões × 100`; as análises usam `desempenhoPercentual` informado ou extraído | Não implementado como métrica | Implementar cálculo rastreável ou retirar essa promessa do TCC |
| Desempenho médio por conceito | `analisarAprendizagemModulo` | Média simples dos percentuais das evidências confirmadas relacionadas ao conceito | Parcialmente alinhado | Documentar como desempenho médio confirmado, não taxa de aprendizagem |
| Desempenho por método | `agruparResultadosPorContexto` | Relaciona sessões do método à compreensão percebida e às evidências posteriores deduplicadas | Implementação mais completa, mas diferente | Explicar associação temporal e ausência de causalidade |
| Desempenho por formato | Mesma função usada para métodos | Mesma regra de associação de evidências posteriores | Implementação mais completa, mas diferente | Explicar contextos múltiplos e não exclusivos |
| Duração das sessões | `calcularMetricasSessoes` e `resumirDuracaoSessoesComMelhorResultado` | Total, média, evolução semanal e duração média de sessões com compreensão ≥ 4/5 e evidência posterior ≥ 70% | Implementação mais completa | Incorporar critérios e limitações ao TCC |
| Evolução do desempenho | `tendenciaEvidencias` e `agruparEvolucaoPercepcaoEvidencia` | Tendência por conceito e série semanal de percepção/evidências | Parcialmente alinhado | Definir formalmente qual evolução é avaliada |
| Compreensão percebida × resultado | `estadoPercepcaoEvidencia`, gráficos e agregações contextuais | Comparações por conceito, método e formato | Implementação mais completa | Uniformizar a normalização da escala 1–5 |
| Quantidade de tentativas, citada no roteiro | Campo `AnaliseMaterial.tentativas` | O campo conta tentativas técnicas de processamento, não tentativas do estudante | Não implementado | Não apresentar esse campo como Learning Analytics |
| Desempenho por Bloom, citado no roteiro | Campos opcionais do DTO e regra local de contingência | Não existe origem persistida, cálculo real nem painel ativo | Planejado ou estrutura não utilizada | Implementar de ponta a ponta ou retirar do escopo atual |

## 4. Inventário das métricas realmente implementadas

### 4.1 Métricas oficiais de sessões

A versão oficial é `metricas-sessoes-v1`. Uma sessão é válida quando:

- possui situação `CONCLUIDA`;
- possui data de encerramento;
- possui duração inteira;
- possui duração mínima de cinco minutos.

Sessões arquivadas permanecem incluídas. Sessões planejadas, ativas e invalidadas ficam de fora.

As métricas calculadas são:

- quantidade de sessões válidas;
- minutos totais;
- duração média;
- dias com estudo;
- maior sequência de dias consecutivos;
- primeira e última sessão;
- semanas ativas;
- número de semanas no período;
- proporção de semanas ativas;
- classificação da regularidade;
- quantidade de percepções preenchidas;
- dificuldade percebida média;
- compreensão percebida média;
- sessões, minutos, proporção e compreensão média por método;
- sessões, minutos, proporção e compreensão média por formato;
- evolução semanal de sessões, minutos, dias, percepções, métodos e formatos.

As médias de percepção são publicadas somente com pelo menos duas percepções. Métodos e formatos múltiplos são contextos não exclusivos; portanto, seus percentuais podem somar mais de 100%.

### 4.2 Métricas e análises de aprendizagem

O módulo de aprendizagem calcula:

- compreensão percebida média por conceito;
- dificuldade percebida média por conceito;
- desempenho médio confirmado por conceito;
- estado da relação entre percepção e evidência;
- tendência do desempenho confirmado por conceito;
- desempenho posterior associado a métodos;
- desempenho posterior associado a formatos;
- duração média das sessões associadas a melhores resultados;
- método associado à maior compreensão;
- formato associado à maior compreensão;
- evolução semanal de percepção e evidências;
- conceitos com maiores sinais de dificuldade;
- conceitos com maiores sinais de compreensão;
- padrões objetivos de calibração, evolução e atenção.

### 4.3 Métricas adicionais do Dashboard

O Dashboard observacional também calcula:

- consistência dos métodos entre módulos;
- quantidade de módulos positivos sobre módulos analisáveis;
- quantidade total de evidências associadas;
- proporção de consistência;
- ponto de maior dificuldade percebida;
- cobertura dos métodos disponíveis;
- método menos explorado como candidato a experimento;
- conceitos extraídos de materiais e mencionados em sessões;
- base histórica de sessões, módulos, métodos e arquivos analisados.

Parte desses resultados permanece no contrato analítico, mas não é consumida pela interface atual. São exemplos `proximoExperimento`, `descobertasRecentes` e o mapa geral de conceitos.

## 5. Funcionamento técnico e fluxo dos dados

O percurso principal é:

```text
SQLite / Prisma
  → consultas filtradas por usuário e módulo
  → mapeamento para DTOs internos
  → funções puras de domínio
  → objetos de métricas e aprendizagem
  → páginas e componentes React
  → interpretação opcional por IA
```

As métricas não são persistidas nem armazenadas em cache. Elas são recalculadas no backend quando o Dashboard ou a página do módulo é consultado. Novas sessões e evidências confirmadas alteram o resultado automaticamente na consulta seguinte.

O isolamento pessoal é aplicado por `usuarioId` e propriedade do módulo. As consultas do Dashboard usam apenas módulos ativos, não arquivados e não classificados como rascunho.

## 6. Estrutura e análise dos conceitos

### 6.1 O que representa um conceito

`ConceitoAprendizagem` é uma entidade pertencente a um módulo. Possui nome, chave normalizada, aliases, origem e estado ativo. A chave é única somente dentro do módulo, de modo que conceitos de módulos diferentes não são automaticamente unificados.

Um conceito pode se relacionar com:

- vários materiais;
- várias sessões;
- várias evidências;
- várias questões.

Uma questão pode estar ligada a vários conceitos. Não existe hierarquia, categoria superior ou relação semântica entre conceitos.

Os conceitos podem ser extraídos automaticamente de materiais pela IA. O resultado da análise é normalizado e persistido, mas a presença de um termo não comprova aprendizagem, domínio ou dificuldade.

### 6.2 Como uma sessão se relaciona a conceitos

Os conceitos de uma sessão são reunidos a partir de:

- vínculos explícitos da sessão;
- conceitos dos materiais usados na sessão;
- menção textual na descrição da sessão;
- aliases reconhecidos no catálogo do módulo.

### 6.3 Como uma evidência se relaciona a uma sessão

Uma evidência pode ser relacionada a uma sessão quando:

- existe um vínculo explícito confirmado; ou
- há conceito comum no mesmo módulo e a evidência ocorreu depois da sessão, dentro de uma janela de 30 dias.

Mesmo no vínculo explícito, a evidência precisa ocorrer estritamente depois da sessão. A associação é temporal e contextual; não demonstra que o método, o formato ou a sessão causaram o resultado.

### 6.4 Fórmula do desempenho médio

O desempenho médio de um conceito, método ou formato é:

```text
desempenho médio = soma dos percentuais das evidências confirmadas / quantidade de evidências
```

As evidências são deduplicadas dentro do grupo. O cálculo é uma média simples de percentuais e não considera a quantidade de questões ou a pontuação máxima de cada evidência.

Exemplo:

```text
Evidência A: 100% em uma questão
Evidência B: 50% em cem questões

Média implementada = (100 + 50) / 2 = 75%
Taxa agregada ponderada hipotética = 51 / 101 ≈ 50,5%
```

Essa diferença precisa ser descrita no TCC ou corrigida caso o objetivo seja representar taxa agregada de acertos.

### 6.5 Fórmula dos rankings de conceitos

A janela dos rankings é de 90 dias. São exigidas duas observações, somando sessões com percepção e evidências com desempenho. São exibidos até cinco conceitos em cada ranking.

```text
compreensão normalizada = (compreensão − 1) / 4 × 100
dificuldade normalizada = (dificuldade − 1) / 4 × 100

índice de compreensão =
média(compreensão normalizada,
      100 − dificuldade normalizada,
      desempenho confirmado)

índice de dificuldade =
média(dificuldade normalizada,
      100 − compreensão normalizada,
      100 − desempenho confirmado)
```

Somente sinais disponíveis entram na média.

Exemplo hipotético:

```text
Compreensão média: 4/5 → 75
Dificuldade média: 2/5 → 25
Desempenho confirmado: 80%

Índice de compreensão = média(75, 75, 80) = 76,7
Índice de dificuldade = média(25, 25, 20) = 23,3
```

### 6.6 Terminologia recomendada

- Usar **desempenho médio confirmado por conceito** para a média das evidências.
- Usar **índice composto de sinais de compreensão** e **índice composto de sinais de dificuldade** para os rankings.
- Usar **evolução do desempenho confirmado por conceito** para a comparação temporal.
- Não usar **taxa de aprendizagem**, pois não há medida de ganho ou velocidade de aprendizagem.
- Não usar **domínio do conceito**, pois não existe modelo de domínio nem inferência psicométrica.

## 7. Evolução e percepção versus evidência

Existem três mecanismos diferentes que podem ser confundidos como “evolução”:

1. evolução semanal das sessões e percepções;
2. série semanal conjunta de compreensão percebida e desempenho das evidências;
3. tendência por conceito, calculada pela diferença entre a última e a primeira evidência.

A tendência por conceito exige apenas duas evidências:

- variação de pelo menos +10 pontos: `EVOLUCAO_POSITIVA`;
- variação de até −10 pontos: `PONTO_DE_ATENCAO`;
- entre esses limites: `ESTAVEL`.

O TCC estabelece três observações válidas para destacar tendência. Logo, a regra atual de duas observações é metodologicamente divergente.

A comparação entre percepção e evidência também possui duas normalizações diferentes:

- a classificação de calibração e alguns gráficos usam `compreensão × 20`;
- os rankings usam `(compreensão − 1) / 4 × 100`.

Assim, uma compreensão 1/5 corresponde a 20% no primeiro caso e a 0% no segundo. Essa inconsistência deve ser resolvida antes da descrição final da metodologia.

## 8. Recomendações e experimentação

Não existe um motor persistente e independente de recomendação de materiais. Também não existe uma entidade `Recomendacao` ativa no modelo atual.

O sistema possui mecanismos parciais:

- identifica o método menos registrado como candidato a próximo experimento;
- identifica contextos frequentes associados a resultados baixos;
- identifica percepção alta com evidência baixa;
- sugere experimentos por regras locais de contingência;
- permite que a IA gere perguntas e experimentos a partir das métricas.

O candidato `proximoExperimento` é calculado, mas não é exibido pelo Dashboard atual. Os materiais sugeridos pela análise automática são armazenados como listas de métodos e próximas sessões, mas não formam um recomendador baseado no desempenho do estudante.

Portanto, o TCC deve preferir expressões como **reflexões contextualizadas** e **experimentos sugeridos** em vez de afirmar que há um sistema completo de recomendação personalizada de materiais.

## 9. Integração com Inteligência Artificial

### 9.1 Provedores e modelos

O código atual usa uma fila configurável:

1. Groq como provedor principal padrão;
2. Gemini como alternativa;
3. Qwen como provedor legado;
4. resposta local determinística como contingência.

O PDF cita apenas Qwen, portanto está desatualizado.

### 9.2 Informações enviadas

O DTO pode incluir:

- quantidade de módulos e sessões válidas;
- minutos válidos e período;
- duração média, dias com estudo e maior sequência;
- médias de percepção;
- métricas por método e formato;
- evolução semanal;
- até dez descrições recentes, delimitadas como conteúdo não confiável;
- conceitos e respectivos resultados no escopo do módulo;
- associações de métodos e formatos;
- padrões calculados pelo sistema;
- eventos recentes;
- evolução entre percepção e evidência;
- limitações metodológicas.

O contexto é compactado antes do envio. Descrições são truncadas, e o prompt determina que instruções contidas nelas sejam ignoradas.

### 9.3 Separação de responsabilidades

O prompt afirma explicitamente que o sistema já calculou médias, contagens, tendências, diferenças e níveis de amostra. A IA é instruída a não recalcular, não inventar dados, não transformar associação em causalidade, não diagnosticar e não atribuir estilos fixos.

A saída passa por:

- schema estruturado;
- limite de um a três insights;
- validação dos tipos de insight;
- validação dos níveis de confiança;
- filtro de expressões causais, diagnósticas ou classificatórias;
- contingência local quando a resposta é inválida.

O princípio “O sistema calcula; a IA interpreta” é verdadeiro para os indicadores numéricos. Contudo, a IA ainda seleciona o foco e formula experimentos. Além disso, não há verificação semântica que compare cada número eventualmente mencionado na resposta com o DTO de entrada; a proteção atual é estrutural e textual.

## 10. Problemas e inconsistências

### Críticos

1. **Domínio acadêmico desatualizado:** o TCC ainda descreve tópicos, avaliações, tentativas e taxa de acerto como núcleo, enquanto o produto atual usa módulos, sessões, conceitos e evidências.
2. **Taxa de acerto não calculada:** resultados de questões são persistidos, mas não alimentam uma taxa de acerto oficial.
3. **Fluxo de confirmação fora da interface atual:** serviço, ações e componente existem, porém o painel foi removido da composição da página. Novos rascunhos extraídos automaticamente permanecem pendentes e fora das análises.

### Altos

4. **Amostra mínima divergente:** o TCC exige três observações, enquanto vários cálculos usam duas.
5. **Normalização inconsistente da escala 1–5:** `valor × 20` e `(valor − 1) / 4 × 100` convivem na aplicação.
6. **Média simples de percentuais:** evidências com quantidades de questões muito diferentes recebem o mesmo peso.
7. **Cenário sintético incompatível com a metodologia:** o seed atual não contém 15 módulos, 150 sessões e 150 avaliações.

### Médios

8. **Bloom não operacional:** existe apenas como campo opcional e regra isolada de contingência.
9. **Código calculado sem consumidor ativo:** próximo experimento, descobertas recentes e mapa geral de conceitos não aparecem na página atual.
10. **Validação limitada de respostas da IA:** expressões proibidas são filtradas, mas valores inventados não são confrontados automaticamente com o DTO.

### Documentais

11. O PDF contém os marcadores “Colocar o quadro da stack usada” e “colocar tabela”.
12. O capítulo de desenvolvimento contém apenas “Em produção”.
13. A conclusão contém texto provisório.
14. Resumo, metodologia e arquitetura ainda usam termos removidos do produto.

## 11. Cenário sintético e reprodutibilidade

O TCC promete:

- cinco usuários fictícios;
- três módulos por usuário;
- dez sessões por módulo;
- 15 módulos;
- 150 sessões;
- 150 avaliações;
- quinze respostas de IA, das quais pelo menos quatorze devem satisfazer os critérios.

O seed atual possui:

- cinco usuários;
- seis módulos;
- aproximadamente 39 sessões válidas;
- seis evidências confirmadas e uma pendente no cenário rico de Diego;
- concentração das análises avançadas em um único perfil.

O sistema consegue demonstrar o ciclo técnico de registro, cálculo, visualização e interpretação, mas não executa atualmente o desenho quantitativo declarado no TCC.

## 12. Cobertura de testes

Foram executados apenas testes unitários diretamente relacionados, sem scripts que recriam ou modificam o banco.

```text
9 arquivos de teste aprovados
67 testes aprovados
0 falhas
```

Os testes cobrem, entre outros pontos:

- ausência de sessões;
- inclusão e exclusão por situação;
- sessões arquivadas;
- métodos e formatos múltiplos;
- amostra insuficiente;
- frequência e semanas UTC;
- isolamento por módulo;
- associação de evidências posteriores;
- deduplicação de evidências;
- rankings de conceitos;
- evolução por conceito;
- percepção versus evidência;
- consolidação entre módulos;
- saída estruturada da IA;
- rejeição de linguagem causal;
- fallback entre provedores;
- contingência local;
- renderização dos gráficos e estados vazios.

Não existem testes que comprovem:

- cálculo de taxa de acerto a partir das questões;
- ponderação por quantidade de questões;
- funcionamento real de Bloom no fluxo persistido;
- aderência ao mínimo de três observações do TCC;
- cenário completo de 150 sessões e 150 avaliações;
- avaliação das quinze respostas generativas prevista na metodologia;
- validação factual de todos os números gerados pela IA.

## 13. Recomendações para o TCC

### Obrigatórias

1. Substituir o domínio antigo de tópicos e avaliações pelo domínio de módulos, sessões, conceitos e evidências confirmadas.
2. Atualizar a arquitetura e os provedores de IA: Groq e Gemini são os provedores principais atuais; Qwen é legado.
3. Explicar que desempenho por método e formato é uma associação observacional baseada em evidências posteriores.
4. Descrever separadamente percepção, desempenho confirmado e índices compostos de conceitos.
5. Corrigir a lista de métricas da seção 3.4.1 e decidir se taxa de acerto, tentativas e Bloom continuam no escopo.
6. Atualizar a metodologia de avaliação para o cenário realmente executado ou expandir o seed para cumprir o desenho 5 × 3 × 10.
7. Preencher os quadros, o capítulo de desenvolvimento e a conclusão.

### Recomendadas

8. Documentar os limiares de cinco minutos, duas ou três observações, 30 dias e 90 dias.
9. Informar que métodos e formatos simultâneos não são categorias exclusivas.
10. Evitar expressões como “melhor método”, “taxa de aprendizagem” e “domínio”, salvo se novos modelos forem implementados.

## 14. Recomendações para a implementação

### Crítico

1. Decidir se a taxa de acerto será implementada a partir das questões ou removida da metodologia.
2. Restaurar um fluxo acessível de confirmação de evidências ou redefinir oficialmente como elas passam de pendentes para confirmadas.

### Alto

3. Uniformizar a conversão da escala de compreensão e dificuldade.
4. Alinhar a amostra mínima com o TCC, preferencialmente usando três observações para destaques declarados como tendência.
5. Decidir entre média simples de percentuais e agregação ponderada por pontos ou questões.
6. Criar um cenário sintético compatível com o procedimento de avaliação final.

### Médio

7. Remover estruturas não utilizadas de Bloom ou completar o fluxo persistido e visual.
8. Validar numericamente referências produzidas pela IA quando elas mencionarem valores.
9. Remover ou reativar cálculos e componentes sem consumidor atual, conforme o escopo aprovado.

### Baixo ou trabalho futuro

10. Considerar um motor explícito de seleção de materiais somente se isso continuar fazendo parte da pergunta de pesquisa. Não é necessário ampliar o produto apenas para torná-lo mais complexo.

## 15. Respostas conclusivas

### As métricas implementadas correspondem às descritas no TCC?

Parcialmente. Duração, métodos, formatos, evolução e percepção versus evidência possuem correspondência, porém com modelos e fórmulas diferentes. Taxa de acerto não está implementada como prometida.

### O sistema possui métricas mais completas ou diferentes das previstas?

Sim. Ele possui regularidade, frequência, rankings compostos de conceitos, evidências posteriores, consistência entre módulos e várias limitações observacionais que não estão adequadamente descritas no TCC.

### Existem métricas prometidas que ainda não funcionam?

Sim. Taxa de acerto, tentativas educacionais e Bloom não funcionam de ponta a ponta no sistema atual.

### A utilização de conceitos substitui adequadamente a utilização de tópicos?

Sim para contextualização e análise observacional, desde que o TCC explique que conceitos são extraídos e relacionados dentro de cada módulo. Eles não equivalem a tópicos curriculares hierárquicos nem demonstram domínio.

### O indicador chamado “taxa de aprendizagem” realmente mede aprendizagem?

Não existe uma métrica ativa com esse nome. O mecanismo mais próximo é um índice composto de sinais recentes de compreensão ou dificuldade. Ele não mede ganho, velocidade de aprendizagem ou domínio.

### O sistema respeita “O sistema calcula; a IA interpreta”?

Majoritariamente sim. Os números são calculados no backend. A IA interpreta, escolhe o foco e pode sugerir experimentos, mas não existe validação factual completa de cada número textual gerado.

### A implementação é suficiente para executar os cenários sintéticos do TCC?

Não no tamanho e desenho declarados. O ciclo técnico está disponível, mas o seed atual não contém os 15 módulos, 150 sessões e 150 avaliações prometidos.

### Cinco correções mais importantes

1. Atualizar o TCC para o domínio atual de sessões, conceitos e evidências.
2. Resolver o fluxo de confirmação das evidências.
3. Decidir o destino de taxa de acerto, tentativas e Bloom.
4. Uniformizar amostra mínima, escalas e ponderação matemática.
5. Alinhar o cenário sintético e a avaliação das respostas de IA com a metodologia final.
