# Auditoria das métricas e indicadores da plataforma — TCC

**Data da auditoria:** 12 de outubro de 2026  
**Agente:** Guanabara  
**Escopo:** código-fonte atualmente presente no repositório, incluindo alterações locais ainda não consolidadas.  
**Natureza:** análise e documentação somente leitura; nenhuma funcionalidade, banco, migração ou dado foi alterado.

## 1. Resumo executivo

A plataforma utiliza dois motores determinísticos principais:

1. metricas-sessoes-v1, responsável por duração, frequência, regularidade, percepções, métodos, formatos e evolução semanal;
2. aprendizagem por módulo, responsável por evidências posteriores, desempenho por conceito, associação com métodos e formatos, tendências, comparação entre percepção e desempenho, índices exploratórios e recomendações.

As métricas oficiais são calculadas pela aplicação. A IA recebe um DTO com médias, contagens, tendências, níveis de amostra e recomendações já calculados. O prompt proíbe o modelo de recalcular indicadores ou substituir a recomendação oficial.

A regra de pelo menos três observações está implementada, mas não é universal:

- três evidências para tendência;
- três evidências para classificar a associação método/formato como suficiente;
- três evidências para comparar percepção e desempenho por conceito;
- três compreensões para destacar método ou formato;
- três compreensões e três evidências por módulo para a consistência entre módulos;
- três contribuidores distintos para liberar agregados de sala.

Outros cálculos usam limites diferentes: médias de percepção exigem duas sessões completas; rankings de conceitos exigem duas observações exploratórias; comparações antigas de desafios exigem duas sessões em cada grupo; a classificação genérica de amostra usa 0, 1, 2–4 e 5 ou mais.

A antiga taxa de acerto de avaliações não é calculada no fluxo atual. Os modelos operacionais antigos de avaliação, tentativa e resposta não existem no schema Prisma vigente. Restam migrações históricas e campos de questões em evidências, mas esses campos não são agregados para produzir taxa de acerto. O desempenho atual é a média simples de percentuais válidos das evidências.

## 2. Critérios básicos de validade

### 2.1 Sessão válida

Uma sessão entra nas métricas quando satisfaz simultaneamente:

~~~text
situação = CONCLUIDA
encerradaEm != nulo
duracaoMinutos é inteiro
duracaoMinutos >= 5
~~~

Sessões planejadas, ativas, invalidadas ou menores que cinco minutos são excluídas. Sessões arquivadas continuam incluídas.

**Código:** src/dominio/analises/metricas-sessoes.ts:102–107 e 198–235.

### 2.2 Evidência válida

Uma evidência entra nos cálculos quando:

~~~text
desempenhoPercentual != nulo
desempenhoPercentual é finito
0 <= desempenhoPercentual <= 100
dataEvento é uma data válida
dataEvento <= data de referência
~~~

O serviço também limita a consulta ao módulo, ao usuário autorizado, ao período selecionado e a materiais ativos cuja função ainda seja AVALIACAO. Ausências e valores inválidos são excluídos, nunca convertidos em zero.

**Código:** src/dominio/analises/aprendizagem-modulo.ts:283–295; src/servidor/aprendizagem-modulo.ts:115–150.

### 2.3 Período

Filtros de interface usam datas UTC inclusivas: início às 00:00:00.000Z e fim às 23:59:59.999Z. Datas futuras, incompletas ou invertidas são rejeitadas e o sistema volta ao período padrão.

**Código:** src/dominio/periodo-modulo.ts:17–39.

## 3. Tabela das métricas identificadas

