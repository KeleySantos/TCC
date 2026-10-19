# Análise e documentação dos cinco cenários de avaliação — TCC

Data da análise: 12 de outubro de 2026  
Escopo: fixture, script de avaliação, algoritmos analíticos, composição do contexto da IA e verificações relacionadas  
Natureza: implementação e verificação dos cenários no seed, no banco local configurado e em banco temporário isolado

## 1. Resumo geral da avaliação

A implementação corresponde à estrutura-base planejada: cinco usuários sintéticos, três módulos por usuário, dez sessões por módulo e uma evidência de desempenho vinculada a cada sessão. A carga inicial contém, portanto, 5 usuários, 15 módulos, 150 sessões e 150 evidências. O script confere automaticamente essas quatro contagens e compara os resultados do conceito-alvo nos 15 módulos com gabaritos previamente definidos ([`scripts/avaliar-tcc.ts`, linhas 26–91](../../scripts/avaliar-tcc.ts)).

Cada usuário representa um cenário analítico diferente:

1. S1 associa duas combinações de método/formato a resultados diferentes;
2. S2 mantém o resultado estável dentro de cada módulo, mas varia entre módulos;
3. S3 simula evolução positiva, queda e estabilidade;
4. S4 reduz de forma controlada a quantidade de evidências do conceito-alvo;
5. S5 contrapõe percepção declarada e desempenho observado.

Os cinco cenários avaliam o cálculo e a organização dos indicadores da plataforma. Eles não representam pessoas reais nem resultados empíricos. As denominações “perfil fictício” e “comportamento” referem-se somente ao padrão sintético de registros. O código não define idade, formação, gênero, diagnóstico ou qualquer outra característica pessoal para esses usuários.

Há duas camadas de avaliação diferentes:

- **avaliação analítica da plataforma:** os 15 módulos são comparados com os gabaritos;
- **avaliação da IA:** somente o módulo 0 de cada cenário é usado, três vezes, totalizando 5 cenários × 3 repetições = 15 respostas.

Essas 15 respostas da IA não correspondem aos 15 módulos. O script padrão utiliza um provedor simulado, sem rede, e deixa a rubrica qualitativa em branco. Logo, não há resultado real de qualidade de IA produzido automaticamente ([`scripts/avaliar-tcc.ts`, linhas 74–85](../../scripts/avaliar-tcc.ts); [`AiFiles/RELATORIOS/PROTOCOLO_AVALIACAO_TCC.md`, linhas 32–54](PROTOCOLO_AVALIACAO_TCC.md)).

## 2. Estrutura dos dados sintéticos

### 2.1 Dados definidos diretamente na fixture

O arquivo [`testes/fixtures/cenarios-tcc.ts`, linhas 1–16](../../testes/fixtures/cenarios-tcc.ts) define diretamente:

- a data de referência: `2026-10-10T12:00:00Z`;
- os identificadores S1 a S5;
- os nomes dos cenários;
- as médias esperadas do conceito-alvo em cada um dos três módulos;
- as tendências esperadas do conceito-alvo;
- a função `percentualCenario`, que determina o desempenho de cada evidência a partir dos índices do cenário, módulo e sessão.

Os gabaritos são constantes independentes do algoritmo analisado. A função auxiliar gera os percentuais individuais usados para chegar a essas médias.

### 2.2 Dados criados pelo script

O script [`scripts/avaliar-tcc.ts`, linhas 26–55](../../scripts/avaliar-tcc.ts) cria, por regra:

| Elemento | Por cenário/usuário | Total inicial |
|---|---:|---:|
| Usuários | 1 | 5 |
| Módulos | 3 | 15 |
| Conceitos | 2 por módulo | 30 |
| Sessões | 10 por módulo; 30 por usuário | 150 |
| Evidências | 10 por módulo; 30 por usuário | 150 |
| Materiais de referência | 1 por módulo, exceto em S4 | 12 |

Os cenários foram vinculados às cinco contas fictícias já cadastradas. Os mesmos nomes e acessos são usados tanto no banco temporário de avaliação quanto no seed e no banco local:

| Cenário | Nome exibido | Usuário | Módulos dedicados |
|---|---|---|---|
| S1 | Ana Souza | `ana.souza` | `avaliacao-tcc-s1-modulo-0` a `-2` |
| S2 | Bruno Lima | `bruno.lima` | `avaliacao-tcc-s2-modulo-0` a `-2` |
| S3 | Carla Rocha | `carla.rocha` | `avaliacao-tcc-s3-modulo-0` a `-2` |
| S4 | Diego Alves | `diego.alves` | `avaliacao-tcc-s4-modulo-0` a `-2` |
| S5 | Elisa Martins | `elisa.martins` | `avaliacao-tcc-s5-modulo-0` a `-2` |

