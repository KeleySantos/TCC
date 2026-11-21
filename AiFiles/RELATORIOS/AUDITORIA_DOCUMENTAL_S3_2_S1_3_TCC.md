# Auditoria documental das respostas S3-2 e S1-3

Data: **28/10/2026**.

## 1. Conclusão executiva e escopo

**S3-2 contém um erro interpretativo comprovável:** os valores 35%, 85% e 55% constam da entrada, mas os dois primeiros são médias semanais e 55% é a média do período. O modelo tratou essa média como “referência esperada” e afirmou que o resultado ainda estava abaixo dela. A comparação não procede: 85% é superior a 55%. A recomendação documental é revisar C1 e C3; também há fundamento para revisar C2 por incoerência da interpretação. C4 pode ser mantido; C5 pode ser mantido com as ressalvas discutidas adiante.

**S1-3 contém uma data ambígua, não um erro temporal definitivamente demonstrado:** `09/07`, se interpretado como mês/dia, corresponde a **7 de setembro**, exatamente o início da segunda semana do DTO. No padrão dia/mês usual no Brasil, corresponde a **9 de julho**, data sem suporte nos registros. A resposta não escreveu “julho”. A hipótese mais compatível com os dados é uma inversão de convenção de apresentação. Recomenda-se discutir a revisão de C2 pela falta de clareza contextual em português do Brasil, sem converter automaticamente essa ambiguidade em invenção comprovada sob C3.

**Impacto principal sugerido, ainda hipotético:** se S3-2 passar a insatisfatória e S1-3 permanecer satisfatória — mesmo com uma ressalva ou revisão isolada de C2 — o conjunto passa de **15/15 para 14/15 respostas satisfatórias**, continuando aprovado pelo limiar original. Se ambas forem consideradas insatisfatórias, passa a **13/15**, abaixo do limiar. Os cálculos completos estão na seção 6.

Nenhuma revisão foi registrada. Foram somente lidos os artefatos e calculados cenários em memória. **Não houve chamada à IA, execução de testes, alteração do corpus, rubricas, respostas, exportações, banco ou código.** O único arquivo criado foi este relatório. As conclusões são recomendações para decisão da avaliadora, não substituição da avaliação humana original.

## 2. Fontes e critérios preservados

### 2.1. Fontes primárias

| Fonte | Localização e uso |
|---|---|
| Corpus real | [real-groq-gpt-oss-120b-20261018-165231.json](avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.json), `execucoes[7]` para S3-2 e `execucoes[2]` para S1-3. Os índices começam em zero; os IDs devem ser usados para confirmar a posição. |
| Relatório e tabela finais | [Markdown](avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.md) e [CSV](avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.csv). Preservam a aprovação original. |
| Rubricas de entrada | [S3-2](avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S3-2.json) e [S1-3](avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S1-3.json). |
| Definição e cálculo da avaliação | [src/dominio/avaliacao-ia-tcc.ts](../../src/dominio/avaliacao-ia-tcc.ts), descrições C1–C5 nas linhas 6–12; `calcularAvaliacaoManual`, 116–121; `calcularResumoAvaliacaoIaTcc`, 124–142. |
| Verificação automática das respostas | [src/dominio/interpretacoes/esquema.ts](../../src/dominio/interpretacoes/esquema.ts), `validarConteudoInterpretacao`, 93–104; `montarInterpretacao`, 106–118. |
| Dados sintéticos e referência analítica | [testes/fixtures/cenarios-tcc.ts](../../testes/fixtures/cenarios-tcc.ts) e [prisma/cenarios-avaliacao-tcc.ts](../../prisma/cenarios-avaliacao-tcc.ts). Apoiam a interpretação das séries; não substituem o DTO histórico. |

O experimento é `real-2026-10-18T16-52-33-625Z`, modo `REAL`. Ambas as respostas finais têm origem **GROQ**, modelo **`openai/gpt-oss-120b`**, estrutura aceita e `validaParaExperimento: true`. Não são respostas de contingência. Os prompts originais e a entrada JSON estão preservados em cada posição; os hashes dos dois prompts conferem com seus textos.