| Métrica ou indicador | Significado | Contexto | Estado e uso atual | Implementação |
|---|---|---|---|---|
| Quantidade de sessões válidas | Volume de sessões que cumprem a regra oficial | usuário, módulo, sala e período | Ativa; cards, tabelas, IA e salas | metricas-sessoes.ts:198–220 |
| Minutos totais | Soma das durações válidas | usuário, módulo, sala e período | Ativa; dashboards, comparação consentida e IA | metricas-sessoes.ts:203–220 |
| Duração média | Minutos totais divididos por sessões válidas | usuário, módulo e sala | Ativa | metricas-sessoes.ts:203–210 |
| Dias com estudo | Quantidade de datas UTC distintas | usuário, módulo e sala | Ativa e enviada à IA | metricas-sessoes.ts:115–127 |
| Maior sequência | Maior sequência de dias UTC consecutivos | usuário e módulo | Ativa e enviada à IA | metricas-sessoes.ts:115–127 |
| Regularidade semanal | Proporção de semanas ativas no intervalo entre primeira e última semana | usuário, módulo e sala | Ativa no módulo e agregados | metricas-sessoes.ts:130–137 |
| Dificuldade percebida média | Média de autorrelatos 1–5 | usuário, módulo, método, formato, semana e sala | Ativa | metricas-sessoes.ts:171–220 |
| Compreensão percebida média | Média de autorrelatos 1–5 | usuário, módulo, método, formato, conceito, semana e sala | Ativa | metricas-sessoes.ts:140–220; aprendizagem-modulo.ts:306–321 |
| Nível da amostra | AUSENTE, INSUFICIENTE, INICIAL ou RECORRENTE | sessões, percepções, métodos e formatos | Ativo como rótulo descritivo | metricas-sessoes.ts:95–100 |
| Sessões por método/formato | Quantidade distinta de sessões que contém cada contexto | usuário, módulo, sala e período | Ativa | metricas-sessoes.ts:140–162 |
| Minutos por método/formato | Soma das durações das sessões do contexto | usuário e módulo | Calculada e enviada à IA | metricas-sessoes.ts:140–162 |
| Participação do método/formato | Sessões do contexto divididas pelo total válido | usuário e módulo | Calculada; sem apresentação direta na interface atual | metricas-sessoes.ts:154–162 |
| Evolução semanal das sessões | Sessões, minutos, duração média, dias, percepções e contagens contextuais por semana UTC | usuário, módulo e sala | Ativa | metricas-sessoes.ts:171–195 |
| Desempenho médio por conceito | Média simples dos percentuais de evidências distintas | módulo, conceito e período | Ativa nos destaques e IA | aprendizagem-modulo.ts:306–321 |
| Tendência por conceito | Diferença entre última e primeira evidência | módulo e conceito | Ativa com mínimo de três evidências | aprendizagem-modulo.ts:121–128 |
| Percepção × desempenho por conceito | Classificação de alinhamento, possível superestimação, possível subestimação ou atenção | módulo e conceito | Ativa na geração de padrões e IA | aprendizagem-modulo.ts:111–119 e 335–340 |
| Resultado por método | Compreensão média e desempenho posterior médio associado ao método | módulo e Dashboard global | Ativa em gráficos, tabelas e IA | aprendizagem-modulo.ts:130–157 e 324–327 |
| Resultado por formato | Compreensão média e desempenho posterior médio associado ao formato | módulo e Dashboard global | Ativa em gráficos, tabelas e IA | aprendizagem-modulo.ts:130–157 e 324–327 |
| Duração associada a melhores resultados | Duração média das sessões com compreensão ≥4 e desempenho posterior ≥70 | módulo e Dashboard global | Ativa em cards | aprendizagem-modulo.ts:182–197 |
| Método associado à maior compreensão | Contexto elegível com maior compreensão média | módulo e Dashboard global | Ativa; exige três compreensões | aprendizagem-modulo.ts:176–180; dashboard-observacional.ts:113–118 |
| Formato associado à maior compreensão | Formato elegível com maior compreensão média | módulo e Dashboard global | Ativa; exige três compreensões | aprendizagem-modulo.ts:176–180; dashboard-observacional.ts:96–99 |
| Evolução semanal percepção × evidência | Médias semanais separadas de compreensão e desempenho | módulo e sala individual | Ativa | aprendizagem-modulo.ts:207–225 |
| Índice exploratório de compreensão | Média de compreensão normalizada, dificuldade invertida e desempenho disponíveis | conceito, janela de 90 dias | Ativa; ranking máximo de cinco | aprendizagem-modulo.ts:232–280 |
| Índice exploratório de dificuldade | Média de dificuldade normalizada, compreensão invertida e desempenho invertido | conceito, janela de 90 dias | Ativa; ranking máximo de cinco | aprendizagem-modulo.ts:232–280 |
| Consistência de método entre módulos | Módulos positivos divididos pelos módulos analisáveis | usuário ou sala | Ativa no Dashboard pessoal | dashboard-observacional.ts:39–71 |
| Maior dificuldade percebida | Módulo com maior média de dificuldade, desde que a média seja pelo menos 3 | Dashboard pessoal ou sala geral | Ativa em card | dashboard-observacional.ts:159–163 |
| Síntese “em linha/em desacordo” | Diferença absoluta entre percepção normalizada e desempenho | Dashboard pessoal ou sala geral | Ativa em gráfico de anel; limite de 15 pontos | graficos-dashboard.tsx:49–65 |
| Consolidação global por contexto | Média ponderada por quantidade de compreensões ou evidências | Dashboard pessoal ou sala | Ativa | dashboard-observacional.ts:74–93 |
| Conceitos em materiais e menções | Quantidade de materiais e sessões que mencionam o conceito | Dashboard global | Calculada, mas o componente não está montado na página atual | dashboard-observacional.ts:190–231; mapa-conceitos-dashboard.tsx:10–33 |
| Cobertura e próximo experimento | Método menos usado entre os métodos cadastrados | Dashboard global | Calculado, porém sem consumidor atual | dashboard-observacional.ts:152–158 |
| Descobertas recentes | Método frequente, combinação de métodos, percepção e variedade | Dashboard global | Calculadas, porém sem consumidor atual | dashboard-observacional.ts:164–188 |
| Recomendação de material | Seleção determinística por sinais de atenção e elegibilidade | módulo e DTO da IA | Ativa no servidor e na IA; painel visual existe, mas não está montado | recomendacoes-materiais.ts:15–49; interpretacoes.ts:130–143 |
| Agregado de sala | Reuso das métricas oficiais quando há três contribuidores no bloqueio de privacidade | sala e módulo-pai | Ativo para proprietário; o bloqueio usa situação concluída e duração ≥5 | paineis-salas.ts:9–20 e 127–143 |
| Comparação consentida de membros | Sessões, minutos, dificuldade e compreensão por membro | sala | Ativa com dois membros consentidos; sem ranking | comparacao-membros.tsx:10–17 |
| Comparação de desafio | Diferenças de duração e percepção entre sessões com e sem desafio | módulo e método | Implementada no domínio/serviço, mas sem consumidor na interface atual | comparar-desafio.ts:56–101; metricas.ts:59–75 |
| Taxa de acerto | Corretas divididas pelo total de questões | avaliação | Removida do fluxo operacional; não calculada | ausência no schema vigente; apenas migrações históricas |
| Tentativas pedagógicas | Número de tentativas do estudante | avaliação | Removida do domínio atual | ausência no schema e no código operacional |
| Bloom | Distribuição por nível cognitivo | avaliação | Não operacional; apenas campo opcional sem produtor no DTO | interpretacoes/esquema.ts:55–56 |
| Tentativas de análise/provedor | Contadores técnicos de processamento e fallback | material e IA | Ativos tecnicamente, mas não são métricas pedagógicas | schema.prisma:470–496; interpretacoes.ts:208–254 |

