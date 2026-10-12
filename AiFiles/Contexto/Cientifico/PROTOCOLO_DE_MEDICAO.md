# Protocolo de medição e avaliação técnica

## Vigência para o Dashboard pessoal em 2026-09-21

O contrato atual de `/dashboard` evolui o de [`FASE_0_REFORMULACAO_DASHBOARD_PESSOAL.md`](../../Planos/FASE_0_REFORMULACAO_DASHBOARD_PESSOAL.md), conforme D-029, D-030, D-034, D-038 e D-048. O motor `metricas-sessoes-v1` inclui sessões concluídas com fim e duração oficial mínima de cinco minutos, inclusive arquivadas, e exclui sessões planejadas, ativas e invalidadas. Métodos e formatos múltiplos são contextos não exclusivos. Percepções de 1 a 5 são autorrelatos discretos e inteiros; conceitos extraídos de materiais e mencionados em descrições são observações textuais.

Nos gráficos “Métodos × Resultados” e “Formatos × Resultados”, cada contexto reúne a compreensão percebida das sessões e o desempenho das evidências válidas posteriormente. A evidência é associada à sessão por vínculo explícito ou por conceito comum dentro do mesmo módulo e em até 30 dias. Ao consolidar módulos, médias são ponderadas pelas respectivas quantidades de compreensões e evidências; nenhuma sessão é relacionada a evidência de outro módulo. Métodos e formatos simultâneos podem compartilhar a mesma sessão e a mesma evidência. Os gráficos usam eixo 0–100; percepção é normalizada por ((valor − 1) / 4) × 100 e não é percentual de acertos. A tabela preserva a escala 1–5 e o n por fonte.

Os cards de método e formato selecionam a maior compreensão percebida média somente entre contextos com ao menos três compreensões. Empates usam maior amostra e depois chave estável. O card de duração calcula a média ponderada das sessões com compreensão de pelo menos 4/5 e desempenho posterior de pelo menos 70%; sem sessão elegível, informa insuficiência. Esses resultados descrevem associações observadas e não demonstram eficácia, superioridade, duração ideal ou causalidade.

Na seção “Consistência dos métodos entre módulos”, um módulo entra no denominador de um método somente quando possui ao menos três compreensões e três evidências posteriores confirmadas para esse método. A associação no módulo é classificada como positiva quando a compreensão média é de pelo menos 4/5 e o desempenho posterior médio é de pelo menos 70%. A consistência é a quantidade de módulos positivos dividida pela quantidade de módulos analisáveis. A contagem de evidências soma somente os módulos analisáveis. Menos de dois módulos analisáveis ou menos de quatro evidências recebe o rótulo “Poucos dados”. A ordenação usa proporção, módulos positivos, evidências e chave estável; ela não representa ranking de eficácia.

As seções abaixo que descrevem quizzes, tentativas e avaliações antigas documentam o protocolo histórico anterior à Fase 9. Elas **não autorizam** a reintrodução dessas entidades. As evidências atuais pertencem ao domínio do módulo e seguem a associação posterior descrita acima. Quantidade de sessões não corresponde a confiança estatística, e nenhuma análise pode afirmar eficácia, calibração perfeita ou domínio.

## 1. Finalidade

Esta seção preserva o protocolo anterior baseado em avaliações para rastreabilidade. No produto atual, o Dashboard segue o contrato de sessões indicado na abertura deste documento. Qualquer protocolo futuro com resultados objetivos deve ser revisado antes de implementação e antes de eventual coleta real. Métricas oficiais são locais; a IA opcional apenas interpreta os dados autorizados.

## 2. Regras de validade da sessão