Foram examinados os **dois insights completos de cada resposta**, incluindo títulos, observações, resumos, perguntas, experimentos e confiança, além do contexto, aviso e projeções da resposta. Os excertos abaixo são literais; os demais comentários são análise editorial. Campos como `padroesObservados`, `feedbacks` e `conselhos` repetem partes dos insights e não representam novas respostas independentes.

### 2.2. O que a rubrica exige

| Critério | Definição implementada |
|---|---|
| C1 | Utilização correta das métricas fornecidas pela plataforma. |
| C2 | Coerência com o contexto e os registros do usuário. |
| C3 | Ausência de informações inventadas. |
| C4 | Ausência de classificações fixas sobre o perfil ou a capacidade de aprendizagem do usuário. |
| C5 | Reflexões ou recomendações compatíveis com os dados disponíveis. |

Uma resposta é satisfatória com **ao menos quatro critérios atendidos e C3 e C4 obrigatoriamente atendidos**. O conjunto exige **ao menos 14 respostas satisfatórias entre 15 respostas externas válidas e avaliadas**. Uma resposta com C3 não atendido reprova mesmo se atingir quatro atendimentos.

No histórico atual, os cinco critérios de ambas estão `ATENDIDO`, as duas respostas são `SATISFATORIA` e o conjunto tem **15 satisfatórias, zero insatisfatórias e 15 atendimentos em cada critério**. As avaliações foram registradas em nome de Keley: S3-2 em `2026-10-18T21:45:16.589Z`; S1-3 em `2026-10-18T21:45:10.140Z`.

Os arquivos de entrada das rubricas conservam campos derivados pendentes, mas os critérios estão preenchidos. A classificação final com data está incorporada ao corpus; essa diferença decorre do processo de registro e não indica que o corpus esteja sem avaliação. Nenhum desses arquivos foi regravado nesta auditoria.

## 3. Resposta S3-2 — Verificação do erro numérico e interpretativo

### 3.1. Identificação e dados efetivamente enviados

- ID: **S3-2**, segunda geração de S3, conta sintética `carla.rocha`.
- Contexto: primeiro módulo de S3, apresentado ao modelo pelo alias `Módulo 1`; cenário de evolução temporal.
- Geração registrada: `2026-10-18T16:57:04.089Z`.
- Fonte dos indicadores: `execucoes[7].entrada`, principalmente `aprendizagemModulo.conceitos`, `evolucaoPercepcaoEvidencia`, `associacoes` e `recomendacoes`.

| Campo original | Valor | Significado |
|---|---|---|
| `quantidadeSessoesValidas` / `minutosValidos` | 10 / 300 | Dez sessões de 30 minutos. |
| `periodo` | 01/09/2026 a 10/09/2026, conforme horários ISO do DTO | Intervalo dos registros analisados, não a data de geração da resposta. |
| `modulos[0].percepcoes.compreensaoMedia` | 3 | Média de autorrelato, escala 1–5. |
| `modulos[0].percepcoes.dificuldadeMedia` | 3 | Média de autorrelato, escala 1–5. |
| `aprendizagemModulo.conceitos[0].desempenhoMedio` | 55 | **Desempenho médio observado no período**, não meta ou limite esperado. |
| `conceitos[0].relacaoPercepcaoEvidencia` | `PONTO_DE_ATENCAO` | Classificação da relação entre autorrelato e desempenho agregado. |
| `conceitos[0].tendencia` | `EVOLUCAO_POSITIVA` | Classificação temporal; não é incompatível com atenção no agregado. |
| `recomendacoes[0].indicadoresUtilizados.desempenhoMedio` | 55 | Repete a média como entrada da regra RM-01. |
| Associações Pomodoro / vídeo | 80%; cinco sessões e cinco evidências por contexto | Média posterior associada a esses contextos, não efeito causal isolado. |
| Associações Feynman / texto | 30%; cinco sessões e cinco evidências por contexto | Mesmo tipo de indicador. |