## 4. Fórmulas detalhadas e exemplos

### 4.1 Quantidade, tempo total e duração média

Se S é o conjunto de sessões válidas:

~~~text
N = |S|
T = soma da duração, em minutos, das sessões de S
média de duração = T / N, quando N > 0
~~~

Sem sessões, N = 0, T = 0 e a média é nula.

**Exemplo:** sessões de 25, 35 e 30 minutos produzem N = 3, T = 90 e média = 30 minutos.

O domínio preserva o decimal. A interface arredonda duração com Math.round.

**Código:** metricas-sessoes.ts:198–220; painel-metricas-sessoes.tsx:54–60.

### 4.2 Dias com estudo e maior sequência

Datas de encerramento são convertidas para YYYY-MM-DD em UTC e deduplicadas.

~~~text
dias com estudo = número de datas UTC distintas
maior sequência = maior cadeia em que data atual - data anterior = 1 dia
~~~

**Exemplo:** sessões em 1, 2, 4 e 5 de outubro produzem quatro dias com estudo e maior sequência igual a dois.

Sem sessões, ambos são zero.

**Código:** metricas-sessoes.ts:115–127.

### 4.3 Regularidade semanal

Cada sessão é atribuída à segunda-feira UTC de sua semana.

~~~text
A = número de semanas ativas
P = número de semanas entre a primeira e a última semana, inclusive
regularidade = A / P
~~~

Classificação:

- nenhuma sessão: SEM_DADOS;
- P < 2: INSUFICIENTE;
- regularidade ≥ 0,75: CONSTANTE;
- regularidade ≥ 0,50: MODERADA;
- abaixo de 0,50: ESPORADICA.

**Exemplo:** estudo em três de quatro semanas produz 3/4 = 0,75, classificado como CONSTANTE.

A interface mostra a porcentagem arredondada para inteiro.

**Código:** metricas-sessoes.ts:109–137; painel-metricas-sessoes.tsx:98–99 e 131–134.

### 4.4 Médias de percepção

O resumo geral exige que a mesma sessão tenha dificuldade e compreensão preenchidas. Só publica as duas médias quando existem pelo menos duas dessas sessões.

~~~text
dificuldade média = soma das dificuldades / n
compreensão média = soma das compreensões / n
~~~

Escala: 1 a 5. Sem duas percepções completas, as médias são nulas.

**Exemplo:** pares (dificuldade 2, compreensão 4) e (dificuldade 4, compreensão 5) produzem dificuldade média 3,0 e compreensão média 4,5.

Na interface, as médias usam uma casa decimal.

**Código:** metricas-sessoes.ts:198–216; painel-metricas-sessoes.tsx:73–75 e 143–146.

### 4.5 Classificação do tamanho da amostra

~~~text
n = 0    → AUSENTE
n = 1    → INSUFICIENTE
2 <= n < 5 → INICIAL
n >= 5   → RECORRENTE
~~~

É um rótulo descritivo, não significância estatística.

**Exemplo:** quatro sessões são classificadas como amostra INICIAL.

**Código:** metricas-sessoes.ts:95–100.

### 4.6 Métricas por método e formato

Para cada contexto c:

~~~text
sessões(c) = IDs distintos de sessões que registram c
minutos(c) = soma das durações dessas sessões
participação(c) = sessões(c) / total de sessões válidas
compreensão média(c) = soma das compreensões preenchidas / n de compreensões
~~~

A média de compreensão do motor de sessões é publicada com pelo menos duas compreensões. O contexto é deduplicado dentro de cada sessão por Set.

**Exemplo:** três sessões válidas, duas com Feynman, durações 20 e 40 e compreensões 4 e 5:

~~~text
sessões(Feynman) = 2
minutos(Feynman) = 60
participação = 2/3 = 0,6667
compreensão média = (4 + 5) / 2 = 4,5
~~~