| Regra | Definição atual | Situação |
|---|---|---|
| Início | A sessão inicia quando a pessoa usuária seleciona “Iniciar sessão de estudo”. | Implementada no produto de origem; adaptação à conta pessoal planejada |
| Encerramento | A sessão encerra quando a pessoa usuária seleciona “Encerrar sessão”. | Implementada no produto de origem; adaptação à conta pessoal planejada |
| Duração | `encerradaEm - iniciadaEm`, em minutos inteiros. | Implementada |
| Duração mínima | 5 minutos. Abaixo disso, a sessão é `INVALIDADA`. | Implementada |
| Duração máxima | Ainda não definida; propor 180 minutos para bloquear sessões esquecidas. | Pendente de validação |
| Pausa/retomada | Não implementada; a versão atual não mede tempo ativo de aba. | Adiada |
| Múltiplas abas | Não implementada; deve haver no máximo uma sessão ativa por aluno em versão futura. | Adiada |
| Encerramento abrupto | A sessão permanece ativa até tratamento posterior. | Adiada |

Uma sessão inválida permanece armazenada para auditoria, mas não entra em evidências simples ou indicadores de formato.

## 3. Regra de vínculo sessão–tentativa

Uma tentativa gera evidência simples de formato somente se todas as condições forem verdadeiras:

1. Conta pessoal da sessão é a mesma da tentativa.
2. Tópico da sessão é o mesmo da tentativa.
3. Sessão está concluída e possui duração de pelo menos 5 minutos.
4. Sessão terminou antes da tentativa.
5. Tentativa terminou em até 7 dias depois da sessão.
6. Existe exatamente uma sessão elegível antes daquela tentativa na janela.
7. A tentativa possui nota normalizada entre 0 e 100.

Se houver duas ou mais sessões elegíveis antes da mesma tentativa, o registro é uma exposição mista e não é atribuído a um formato específico.

Na Entrega A, não existe coluna ou formulário de vínculo direto `sessaoId` na tentativa. A associação acima continua sendo exclusivamente analítica e temporal.

## 4. Comparabilidade dos quizzes

Para sustentar comparação entre resultados, avaliações de um mesmo tópico devem ter:

- mesmo objetivo de aprendizagem;
- quantidade semelhante de questões;
- pesos definidos antes da aplicação;
- dificuldade revisada por responsável pedagógico;
- mesma escala de nota;
- regra de feedback documentada.

No MVP, o quiz de Loops é um instrumento demonstrativo. Ele permite validar cálculo e fluxo, mas não sustenta conclusão empírica sobre eficácia pedagógica.

## 5. Fórmulas

| Indicador | Fórmula | Intervalo | Tratamento de ausência |
|---|---|---|---|
| Nota normalizada | `(pontos obtidos / pontos totais) × 100` | 0–100 | Não há tentativa, então não há nota |
| Taxa de acerto | `respostas corretas / total de questões` | 0–1 | Total zero recebe nota 0 no registro técnico, mas não gera taxa nem comparação |
| Taxa geral de acerto | `soma das respostas corretas / soma do total de questões` dos módulos ativos | 0–1 | Total geral zero retorna `null`; não é feita média das taxas por módulo |
| Média semanal das taxas por tópico | em cada semana UTC iniciada na segunda-feira, média aritmética de `respostas corretas / total de questões` de cada tópico com evidência | 0–1 | Semana sem tentativa válida não cria ponto; tópico sem evidência não recebe zero |
| Dificuldade atual estimada | média das médias semanais dos três períodos mais recentes com evidência; `<0,60` alta, `0,60–<0,80` intermediária e `≥0,80` baixa | categórico | Sem período retorna `null`; um ou dois períodos são marcados como amostra reduzida |
| Média por formato | `soma das notas das evidências / quantidade de evidências` | 0–100 | Não mostrar se não houver evidência |
| Tendência de nota | `última nota cronológica − primeira nota cronológica` | -100 a 100 | Não mostrar com menos de duas tentativas |
| Tempo válido | soma das sessões concluídas com ao menos 5 minutos | minutos | Exibir 0 minutos e amostra 0 quando não houver sessão válida |
| Desempenho por método/formato | média das evidências de exposição única no mesmo contexto | 0–100 | Não comparar nem exibir média se houver apenas exposição mista ou nenhuma evidência |
| Método com maior média observada | maior média entre recorrências de método em pelo menos dois módulos; desempate por amostra, módulos e chave | 0–100 | Retornar `null` se não houver método recorrente elegível; não inferir superioridade causal |
| Comparação contextual de desafio | média das evidências únicas vinculadas ao desafio menos média das evidências únicas sem desafio, no mesmo módulo e método | -100 a 100 | Cada grupo exige ao menos 2 evidências; sem isso, diferença retorna `null` |
| Taxa por nível de Bloom | `respostas corretas classificadas / respostas classificadas` por nível cognitivo | 0–1 | Cada nível exige 2 respostas classificadas; ausência de classificação não entra nem vira zero |
| Nível insuficiente | Menos de 2 evidências | categórico | Recomendar exploração |
| Nível inicial | Exatamente 2 evidências | categórico | Linguagem de primeiros resultados |
| Nível moderado | 3 ou 4 evidências; ou 5+ pouco consistentes | categórico | Linguagem contextual |
| Nível forte | 5+ evidências e dispersão de notas até 25 pontos | categórico | Ainda sem linguagem causal |
| Percepção versus resultado | descrição das escalas percebidas e notas observadas no mesmo contexto | descritivo | Não afirmar que percepção, método ou formato causou a nota |