Os identificadores exclusivos evitam conflito com os módulos demonstrativos preexistentes, como `javascript` e `logica`. A reaplicação substitui apenas o conteúdo dos 15 módulos `avaliacao-tcc-*`, preservando os demais dados das contas.

Cada módulo possui dois conceitos:

- `conceito` / “Conceito”: conceito-alvo dos gabaritos;
- `controle` / “Controle”: usado principalmente para deslocar evidências no cenário S4.

Os cenários S1, S2, S3 e S5 recebem um material textual chamado “Referência do conceito”, vinculado ao conceito-alvo. O cenário S4 não recebe material. Esse comportamento é definido no script, não na fixture ([`scripts/avaliar-tcc.ts`, linhas 29–33](../../scripts/avaliar-tcc.ts)).

### 2.3 Estrutura comum das sessões

Todas as sessões iniciais têm:

- datas consecutivas de 1º a 10 de setembro de 2026, às 10h UTC;
- encerramento 30 minutos após o início;
- duração de 30 minutos;
- situação `CONCLUIDA`;
- registro manual;
- descrição “Estudo do Conceito”;
- vínculo com o conceito-alvo;
- última sessão marcada como arquivada, sem ser excluída das métricas históricas.

As cinco primeiras sessões usam Técnica de Feynman e formato texto. As cinco últimas usam Pomodoro e formato vídeo. Esses valores vêm do laço do script ([`scripts/avaliar-tcc.ts`, linhas 34–45](../../scripts/avaliar-tcc.ts)), não do arquivo de fixture.

Como todas são concluídas, têm encerramento e duração inteira de pelo menos cinco minutos, as dez sessões de cada módulo são válidas. O fato de a décima estar arquivada não a retira dos cálculos ([`src/dominio/analises/metricas-sessoes.ts`, linhas 102–107 e 221–235](../../src/dominio/analises/metricas-sessoes.ts)).

### 2.4 Indicadores comuns aos módulos

Antes das diferenças específicas de cada cenário, todo módulo apresenta:

- 10 sessões válidas;
- 300 minutos totais: `10 × 30`;
- duração média de 30 minutos: `300 ÷ 10`;
- 10 dias com estudo;
- maior sequência de 10 dias consecutivos;
- 10 registros de compreensão e dificuldade;
- 5 sessões e 150 minutos associados a Feynman/texto;
- 5 sessões e 150 minutos associados a Pomodoro/vídeo;
- nível de amostra `RECORRENTE` para cada método e formato, pois há cinco sessões.

As sessões ficam distribuídas em duas semanas UTC: seis registros na semana iniciada em 31 de agosto e quatro na semana iniciada em 7 de setembro. As regras de validade, frequência, contexto e evolução semanal estão em [`src/dominio/analises/metricas-sessoes.ts`, linhas 95–220](../../src/dominio/analises/metricas-sessoes.ts).

Nos cenários S1 a S4, compreensão e dificuldade percebidas valem 3/5 em todas as sessões. Em S5 esses valores variam por módulo. A média percebida só é publicada a partir de duas observações, condição atendida nos módulos completos ([`src/dominio/analises/metricas-sessoes.ts`, linhas 3–5 e 198–220](../../src/dominio/analises/metricas-sessoes.ts)).

### 2.5 Estrutura comum das evidências

Cada sessão recebe uma atividade sintética distinta, do tipo `EXERCICIO`, ocorrida um minuto após o encerramento. A evidência:

- pertence ao mesmo módulo da sessão;
- possui percentual definido por `percentualCenario`;
- é ligada explicitamente à sessão correspondente;
- é ligada ao conceito-alvo ou ao conceito de controle, conforme a regra de S4.

Assim, sessão e evidência são registros separados; o teste não presume que uma sessão real seja automaticamente uma avaliação. O vínculo é criado deliberadamente na fixture ([`scripts/avaliar-tcc.ts`, linhas 46–54](../../scripts/avaliar-tcc.ts)).

Para tendência e associação, o mínimo é de três evidências. A tendência compara o valor cronologicamente mais recente com o primeiro: variação de pelo menos +10 pontos indica evolução positiva; no máximo −10 indica ponto de atenção; valores intermediários são estáveis ([`src/dominio/analises/aprendizagem-modulo.ts`, linhas 29–38 e 111–128](../../src/dominio/analises/aprendizagem-modulo.ts)).

## 3. Descrição detalhada dos cinco cenários

### 3.1 S1 — Formato e método

**Objetivo.** Verificar se a plataforma associa corretamente os resultados às sessões explicitamente vinculadas, diferencia os dois contextos de estudo e evita transformar associação em causalidade ou superioridade de método.