Uma sessão pode registrar vários métodos e formatos e entrar em todos eles. Portanto, participações podem somar mais de 100%.

**Código:** metricas-sessoes.ts:140–168.

### 4.7 Evolução semanal das sessões

Para cada semana UTC:

~~~text
sessões semanais = quantidade de sessões válidas
minutos semanais = soma das durações
duração média semanal = minutos semanais / sessões semanais
dias com estudo = datas UTC distintas
~~~

As médias semanais de dificuldade e compreensão só aparecem com duas sessões que tenham ambas as percepções.

**Exemplo:** duas sessões de 30 e 50 minutos em dois dias da mesma semana produzem duas sessões, 80 minutos, média de 40 minutos e dois dias de estudo.

**Código:** metricas-sessoes.ts:171–195.

### 4.8 Associação entre sessão e evidência posterior

Para uma sessão s e evidência e:

~~~text
e deve ocorrer estritamente depois do encerramento de s

se e possui qualquer vínculo explícito:
    e só pode ser associada às sessões explicitamente listadas
senão:
    deve compartilhar conceito com s
    e ocorrer em até 30 dias depois
~~~

A deduplicação usa o ID da evidência. Uma evidência associada a várias sessões do mesmo grupo conta uma única vez no resultado agregado daquele método ou formato.

**Exemplo:** uma evidência de 80% vinculada a duas sessões Feynman aparece uma vez na média de Feynman, não duas.

**Código:** aprendizagem-modulo.ts:130–173.

### 4.9 Desempenho médio por conceito, método e formato

~~~text
desempenho médio =
soma dos percentuais das evidências válidas e distintas
/ número de evidências válidas e distintas
~~~

É média simples, sem ponderação por quantidade de questões ou pontos.

**Exemplo:** evidências de 100%, 50% e 70% produzem 220/3 = 73,333...%.

Sem evidência válida, o resultado é nulo. O backend não arredonda; a interface normalmente mostra porcentagem inteira.

**Código:** aprendizagem-modulo.ts:97–99, 149–157 e 306–321; painel-resultados-contextuais.tsx:14–26.

### 4.10 Tendência por conceito

Requer três evidências distintas.

~~~text
variação = desempenho mais recente - desempenho mais antigo

variação >= 10  → EVOLUCAO_POSITIVA
variação <= -10 → PONTO_DE_ATENCAO
caso contrário  → ESTAVEL
n < 3           → DADOS_INSUFICIENTES
~~~

**Exemplo:** 55%, 60% e 72% produzem variação 72 - 55 = 17, portanto EVOLUCAO_POSITIVA.

Valores intermediários não entram na fórmula além de satisfazer o tamanho mínimo. Não é regressão estatística.

**Código:** aprendizagem-modulo.ts:121–128 e 306–321.

### 4.11 Normalização da percepção

~~~text
percepção normalizada = ((valor - 1) / 4) × 100
~~~

Mapeamento: 1→0, 2→25, 3→50, 4→75, 5→100.

**Exemplo:** compreensão média 3,8 produz ((3,8 - 1) / 4) × 100 = 70.

**Código:** aprendizagem-modulo.ts:228–230.

### 4.12 Percepção versus desempenho por conceito

Requer compreensão, desempenho e pelo menos três evidências.

~~~text
percepção alta = compreensão normalizada >= 70
evidência alta = desempenho médio >= 70
~~~

Combinações:

- alta/alta: ALINHAMENTO_POSITIVO;
- alta/baixa: POSSIVEL_SUPERESTIMACAO;
- baixa/alta: POSSIVEL_SUBESTIMACAO;
- baixa/baixa: PONTO_DE_ATENCAO;
- dados ausentes ou n < 3: DADOS_INSUFICIENTES.

**Exemplo:** compreensão 4/5 normaliza para 75 e desempenho 62% produz POSSIVEL_SUPERESTIMACAO.

**Código:** aprendizagem-modulo.ts:111–119.

### 4.13 Duração associada a melhores resultados

Uma sessão é elegível quando:

~~~text
compreensão percebida >= 4
média das evidências posteriores da sessão >= 70
~~~

Depois:

~~~text
duração associada = soma das durações elegíveis / número de sessões elegíveis
~~~

**Exemplo:** sessões elegíveis de 30 e 50 minutos produzem média de 40 minutos.

Sem sessão elegível, o valor é nulo. Não existe exigência explícita de três evidências neste cálculo; basta a sessão ter pelo menos uma evidência posterior válida cuja média atinja o limite.

**Código:** aprendizagem-modulo.ts:182–197.

### 4.14 Destaques de método e formato

O candidato precisa de pelo menos três compreensões.

Ordenação do módulo:

1. maior compreensão média;
2. maior número de compreensões;
3. maior número de sessões;
4. chave alfabética.

No Dashboard global, o método usa compreensão histórica das sessões; o formato usa os resultados contextuais consolidados. Ambos mantêm o mínimo de três compreensões.

**Exemplo:** Feynman com média 4,4 e três compreensões vence Pomodoro com 4,1 e cinco compreensões porque a média é o primeiro critério.