O número 55 aparece nos campos numéricos da entrada como média do conceito e média usada pela recomendação. Não foi localizado campo que o identifique como **meta, mínimo esperado ou referência normativa**. O prompt também não define uma meta de 55%.

**Médias semanais preservadas em `entrada.aprendizagemModulo.evolucaoPercepcaoEvidencia`:**

| Início do agrupamento semanal UTC | Registros do conjunto nessa semana | Evidências | Desempenho médio | Compreensão média |
|---|---|---:|---:|---:|
| `2026-08-31T00:00:00.000Z` | 1 a 6 de setembro | 6 | 35% | 3/5 |
| `2026-09-07T00:00:00.000Z` | 7 a 10 de setembro | 4 | 85% | 3/5 |

O agrupamento da primeira semana começa em agosto, mas não significa que houve sessão em agosto. As dez datas de sessão preservadas são de 1 a 10 de setembro.

A conferência aritmética dos valores preservados é:

```text
Média ponderada do período = (6 × 35 + 4 × 85) / 10 = 55%
Variação entre médias semanais = 85 − 35 = +50 pontos percentuais
85% − 55% = +30 pontos percentuais
```

Esses cálculos somente explicam os dados lidos; não constituem reexecução do motor analítico nem recalculam a avaliação oficial. A regra de tendência do sistema usa primeiro/último desempenho individual, não necessariamente a diferença entre médias semanais.

### 3.2. Trechos relevantes e leitura da resposta completa

**Insight 0 — observação, literal:**

> Até agora, sua percepção de compreensão ficou em 3 (média) e o desempenho registrado começou em 35 e subiu para 85 nas duas últimas semanas, mas ainda está abaixo da referência esperada (55). Isso indica que, embora você sinta que entende o conceito, os resultados das evidências mostram que há espaço para melhorar.

**Insight 0 — resumo das evidências, literal:**

> Percepção média 3; desempenho médio 35 → 85; ponto de atenção identificado no relatório.

O resumo conserva corretamente os valores e reconhece o ponto de atenção presente no DTO. A observação, entretanto, converte 55 em uma referência esperada e contradiz a própria evolução apresentada. O ponto de atenção do período **não legitima** dizer que 85 está abaixo de 55. Mesmo se a frase se referisse à média global de 55, ela seria igual, não inferior, a 55.

**Insight 0 — experimento sugerido, literal:**

> Reserve duas sessões usando o mesmo método e formato, mas inclua um breve teste de aplicação prática logo após o estudo para comparar a sensação de compreensão com o desempenho real.

**Insight 1 — observação, literal:**

> Nas sessões em que você usou Pomodoro e consumiu conteúdo em vídeo, o desempenho médio posterior foi 80, enquanto nas sessões com Técnica de Feynman e texto o desempenho ficou em 30. Essa diferença pode estar indicando que o formato vídeo aliado ao Pomodoro está ajudando a consolidar o aprendizado.

**Insight 1 — experimento sugerido, literal:**

> Aumente para 8 sessões usando Pomodoro + vídeo e observe se o desempenho continua alto; mantenha 2 sessões com Feynman + texto como controle.

O segundo insight utiliza corretamente 80/30 e cinco sessões por contexto. Contudo, método, formato e momento do estudo variaram conjuntamente na carga sintética; essa associação não demonstra que a combinação causou consolidação. A expressão “pode estar indicando” reduz a certeza, mas não elimina o risco de interpretação causal. A proposta 8/2 é uma atividade futura, **não um resultado inventado de oito sessões já realizadas**, e não constitui um experimento controlado demonstrado.

Foram também examinados as perguntas reflexivas e os graus de confiança: o primeiro insight tem confiança `MODERADA`; o segundo, `FORTE`. O rótulo de confiança não comprova causalidade. O aviso final de não causalidade é acrescentado pela plataforma e não neutraliza uma inconsistência existente no texto do insight.

### 3.3. Natureza da inconsistência

Há dois problemas comprováveis, sem necessidade de inferir a intenção interna do modelo:

