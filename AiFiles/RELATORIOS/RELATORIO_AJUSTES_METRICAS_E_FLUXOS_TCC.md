# Relatório dos ajustes, cálculos das métricas e fluxos do sistema

**Data:** 10 de outubro de 2026
**Agente:** Guanabara
**Escopo:** estado posterior à auditoria técnica e à implementação do plano de ajustes do TCC.
**Referências:** `AUDITORIA_TECNICA_COMPARACAO_IMPLEMENTACAO_TCC.md`, `AJUSTES_TCC_2026_10_10.md`, `PROTOCOLO_DE_MEDICAO.md` e código vigente.

## 1. Resumo do resultado

Os ajustes prioritários solicitados após a comparação com o TCC foram implementados no núcleo de Learning Analytics. O sistema agora usa uma regra única para validar evidências, normaliza corretamente percepções de 1 a 5, exige três evidências para tendência e suficiência, registra evidências automáticas sem confirmação humana e possui um motor determinístico de recomendação de materiais.

A avaliação sintética também foi ampliada para o desenho quantitativo esperado: cinco usuários, três módulos por usuário, dez sessões por módulo, totalizando 150 sessões válidas e 150 evidências válidas.

Permanecem fora do escopo operacional: taxa agregada de acerto, tentativas pedagógicas, análise por nível de Bloom e avaliação qualitativa com um provedor real de IA. Esses itens não são apresentados como funcionalidades concluídas.

## 2. Como ficaram os ajustes pedidos

| Ajuste | Como ficou | Estado |
|---|---|---|
| Validade das evidências | Uma evidência entra nos cálculos quando possui percentual finito entre 0 e 100, data válida e não futura e pertence ao contexto autorizado | Implementado |
| Confirmação humana | O fluxo de confirmar/rejeitar foi removido; campos antigos permanecem apenas para compatibilidade de armazenamento e são ignorados nos cálculos | Implementado conforme decisão do projeto |
| Registro automático | A análise de material registra ou atualiza uma evidência única por recurso quando encontra percentual explicitamente identificado | Implementado |
| Normalização 1–5 | Toda percepção usa `((valor - 1) / 4) × 100` | Implementado e unificado |
| Amostra mínima | Tendência e suficiência objetiva exigem três evidências; destaques de compreensão exigem três percepções | Implementado |
| Média de desempenho | Continua como média simples dos percentuais das evidências válidas e distintas | Implementado e documentado como medida descritiva |
| Associação sessão–evidência | Vínculo explícito tem prioridade; sem vínculo, exige conceito comum, mesmo módulo, ordem posterior e janela de até 30 dias | Implementado |
| Recomendação de materiais | Um motor determinístico escolhe material elegível, informa ausência de material ou recomenda exploração inicial | Implementado; o card foi posteriormente retirado da interface do módulo, mas o motor e o DTO permanecem disponíveis |
| IA | Recebe as métricas e a recomendação já calculadas; interpreta, mas não recalcula nem substitui a decisão oficial | Implementado com contingência local |
| Avaliação sintética | Cinco cenários, 15 módulos, 150 sessões válidas, 150 evidências válidas e 15 interpretações simuladas | Implementado |
| Taxa de acerto | Não é reconstruída quando faltam questões ou pontuações confiáveis | Não implementada ponta a ponta |
| Tentativas pedagógicas | Contadores técnicos de processamento/provedor não são tratados como tentativas do estudante | Não implementadas |
| Bloom | Há somente estruturas opcionais e compatibilidade de contrato, sem coleta e painel operacionais | Não operacional |

## 3. Fontes dos cálculos

As métricas usam três conjuntos principais:

- **sessões:** situação, início, encerramento, duração, módulo, conceitos, métodos, formatos, dificuldade e compreensão percebidas;
- **evidências:** percentual de desempenho, data do evento, módulo, conceitos, material de origem, questões e vínculos explícitos com sessões;
- **materiais e conceitos:** disponibilidade, módulo, relações entre material e conceito e resultado da análise do arquivo.

A IA não é fonte de métrica. Ela recebe um DTO produzido depois da validação e dos cálculos determinísticos.

## 4. Validade das sessões

Uma sessão é válida quando:

~~~text
situação = CONCLUIDA
e encerradaEm está preenchido
e duracaoMinutos é um inteiro
e duracaoMinutos >= 5
~~~

Sessões planejadas, ativas, invalidadas ou curtas são excluídas. Uma sessão arquivada continua participando das métricas porque o arquivamento não apaga o histórico.

## 5. Métricas de sessões

### 5.1 Volume e duração

~~~text
N = quantidade de sessões válidas
tempo total = soma(duração de cada sessão válida)
duração média = tempo total / N
~~~

Quando `N = 0`, a duração média é ausente, não zero.