**Código:** aprendizagem-modulo.ts:176–180; dashboard-observacional.ts:96–118 e 141–150.

### 4.15 Evolução semanal de percepção e evidência

~~~text
compreensão semanal = soma das compreensões / n de percepções
desempenho semanal = soma dos percentuais / n de evidências
~~~

Sessões usam a semana do encerramento; evidências usam a semana do evento. Não há limiar de três para criar o ponto desta série.

**Exemplo:** uma compreensão 4 e evidências 60% e 80% na semana produzem compreensão 4/5 e desempenho 70%.

**Código:** aprendizagem-modulo.ts:200–225.

### 4.16 Índices exploratórios por conceito

A janela é de 90 dias e exige duas observações exploratórias:

~~~text
observações = sessões com ao menos uma percepção + evidências válidas
~~~

Componentes:

~~~text
C = compreensão normalizada
D = dificuldade normalizada
E = desempenho médio

índice de compreensão = média dos componentes disponíveis [C, 100-D, E]
índice de dificuldade = média dos componentes disponíveis [D, 100-C, 100-E]
~~~

Ausências são removidas do denominador; cada fonte disponível recebe peso igual. Cada ranking retorna no máximo cinco conceitos.

**Exemplo:** compreensão 4/5 = 75, dificuldade 2/5 = 25 e desempenho 80:

~~~text
compreensão = média(75, 75, 80) = 76,67
dificuldade = média(25, 25, 20) = 23,33
~~~

**Código:** aprendizagem-modulo.ts:232–280.

### 4.17 Consolidação global por método ou formato

As médias dos módulos são reponderadas por suas amostras:

~~~text
compreensão global =
soma(compreensão média do módulo × n de compreensões do módulo)
/ soma(n de compreensões)

desempenho global =
soma(desempenho médio do módulo × n de evidências do módulo)
/ soma(n de evidências)
~~~

**Exemplo:** módulo A com média 80 em duas evidências e módulo B com média 50 em uma evidência:

~~~text
(80×2 + 50×1) / 3 = 70
~~~

**Código:** dashboard-observacional.ts:74–93.

### 4.18 Consistência entre módulos

Um método é analisável em um módulo quando há:

- compreensão média;
- desempenho posterior médio;
- pelo menos três compreensões;
- pelo menos três evidências.

Um módulo analisável é positivo quando:

~~~text
compreensão média >= 4/5
desempenho posterior médio >= 70%
~~~

Então:

~~~text
consistência = módulos positivos / módulos analisáveis
~~~

A interface mostra a razão “x de y”. O rótulo Poucos dados aparece se houver menos de dois módulos analisáveis ou menos de quatro evidências somadas.

**Exemplo:** dois módulos analisáveis, um positivo, produzem 1/2 = 0,5 de consistência.

**Código:** dashboard-observacional.ts:39–71; consistencia-metodos-dashboard.tsx:7–18.

### 4.19 Síntese “em linha” e “em desacordo”

Considera somente método/formato com compreensão, desempenho e amostra objetiva suficiente.

~~~text
diferença = |compreensão normalizada - desempenho|
diferença <= 15 → em linha
diferença > 15  → em desacordo
~~~

**Exemplo:** compreensão 4/5 = 75 e desempenho 63 resultam em diferença 12, portanto em linha.

Essa classificação é calculada no componente de interface, não no domínio.

**Código:** graficos-dashboard.tsx:49–65.

### 4.20 Maior dificuldade percebida

Para cada módulo, o Dashboard calcula a média geral de dificuldade das sessões recentes. Só entram módulos cuja média publicada seja pelo menos 3/5. Ordena por:

1. maior dificuldade média;
2. maior amostra;
3. título.

Como a média geral exige duas percepções completas, um módulo com uma única percepção não é elegível.

**Exemplo:** módulos com médias 3,5 e 4,0 produzem destaque para o segundo.

**Código:** dashboard-observacional.ts:159–163.

### 4.21 Recomendação determinística

Um conceito é sinal de atenção quando ocorre pelo menos uma condição:

~~~text
desempenho médio < 70
ou compreensão média < 3
ou dificuldade média >= 3
~~~

Prioridade:

1. conceitos com desempenho abaixo de 70;
2. menor desempenho;
3. ID estável.

Saídas:

- RM-01: material ativo, do mesmo usuário, módulo e conceito;
- RM-02: sinal de atenção sem material elegível;
- RM-03: nenhum sinal suficiente, recomendação de exploração.

São retornadas no máximo três recomendações e o mesmo material não é repetido entre conceitos. O nível é DESCRITIVA com três ou mais evidências e LIMITADA abaixo disso.

**Exemplo:** conceito com 62%, compreensão 4 e dificuldade 2 entra pela regra de desempenho. Se houver referência elegível, recebe RM-01; sem referência, RM-02.

**Código:** recomendacoes-materiais.ts:15–49; aprendizagem-modulo.ts:151–158.

## 5. Agrupamentos, contextos e deduplicação

### 5.1 Usuário e módulo