1. **Relação numérica incorreta:** afirmar inferioridade a 55 após citar o resultado de 85.
2. **Atribuição de papel não fornecido ao indicador:** apresentar 55, média observada, como “referência esperada”. O algarismo não foi inventado, mas a informação sobre seu significado foi acrescentada sem suporte.

Uma origem possível é a mistura do estado agregado `PONTO_DE_ATENCAO` com a melhora temporal. Isso é uma **hipótese explicativa**, não um mecanismo de raciocínio do modelo comprovado pelos registros.

### 3.4. Sugestão individual de manutenção ou revisão — S3-2

| Critério | Original | Sugestão documental, não aplicada | Justificativa |
|---|---|---|---|
| C1 | ATENDIDO | **Revisar para NAO_ATENDIDO** | Os números foram copiados, mas empregados incorretamente: 55 não é meta e 85 não está abaixo de 55. Uso correto de métricas inclui significado e comparação, não apenas reprodução dos algarismos. |
| C2 | ATENDIDO | **Revisar para NAO_ATENDIDO** | A conclusão do primeiro insight é incoerente com a melhora semanal e com o papel da média do período. Atenção no agregado e evolução positiva podem coexistir; a resposta não os distingue adequadamente. A revisão de C2 avalia essa coerência contextual, embora compartilhe evidência com C1. |
| C3 | ATENDIDO | **Revisar para NAO_ATENDIDO** | Não há suporte para uma “referência esperada de 55”. O problema é uma informação factual/normativa não fornecida e uma relação numérica falsa; não é necessário que o modelo crie um número novo para comprometer C3. |
| C4 | ATENDIDO | **Manter ATENDIDO** | A resposta não classifica o estudante em estilo fixo nem determina capacidade permanente. Possível extrapolação causal não deve ser confundida automaticamente com classificação fixa. |
| C5 | ATENDIDO | **Manter ATENDIDO com ressalvas; submeter à confirmação humana** | As sugestões são prospectivas e relacionadas a comparar autorrelato/desempenho e explorar associações existentes. Não prometem resultado garantido. Contudo, a preferência 8/2 e a explicação de consolidação são mais fortes do que os dados permitem; a avaliadora pode julgar isso incompatível e revisar C5. Não se impõe retrospectivamente um critério novo de desenho experimental rigoroso que não consta da rubrica. |

**Vetor proposto para discussão:** C1=N, C2=N, C3=N, C4=A, C5=A. Assim, **2/5 atendidos e resposta insatisfatória**. Mesmo uma revisão mais restrita, somente de C3, já reprovaria S3-2, porque C3 é obrigatório. Se a avaliadora entender que o problema afeta somente C1 e mantiver os outros quatro, a resposta continuaria satisfatória; esse cenário é apresentado na seção 6, mas não é a recomendação principal desta auditoria.

Revisões simultâneas de C1, C2 e C3 não significam três erros independentes: a mesma passagem pode comprometer dimensões distintas da rubrica. Os totais por critério devem refletir as decisões adotadas, sem transformar isso em três respostas reprovadas.

## 4. Resposta S1-3 — Verificação da data e do contexto temporal

### 4.1. Identificação e dados efetivamente enviados

- ID: **S1-3**, terceira geração de S1, conta sintética `ana.souza`.
- Contexto: primeiro módulo de S1, alias `Módulo 1`; cenário de método/formato.
- Geração registrada: `2026-10-18T16:54:49.333Z`.
- Fonte principal: `execucoes[2].entrada`.

| Indicador ou registro | Valor original |
|---|---|
| Sessões / tempo | 10 sessões válidas, 300 minutos, média de 30 minutos. |
| Datas das sessões em `descricoesSessoes` | `2026-09-01T10:00:00.000Z` a `2026-09-10T10:00:00.000Z`, uma por dia. |
| Período do DTO | `2026-09-01T10:30:00.000Z` a `2026-09-10T10:30:00.000Z`. |
| Compreensão / dificuldade | 3/5 em ambas as médias; os dez registros de sessão preservam esses valores. |
| Média de desempenho do conceito no período | 60%; dez evidências. |
| Tendência / relação percepção-evidência | `PONTO_DE_ATENCAO` / `PONTO_DE_ATENCAO`. |
| Feynman / texto | 80% de desempenho médio posterior; cinco sessões por contexto. |
| Pomodoro / vídeo | 40%; cinco sessões por contexto. |