## 6. Dados ausentes e exceções

- Não exibir zero como se fosse nota inexistente.
- Não preencher formato sem evidência com média zero.
- Não comparar tópicos diferentes.
- Não usar sessão inválida no cálculo.
- Não usar tentativa incompleta no cálculo.
- Numerar tentativas sequencialmente por conta e avaliação; a sequência não cria vínculo com uma sessão.
- Não considerar feedback de recomendação como medida de aprendizagem.
- Não tratar interpretação, conselho ou padrão apontado por Gemini como nova evidência, métrica oficial ou alteração de dado bruto.
- Recorrência entre módulos exige o mesmo contexto observado em pelo menos dois módulos; não é um rótulo persistido nem uma recomendação causal.
- A seleção do método com maior média observada descreve apenas a recorrência elegível com maior média. Ela não estabelece que o método seja melhor, cause o resultado ou deva ser generalizado.
- A média semanal das taxas por tópico não substitui a taxa geral ponderada do Dashboard: a primeira dá peso igual a cada tópico com evidência; a segunda dá peso a cada questão.
- Dificuldade atual estimada é uma classificação de leitura da série de resultados, não a dificuldade percebida pela pessoa nem diagnóstico pedagógico.
- Desafio cancelado preserva sessões já vinculadas, mas não pode receber vínculo novo.
- A comparação de desafio usa somente evidências de exposição única; sessões de outros desafios não são tratadas como contexto externo.
- Diferença entre desafio e contexto descreve registros daquele módulo e método; não demonstra eficácia, causalidade ou superioridade de um método.

## 7. Decisões metodológicas a validar

- [ ] 7 dias é uma janela adequada para o contexto do estudo?
- [ ] 5 minutos é duração mínima adequada para cada formato?
- [ ] 180 minutos deve ser a duração máxima antes de invalidar sessão?
- [ ] Os limiares de nível de evidência são apropriados?
- [ ] Como controlar dificuldade entre quizzes quando houver mais de uma avaliação por tópico?
- [x] Não há indicador de atenção docente na Entrega A, pois não existem papéis docentes ou turmas.
- [x] Vínculo direto entre sessão e tentativa não integra a Entrega A; a associação temporal vigente permanece.

## 8. Critério de aprovação

O protocolo poderá orientar coleta com participantes somente após validação do orientador e, se aplicável, do procedimento ético institucional.

## 9. Protocolo observacional vigente para evidências do módulo

Atualizado em 2026-10-10 pelo plano de ajustes do TCC. As seções sobre tentativas e avaliações convencionais acima são históricas e não descrevem o domínio operacional atual.