**Perfil sintético.** Ana Souza (`ana.souza`). O comportamento simulado mantém percepção neutra, mas apresenta desempenho maior na primeira metade do período e menor na segunda.

**Estrutura.** Três módulos (`S1 módulo 0`, `S1 módulo 1` e `S1 módulo 2`), cada um com “Conceito” e “Controle”, um material textual de referência, dez sessões e dez evidências. Em todos os módulos:

- sessões 1–5: Feynman + texto, desempenho 80%;
- sessões 6–10: Pomodoro + vídeo, desempenho 40%;
- compreensão percebida: 3/5;
- dificuldade percebida: 3/5.

Os percentuais 80 e 40 são gerados pela primeira condição de `percentualCenario`; as médias e tendências 60/60/60 e `PONTO_DE_ATENCAO` são declaradas no gabarito ([`testes/fixtures/cenarios-tcc.ts`, linhas 3–16](../../testes/fixtures/cenarios-tcc.ts)).

**Resultados esperados.** Em cada módulo:

- desempenho médio do conceito: `(5 × 80 + 5 × 40) ÷ 10 = 60%`;
- tendência: `40 − 80 = −40`, portanto `PONTO_DE_ATENCAO`;
- Feynman e texto: 5 sessões, 5 evidências posteriores, média de 80%;
- Pomodoro e vídeo: 5 sessões, 5 evidências posteriores, média de 40%;
- as quatro associações têm amostra suficiente, pois `n = 5 ≥ 3`;
- relação percepção × evidência: compreensão normalizada em 50% e desempenho de 60%, ambos abaixo de 70%, gerando `PONTO_DE_ATENCAO`.

O script afirma explicitamente as médias contextuais de 80% e 40% para os métodos ([`scripts/avaliar-tcc.ts`, linhas 56–65](../../scripts/avaliar-tcc.ts)). Os formatos são calculados pela mesma função, mas não possuem uma asserção específica nesse script.

**Leitura correta.** Os registros mostram uma associação observacional entre os contextos e os resultados nesta amostra. Como método/formato e momento temporal mudam juntos, não é possível concluir que Feynman ou texto causaram melhor desempenho.

### 3.2 S2 — Contexto de módulo

**Objetivo.** Confirmar que o mesmo conceito é analisado separadamente em módulos distintos e que a plataforma não mistura resultados entre módulos ou usuários.

**Perfil sintético.** Bruno Lima (`bruno.lima`). O comportamento é estável ao longo do tempo dentro de cada módulo, mas possui patamares diferentes entre os três módulos.

**Estrutura.** Três módulos, dois conceitos e um material de referência por módulo. Sessões, métodos, formatos e percepções seguem a base comum. Os desempenhos são:

- módulo 0: dez evidências de 80%;
- módulo 1: dez evidências de 40%;
- módulo 2: dez evidências de 60%.

Esses valores são gerados por `[80, 40, 60][modulo]` ([`testes/fixtures/cenarios-tcc.ts`, linha 13](../../testes/fixtures/cenarios-tcc.ts)).

**Resultados esperados.** As médias são, respectivamente, 80%, 40% e 60%. Em todos os módulos o primeiro e o último valor são iguais, logo a tendência é `ESTAVEL`. Dentro de cada módulo, Feynman/texto e Pomodoro/vídeo têm a mesma média do módulo, pois a troca de contexto não altera os percentuais.

A relação percepção × evidência é:

- módulo 0: percepção normalizada em 50% e desempenho de 80%, resultando em `POSSIVEL_SUBESTIMACAO`;
- módulos 1 e 2: percepção e desempenho abaixo de 70%, resultando em `PONTO_DE_ATENCAO`.

O script tenta consultar cada módulo com `outro-usuario` e exige retorno nulo, comprovando isolamento por conta para essa operação ([`scripts/avaliar-tcc.ts`, linha 72](../../scripts/avaliar-tcc.ts)).

**Leitura correta.** O cenário permite afirmar que o resultado observado varia conforme o módulo. Não permite atribuir a diferença a dificuldade, conteúdo ou método, porque esses fatores não são controlados nem descritos suficientemente.

### 3.3 S3 — Evolução

**Objetivo.** Verificar ordenação cronológica e classificação de crescimento, queda e estabilidade.

**Perfil sintético.** Carla Rocha (`carla.rocha`). Cada módulo reproduz uma trajetória temporal diferente, com percepção neutra constante.

**Estrutura e resultados.** Os percentuais são calculados pela posição da sessão ([`testes/fixtures/cenarios-tcc.ts`, linha 14](../../testes/fixtures/cenarios-tcc.ts)):