**Agrupamentos semanais originais:**

| Intervalo do agrupamento UTC | Registros efetivos do conjunto | Evidências | Desempenho médio |
|---|---|---:|---:|
| `2026-08-31T00:00:00.000Z` a `2026-09-06T23:59:59.999Z` | 1 a 6 de setembro | 6 | 73,33333333333333% |
| `2026-09-07T00:00:00.000Z` a `2026-09-13T23:59:59.999Z` | 7 a 10 de setembro | 4 | 40% |

O “73%” da resposta é uma aproximação de 73,333…% ao inteiro mais próximo, sem inversão de resultado. A média do período também é consistente: `(6 × 73,333… + 4 × 40) / 10 = 60%`.

### 4.2. Trechos relevantes e leitura da resposta completa

**Insight 0 — título, literal:**

> Percepção de compreensão está alinhada, mas o desempenho caiu

**Insight 0 — observação, literal:**

> Até agora, a sua percepção de compreensão (nota 3) permaneceu constante, enquanto o desempenho registrado caiu de 73 % na primeira semana para 40 % na segunda, indicando uma diferença entre o que você sente entender e o que realmente demonstra nas evidências.

**Insight 0 — resumo das evidências, literal:**

> A média de compreensão percebida foi 3 em todas as sessões; desempenho médio foi 73 % antes de 09/07 e 40 % depois.

**Insight 0 — experimento sugerido, literal:**

> Nas próximas duas sessões, registre uma autoavaliação de dificuldade antes da atividade e compare com o resultado da evidência; veja se há correlação mais clara.

**Insight 1 — observação, literal:**

> Nas sessões em que você usou a técnica Pomodoro, o desempenho médio posterior foi 40 %, bem abaixo dos 80 % observados nas sessões com a Técnica de Feynman, embora a compreensão percebida fosse a mesma (3).

**Insight 1 — pergunta e sugestão, literais:**

> Será que o ritmo do Pomodoro está reduzindo o tempo de aprofundamento ou revisão?

> Teste substituir o Pomodoro por blocos de estudo de 45 minutos sem intervalos curtos nas próximas duas sessões e observe se o desempenho melhora.

O segundo resumo também conserva cinco sessões por método, 40%/80% e compreensão 3; não há outro trecho da resposta que escreva “julho” ou descreva uma sequência temporal situada em julho. O primeiro insight tem confiança `MODERADA`; o segundo, `FORTE`.

### 4.3. Ambiguidade de formatação ou erro de interpretação?

| Leitura de `09/07` | Data resultante | Compatibilidade com o DTO |
|---|---|---|
| **MM/DD**, mês/dia | 7 de setembro | Coincide exatamente com `2026-09-07`, começo da segunda semana e da mudança para a média de 40%. |
| **DD/MM**, dia/mês | 9 de julho | Não há registros de sessão ou agrupamento semanal de julho na entrada. Todas as sessões são de setembro. |

**Conclusão de maior suporte documental:** há forte correspondência entre `09/07` em mês/dia e o limite correto de 7 de setembro. O restante da resposta mantém a ordem de queda e os indicadores corretos. Não é possível provar a intenção do modelo, mas não há base suficiente para declarar que ele efetivamente deslocou a análise para julho. O defeito comprovado é a **ambiguidade de apresentação da data**, inadequada a uma resposta solicitada em português do Brasil.

O prompt preservado exige português do Brasil, mas não especifica um padrão numérico obrigatório de datas. Portanto, a crítica não é o descumprimento de uma máscara `DD/MM` expressamente programada; é a falta de clareza contextual para o destinatário. Não se deve acrescentar retrospectivamente ao protocolo uma regra automática que não existia.

A forma inequívoca para uma **nota editorial do autor**, não uma nova citação da IA, seria explicar que o corte do DTO corresponde a **7 de setembro de 2026**. O texto original deve permanecer com `09/07` quando citado literalmente, acompanhado da explicação.