As consultas pessoais sempre filtram usuarioId e somente módulos não arquivados e não rascunhos. Métricas globais consolidam apenas módulos ativos da conta. Métricas de módulo filtram um módulo específico.

**Código:** src/servidor/metricas.ts:30–56; src/servidor/dashboard-observacional.ts:8–34.

### 5.2 Conceito

Conceitos são resolvidos para uma chave canônica por normalização e aliases. Sessões recebem conceitos por vínculo direto, materiais usados e menções textuais na descrição. Evidências recebem conceitos por vínculo próprio e por suas questões.

Dentro de cada conceito, sessões e evidências são armazenadas em mapas por ID para evitar repetição.

**Código:** aprendizagem-modulo.ts:75–108 e 293–305; servidor/aprendizagem-modulo.ts:129–150.

### 5.3 Método e formato

Uma mesma sessão pode contribuir para vários métodos e formatos. Duplicatas do mesmo contexto dentro da sessão são removidas por Set. A mesma evidência pode ser encontrada por várias sessões, mas é deduplicada por ID dentro do grupo contextual.

**Código:** metricas-sessoes.ts:140–168; aprendizagem-modulo.ts:136–157.

### 5.4 Período

O Dashboard pessoal usa 90 dias como janela recente quando não existe filtro explícito, mas preserva métricas históricas em campos secundários. Com filtro explícito, as consultas limitam sessões pela data de início e evidências pela data do evento. Os rankings de conceitos continuam limitados a 90 dias dentro da referência.

**Código:** dashboard-observacional.ts:121–135; aprendizagem-modulo.ts:232–280.

### 5.5 Sala

O proprietário vê:

- métricas individuais dos vínculos que compartilham Dashboard;
- agregados por módulo-pai somente com três contribuidores distintos;
- Dashboard geral somente com três contribuidores vivos;
- comparação nominal apenas dos membros que autorizaram comparação;
- IA individual apenas quando o membro autorizou IA.

O agregado reutiliza calcularMetricasSessoes e calcularDashboardObservacional. IDs são pseudonimizados e sessões são deduplicadas pela combinação módulo + ID.

**Código:** paineis-salas.ts:9–20 e 37–153; dashboard-sala.ts:11–13; app/salas/[identificador]/page.tsx:59–74.

## 6. Regra das três observações e demais mínimos

| Regra | Limiar atual | Consequência abaixo do limiar | Referência |
|---|---:|---|---|
| Tendência por conceito | 3 evidências | DADOS_INSUFICIENTES | aprendizagem-modulo.ts:29 e 121–128 |
| Associação método/formato suficiente | 3 evidências distintas | média pode existir, mas amostraSuficiente = false | aprendizagem-modulo.ts:30 e 149–157 |
| Percepção × desempenho por conceito | 3 evidências | DADOS_INSUFICIENTES | aprendizagem-modulo.ts:31 e 111–119 |
| Destaque de método/formato | 3 compreensões | contexto não é candidato | aprendizagem-modulo.ts:36 e 176–180 |
| Consistência por módulo | 3 compreensões e 3 evidências | módulo sai do denominador | dashboard-observacional.ts:39–52 |
| Agregado de sala | 3 contribuidores com sessão concluída e duração ≥5 | métricas ocultadas | paineis-salas.ts:9–20 |
| Média geral/semanal de percepção | 2 percepções completas | média nula | metricas-sessoes.ts:4 e 180–191 |
| Ranking de conceitos | 2 observações exploratórias | conceito não entra no ranking | aprendizagem-modulo.ts:35 e 232–243 |
| Comparação antiga de desafio | 2 sessões completas em cada grupo | diferenças nulas e comparável = false | comparar-desafio.ts:65–99 |
| Rótulo recorrente de amostra | 5 observações | abaixo disso fica AUSENTE, INSUFICIENTE ou INICIAL | metricas-sessoes.ts:95–100 |

Conclusão: a regra de três está implementada nos indicadores objetivos centrais solicitados, mas não deve ser descrita no TCC como requisito de toda e qualquer média.

## 7. Dashboards, recomendações e IA

### 7.1 Dashboard do módulo

A página do módulo monta atualmente:

- duração associada a melhores resultados;
- método associado à maior compreensão;
- formato associado à maior compreensão;
- regularidade;
- evolução semanal de percepção e evidências;
- médias de dificuldade e compreensão;
- método × resultados;
- formato × resultados;
- conceitos com maiores sinais de dificuldade;
- conceitos com maiores sinais de compreensão.

**Código:** app/modulos/[identificador]/page.tsx:80–153; conteudo-dashboard-modulo.tsx:14–31.

### 7.2 Dashboard pessoal

Monta atualmente:

- quatro cards de síntese;
- evolução semanal das percepções;
- anel percepção × evidências;
- método × resultados;
- formato × resultados;
- consistência de métodos entre módulos;
- base com métodos registrados, sessões válidas e duração média.

O mapa textual de conceitos, as descobertas recentes, a cobertura dos métodos e o próximo experimento continuam sendo calculados, mas não estão montados na página atual.

