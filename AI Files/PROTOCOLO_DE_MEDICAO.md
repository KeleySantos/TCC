# Protocolo de medição e avaliação técnica

## 1. Finalidade

Definir como a plataforma transforma eventos de estudo e avaliação em registros válidos, métricas e evidências. Este protocolo vale para o cenário sintético atual e deve ser revisado pelo orientador antes de qualquer coleta real.

## 2. Regras de validade da sessão

| Regra | Definição atual | Situação |
|---|---|---|
| Início | A sessão inicia quando o aluno seleciona “Iniciar sessão de estudo”. | Implementada |
| Encerramento | A sessão encerra quando o aluno seleciona “Encerrar sessão”. | Implementada |
| Duração | `encerradaEm - iniciadaEm`, em minutos inteiros. | Implementada |
| Duração mínima | 5 minutos. Abaixo disso, a sessão é `INVALIDADA`. | Implementada |
| Duração máxima | Ainda não definida; propor 180 minutos para bloquear sessões esquecidas. | Pendente de validação |
| Pausa/retomada | Não implementada; a versão atual não mede tempo ativo de aba. | Adiada |
| Múltiplas abas | Não implementada; deve haver no máximo uma sessão ativa por aluno em versão futura. | Adiada |
| Encerramento abrupto | A sessão permanece ativa até tratamento posterior. | Adiada |

Uma sessão inválida permanece armazenada para auditoria, mas não entra em evidências simples ou indicadores de formato.

## 3. Regra de vínculo sessão–tentativa

Uma tentativa gera evidência simples de formato somente se todas as condições forem verdadeiras:

1. Aluno da sessão é o mesmo da tentativa.
2. Tópico da sessão é o mesmo da tentativa.
3. Sessão está concluída e possui duração de pelo menos 5 minutos.
4. Sessão terminou antes da tentativa.
5. Tentativa terminou em até 7 dias depois da sessão.
6. Existe exatamente uma sessão elegível antes daquela tentativa na janela.
7. A tentativa possui nota normalizada entre 0 e 100.

Se houver duas ou mais sessões elegíveis antes da mesma tentativa, o registro é uma exposição mista e não é atribuído a um formato específico.

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
| Taxa de acerto | `respostas corretas / total de questões` | 0–1 | Total zero é inválido |
| Média por formato | `soma das notas das evidências / quantidade de evidências` | 0–100 | Não mostrar se não houver evidência |
| Tendência de nota | `última nota cronológica − primeira nota cronológica` | -100 a 100 | Não mostrar com menos de duas tentativas |
| Nível insuficiente | Menos de 2 evidências | categórico | Recomendar exploração |
| Nível inicial | Exatamente 2 evidências | categórico | Linguagem de primeiros resultados |
| Nível moderado | 3 ou 4 evidências; ou 5+ pouco consistentes | categórico | Linguagem contextual |
| Nível forte | 5+ evidências e dispersão de notas até 25 pontos | categórico | Ainda sem linguagem causal |

## 6. Dados ausentes e exceções

- Não exibir zero como se fosse nota inexistente.
- Não preencher formato sem evidência com média zero.
- Não comparar tópicos diferentes.
- Não usar sessão inválida no cálculo.
- Não usar tentativa incompleta no cálculo.
- Não considerar feedback de recomendação como medida de aprendizagem.

## 7. Decisões metodológicas a validar

- [ ] 7 dias é uma janela adequada para o contexto do estudo?
- [ ] 5 minutos é duração mínima adequada para cada formato?
- [ ] 180 minutos deve ser a duração máxima antes de invalidar sessão?
- [ ] Os limiares de nível de evidência são apropriados?
- [ ] Como controlar dificuldade entre quizzes quando houver mais de uma avaliação por tópico?
- [ ] O limiar de atenção docente em 60% é adequado e apenas demonstrativo?

## 8. Critério de aprovação

O protocolo poderá orientar coleta com participantes somente após validação do orientador e, se aplicável, do procedimento ético institucional.