| Módulo | Série de desempenho | Média | Variação último − primeiro | Tendência |
|---|---|---:|---:|---|
| 0 | 10, 20, 30, …, 100 | `(10 + 100) × 10 ÷ 2 ÷ 10 = 55%` | `100 − 10 = +90` | `EVOLUCAO_POSITIVA` |
| 1 | 100, 90, 80, …, 10 | `55%` | `10 − 100 = −90` | `PONTO_DE_ATENCAO` |
| 2 | dez valores de 50 | `50%` | `50 − 50 = 0` | `ESTAVEL` |

As associações por contexto também refletem a ordem temporal:

- módulo 0: Feynman/texto = média 30%; Pomodoro/vídeo = média 80%;
- módulo 1: Feynman/texto = média 80%; Pomodoro/vídeo = média 30%;
- módulo 2: todos os contextos = 50%.

Na evolução semanal, o módulo 0 passa de média 35% na primeira semana `(10+20+30+40+50+60) ÷ 6` para 85% na segunda `(70+80+90+100) ÷ 4`. O módulo 1 passa de 75% para 25%; o módulo 2 permanece em 50%.

**Leitura correta.** A plataforma pode descrever a direção temporal. Não pode afirmar que a mudança de Feynman/texto para Pomodoro/vídeo causou a evolução ou a queda, pois o contexto está confundido com o tempo.

### 3.4 S4 — Dados insuficientes

**Objetivo.** Verificar o comportamento com `n = 0`, `n = 1` e `n = 2` evidências do conceito-alvo, todos abaixo do mínimo de três para tendência e comparação.

**Perfil sintético.** Diego Alves (`diego.alves`). O usuário registra dez sessões por módulo, mas as evidências do conceito-alvo são deliberadamente escassas. Isso representa falta de evidência específica, não ausência de estudo.

**Estrutura.** S4 é o único cenário sem materiais de referência. Todas as sessões continuam vinculadas a “Conceito”, com compreensão e dificuldade 3/5. As dez evidências valem 50%, mas sua associação conceitual é distribuída pela condição `numeroSessao >= numeroModulo` ([`scripts/avaliar-tcc.ts`, linhas 31–33 e 48–53](../../scripts/avaliar-tcc.ts)):

| Módulo | Evidências em “Conceito” | Evidências em “Controle” | Média do conceito-alvo | Tendência do conceito-alvo |
|---|---:|---:|---:|---|
| 0 | 0 | 10 | nula | `DADOS_INSUFICIENTES` |
| 1 | 1 | 9 | 50% | `DADOS_INSUFICIENTES` |
| 2 | 2 | 8 | 50% | `DADOS_INSUFICIENTES` |

O script afirma essas quantidades e exige que todas as recomendações tenham `materialId = null` ([`scripts/avaliar-tcc.ts`, linhas 56–66](../../scripts/avaliar-tcc.ts)). O recomendador classifica amostras com menos de três evidências como `LIMITADA` e, sem material elegível, usa a regra `RM-02` ([`src/dominio/analises/recomendacoes-materiais.ts`, linhas 23–48](../../src/dominio/analises/recomendacoes-materiais.ts)).

Como cada evidência também tem vínculo explícito com sua sessão, as associações globais de método/formato ainda podem reunir cinco evidências de 50% em cada metade. Isso não altera a insuficiência do conceito-alvo. A distinção entre associação da sessão e classificação por conceito precisa ser preservada na leitura.

**Leitura correta.** Há sessões suficientes para descrever frequência e percepções, mas não há evidência suficiente para estabelecer tendência do conceito-alvo. Não é correto concluir desconhecimento, domínio ou preferência de aprendizagem.

### 3.5 S5 — Percepção × evidência

**Objetivo.** Verificar a comparação entre compreensão percebida, dificuldade percebida e desempenho objetivo, sem transformar divergências em diagnóstico ou classificação fixa.

**Perfil sintético.** Elisa Martins (`elisa.martins`). Os três módulos representam percepção alta com desempenho baixo, percepção baixa com desempenho alto e sinais intermediários alinhados em nível de atenção.

**Estrutura.** Os percentuais e percepções são constantes dentro de cada módulo:

| Módulo | Compreensão | Dificuldade | Desempenho | Relação esperada |
|---|---:|---:|---:|---|
| 0 | 5/5 | 1/5 | 20% | `POSSIVEL_SUPERESTIMACAO` |
| 1 | 1/5 | 5/5 | 90% | `POSSIVEL_SUBESTIMACAO` |
| 2 | 3/5 | 3/5 | 50% | `PONTO_DE_ATENCAO` |

Os valores de percepção vêm do script; os desempenhos `[20, 90, 50]` vêm de `percentualCenario` ([`scripts/avaliar-tcc.ts`, linhas 37–43](../../scripts/avaliar-tcc.ts); [`testes/fixtures/cenarios-tcc.ts`, linha 16](../../testes/fixtures/cenarios-tcc.ts)). Como os percentuais não variam no tempo, as três tendências são `ESTAVEL`.