### 5.2 Dias e sequência de estudo

~~~text
dias com estudo = quantidade de datas UTC distintas com sessão válida
maior sequência = maior número de datas consecutivas, com diferença de 1 dia
~~~

### 5.3 Regularidade semanal

As semanas começam na segunda-feira em UTC.

~~~text
semanas ativas = semanas com pelo menos uma sessão válida
semanas do intervalo = distância entre a primeira e a última semana + 1
regularidade = semanas ativas / semanas do intervalo
~~~

| Condição | Classificação |
|---|---|
| Nenhuma sessão | Sem dados |
| Menos de duas semanas | Insuficiente |
| Regularidade ≥ 0,75 | Constante |
| Regularidade ≥ 0,50 e < 0,75 | Moderada |
| Regularidade < 0,50 | Esporádica |

### 5.4 Percepções

Dificuldade e compreensão são autorrelatos na escala inteira de 1 a 5.

~~~text
média percebida = soma dos valores preenchidos / quantidade de valores
percepção normalizada = ((média - 1) / 4) × 100
~~~

| Escala 1–5 | Escala 0–100 |
|---:|---:|
| 1 | 0 |
| 2 | 25 |
| 3 | 50 |
| 4 | 75 |
| 5 | 100 |

Essa transformação não representa percentual de acertos.

### 5.5 Método e formato

Para cada método ou formato `c`:

~~~text
sessões(c) = quantidade de sessões válidas distintas com c
minutos(c) = soma das durações dessas sessões
participação(c) = sessões(c) / total de sessões válidas
compreensão média(c) = soma das compreensões / n de compreensões
~~~

Métodos e formatos não são exclusivos. Uma sessão com dois métodos entra nos dois grupos; por isso, as participações podem somar mais de 100%.

## 6. Validade e associação das evidências

### 6.1 Evidência válida

~~~text
percentual é numérico e finito
e 0 <= percentual <= 100
e data é válida
e data não está no futuro
e registro pertence ao módulo e período consultados
~~~

Ausência, `NaN`, data inválida e percentual fora do intervalo não viram zero. Evidências são deduplicadas por ID.

### 6.2 Associação com a sessão

~~~text
se existe vínculo explícito:
    usar somente as sessões explicitamente vinculadas
    e exigir evidência posterior ao encerramento
senão:
    exigir mesmo módulo
    e pelo menos um conceito em comum
    e evidência posterior
    e diferença de até 30 dias, inclusive
~~~

O vínculo explícito dispensa a janela de 30 dias, mas não permite que uma evidência anterior seja tratada como resultado posterior.

## 7. Métricas de aprendizagem

### 7.1 Desempenho médio

Por conceito, método ou formato:

~~~text
desempenho médio =
    soma dos percentuais das evidências válidas e distintas
    / quantidade de evidências válidas e distintas
~~~

É uma média simples. Exemplo:

~~~text
evidência A = 100%
evidência B = 50%
desempenho médio = (100 + 50) / 2 = 75%
~~~

O sistema não pondera pela quantidade de questões, pois nem toda evidência possui denominador ou pontuação completa. Portanto, o indicador não deve ser chamado de taxa agregada de acerto.

### 7.2 Tendência

São necessárias pelo menos três evidências distintas, ordenadas pela data do evento.

~~~text
variação = último percentual - primeiro percentual

variação >= 10  → evolução positiva
variação <= -10 → ponto de atenção
-10 < variação < 10 → estável
n < 3 → dados insuficientes
~~~

A fórmula compara os extremos cronológicos; não é regressão estatística nem prova causal.

### 7.3 Percepção versus evidência

A comparação exige compreensão e desempenho disponíveis e pelo menos três evidências.

~~~text
percepção normalizada = ((compreensão média - 1) / 4) × 100
percepção alta = percepção normalizada >= 70
evidência alta = desempenho médio >= 70
~~~

| Percepção | Evidência | Leitura |
|---|---|---|
| Alta | Alta | Alinhamento positivo |
| Alta | Baixa | Possível superestimação |
| Baixa | Alta | Possível subestimação |
| Baixa | Baixa | Ponto de atenção |
| Dados incompletos | — | Dados insuficientes |

Os rótulos são descritivos e não constituem diagnóstico psicológico ou comprovação de domínio.

### 7.4 Duração associada a melhores resultados

Uma sessão entra no subconjunto quando possui:

~~~text
compreensão >= 4/5
e desempenho posterior médio >= 70%
~~~

Depois:

~~~text
duração associada = soma das durações elegíveis / n de sessões elegíveis
~~~

O resultado descreve o histórico observado; não define uma duração ideal.

### 7.5 Evolução semanal

Sessões são agrupadas pela semana UTC do encerramento e evidências pela semana UTC do evento.