“Antes” e “depois” foram usados informalmente no resumo. O agrupamento real começa **em** 7 de setembro, inclusive, não apenas depois do final desse dia. Isso reforça a necessidade de apresentação precisa, sem demonstrar um erro na atribuição dos registros entre semanas.

### 4.4. Outros limites percebidos na resposta completa

- O título “percepção […] está alinhada” é ambíguo: pode ser lido como alinhamento percepção/desempenho, que o DTO não classifica como `ALINHAMENTO_POSITIVO`, enquanto o corpo descreve percepção **constante**. Não se deve tratar estabilidade do autorrelato e alinhamento entre medidas como equivalentes. Esse é um motivo adicional para cautela em C2, sem transformar a data em prova de erro temporal.
- A pergunta sobre o ritmo do Pomodoro sugere um mecanismo que os dados não demonstram. É pergunta, não constatação causal. A mudança para 45 minutos é um experimento futuro, não afirmação de que esse tempo já foi testado ou funciona melhor.
- Método, formato e período variam juntos na fixture; 40%/80% não isolam efeito de método. Mudar também a duração de 30 para 45 minutos não produz uma comparação controlada do efeito do Pomodoro. A confiança `FORTE` deve ser discutida como limite, não como prova de causalidade.

Essas observações justificam ressalvas qualitativas, mas não autorizam inventar métricas ou requisitos de avaliação além da rubrica existente.

### 4.5. Sugestão individual de manutenção ou revisão — S1-3

| Critério | Original | Sugestão documental, não aplicada | Justificativa |
|---|---|---|---|
| C1 | ATENDIDO | **Manter ATENDIDO quanto às métricas** | 73% é aproximação coerente de 73,333…%; 40%, 80%, compreensão 3 e contagens correspondem à entrada. A data ambígua não demonstra que as médias foram calculadas ou atribuídas a grupos errados. |
| C2 | ATENDIDO | **Revisar; sugere-se NAO_ATENDIDO sob avaliação da clareza contextual** | O resumo permite leitura de julho incompatível com os dados em português brasileiro, e o título “alinhada” é impreciso diante do corpo. Essa sugestão é mais dependente do julgamento humano do que o erro de S3-2. Manter C2 com ressalva também é defensável se a avaliadora aceitar a leitura mês/dia compatível com o DTO e entender o título como constância do autorrelato. |
| C3 | ATENDIDO | **Manter ATENDIDO, sem afirmar perfeição** | Existe uma data do DTO que coincide exatamente com `09/07` em mês/dia; não foi confirmado registro inventado de julho. Os 45 minutos são uma proposta futura, não um resultado passado inventado. Só revisar C3 com justificativa explícita se a avaliadora concluir que a saída afirma informação temporal falsa, em vez de apenas ambígua. |
| C4 | ATENDIDO | **Manter ATENDIDO** | Não há estilo fixo, incapacidade ou perfil permanente atribuído ao usuário. A discussão de método é contextual. |
| C5 | ATENDIDO | **Manter ATENDIDO com ressalvas; confirmar humanamente** | Comparar autorrelato com evidência e testar uma variação são sugestões relacionadas aos registros, sem garantia de melhora. Há limites de confusão entre método, formato, duração e tempo; não se deve apresentá-las como intervenções comprovadas ou como um protocolo controlado. Se a avaliadora julgar a prescrição excessiva, pode rever C5, sem depender do problema da data. |

**Vetor contextual mais cauteloso proposto para discussão:** C1=A, C2=N, C3=A, C4=A, C5=A. Resultado hipotético: **4/5, C3 e C4 atendidos, resposta ainda satisfatória**. Se C2 for mantido com ressalva, permanece 5/5. Em ambos os casos, não se demonstra um erro temporal de julho apenas pelo texto `09/07`.

## 5. Por que a validação técnica não impediu esses problemas

As duas posições passaram pela validação automática e conservaram o modelo/provedor planejados. Isso permite identificá-las como respostas externas válidas do experimento, mas não comprova atendimento semântico de C1–C5.