A escala de 1 a 5 é normalizada por `((valor − 1) ÷ 4) × 100`. O índice de compreensão usa a média entre compreensão normalizada, inverso da dificuldade normalizada e desempenho ([`src/dominio/analises/aprendizagem-modulo.ts`, linhas 228–280](../../src/dominio/analises/aprendizagem-modulo.ts)):

- módulo 0: `(100 + 100 + 20) ÷ 3 = 73,333…`;
- módulo 1: `(0 + 0 + 90) ÷ 3 = 30`;
- módulo 2: `(50 + 50 + 50) ÷ 3 = 50`.

O índice de dificuldade, citado no protocolo, é:

- módulo 0: `(0 + 0 + 80) ÷ 3 = 26,666…`;
- módulo 1: `(100 + 100 + 10) ÷ 3 = 70`;
- módulo 2: `(50 + 50 + 50) ÷ 3 = 50`.

O script afirma os três estados percepção × evidência e os três índices de compreensão ([`scripts/avaliar-tcc.ts`, linhas 67–70](../../scripts/avaliar-tcc.ts)). Os índices de dificuldade estão documentados no protocolo, mas não são afirmados diretamente no script de avaliação.

**Leitura correta.** A divergência é um convite à reflexão e a novas evidências. Ela não comprova que o usuário “se avalia mal”, possui capacidade fixa ou tem um estilo de aprendizagem.

## 4. Resultados esperados e respectivos cálculos

### 4.1 Gabarito principal dos 15 módulos

| Cenário | Módulo 0 | Módulo 1 | Módulo 2 | Evidências do conceito-alvo |
|---|---|---|---|---|
| S1 | 60%; atenção | 60%; atenção | 60%; atenção | 10 / 10 / 10 |
| S2 | 80%; estável | 40%; estável | 60%; estável | 10 / 10 / 10 |
| S3 | 55%; evolução positiva | 55%; atenção | 50%; estável | 10 / 10 / 10 |
| S4 | sem média; insuficiente | 50%; insuficiente | 50%; insuficiente | 0 / 1 / 2 |
| S5 | 20%; estável | 90%; estável | 50%; estável | 10 / 10 / 10 |

O script obtém a análise de cada módulo e compara `desempenhoMedio`, `tendencia` e quantidade de evidências com esse gabarito ([`scripts/avaliar-tcc.ts`, linhas 56–73](../../scripts/avaliar-tcc.ts)).

### 4.2 O que deve aparecer nos dashboards

Os indicadores de sessão comuns devem refletir 10 sessões, 300 minutos, média de 30 minutos, 10 dias estudados e dez percepções por módulo. Os comparativos de métodos e formatos devem apresentar cinco sessões por contexto. Os resultados objetivos por método/formato variam conforme as tabelas dos cenários anteriores.

O dashboard não cria uma métrica nova para o cenário; ele consome os resultados das funções de sessão e aprendizagem. Portanto, “deverá apresentar” significa que os dados calculados ficam disponíveis aos componentes atuais. O script `avaliar-tcc.ts` não renderiza páginas nem faz asserções visuais sobre os dashboards.

A amostra mínima tem dois usos distintos:

- duas percepções para publicar médias de compreensão/dificuldade nas métricas de sessões;
- três evidências para tendência, comparação percepção × evidência e suficiência das associações objetivas.

### 4.3 Separação por usuário e módulo

Cada módulo é criado com `usuarioId` do usuário do cenário, e cada evidência com `moduloId` do módulo corrente. O conceito ligado à evidência também é criado dentro desse módulo. A busca de aprendizagem exige simultaneamente `moduloId` e `usuarioId`, retornando nulo para outra conta ([`src/servidor/aprendizagem-modulo.ts`, linhas 115–131](../../src/servidor/aprendizagem-modulo.ts)).

O script confirma automaticamente que `outro-usuario` não obtém a análise dos 15 módulos. Ele também testa, na etapa de atualização, que outra conta não consegue registrar evidência no material ([`scripts/avaliar-tcc.ts`, linhas 72 e 97–101](../../scripts/avaliar-tcc.ts)).

## 5. Etapas de atualização dos dados

Os cinco cenários não recebem atualizações individuais durante sua avaliação principal. Depois que os 15 módulos são criados e conferidos, o script executa controles transversais em um único módulo 0 — pela ordenação atual, o primeiro entre os títulos encontrados — para verificar regras adicionais ([`scripts/avaliar-tcc.ts`, linhas 90–110](../../scripts/avaliar-tcc.ts)).

### 5.1 Sessões adicionais inválidas

São adicionadas duas sessões físicas:

1. uma sessão concluída de quatro minutos;
2. uma sessão planejada de 30 minutos, sem encerramento.