~~~text
compreensão semanal = soma das compreensões / n de percepções
desempenho semanal = soma dos percentuais / n de evidências distintas
~~~

As duas séries permanecem separadas. Ausência é nula, não zero.

## 8. Índices exploratórios por conceito

Os rankings usam uma janela inclusiva de até 90 dias e mostram no máximo cinco conceitos.

~~~text
compreensão normalizada = ((compreensão - 1) / 4) × 100
dificuldade normalizada = ((dificuldade - 1) / 4) × 100

índice de compreensão = média dos componentes disponíveis:
    compreensão normalizada
    100 - dificuldade normalizada
    desempenho médio

índice de dificuldade = média dos componentes disponíveis:
    dificuldade normalizada
    100 - compreensão normalizada
    100 - desempenho médio
~~~

Ausências saem do denominador; cada fonte disponível tem o mesmo peso. Os índices exigem duas observações exploratórias e informam separadamente quantas compreensões, dificuldades e evidências os compõem.

Exemplo:

~~~text
compreensão = 4/5 → 75
dificuldade = 2/5 → 25
desempenho = 80

índice de compreensão = média(75, 75, 80) = 76,67
índice de dificuldade = média(25, 25, 20) = 23,33
~~~

Esses valores não são probabilidade de domínio nem taxa de aprendizagem.

## 9. Consolidação no Dashboard

### 9.1 Consolidação entre módulos

As médias são ponderadas pelas respectivas amostras:

~~~text
compreensão consolidada =
    soma(compreensão média do módulo × n de compreensões do módulo)
    / soma(n de compreensões)

desempenho consolidado =
    soma(desempenho médio do módulo × n de evidências do módulo)
    / soma(n de evidências)
~~~

### 9.2 Destaques de método e formato

Um contexto precisa de pelo menos três compreensões. A ordenação usa:

1. maior compreensão média;
2. maior quantidade de compreensões;
3. maior quantidade de sessões;
4. chave estável.

O destaque significa “maior média observada entre contextos elegíveis”, não “melhor método”.

### 9.3 Consistência entre módulos

Um método é analisável em um módulo quando há pelo menos três compreensões e três evidências posteriores.

~~~text
módulo positivo = compreensão média >= 4/5
                  e desempenho médio >= 70%

consistência = módulos positivos / módulos analisáveis
~~~

Com menos de dois módulos analisáveis ou menos de quatro evidências, o resultado recebe o rótulo “Poucos dados”.

## 10. Motor de recomendação

O recomendador é determinístico e funciona sem provedor de IA.

### RM-01 — material elegível

Quando existe sinal de atenção e material ativo do mesmo módulo e conceito:

1. baixo desempenho, abaixo de 70%, tem prioridade;
2. depois, compreensão abaixo de 3/5 ou dificuldade a partir de 3/5;
3. empates usam critérios estáveis;
4. um mesmo material não é repetido para conceitos diferentes;
5. a saída é limitada a três recomendações.

### RM-02 — sem material

Quando existe sinal de atenção, mas não há material elegível, o sistema declara a ausência e sugere revisão ou coleta de nova evidência. Ele não inventa referência.

### RM-03 — exploração

Sem sinal suficiente ou no início a frio, a saída recomenda exploração e coleta de dados, sem escolher formato ou método como preferência fixa.

O DTO registra regra aplicada, indicadores usados, tamanho da amostra, justificativa e limitações. Com menos de três evidências, a base é marcada como limitada.

## 11. Fluxos atuais

### 11.1 Registro de sessão

~~~text
formulário ou cronômetro
  → autenticação e autorização do módulo
  → validação de datas, duração, estado e relações
  → persistência da sessão
  → consulta das sessões válidas
  → cálculo determinístico das métricas
  → Dashboard e página do módulo
~~~

### 11.2 Material, extração e evidência

~~~text
upload
  → validação do arquivo e da propriedade
  → extração do texto
  → análise do material
  → normalização e persistência dos conceitos
  → extração conservadora de percentual explicitamente rotulado
  → upsert de uma evidência por recurso
  → validação objetiva da evidência
  → métricas, recomendação e DTO da IA
~~~

Questões incompletas não são transformadas em pontos. Uma questão identificada como incorreta não é registrada como correta. Não há fila de confirmação humana.

### 11.3 Atualização após nova análise

~~~text
API conclui a análise
  → invalida as páginas do Dashboard e do módulo
  → cliente atualiza a rota
  → consultas leem os registros atuais
  → n, médias, tendências e recomendações são recalculados
~~~

Não há uma métrica congelada produzida pela IA.

### 11.4 Dashboard do módulo