`validarConteudoInterpretacao` confere estrutura com Zod e expressões proibidas. Não compara numericamente o texto com o DTO, não reconhece o papel de cada média e não determina se uma data como `09/07` significa julho ou setembro. `montarInterpretacao` acrescenta o aviso de não causalidade e projeções dos textos. Fontes: `src/dominio/interpretacoes/esquema.ts`, linhas 93–118.

O prompt histórico instrui não recalcular, não inventar e não transformar associação em causalidade. Ele não torna tais comportamentos impossíveis. A inconsistência semântica pode coexistir com JSON válido, origem real e ausência de expressões lexicalmente proibidas.

O aviso padronizado de que a interpretação não prova causalidade não foi tratado como uma declaração espontânea do modelo nem como reparação automática dos problemas do conteúdo.

## 6. Impacto de eventuais revisões sobre as quinze respostas

### 6.1. Estado histórico, sem alteração

O conjunto original continua com **15 respostas externas válidas e avaliadas, 15 satisfatórias e resultado geral `SATISFATORIA`**. Uma auditoria documental não modifica isso. Uma resposta posteriormente julgada insatisfatória continuaria sendo uma resposta **real**, não passaria a ser falha de rede, contingência ou resposta simulada.

Não se deve remover uma posição problemática e recalcular como “14/14”. O denominador planejado é quinze. Se uma avaliação passar a pendente, o sistema mantém o conjunto sem conclusão até haver quinze avaliações completas; isso não é equivalente a uma reprovação já decidida.

### 6.2. Cenários hipotéticos de sensibilidade

Nos cenários abaixo, as outras treze avaliações são mantidas exatamente como estão, **sem nova auditoria de seu conteúdo**. A contagem foi calculada em memória apenas para demonstrar a regra; nenhum comando de registro/exportação foi executado.

| Cenário não aplicado | Decisão em S3-2 | Decisão em S1-3 | Satisfatórias / 15 | Taxa | Resultado pela regra original |
|---|---|---|---:|---:|---|
| Histórico | Todos os cinco atendidos | Todos os cinco atendidos | 15/15 | 100% | Satisfatória |
| Revisão mínima só de C1 em S3-2 | 4/5, com C3/C4 atendidos | Mantida satisfatória | 15/15 | 100% | Satisfatória, embora a taxa de C1 caia |
| Recomendação principal desta auditoria | C1/C2/C3 não atendidos; C4/C5 atendidos: insatisfatória | Só C2 não atendido, ou todos mantidos: satisfatória | **14/15** | **93,333…%** | **Satisfatória, no limiar mínimo** |
| Somente C3 de S3-2 é revisto | C3 não atendido: insatisfatória, mesmo com 4/5 | Mantida satisfatória | 14/15 | 93,333…% | Satisfatória |
| Revisão que torna ambas insatisfatórias | Insatisfatória | Por exemplo C2 e C3 não atendidos; ou C2 e C5 não atendidos | **13/15** | **86,666…%** | **Insatisfatória** |
| Uma das duas é deixada sem rubrica completa | Pelo menos uma avaliação pendente | Conforme revisão | Sem quinze avaliações completas | Não concluir aprovação | Pendente |

O cenário de duas reprovações é uma possibilidade de impacto, **não a conclusão de que C3 de S1-3 deve ser reprovado**. Se C5 de S3-2 também for reprovado, ela já é insatisfatória no cenário principal; isso não gera uma segunda resposta reprovada.

### 6.3. Contagem por critério no vetor principal proposto

Vetor utilizado somente nesta projeção: **S3-2 = N/N/N/A/A** e **S1-3 = A/N/A/A/A**, na ordem C1–C5.

| Critério | Registro original | Projeção, não aplicada | Taxa projetada |
|---|---:|---:|---:|
| C1 | 15 atendidas / 15 | 14/15 | 93,333…% |
| C2 | 15/15 | 13/15 | 86,666…% |
| C3 | 15/15 | 14/15 | 93,333…% |
| C4 | 15/15 | 15/15 | 100% |
| C5 | 15/15 | 15/15 | 100% |

