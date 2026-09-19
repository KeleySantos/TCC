# Protocolo de medição e avaliação técnica

## 1. Finalidade

Definir como o laboratório pessoal transforma eventos de estudo e avaliação em registros válidos, métricas e evidências. Este protocolo vale para o cenário sintético atual e deve ser revisado pelo orientador antes de qualquer coleta real. As métricas oficiais são calculadas localmente; Gemini apenas interpreta um resumo agregado dessas métricas.

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