**Código:** app/dashboard/page.tsx:18–37; cartoes-insights-dashboard.tsx:9–35; graficos-dashboard.tsx:49–74.

### 7.3 Recomendação

O motor de recomendação é executado ao obter a aprendizagem do módulo. O painel PainelRecomendacoesMateriais existe e possui testes, mas não é importado pela página do módulo nem por ConteudoDashboardModulo. Portanto:

- cálculo no servidor: ativo;
- envio à IA do módulo: ativo;
- apresentação visual específica: inativa na composição atual.

**Código:** servidor/aprendizagem-modulo.ts:151–164; servidor/ia/interpretacoes.ts:130–143; painel-recomendacoes-materiais.tsx:4–18.

### 7.4 Dados enviados à IA

No escopo pessoal, a IA recebe:

- quantidade de módulos, sessões válidas e minutos;
- resumos por módulo;
- frequência, sequência, percepções, métodos e formatos;
- evolução semanal;
- até dez descrições compactadas das sessões.

No escopo do módulo, recebe adicionalmente:

- base de sessões, evidências e conceitos;
- desempenho e tendência por conceito;
- associações por método e formato;
- padrões objetivos;
- eventos recentes;
- evolução percepção × evidência;
- recomendações determinísticas.

No escopo de membro da sala, recebe somente métricas autorizadas; descrições e materiais não são enviados.

O DTO é limitado antes do provedor: últimas 12 semanas, dez descrições, 12 conceitos, 12 associações, oito padrões e dez eventos.

**Código:** interpretacoes/esquema.ts:8–58; servidor/ia/interpretacoes.ts:68–184 e 300–316.

### 7.5 O que a IA calcula

A IA não calcula métricas oficiais. Ela produz de um a três textos estruturados de observação/reflexão. O prompt declara que médias, contagens, tendências, diferenças, níveis de amostra e recomendações já foram calculados e não devem ser recalculados.

A resposta é validada por schema e por expressões proibidas. Não existe, entretanto, uma verificação semântica completa que recalcule todos os números mencionados no texto da IA.

**Código:** servidor/ia/contrato-provedores.ts:30–47; interpretacoes/esquema.ts:60–119.

## 8. Métricas antigas, removidas ou não utilizadas

### 8.1 Taxa de acerto em avaliações

Não está operacional.

O schema atual não contém Avaliacao, TentativaAvaliacao, Questao ou RespostaQuestao. Esses nomes aparecem apenas em migrações históricas e em um verificador de remoção. QuestaoEvidencia ainda armazena resultado, pontuação obtida e pontuação máxima, mas o motor atual não agrega esses campos.

O percentual utilizado vem diretamente de EvidenciaAprendizagem.desempenhoPercentual e é agregado por média simples.

**Referências:** prisma/schema.prisma:634–673; servidor/aprendizagem-modulo.ts:81–109; ausência de consumidores de respostasCorretas/totalQuestoes em src.

### 8.2 Desempenho médio por conceito

Permanece ativo. É a média simples dos percentuais válidos e distintos associados ao conceito.

**Referência:** aprendizagem-modulo.ts:306–321.

### 8.3 Desempenho médio por método

Permanece ativo. Usa as evidências posteriores associadas às sessões do método, com deduplicação por ID.

**Referência:** aprendizagem-modulo.ts:130–157 e 324–327.

### 8.4 Desempenho médio por formato

Permanece ativo com a mesma regra do método.

**Referência:** aprendizagem-modulo.ts:130–157 e 324–327.

### 8.5 Comparação entre compreensão percebida e desempenho

Permanece ativa em duas formas:

1. classificação por conceito usando limite 70/70 e mínimo de três evidências;
2. gráfico global “em linha/em desacordo” usando diferença absoluta de 15 pontos entre percepção normalizada e desempenho.

**Referências:** aprendizagem-modulo.ts:111–119; graficos-dashboard.tsx:49–65.

### 8.6 Desafios

O cálculo de comparação de desafio ainda existe, mas a página de Experimentos exibe somente o catálogo dos seis métodos e não chama o serviço. É código sem consumidor de produto atual.

**Referências:** comparar-desafio.ts:82–101; servidor/metricas.ts:59–75; app/desafios/page.tsx:28–65.

### 8.7 Bloom

O DTO admite um campo opcional bloom e o prompt menciona níveis cognitivos, mas nenhum construtor do DTO atual preenche esse campo. Não há métrica Bloom operacional.

**Referências:** interpretacoes/esquema.ts:55–56; servidor/ia/interpretacoes.ts:130–161 e 300–316.

## 9. Divergências e pontos que precisam de confirmação

1. **Duração associada a melhores resultados não exige três evidências.** A sessão é aceita se a média das evidências posteriores disponíveis for pelo menos 70. Se a metodologia afirmar mínimo de três para esse indicador, haverá divergência com o código.

2. **Série semanal de percepção × evidência não exige três observações.** Ela pode publicar uma semana com uma percepção ou uma evidência. O tamanho da amostra acompanha o ponto.

3. **Rankings de conceitos exigem duas observações exploratórias, não três evidências.** Uma observação pode ser uma sessão com percepção ou uma evidência.