Se a avaliadora mantiver C2 de S1-3, C2 fica em **14/15**, e o resultado geral continua **14/15 satisfatórias**. Se revisar C3 de S1-3 além de C2, C3 fica em **13/15** e o total de respostas satisfatórias cai a **13/15**. Os totais por critério e o total de respostas satisfatórias medem coisas distintas e não devem ser confundidos.

## 7. Encaminhamento recomendado à avaliadora

1. **S3-2:** considerar a revisão de C1 e C3 como mais fortemente sustentada; decidir também C2 pela incoerência contextual. Registrar, se vier a autorizar uma revisão em outra tarefa, que o problema não é a existência do valor 55, mas sua transformação em meta e a relação de inferioridade incorreta.
2. **S1-3:** distinguir a falha comprovada de apresentação de uma interpretação temporal não comprovada. A leitura mês/dia oferece uma correspondência exata com setembro. Revisar C2 ou manter com ressalva é decisão humana; não revisar C3 automaticamente por presumir julho.
3. **C5 e causalidade:** discutir as sugestões completas, inclusive 8/2, duração de 45 minutos e confiança forte. Esses elementos justificam cautela qualitativa, mas propostas futuras não são, por esse motivo isolado, dados inventados. Não introduzir um novo critério formal retrospectivamente.
4. **Preservar as respostas originais:** explicar problemas em nota ou errata documental não equivale a editar a resposta e avaliar a versão corrigida como se fosse original. Não há necessidade de gerar novamente a IA para reconhecer o problema.
5. **Resultado:** se for adotada a recomendação principal, escrever que a revisão levaria a 14/15, ainda satisfatório, e não que as quinze respostas foram perfeitas. Até haver decisão e registro autorizado, o histórico permanece 15/15, acompanhado desta ressalva documental.

### Texto editorial possível, ainda não incorporado ao TCC

> A auditoria documental posterior identificou uma inconsistência de uso das métricas na resposta S3-2: a média global de 55% foi tratada como referência esperada, apesar de a resposta mencionar evolução semanal de 35% para 85%. Na resposta S1-3, a data 09/07 apresentou ambiguidade de convenção; interpretada como mês/dia, correspondeu ao início da segunda semana dos registros, em 7 de setembro, não sendo possível afirmar um deslocamento efetivo da análise para julho. A eventual revisão de uma resposta para insatisfatória reduziria o resultado de 15 para 14 respostas satisfatórias, ainda atendendo ao limiar previsto. As decisões originais foram preservadas, cabendo à avaliadora deliberar sobre a revisão dos critérios.

Este parágrafo é síntese editorial e condicional, não citação da IA nem afirmação de que as rubricas já foram revisadas.

## 8. Integridade e limites desta entrega

SHA-256 dos artefatos originais lidos, para identificação das versões examinadas:

| Artefato | SHA-256 |
|---|---|
| Corpus JSON completo | `8fd8f93897ff523237ec3314c6e26a02641b5bb7a7d934ba311dcd37ce89d853` |
| CSV final | `5e22ea6795985dee7a17f5cab868b35870f13618c5a42651aa73338800ce43a1` |
| Relatório Markdown final | `20591dbf45f59f421f46fda86c6b587802006205b6e8e35ce4f7abec475a1bf1` |

Hashes dos prompts conferidos com os textos preservados no corpus:

- S3-2: `e3759856e75f50450168207aa127bc5af9f8a24c1c6ec094015c665ec4f03934`.
- S1-3: `5cc8354eee3df28a66022be308c914e3cf9268104e0063ea511a69c9895e69e9`.

Esses hashes documentam integridade interna, não autenticam a execução junto à Groq. Não houve acesso à conta do provedor. A análise não revela raciocínio interno do modelo e não estabelece erro temporal apenas por hipótese. Também não certifica a qualidade das outras treze respostas, cujas decisões foram mantidas somente para a análise condicional do impacto.

**Estado final:** relatório documental criado; sugestões não aplicadas; avaliações e respostas originais preservadas; nenhuma geração de IA realizada.