Ambas são excluídas das métricas. O total físico passa de 150 para 152 sessões, mas a base válida do módulo permanece com 10. Essa etapa testa os filtros de validade, não altera o gabarito dos cinco cenários.

### 5.2 Recorte temporal

O script consulta apenas o dia 2 de setembro e exige uma evidência válida. Isso verifica o filtro de período sem alterar dados.

### 5.3 Evidência extraída de material

Depois é criado um material de avaliação com data de 20 de setembro. O fluxo é:

1. outra conta tenta registrar “Resultado: 70%” e recebe `null`;
2. o proprietário registra o mesmo resultado duas vezes;
3. o `upsert` mantém uma única evidência física para o material;
4. a quantidade válida do módulo passa de 10 para 11;
5. a média do conceito passa de 60% para `670 ÷ 11 ≈ 60,91%` no módulo selecionado;
6. ao desativar o material, a evidência deixa a consulta e a base volta a 10;
7. ao reativar e registrar texto sem percentual, a evidência é atualizada com desempenho nulo e continua fora das métricas válidas.

O total físico final é 152 sessões e 151 evidências, mas continuam válidas 150 sessões e 150 evidências no conjunto. O arquivo já gerado `RESULTADOS_AVALIACAO_TCC.json` registra essas contagens. Entretanto, o script afirma com `assert.deepEqual` somente a contagem inicial 5/15/150/150; `contagensFinais` é calculado e gravado, sem uma asserção equivalente ([`scripts/avaliar-tcc.ts`, linhas 90–114](../../scripts/avaliar-tcc.ts)).

## 6. Relação dos cenários com a avaliação da IA

### 6.1 Informações enviadas

Para a avaliação da IA, o script calcula métricas e cria o DTO apenas quando `numeroModulo === 0`. O contexto contém:

- 10 sessões válidas, 300 minutos, período e evolução semanal;
- médias percebidas e frequência;
- métodos e formatos com amostra, duração e compreensão;
- as dez descrições “Estudo do Conceito”, delimitadas como texto não confiável;
- base, conceitos, evidências, tendências e relação percepção × evidência;
- associações de métodos e formatos com resultados posteriores;
- padrões objetivos, eventos recentes e evolução semanal percepção × evidência;
- recomendações determinísticas e limitações.

A composição está em `criarDtoInterpretacaoModulo` e `mapearAprendizagemModulo` ([`src/servidor/ia/interpretacoes.ts`, linhas 68–143](../../src/servidor/ia/interpretacoes.ts)).

### 6.2 Possibilidades e limites por cenário

| Cenário enviado à IA | Padrão disponível no módulo 0 | Interpretação compatível | Afirmação sem fundamento |
|---|---|---|---|
| S1 | 80% em Feynman/texto e 40% em Pomodoro/vídeo; média 60%; queda temporal | Existe uma associação diferente entre os dois contextos nesta amostra; vale comparar em condições semelhantes | “Feynman é o melhor método” ou “texto causou o resultado” |
| S2 | dez evidências estáveis de 80%, percepção 3/5 | O desempenho observado ficou alto e estável, enquanto a percepção permaneceu intermediária | Generalizar os módulos 1 e 2, que não são enviados nessa avaliação da IA |
| S3 | série crescente de 10% a 100%, média 55% | O desempenho aumentou no período, mas a média geral e o contexto exigem cautela | Atribuir a melhora à troca para Pomodoro/vídeo |
| S4 | dez sessões do conceito-alvo, nenhuma evidência desse conceito e dez evidências do controle; sem material | Há registros de estudo, mas faltam evidências objetivas do conceito-alvo | Dizer que não houve estudo, que há domínio ou que o usuário é incapaz |
| S5 | compreensão 5/5, dificuldade 1/5 e desempenho 20% | Há possível divergência entre percepção e evidência, a investigar com nova atividade | Diagnosticar excesso de confiança ou classificar capacidade/perfil |

No S3, o DTO mantém a tendência `EVOLUCAO_POSITIVA` do conceito. Contudo, a lista `padroesObjetivos` prioriza o estado `PONTO_DE_ATENCAO` antes de verificar a evolução positiva, porque a compreensão normalizada e a média de 55% ficam abaixo de 70% ([`src/dominio/analises/aprendizagem-modulo.ts`, linhas 335–339](../../src/dominio/analises/aprendizagem-modulo.ts)). A IA ainda recebe ambos os campos, mas essa precedência deve ser conhecida na avaliação.

### 6.3 Contribuição aos cinco critérios metodológicos