4. **O formato de destaque global vem da análise contextual; o método de destaque global vem das métricas históricas de sessão.** Ambos usam compreensão média, mas suas fontes são montadas por caminhos diferentes.

5. **O filtro de período das sessões usa iniciadaEm.** A validade e os agrupamentos semanais usam encerradaEm. Uma sessão que começa antes do início filtrado e termina dentro dele fica fora da consulta.

6. **O Dashboard sem filtro mistura uma janela recente de 90 dias com campos históricos.** Cards e séries recentes não devem ser descritos genericamente como “todo o histórico”.

7. **Recomendação está ativa no servidor e na IA, mas sem card próprio na página.** A metodologia deve diferenciar motor implementado de componente visual exibido.

8. **Código calculado sem consumidor:** cobertura de métodos, próximo experimento, descobertas recentes, mapa textual de conceitos e comparação de desafios não aparecem no produto atual.

9. **Campos legados de confirmação permanecem fisicamente no schema**, mas são ignorados pelo fluxo de negócio. Não devem ser interpretados como confirmação humana ativa.

10. **A síntese de diferença de 15 pontos é calculada na interface.** Apesar de determinística e testada, não pertence ao módulo central de domínio.

11. **O bloqueio de privacidade dos agregados de sala usa uma verificação reduzida.** Para contar contribuidores, verifica situação concluída e duração mínima de cinco minutos, mas não testa explicitamente encerramento não nulo nem duração inteira. Depois de liberado, o cálculo das métricas usa a regra oficial completa. Com dados persistidos normais os conjuntos tendem a coincidir, mas o código não garante equivalência formal entre os dois filtros.

## 10. Resumo técnico para a metodologia do TCC

A plataforma adota métricas descritivas calculadas deterministicamente a partir de sessões de estudo e evidências posteriores. Uma sessão é considerada válida quando está concluída, possui encerramento registrado e duração inteira mínima de cinco minutos. Sessões arquivadas preservam participação histórica. A partir dessas sessões são calculados quantidade, minutos totais, duração média, dias com estudo, maior sequência diária, regularidade semanal, médias de dificuldade e compreensão percebidas, distribuição por método e formato e evolução semanal.

As percepções são autorrelatos na escala de 1 a 5. Quando comparadas ao desempenho, são normalizadas para 0 a 100 pela fórmula ((valor - 1) / 4) × 100. O desempenho observado é representado pelo percentual registrado em evidências válidas, entre 0 e 100. Por conceito, método ou formato, o desempenho médio é a média aritmética simples dos percentuais de evidências distintas; ele não é ponderado pelo número de questões e não constitui taxa agregada de acerto.

Evidências são associadas a sessões por vínculo explícito ou, na ausência dele, por conceito comum no mesmo módulo, ocorrência posterior e janela máxima de 30 dias. Métodos e formatos são contextos não exclusivos: uma sessão pode contribuir para vários grupos. IDs de sessão e evidência são deduplicados nos agrupamentos para evitar repetição indevida.

Tendências por conceito exigem ao menos três evidências e comparam o último percentual ao primeiro. Variações de pelo menos dez pontos indicam evolução positiva; quedas de dez pontos ou mais indicam ponto de atenção; as demais são estáveis. A comparação entre percepção e desempenho também exige três evidências e usa 70 pontos como referência para ambos os sinais. Esses resultados são observacionais e não demonstram causalidade, domínio ou eficácia de método.

Os rankings exploratórios de conceitos utilizam até 90 dias. O índice de compreensão é a média dos sinais disponíveis de compreensão normalizada, dificuldade invertida e desempenho. O índice de dificuldade inverte esses componentes. São necessárias duas observações exploratórias, e no máximo cinco conceitos são apresentados.

No Dashboard global, resultados de vários módulos são consolidados com ponderação pelas quantidades de compreensões e evidências. A consistência de um método é a proporção de módulos positivos entre módulos analisáveis; cada módulo requer três compreensões e três evidências e é positivo quando apresenta compreensão média mínima de 4/5 e desempenho mínimo de 70%.

A recomendação de materiais é produzida por regras determinísticas. Sinais de atenção são desempenho abaixo de 70%, compreensão abaixo de 3/5 ou dificuldade a partir de 3/5. A IA recebe métricas e recomendações já calculadas, juntamente com contagens e limitações, e atua somente na interpretação textual. Ela não modifica os dados nem produz as métricas oficiais.

## 11. Validação da auditoria

Foram executados somente testes unitários de domínio, sem banco configurado ou scripts de dados:

~~~text
7 arquivos de teste aprovados
52 testes aprovados
0 falhas
~~~

Arquivos verificados:

- metricas-sessoes.test.ts;
- aprendizagem-modulo.test.ts;
- ajustes-tcc.test.ts;
- dashboard-observacional.test.ts;
- recomendacoes-materiais.test.ts;
- dashboard-sala.test.ts;
- comparar-desafio.test.ts.

Esta auditoria não executou migrações, seed, avaliação sintética, chamadas de IA ou alterações em dados existentes.