~~~text
página autenticada
  → busca conceitos, sessões, materiais e evidências autorizados
  → filtra sessões e evidências válidas
  → associa resultados posteriores
  → calcula aprendizagem do módulo
  → exibe cards, séries, conceitos e limitações
~~~

### 11.5 Dashboard pessoal

~~~text
/dashboard
  → autenticação e filtro temporal
  → busca módulos ativos
  → calcula cada módulo
  → consolida médias ponderadas e consistência
  → renderiza métricas com n e linguagem observacional
~~~

### 11.6 IA interpretativa

~~~text
usuário solicita interpretação
  → API autentica
  → servidor recalcula métricas oficiais
  → motor determinístico calcula a recomendação
  → servidor monta e compacta o DTO
  → tenta o provedor configurado e as contingências
  → valida schema e linguagem
  → falha externa aciona resposta local
  → interface informa origem, modelo e limitações
~~~

A IA pode explicar padrões e sugerir próximos passos, mas não altera registros, métricas, seleção oficial de material nem grau de evidência.

### 11.7 Dashboards de sala

~~~text
proprietário acessa a sala
  → servidor valida propriedade e vínculos ativos
  → visão individual exige autorização do membro
  → agregado exige pelo menos três contribuidores válidos
  → reutiliza as métricas oficiais
  → omite arquivos, materiais e descrições privadas
~~~

## 12. Avaliação sintética

O comando de avaliação usa um banco temporário independente e não altera o banco pessoal.

~~~text
5 usuários
× 3 módulos por usuário
× 10 sessões válidas por módulo
= 150 sessões válidas

15 módulos
× 10 atividades de desempenho
= 150 evidências válidas
~~~

Também são criados controles inválidos para verificar exclusões. O total físico final é de 152 sessões, das quais 150 são válidas, e 151 evidências, das quais 150 são válidas.

Os cinco cenários verificam:

1. método e formato com resultados distintos;
2. isolamento do mesmo conceito entre módulos;
3. evolução positiva, atenção e estabilidade;
4. amostras `n = 0`, `n = 1` e `n = 2`;
5. percepção, evidência e índices exploratórios.

As 15 interpretações registradas usam simulação sem rede. Elas validam transporte, schema e contingência, mas não demonstram a qualidade de um modelo externo.

## 13. Validação executada na implementação

Conforme o relatório de implementação:

~~~text
npm run validar
  → scanner de credenciais aprovado
  → lint aprovado
  → tipos aprovados
  → 147 testes em 40 arquivos aprovados
  → build de produção aprovado

npm run testar:tcc
  → 15 comparações de módulos aprovadas
  → 150 sessões válidas conferidas
  → 150 evidências válidas conferidas
  → 15 interpretações simuladas registradas
~~~

Esses resultados pertencem à execução documentada em `AJUSTES_TCC_2026_10_10.md`. Este relatório não executou novamente scripts de banco.

## 14. O que ainda precisa ser feito

1. Atualizar o texto acadêmico para descrever sessões, conceitos, evidências automáticas, média simples, normalização e amostra mínima de três.
2. Não apresentar taxa agregada de acerto, tentativas pedagógicas ou Bloom como funcionalidades operacionais atuais.
3. Executar e rubricar 15 interpretações de um provedor real somente se houver autorização para consumo e configuração de credenciais.
4. Remover fisicamente os campos legados de confirmação apenas em uma migração futura e segura; hoje eles preservam compatibilidade histórica.
5. Tratar a checagem semântica completa dos números produzidos pela IA como evolução futura.

## 15. Situação final

| Área | Situação atual |
|---|---|
| Sessões, tempo, frequência e regularidade | Operacionais |
| Percepções 1–5 e normalização 0–100 | Operacionais e unificadas |
| Evidências automáticas | Operacionais, sem confirmação humana |
| Método/formato × resultados | Operacionais, com linguagem observacional |
| Tendência com `n >= 3` | Operacional |
| Rankings e índices por conceito | Operacionais e exploratórios |
| Recomendador determinístico | Implementado; interface do card removida por decisão posterior |
| IA interpretativa | Operacional com fallback; qualidade externa ainda não avaliada |
| Avaliação sintética 5 × 3 × 10 | Implementada e reproduzível |
| Taxa agregada de acerto | Não implementada ponta a ponta |
| Tentativas pedagógicas | Não implementadas |
| Bloom operacional | Não implementado |
| Atualização do PDF do TCC | Pendente do autor |

## 16. Conclusão

O código foi ajustado para uma prova de conceito coerente e verificável: o sistema calcula métricas determinísticas, registra o tamanho das amostras, separa percepção de desempenho e limita a IA ao papel de interpretação. A principal adequação necessária agora está no texto do TCC, que deve refletir o domínio e as fórmulas atuais sem prometer taxa de acerto, tentativas ou Bloom como recursos já disponíveis.