| Cenário | Métricas corretas | Coerência contextual | Ausência de invenção | Sem classificação fixa | Reflexão/recomendação compatível |
|---|---|---|---|---|---|
| S1 | Confere 80/40 e média 60 | Exige distinguir associação e causalidade | Impede criar fatores não registrados | Não deve inferir preferência por método | Pode propor comparação controlada |
| S2 | Confere 80 no módulo enviado | Exige manter o escopo do módulo 0 | Não pode citar os resultados 40/60 ausentes do DTO | Não deve definir capacidade global | Pode sugerir observar se o padrão se repete |
| S3 | Confere série, média e direção | Exige considerar a ordem temporal | Não pode inventar causa para a evolução | Não deve rotular o usuário pela trajetória | Pode propor nova observação em contexto semelhante |
| S4 | Confere `n = 0` no conceito-alvo | Exige separar sessão de evidência | Não pode preencher lacunas com desempenho fictício | Não deve concluir incapacidade ou domínio | Deve recomendar coleta de nova evidência |
| S5 | Confere percepção 5/1 e desempenho 20 | Exige comparar escalas distintas com cautela | Não pode inventar diagnóstico | É o teste mais direto contra classificação fixa | Pode propor recuperação/aplicação antes da consulta |

No modo padrão, a resposta é uma fixture genérica e igual em estrutura nas três execuções. C1–C5 e `satisfatoria` são gravados como `null`. Assim, a contribuição acima descreve o que cada cenário permite avaliar manualmente, não um resultado já obtido ([`scripts/avaliar-tcc.ts`, linhas 81–85](../../scripts/avaliar-tcc.ts)).

## 7. Tabela resumida para inclusão no TCC

| Cenário | Perfil fictício | Comportamento simulado | Objetivo da avaliação | Resultado esperado |
|---|---|---|---|---|
| S1 — Formato e método | Estudante com percepção intermediária e dois contextos de estudo em sequência | Primeiras cinco atividades com 80% em Feynman/texto e últimas cinco com 40% em Pomodoro/vídeo | Verificar associações entre contexto e resultado sem concluir causalidade ou superioridade | Média de 60%, tendência de atenção e associações de 80% e 40% com cinco evidências cada |
| S2 — Contexto de módulo | Estudante com comportamento estável, mas desempenho diferente entre módulos | Dez resultados constantes de 80%, 40% e 60%, conforme o módulo | Verificar isolamento dos cálculos por usuário e módulo | Médias de 80%, 40% e 60%, todas estáveis e sem mistura entre módulos |
| S3 — Evolução | Estudante com trajetórias crescente, decrescente e estável | Séries 10→100, 100→10 e dez resultados de 50% | Verificar ordenação temporal e classificação da tendência | Médias 55%, 55% e 50%, com evolução positiva, atenção e estabilidade |
| S4 — Dados insuficientes | Estudante com sessões registradas, mas pouca evidência do conceito-alvo | Zero, uma e duas evidências do conceito, embora existam dez sessões por módulo | Verificar limites mínimos de amostra e comunicação da incerteza | Média ausente/50%/50%, tendência insuficiente nos três módulos e nenhuma indicação de material disponível |
| S5 — Percepção × evidência | Estudante com diferentes graus de alinhamento entre autorrelato e desempenho | Percepções 5/1, 1/5 e 3/3 combinadas a desempenhos de 20%, 90% e 50% | Verificar comparação cautelosa entre percepção e evidência | Possível superestimação, possível subestimação e ponto de atenção, sem diagnóstico ou perfil fixo |

## 8. Divergências entre o planejamento e a implementação

1. **A avaliação da IA não usa os 15 módulos.** Ela usa apenas o módulo 0 de cada cenário, repetido três vezes. Com isso, S2 não testa na IA os patamares 40% e 60%; S3 não testa queda e estabilidade; S4 não testa `n = 1` e `n = 2`; S5 não testa subestimação e o caso intermediário.
2. **A execução padrão da IA é simulada.** As 15 respostas não medem variabilidade nem qualidade de provedor real, e a rubrica permanece nula.
3. **As contagens mudam após os controles.** A base planejada e assertada tem 150 sessões e 150 evidências; o estado físico final do banco temporário tem 152 e 151. A redação deve distinguir “conjunto-base” de “controles adicionais”.
4. **A contagem final não é afirmada automaticamente.** Ela é calculada e escrita no JSON, mas não existe `assert.deepEqual` de 152/151.
5. **Nem todo resultado derivável é assertado.** O script confere média, tendência e `n` do conceito-alvo nos 15 módulos, além de verificações específicas. Valores de dashboard, formatos, índices de dificuldade e todas as associações não recebem asserção individual no mesmo script.
6. **S4 contém evidências de controle explicitamente ligadas às sessões do conceito-alvo.** Isso é intencional para testar separação conceitual, mas produz associações por sessão mesmo quando o conceito-alvo tem amostra insuficiente.
7. **O padrão objetivo de S3 módulo 0 enfatiza atenção.** A tendência positiva permanece no conceito, mas a lista resumida de padrões prioriza o ponto de atenção por ordem das regras.
8. **Os cenários agora pertencem também ao seed demonstrativo.** A mesma função compartilhada popula Ana, Bruno, Carla, Diego e Elisa no seed, no comando aditivo do banco local e no banco temporário de `avaliar-tcc.ts`. O protocolo isolado continua sem reutilizar o banco configurado em `.env`.
9. **Permissões de sala não fazem parte dos cinco cenários.** Elas são cobertas por verificações separadas.