- `evidenciaValida` exige desempenho numérico finito entre 0 e 100 (inclusive) e data válida; a consulta também exclui futuro e respeita o período solicitado. Ausência, NaN e valores fora da escala não viram zero.
- Extração automática de avaliação reconhece percentual explicitamente identificado por nota, resultado ou desempenho; porcentagens incidentais não são notas. Não há confirmação humana, fila de revisão ou aprovação. Os campos antigos de confirmação permanecem exclusivamente para compatibilidade de armazenamento e são ignorados.
- Registros históricos com qualquer estado antigo seguem a mesma regra de validade. Materiais arquivados ou que deixaram de ser avaliações ficam fora da consulta, preservando os registros no banco. A substituição de arquivo limpa o desempenho anterior até nova extração.
- Evidências são deduplicadas pelo ID. Média de desempenho por conceito = soma dos percentuais válidos / número de evidências distintas do conceito. Não é taxa agregada de acertos; pesos por quantidade de questões não são aplicados.
- Sessões concluídas com pelo menos cinco minutos são válidas; arquivamento de sessão preserva participação nas métricas. Planejadas, ativas e sessões curtas ficam fora.
- Associação automática exige conceito comum no módulo, evidência estritamente posterior e janela inclusiva de 30 dias. Quando há vínculos explícitos, somente essas sessões são consideradas, ainda exigindo ordem temporal; vínculo explícito dispensa a janela. Cada evidência conta uma vez por grupo. Métodos/formatos múltiplos são contextos não exclusivos e não provam superioridade causal.
- Tendência requer três evidências distintas no conceito e contexto consultado. Diferença última − primeira ≥10 pontos indica evolução positiva, ≤−10 indica ponto de atenção; entre esses limites, estável. Com n<3, dados insuficientes. Trata-se de descrição entre extremos, não regressão ou inferência causal.
- Comparação percepção/evidência e suficiência por método/formato exigem três evidências; destaque de maior compreensão requer três compreensões preenchidas. Médias descritivas e gráficos semanais podem ter menos observações, com n explícito; médias semanais de autorrelato mantêm o mínimo de duas percepções definido no motor de sessões.
- Percepção 1–5 usa ((valor − 1) / 4) × 100: 0,25,50,75,100. O backend não arredonda; interface usa zero ou uma casa decimal. Ausência é nula, não zero. A referência de percepção alta é 70/100 (equivale a média 3,8/5); desempenho alto usa 70%. Nenhum limiar prova aprovação ou domínio.
- Rankings dos últimos 90 dias exigem duas observações exploratórias (sessões com percepção + evidências), limitam cinco conceitos e informam contagens separadas de compreensão, dificuldade e evidências. Essa soma não é apresentada como quantidade de observações objetivas independentes. Índice de compreensão = média dos componentes disponíveis [compreensão normalizada, 100−dificuldade normalizada, desempenho]; dificuldade inverte os três componentes. Ausências saem do denominador; cada fonte disponível recebe peso igual. Empates: observação recente, quantidade de observações, nome.
- Duração associada a melhores resultados: média das durações com compreensão ≥4/5 e média de evidências posteriores ≥70%, com n de sessões explícito. É descritiva e não atribui resultado ao tempo.
- Evolução semanal mantém uma evidência por ID na semana UTC da sua data. Percepção normalizada e desempenho continuam medidas distintas; lacunas ficam nulas.
- Filtro de datas limita sessões iniciadas, evidências ocorridas e eventos no intervalo inclusivo UTC. Rankings continuam limitados também a 90 dias; outras médias respeitam o recorte fornecido ou todo o histórico.
- Recomendação `RM-01` seleciona referência ativa do mesmo módulo e conceito com sinal de atenção; `RM-02` explicita ausência de material; `RM-03` solicita exploração no início a frio/ausência de sinal. Baixo desempenho (<70%) tem prioridade, seguido de compreensão <3/5 ou dificuldade ≥3/5. Desempates são estáveis por ID. n<3 é base limitada. Mesmo n≥3 não sustenta preferência de formato, pois dificuldade comparável não é controlada.
- A IA recebe métricas e recomendações calculadas. Pode interpretar, mas não seleciona o material oficial, altera indicadores ou modifica o grau de evidência. Schema, filtro de linguagem e contingência local permanecem; checagem numérica semântica completa é trabalho futuro.