### 8.1 Verificação das salas e do compartilhamento

Há cobertura específica, separada dos cinco cenários:

- o proprietário é exigido para obter os dashboards da sala, e vínculos precisam estar ativos e compartilháveis ([`src/servidor/paineis-salas.ts`, linhas 37–58](../../src/servidor/paineis-salas.ts));
- o agregado geral exige no mínimo três contribuidores ativos ([`src/servidor/paineis-salas.ts`, linhas 9–20](../../src/servidor/paineis-salas.ts));
- o script `verificar-dashboards-salas.ts` testa acesso exclusivo do proprietário, corte por `dadosDesde`, mínimo de grupo, exclusão de descrições/materiais privados, consentimento para IA, bloqueio sem consentimento, histórico pseudonimizado e reativação sem duplicidade ([`scripts/verificar-dashboards-salas.ts`, linhas 28–94](../../scripts/verificar-dashboards-salas.ts));
- testes unitários verificam a projeção sem dados privados e a agregação sem duplicar sessão ([`src/servidor/aprendizagem-sala.test.ts`, linhas 6–29](../../src/servidor/aprendizagem-sala.test.ts); [`src/dominio/analises/dashboard-sala.test.ts`, linhas 38–58](../../src/dominio/analises/dashboard-sala.test.ts)).

Nesta tarefa, os scripts de integração de sala não foram executados porque escrevem no banco. Sua existência e suas asserções foram confirmadas por inspeção do código.

## 9. Pontos que ainda precisam ser definidos ou executados

1. Executar, com autorização e ambiente controlado, as 15 chamadas reais previstas para a IA; nenhuma chamada externa foi feita nesta análise.
2. Registrar manualmente C1–C5 e a decisão final de cada resposta real, preservando cenário, execução, DTO, prompt, provedor, modelo, resposta e avaliador.
3. Decidir se a metodologia da IA pretende avaliar somente os cinco módulos 0, como o código atual, ou cobrir também as variações dos módulos 1 e 2. Esta tarefa não altera essa decisão.
4. Definir explicitamente no texto se “150 sessões e 150 evidências” designa a carga-base anterior aos controles; essa é a interpretação compatível com o script.
5. Se os totais físicos finais forem requisito formal, adicionar futuramente uma asserção própria para 152 sessões e 151 evidências. Isso não foi implementado aqui.
6. Os nomes Ana, Bruno, Carla, Diego e Elisa identificam contas fictícias; não há persona biográfica além do padrão analítico. Qualquer característica adicional precisaria ser definida pela metodologia e não pode ser inferida do código.
7. A prova visual dos dashboards para estes cinco usuários não é produzida por `avaliar-tcc.ts`; ela exigiria um procedimento separado se for necessária como evidência do TCC.
8. Os resultados reais de permissões de sala devem ser citados somente após a execução registrada dos scripts correspondentes; nesta análise foi verificada apenas a cobertura existente.

## Registro da verificação desta análise

Além dos testes puros anteriormente registrados, em 12 de outubro de 2026 foram executadas as verificações abaixo, sem chamada externa de IA:

```powershell
npm.cmd exec -- vitest run src/dominio/analises/aprendizagem-modulo.test.ts src/dominio/analises/metricas-sessoes.test.ts src/dominio/analises/dashboard-sala.test.ts src/servidor/aprendizagem-modulo.test.ts src/servidor/aprendizagem-sala.test.ts --no-cache
```

```powershell
npm run verificar-tipos
npm run testar:tcc
npm run banco:aplicar-cenarios-tcc
npm run banco:verificar-cenarios-tcc
npm run testar:metricas-sessoes
npm run testar:metricas
npm run verificar-estilo
npm run testar
```

Resultados: tipagem e estilo aprovados; 45 arquivos e 166 testes aprovados; protocolo isolado aprovado com 5 usuários, 15 módulos, 150 sessões, 150 evidências e 15 respostas simuladas; seed completo aprovado em SQLite temporário; banco local aprovado com os mesmos 15 módulos, 150 sessões e 150 evidências vinculados às contas nomeadas; métricas e Dashboard observacional aprovados. Nenhuma API externa de IA foi chamada.
