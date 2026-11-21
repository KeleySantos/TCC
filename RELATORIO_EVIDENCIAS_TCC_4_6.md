# Evidências da seção 4.6 — Avaliação técnica e resultados

Data da auditoria documental: **27/10/2026**.

## 1. Escopo e critérios desta auditoria

Este relatório recupera evidências já existentes para as subseções 4.6.1, 4.6.2 e 4.6.3 do TCC. Foi criado na raiz por solicitação expressa da especificação fornecida pelo autor.

Foram realizadas somente leituras dos arquivos, extração dos campos dos JSON/CSV, contagens das avaliações e conferência de hashes. **Não foram executados testes, migrações, seed, build, scripts de avaliação ou chamadas à Groq nesta tarefa.** Não foram modificados código, testes, dados, configurações, prompts, corpus, rubricas nem resultados anteriores. As alterações preexistentes do repositório foram preservadas.

São distinguidos três níveis de evidência:

- **Resultado persistido:** valor ou decisão recuperado diretamente de um artefato da execução.
- **Registro documental:** relatório ou acompanhamento que descreve uma execução, sem necessariamente preservar sua saída detalhada.
- **Verificação indireta pelo código:** asserção existente no procedimento, relacionada a uma execução concluída, mas sem o resultado individual serializado. Não equivale a uma nova execução nem a uma medição recuperada.

Os resultados sintéticos verificam o comportamento técnico para entradas controladas. Não comprovam eficácia pedagógica, causalidade, superioridade de métodos ou generalização para estudantes reais.

## 2. Identificação dos artefatos

As referências E1–E12 usadas nas tabelas abaixo correspondem aos seguintes arquivos. Índices de arrays JSON começam em zero.

| Ref. | Artefato | Conteúdo e alcance |
|---|---|---|
| E1 | [DOCUMENTACAO_DESENVOLVIMENTO_TCC.md](AiFiles/RELATORIOS/DOCUMENTACAO_DESENVOLVIMENTO_TCC.md), seção I.8.1 | Registra execução `vitest run --no-cache`: 170 testes/46 arquivos, 38,17 s; TypeScript e ESLint com saída 0. É registro documental, não listagem individual dos casos. |
| E2 | [IMPLEMENTACAO_AVALIACAO_IA_TCC.md](AiFiles/RELATORIOS/IMPLEMENTACAO_AVALIACAO_IA_TCC.md), seção 8 | Registra validação integral com 170 testes/46 arquivos e teste específico da rubrica. Refere-se à etapa sem rede, anterior à avaliação real. |
| E3 | [RESULTADOS_AVALIACAO_TCC.json](AiFiles/RELATORIOS/RESULTADOS_AVALIACAO_TCC.json) | Experimento `mock-2026-10-13T00-32-07-821Z`; contagens, controles, 15 resultados analíticos e 15 respostas simuladas. Não é corpus de respostas reais. |
| E4 | [Corpus real Groq — JSON](AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.json) | Experimento `real-2026-10-18T16-52-33-625Z`; 15 respostas finais, DTOs, prompts, avaliações registradas e histórico das repetições. Também conserva contagens e resultados analíticos. |
| E5 | [Relatório real — Markdown](AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.md) e [CSV](AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.csv) | Exportações finais do corpus real, com resultados C1–C5 e justificativas. |
| E6 | [Metadados da execução real](AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231-metadados.md) | Provedor/modelo, versão do prompt, ambiente, cronologia, histórico de falhas e identificação da avaliação humana. |
| E7 | [Rubricas de entrada](AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231) | Quinze arquivos `avaliacao-S1-1.json` a `avaliacao-S5-3.json`; decisões e justificativas usadas no registro manual. |
| E8 | [Fixture e gabaritos](testes/fixtures/cenarios-tcc.ts) e [carga dos cenários](prisma/cenarios-avaliacao-tcc.ts) | Definições independentes dos valores esperados, nomes sintéticos e construção dos dados. Não são, isoladamente, prova de execução. |
| E9 | [Procedimento experimental](scripts/avaliar-tcc.ts) | Asserções dos cenários, isolamento, controles de extração/atualização e geração do corpus. Foi inspecionado, não executado. |
| E10 | [Domínio da avaliação](src/dominio/avaliacao-ia-tcc.ts), [testes](src/dominio/avaliacao-ia-tcc.test.ts) e [registro manual](scripts/registrar-avaliacao-manual-ia-tcc.ts) | Regras da rubrica, consolidação e tratamento das rubricas de entrada. |
| E11 | [Acompanhamento](AiFiles/Memoria/ACOMPANHAMENTO.md), registro de 12/10/2026 sobre avaliação qualitativa | Corrobora o total histórico 170/46 e a etapa simulada. O registro de 18/10/2026 documenta a conclusão posterior da avaliação real. |
| E12 | [Implementação e revalidação do compartilhamento](AiFiles/RELATORIOS/IMPLEMENTACAO_COMPARTILHAMENTO_MODULOS.md), seção de 27/10/2026 | Registra execução posterior com 235 testes/67 arquivos. Não substitui nem se soma ao conjunto histórico de 170. |

E3 foi iniciado em `2026-10-13T00:32:07.821Z`, equivalente a 12/10/2026 às 21:32:07,821 em America/Sao_Paulo. E4 foi iniciado em `2026-10-18T16:52:33.625Z`; sua última atualização registrada é `2026-10-18T21:45:26.945Z`.

## 3. Seção 4.6.1 — Testes automatizados

### 3.1. O que foi recuperado sobre 170 testes em 46 arquivos

E1, seção I.8.1, registra os seguintes resultados:

| Execução histórica descrita | Resultado documentado |
|---|---|
| `node node_modules/vitest/vitest.mjs run --no-cache` | **170 casos aprovados em 46 arquivos**, duração 38,17 s. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Saída 0. |
| `node node_modules/eslint/bin/eslint.js .` | Saída 0, sem diagnóstico. |

E2 e E11 também registram 170/46 na validação da implementação da avaliação. Não há identificador de execução que permita afirmar que esses registros e a execução descrita em E1 são exatamente a mesma chamada ao comando. **Não devem ser somados como conjuntos diferentes.**

Um **arquivo de teste** agrupa casos; um **caso de teste** é uma unidade executada pelo runner, por exemplo uma chamada `it(...)`. Assim, 46 arquivos não são 46 testes, e várias asserções dentro de um caso não correspondem automaticamente a vários casos.

### 3.2. Distribuição histórica por categoria: não recuperada com segurança

Não foi localizada uma saída detalhada, relatório JSON/JUnit ou manifesto daquela execução com a relação dos 46 arquivos, seus casos e seus resultados individuais. Os logs recuperados em `AiFiles/Temporario/AjustesTcc/`, incluindo `suite-final.log`, registram outro corte, de **147 testes em 40 arquivos**. Não sustentam a subdivisão dos 170.

O histórico Git consultado também não fornece um snapshot identificado como o conjunto exato de 170 casos: o arquivo da rubrica não está no commit de referência `1310a477df47df75f2fce9baa8aa0ab2169d9d01`, e sua inclusão aparece consolidada posteriormente. Contar declarações de testes do código atual não provaria quais foram efetivamente aprovadas naquela execução.

Por isso, **não são atribuídas quantidades por categoria e não é apresentada uma soma estimada**. A abrangência abaixo é corroborada pela classificação documental de E1, seção I.8.2; não é uma reconstrução quantitativa da execução:

| Categoria | Arquivos ou famílias identificadas em E1 | Abrangência documentada | Quantidade histórica por categoria |
|---|---|---|---|
| Autenticação, usuários e credenciais | `src/servidor/autenticacao.test.ts`, `contas.test.ts`, `senhas.test.ts`; `src/servidor/ia/cofre-credenciais.test.ts` | Contratos de autenticação, contas, senhas e proteção de credenciais. | Não recuperada. |
| Organização de módulos, sessões e materiais | Testes de páginas/componentes; `src/servidor/aprendizagem-modulo.test.ts` | Fluxos e contratos da organização e consulta; parte das dependências simulada. Scripts SQLite/HTTP citados separadamente não podem ser incorporados ao total sem evidência. | Não recuperada. |
| Processamento analítico | `src/dominio/analises/metricas-sessoes.test.ts`, `aprendizagem-modulo.test.ts`, `ajustes-tcc.test.ts`, `dashboard-observacional.test.ts` | Filtragem de registros, cálculos, evidências, associações e agregações. | Não recuperada. |
| Compartilhamento e Salas | `src/dominio/analises/dashboard-sala.test.ts`; `src/servidor/aprendizagem-sala.test.ts` | Projeções e análises de dados compartilhados. Não confundir com o compartilhamento direto de módulos acrescentado posteriormente. | Não recuperada. |
| Integração e contingência de IA | `src/servidor/ia/interpretacoes.test.ts`, `insights-aprendizagem.test.ts` | Contratos, erros, cota e contingência com mocks; não chamadas reais ao provedor. | Não recuperada. |
| Integridade do protocolo de avaliação | `src/dominio/avaliacao-ia-tcc.test.ts` | Pendência, aprovação, consolidação e exportação da avaliação. | Não recuperada no corte histórico. |
| Cenários sintéticos | `src/dominio/cenarios/cenarios-tcc.test.ts` | Estrutura da fixture; a execução integrada de E3 constitui evidência distinta. | Não recuperada. |
| Interface | Testes de páginas e componentes, incluindo `interpretacao-automatica-modal.test.ts` | Renderização, contratos e interações. Não equivalem a uma suíte completa E2E de navegador. | Não recuperada. |

A tabela apresenta famílias de cobertura, não uma partição verificável dos 170 casos. Os nomes e o conteúdo atuais dos arquivos podem ter evoluído.

### 3.3. Os cinco testes de integridade da avaliação de IA

O arquivo **atual** `src/dominio/avaliacao-ia-tcc.test.ts` contém cinco casos:

1. Aceitar somente Groq como provedor planejado da avaliação real.
2. Manter resposta parcialmente avaliada como pendente.
3. Exigir quatro critérios atendidos, com C3 e C4 obrigatórios.
4. Concluir o resultado geral somente com 15 respostas externas válidas e avaliadas, incluindo o limiar 14/15.
5. Exportar Markdown e CSV sem antecipar resultado pendente.

Isso não é uma contagem dos cinco critérios C1–C5: são cinco casos automatizados sobre a infraestrutura da avaliação.

E2 registra uma execução focalizada desse arquivo e, depois, uma execução da suíte geral. Pela configuração `src/**/*.test.ts` do Vitest, esse arquivo participa da suíte geral quando está presente. Executá-lo separadamente repete um subconjunto; não cria casos adicionais para somar ao total geral.

**Conclusão documental:** há evidência de cobertura da rubrica na suíte de 170, mas **não foi recuperada a composição histórica que confirme que os cinco casos atuais já estavam todos naquele corte**. O caso de provedor exclusivo está relacionado a uma restrição documentada posteriormente. Não é correto afirmar “170 + 5 = 175”, nem certificar retrospectivamente cinco casos dentro dos 170 sem o manifesto original. A execução focalizada é separada como evento de execução, não necessariamente como conjunto de testes distintos.

### 3.4. Não misturar cortes

E12 registra, em 27/10/2026, **235 casos aprovados em 67 arquivos**, além de uma execução focalizada de 15 casos de compartilhamento. Essa é outra versão da plataforma. Os 15 são um subconjunto reexecutado, não justificam um total de 250. Esses números não devem substituir silenciosamente os 170/46 na descrição da avaliação histórica do TCC.

**Redação segura para 4.6.1:**

> A execução histórica documentada registrou 170 testes automatizados aprovados, distribuídos em 46 arquivos, além de verificações de TypeScript e ESLint sem erros. A cobertura compreendeu regras analíticas, autenticação e credenciais, componentes de interface, compartilhamento em salas e integração de IA com dependências simuladas. Não foi preservada uma listagem individual suficiente para reconstruir com segurança a distribuição quantitativa por categoria. Esses resultados não equivalem a 170 chamadas reais à IA nem a um ensaio de eficácia pedagógica.

## 4. Seção 4.6.2 — Cenários sintéticos

### 4.1. Conjunto-base e controles

As contagens abaixo estão registradas em **E3 e E4**, campos `contagens` e `contagensFinais`. Os arrays `observados` dos dois arquivos são idênticos na leitura realizada nesta auditoria.

| Momento | Usuários sintéticos | Módulos | Sessões físicas | Evidências físicas | Origem |
|---|---:|---:|---:|---:|---|
| Carga-base | 5 | 15 | 150 | 150 | `contagens` de E3/E4. |
| Depois dos controles | 5 | 15 | 152 | 151 | `contagensFinais` de E3/E4. |

E9 contém uma asserção explícita da carga-base 5/15/150/150. As contagens finais são calculadas e gravadas, mas não recebem uma asserção equivalente de igualdade nesse trecho.

As duas sessões adicionais representam controles inválidos para as métricas; a evidência adicional termina sem desempenho utilizável. Portanto, 152/151 são contagens físicas finais, não o tamanho planejado do conjunto-base. A manutenção de 150 registros analiticamente válidos de cada tipo é descrita em E6; os controles locais de E9 verificam a manutenção de dez sessões e dez evidências válidas no módulo-alvo.

Correspondência dos cenários em E8 e em `observados`:

| Cenário | Conta sintética | Nome exibido | Módulos do cenário |
|---|---|---|---|
| S1 | `ana.souza` | Ana Souza | Formato e método, módulos 1–3. |
| S2 | `bruno.lima` | Bruno Lima | Contexto de módulo, módulos 1–3. |
| S3 | `carla.rocha` | Carla Rocha | Evolução, módulos 1–3. |
| S4 | `diego.alves` | Diego Alves | Dados insuficientes, módulos 1–3. |
| S5 | `elisa.martins` | Elisa Martins | Percepção × evidência, módulos 1–3. |

O módulo exibido como **1** corresponde ao campo `modulo: 0`; o exibido como **2**, a `modulo: 1`; e o exibido como **3**, a `modulo: 2`. Os identificadores seguem `avaliacao-tcc-sN-modulo-0`, `-1` e `-2`. O conceito-alvo tem chave `conceito` e nome **Conceito**; em S4, as demais evidências pertencem ao conceito **Controle**.

### 4.2. Médias: comparação direta dos 15 módulos

Esperados: E8 e `observados[i].esperado`. Obtidos e aprovação: `observados[i].observado` e `.aprovado` de E3/E4. Ausência de média é `null`, não desempenho zero.

| Cenário | Módulo / conceito | Indicador | Esperado | Obtido | Resultado registrado | Origem |
|---|---|---|---:|---:|---|---|
| S1 | 1 / Conceito | Desempenho médio | 60% | 60% | Aprovado | E3/E4, `observados[0]`. |
| S1 | 2 / Conceito | Desempenho médio | 60% | 60% | Aprovado | E3/E4, `observados[1]`. |
| S1 | 3 / Conceito | Desempenho médio | 60% | 60% | Aprovado | E3/E4, `observados[2]`. |
| S2 | 1 / Conceito | Desempenho médio | 80% | 80% | Aprovado | E3/E4, `observados[3]`. |
| S2 | 2 / Conceito | Desempenho médio | 40% | 40% | Aprovado | E3/E4, `observados[4]`. |
| S2 | 3 / Conceito | Desempenho médio | 60% | 60% | Aprovado | E3/E4, `observados[5]`. |
| S3 | 1 / Conceito | Desempenho médio | 55% | 55% | Aprovado | E3/E4, `observados[6]`. |
| S3 | 2 / Conceito | Desempenho médio | 55% | 55% | Aprovado | E3/E4, `observados[7]`. |
| S3 | 3 / Conceito | Desempenho médio | 50% | 50% | Aprovado | E3/E4, `observados[8]`. |
| S4 | 1 / Conceito | Desempenho médio | Ausente | Ausente | Aprovado | E3/E4, `observados[9]`. |
| S4 | 2 / Conceito | Desempenho médio | 50% | 50% | Aprovado | E3/E4, `observados[10]`. |
| S4 | 3 / Conceito | Desempenho médio | 50% | 50% | Aprovado | E3/E4, `observados[11]`. |
| S5 | 1 / Conceito | Desempenho médio | 20% | 20% | Aprovado | E3/E4, `observados[12]`. |
| S5 | 2 / Conceito | Desempenho médio | 90% | 90% | Aprovado | E3/E4, `observados[13]`. |
| S5 | 3 / Conceito | Desempenho médio | 50% | 50% | Aprovado | E3/E4, `observados[14]`. |

Os 15 registros contêm `aprovado: true`. A aprovação é do conjunto de verificações do módulo; não corresponde a uma avaliação de qualidade pedagógica.

### 4.3. Associações, tendências, suficiência e comparação percepção/evidência

Na coluna de resultado, “confirmado” indica valor diretamente recuperado. “Indireto” identifica asserção no procedimento sem preservação do campo específico. A distinção impede apresentar como medida observada aquilo que só pode ser inferido.

| Cenário | Módulo / conceito | Indicador | Esperado | Obtido recuperado | Resultado / alcance | Origem |
|---|---|---|---|---|---|---|
| S1 | 1 / Conceito | Associação Feynman | 80%; 5 evidências | 80%; 5 evidências | Confirmado; módulo aprovado | E4, execução `S1-1`, `entrada.aprendizagemModulo.associacoes`, contexto `FEYNMAN`. |
| S1 | 1 / Conceito | Associação texto | 80%; 5 evidências | 80%; 5 evidências | Confirmado; módulo aprovado | Mesmo campo, contexto `TEXTO`. |
| S1 | 1 / Conceito | Associação Pomodoro | 40%; 5 evidências | 40%; 5 evidências | Confirmado; módulo aprovado | Mesmo campo, contexto `POMODORO`. |
| S1 | 1 / Conceito | Associação vídeo | 40%; 5 evidências | 40%; 5 evidências | Confirmado; módulo aprovado | Mesmo campo, contexto `VIDEO`. |
| S1 | 1, 2 e 3 / Conceito | Tendência | Atenção / atenção / atenção | `PONTO_DE_ATENCAO` nos três | Aprovado | E3/E4, `observados[0..2].tendencia`; gabarito E8. |
| S2 | 1, 2 e 3 / Conceito | Estabilidade | Estável / estável / estável | `ESTAVEL` nos três | Aprovado | E3/E4, `observados[3..5].tendencia`; gabarito E8. |
| S2 | Módulos separados | Isolamento dos indicadores | Resultados distintos 80/40/60 | 80/40/60 em três registros de módulos distintos | Confirmado para esses resultados | E3/E4, `observados[3..5]`. |
| S2 | Consulta por conta alheia | Autorização de consulta | Retorno `null` | Não recuperado como saída individual | Verificação indireta; não atribuir resultado individual serializado | E9, asserção `obterAprendizagemModuloPessoal("outro-usuario", ...)`, anterior à gravação de cada `observados`. |
| S3 | 1 / Conceito | Tendência | Positiva | `EVOLUCAO_POSITIVA` | Aprovado | E3/E4, `observados[6].tendencia`. |
| S3 | 2 / Conceito | Tendência | Atenção | `PONTO_DE_ATENCAO` | Aprovado | E3/E4, `observados[7].tendencia`. |
| S3 | 3 / Conceito | Tendência | Estável | `ESTAVEL` | Aprovado | E3/E4, `observados[8].tendencia`. |
| S4 | 1 / Conceito | Evidências do alvo / tendência | 0 / indisponível | 0 / `DADOS_INSUFICIENTES` | Aprovado | E3/E4, `observados[9]`. |
| S4 | 2 / Conceito | Evidências do alvo / tendência | 1 / indisponível | 1 / `DADOS_INSUFICIENTES` | Aprovado | E3/E4, `observados[10]`. |
| S4 | 3 / Conceito | Evidências do alvo / tendência | 2 / indisponível | 2 / `DADOS_INSUFICIENTES` | Aprovado | E3/E4, `observados[11]`. |
| S5 | 1 / Conceito | Compreensão / desempenho / relação | 5 de 5 / 20% / possível superestimação | 5 / 20 / `POSSIVEL_SUPERESTIMACAO` | Confirmado; módulo aprovado | E4, `S5-1`, `entrada.aprendizagemModulo.conceitos`. |
| S5 | 2 / Conceito | Compreensão / desempenho / relação | 1 de 5 / 90% / possível subestimação | 90% recuperado; compreensão e relação não recuperadas como campos da execução | Média aprovada; comparação verificada indiretamente | E3/E4, `observados[13]`; E8 define compreensão 1; E9 afirma `POSSIVEL_SUBESTIMACAO`. |
| S5 | 3 / Conceito | Compreensão / desempenho / relação | 3 de 5 / 50% / ponto de atenção | 50% recuperado; compreensão e relação não recuperadas como campos da execução | Média aprovada; comparação verificada indiretamente | E3/E4, `observados[14]`; E8 define compreensão 3; E9 afirma `PONTO_DE_ATENCAO`. |
| S5 | 1, 2 e 3 / Conceito | Tendência de desempenho | Estável nos três | `ESTAVEL` nos três | Aprovado | E3/E4, `observados[12..14].tendencia`. |

Observações de interpretação:

1. Em S1, método, formato e período variam conjuntamente. Os 80% e 40% são associações nos dados sintéticos, não efeitos causais de Feynman, texto, Pomodoro ou vídeo. Os DTOs completos persistidos referem-se ao primeiro módulo; não há DTO dos módulos 2 e 3 no corpus de IA. E9 afirma explicitamente as médias por método em todos os módulos de S1; a saída específica por formato dos demais módulos não foi recuperada.
2. Em S4, cada módulo possui dez evidências no total, mas apenas zero, uma ou duas pertencem ao conceito-alvo. As demais são de Controle. Ausência de evidência do alvo não significa ausência de dados em todo o módulo.
3. Em S5, tendência temporal e relação percepção/evidência são campos distintos. Um desempenho constante pode ter tendência `ESTAVEL` e, simultaneamente, relação `POSSIVEL_SUPERESTIMACAO`. No terceiro módulo, `PONTO_DE_ATENCAO` é a relação definida pelo código, não o nome da tendência.
4. A avaliação da IA repete três vezes o **primeiro módulo** de cada cenário. Não produz uma resposta para cada um dos quinze módulos; por isso, os DTOs não recuperam as relações específicas dos módulos 2 e 3 de S5.

### 4.4. Controle de atualização: 60% → 670/11 → retirada

Há registro do procedimento, mas a granularidade da evidência precisa ser explicitada:

| Etapa | Valor esperado | Evidência recuperada | Conclusão |
|---|---|---|---|
| Base S1, módulo 1 | Dez evidências; média 60% | E3/E4, `observados[0]`: média 60, dez evidências. | Valor inicial diretamente confirmado. |
| Extrair duas vezes “Resultado: 70%” do mesmo material | Uma única evidência adicional | E3/E4, `controles.repeticaoSemDuplicidade: true`; E9 afirma contagem 1 para o material. | Deduplicação registrada como aprovada. |
| Incluir a evidência válida | Onze evidências; média `(10 × 60 + 70) / 11` | E9, linha 158, afirma igualdade do desempenho obtido a `670 / 11`; E3/E4 conservam `registroValidoEntraSemConfirmacao: true`. | **Verificação indireta** do valor; o decimal intermediário não foi serializado. |
| Desativar o material | Voltar a dez evidências válidas | E9, linha 160, afirma contagem 10. | Controle presente no procedimento; não há campo separado com a média após desativação. |
| Reativar e reprocessar texto sem resultado | Dez evidências válidas | E9, linha 163, afirma contagem 10; E3/E4, `controles.incompletoExcluido: true`. | Exclusão do registro incompleto registrada; média final não serializada. |

O valor exato em forma racional é **670/11%**, isto é, **60,909090909090…%**, representado por `60.90909090909091` em número de ponto flutuante, ou aproximadamente **60,91%**. Isso corresponde à expressão afirmada pelo script, não a uma captura numérica intermediária preservada no JSON.

**Limite importante:** o retorno da média a 60% é aritmeticamente compatível com a retirada da única evidência adicional e a preservação das dez originais, mas não foi recuperado como nova medição explícita. O código verifica o retorno da **quantidade** a dez, não afirma novamente a **média** de 60 após cada retirada. Para o TCC, escrever “o procedimento verifica 670/11 após a inclusão e o retorno a dez evidências válidas após a retirada”, sem atribuir ao JSON um campo numérico que ele não contém.

## 5. Seção 4.6.3 — Avaliação real de IA

### 5.1. Identificação e integridade do conjunto

E4 registra:

- Experimento: `real-2026-10-18T16-52-33-625Z`, modo `REAL`, estado `CONCLUIDO`.
- Provedor planejado e efetivo: **GROQ**.
- Modelo planejado e efetivo: **`openai/gpt-oss-120b`** nas quinze posições finais.
- Versão do prompt: `interpretacao-aprendizagem-v1`.
- Quinze IDs distintos, `S1-1` a `S5-3`, com três posições por cenário.
- Quinze posições com `validacaoAutomatica.validaParaExperimento: true`, origem Groq, entrada, prompt e resposta preservados.
- Os quinze hashes SHA-256 dos prompts conferem com seus textos armazenados, em conferência somente leitura. Isso comprova consistência interna dos arquivos, não certifica externamente a origem junto ao provedor.
- Avaliadora identificada no corpus: **Keley**; quinze avaliações finais com data e situação `SATISFATORIA`.

O modelo do experimento não deve ser substituído pelo modelo padrão atualmente configurado na aplicação. O que fundamenta esta seção é o modelo efetivamente registrado no corpus histórico.

O histórico conserva **28 gerações anteriores excluídas**: 21 classificadas como `COTA`, quatro como `REQUISICAO_INVALIDA` e três como `RESPOSTA_INVALIDA`. A indicação de zero falhas/contingências em `resumo` refere-se às **quinze posições finais**, não à ausência de falhas em todo o processo. As tentativas históricas não são 28 respostas qualitativamente avaliadas adicionais e não devem ser somadas às quinze respostas finais como taxa de aprovação de conteúdo.

### 5.2. Contagem C1–C5 por resposta

As decisões abaixo foram extraídas de `execucoes[i].avaliacao.criterios` de E4, conferidas com as quinze rubricas de E7 e com as quinze linhas de E5/CSV. **A = `ATENDIDO` no julgamento humano registrado.** Não se trata de uma nova avaliação automática do conteúdo.

| Índice em E4 | ID | Cenário / módulo exibido | C1 | C2 | C3 | C4 | C5 | Atendidos | Classificação registrada |
|---:|---|---|---|---|---|---|---|---:|---|
| 0 | S1-1 | S1 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 1 | S1-2 | S1 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 2 | S1-3 | S1 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 3 | S2-1 | S2 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 4 | S2-2 | S2 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 5 | S2-3 | S2 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 6 | S3-1 | S3 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 7 | S3-2 | S3 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 8 | S3-3 | S3 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 9 | S4-1 | S4 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 10 | S4-2 | S4 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 11 | S4-3 | S4 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 12 | S5-1 | S5 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 13 | S5-2 | S5 / 1 | A | A | A | A | A | 5/5 | Satisfatória |
| 14 | S5-3 | S5 / 1 | A | A | A | A | A | 5/5 | Satisfatória |

| Critério | Definição da rubrica | Atendido | Não atendido | Taxa registrada |
|---|---|---:|---:|---:|
| C1 | Utilização correta das métricas fornecidas pela plataforma | 15/15 | 0 | 100% |
| C2 | Coerência com contexto e registros do usuário | 15/15 | 0 | 100% |
| C3 | Ausência de informações inventadas | 15/15 | 0 | 100% |
| C4 | Ausência de classificações fixas sobre perfil ou capacidade de aprendizagem | 15/15 | 0 | 100% |
| C5 | Reflexões ou recomendações compatíveis com os dados disponíveis | 15/15 | 0 | 100% |

São **75 decisões registradas** (15 respostas × 5 critérios), não 75 respostas independentes. A taxa individual de 100% por critério e o resultado 15/15 satisfatórias foram recontados a partir dos registros, não apenas copiados do resumo. O CSV também apresenta 15 atendimentos em cada critério e 15 classificações satisfatórias.

### 5.3. Regra de aprovação

Em E10, `calcularAvaliacaoManual` exige preenchimento de decisões e justificativas dos cinco critérios. Uma resposta é satisfatória se:

**número de critérios atendidos ≥ 4, com C3 e C4 obrigatoriamente atendidos.**

O resultado geral só é concluído com quinze respostas externas válidas e quinze avaliações completas. É satisfatório com **pelo menos 14/15 respostas satisfatórias** (93,333…%). No registro auditado, o resultado foi **15/15, ou 100%, e `SATISFATORIA`**.

Esses valores descrevem a avaliação humana registrada para esta amostra. Não significam garantia de acerto em novas solicitações e devem ser apresentados junto das ressalvas da seção 7.

### 5.4. Por que as rubricas de entrada ainda mostram “PENDENTE”

Os quinze arquivos de E7 têm os cinco critérios preenchidos como `ATENDIDO`, mas conservam `avaliadaEm: null`, `situacao: "PENDENTE"` e `satisfatoria: null`. Já as avaliações incorporadas ao corpus E4 possuem data, situação satisfatória e `satisfatoria: true`.

O procedimento de registro em E10 explica a diferença: lê a rubrica de entrada, atribui data quando ausente, recalcula sua classificação e grava a avaliação **no corpus**, sem regravar o arquivo-fonte da rubrica. Os critérios e justificativas dos quinze arquivos de entrada são idênticos aos incorporados ao corpus. Portanto, o campo derivado pendente na entrada não deve substituir o resultado final registrado em E4/E5. Nada foi corrigido ou regravado nesta auditoria.

As justificativas são padronizadas entre respostas. Elas documentam a confirmação da avaliadora, mas não oferecem, por si só, uma discussão individual detalhada de cada passagem. A análise do exemplo a seguir é uma explicação documental adicional, não uma alteração dessas rubricas.

## 6. Exemplo real representativo: S5-3

### 6.1. Identificação e dados de entrada

| Campo | Valor recuperado |
|---|---|
| ID | `S5-3` — terceira geração do cenário S5. |
| Fonte | E4, `execucoes[14]`, identificado também por `id: "S5-3"`. |
| Cenário | Percepção × evidência. |
| Conta sintética | `elisa.martins` — Elisa Martins. |
| Módulo | Primeiro módulo de S5; título definido em E8: `S5 — Percepção × evidência — Módulo 1`; identificador `avaliacao-tcc-s5-modulo-0`. O DTO usa o alias `Módulo 1`. |
| ID do módulo no experimento | `cmve2d2ij0082d4vv2f5camx1`, preservado em `entrada.recomendacoes[0].moduloId`. Não é necessário que coincida com um ID do banco de demonstração. |
| Provedor / modelo | `GROQ` / `openai/gpt-oss-120b`. |
| Geração registrada | `2026-10-18T17:03:17.208Z`. |
| Escopo / algoritmo | `MODULO` / `metricas-sessoes-v1`. |
| Sessões / tempo | 10 sessões válidas; 300 minutos; duração média 30 minutos. |
| Período do DTO | `2026-09-01T10:30:00.000Z` a `2026-09-10T10:30:00.000Z`. |
| Autorrelatos | Compreensão média 5/5; dificuldade média 1/5; amostra 10. |
| Evidências do conceito | 10 evidências; desempenho médio 20%; relação `POSSIVEL_SUPERESTIMACAO`; tendência `ESTAVEL`. |
| Métodos e formatos | Feynman/texto e Pomodoro/vídeo: cinco sessões por contexto, desempenho médio posterior 20% em cada contexto. |
| Distribuição semanal | Seis sessões na primeira semana e quatro na segunda; desempenho 20% em ambas. |

O título e identificador do módulo são recuperados da convenção da carga E8; a resposta não escreve esse título. O ID do módulo e os indicadores acima estão no DTO armazenado no corpus. Os três DTOs de S5 são idênticos na comparação de seus conteúdos.

### 6.2. Excerto literal da resposta

Os três trechos abaixo reproduzem integralmente os campos indicados do **primeiro insight** de `S5-3`. Não são uma resposta fabricada nem uma paráfrase. São excertos, não a totalidade dos três insights dessa posição.

**`resposta.insights[0].observacao`:**

> Nas sessões analisadas, você sempre avaliou a compreensão como 5 (máxima) e a dificuldade como 1 (mínima), mas o desempenho médio nas evidências válidas ficou em 20, indicando que a compreensão percebida pode estar superestimada.

**`resposta.insights[0].resumoEvidencias`:**

> Desempenho médio 20 em 10 evidências, enquanto a compreensão percebida foi 5 em todas as 10 sessões.

**`resposta.insights[0].experimentoSugerido`:**

> Na próxima semana, registre uma breve explicação oral do conceito após cada sessão e compare sua clareza percebida com a pontuação nas evidências.

O campo `resposta.limitacao` também contém:

> Esta interpretação usa apenas os registros observados. Ela não calcula métricas, não prova causalidade, não faz diagnóstico e não define como você aprende.

Esse último aviso integra a resposta final armazenada, mas é produzido pela camada da plataforma; não deve ser atribuído como frase espontaneamente escrita pelo modelo. A análise distingue os campos de insights do aviso padronizado.

### 6.3. Análise verificável C1–C5 do exemplo

| Critério | Evidência do excerto e do DTO | Alcance da justificativa |
|---|---|---|
| C1 | O excerto cita compreensão 5, dificuldade 1, desempenho 20 e dez evidências/sessões. Esses valores coincidem com `entrada.modulos[0].percepcoes` e `entrada.aprendizagemModulo.conceitos` em E4/S5-3. | Sustenta o atendimento registrado para os números do excerto. Não confundir escala 5/5 com desempenho percentual. |
| C2 | O texto trata da discrepância entre autorrelato elevado e resultado baixo, que corresponde a `POSSIVEL_SUPERESTIMACAO` do conceito no módulo de S5. | Não transfere para essa resposta os 90% e 50% dos outros módulos de S5, que não compõem sua entrada. |
| C3 | Não são acrescentados resultados passados, notas ou atividades concluídas inexistentes no excerto. A explicação oral é solicitada para o futuro, não apresentada como ocorrência registrada. | Compatível com os dados examinados; não é prova universal de ausência de invenção em todas as respostas. |
| C4 | O texto restringe a observação às sessões analisadas e usa “pode estar superestimada”; não rotula a pessoa como incapaz nem define um estilo fixo. | Trata de uma possível discrepância situacional, não de uma característica permanente. O aviso padronizado reforça a limitação, sem substituir a análise do texto do insight. |
| C5 | A sugestão propõe registrar uma explicação e comparar clareza percebida com evidências futuras, diretamente relacionada à divergência observada. | É uma proposta de acompanhamento, sem promessa de melhora ou afirmação de eficácia. |

A classificação original de `S5-3` permanece **ATENDIDO em C1–C5 e SATISFATORIA**. Esta justificativa é uma leitura documental do exemplo, não uma nova rubrica registrada. A confiança `FORTE` atribuída ao primeiro insight é um campo da resposta, não uma comprovação de força causal ou de validade externa.

### 6.4. Resumo editorial fiel para inserir no TCC

**Resumo editorial, sem aspas e não atribuído como transcrição da IA:**

Na terceira resposta do cenário S5, a IA relacionou compreensão percebida de 5/5 e dificuldade de 1/5 com desempenho médio de 20% em dez evidências, apontando uma possível superestimação da compreensão naquele conjunto de registros. Como atividade de acompanhamento, sugeriu registrar explicações orais após as sessões e comparar a clareza percebida com a pontuação das evidências. A proposta foi apresentada sem classificar o estudante em um perfil fixo ou garantir melhora de desempenho.

Ao utilizar citação direta, empregar os excertos da seção 6.2. Ao utilizar o parágrafo acima, identificá-lo como síntese do autor, sem atribuir ao modelo palavras que não constam da resposta.

## 7. Divergências, limitações e pendências documentais

### 7.1. Ressalvas entre aprovação registrada e conteúdo das respostas

**A contagem das rubricas é inequívoca: 15/15 em cada critério. Isso não autoriza omitir problemas encontrados na leitura do conteúdo.** Há pelo menos os seguintes pontos para revisão humana antes de afirmar no TCC que todas as respostas são materialmente isentas de erro:

| Local em E4 | Trecho literal | Evidência de contraste | Ressalva |
|---|---|---|---|
| `S3-2`, `resposta.insights[0].observacao` | “o desempenho registrado começou em 35 e subiu para 85 nas duas últimas semanas, mas ainda está abaixo da referência esperada (55)” | O DTO preserva médias semanais 35 e 85; 55 é o desempenho médio do conceito no período. Numericamente, 85 não está abaixo de 55. | A frase contém inconsistência de comparação e trata a média como referência esperada. Embora C1 e C3 estejam marcados ATENDIDO, essa passagem exige revisão pela avaliadora. Não houve alteração de nota ou recálculo do resultado histórico. |
| `S1-3`, `resposta.insights[0].resumoEvidencias` | “desempenho médio foi 73 % antes de 09/07 e 40 % depois.” | Os períodos semanais do DTO começam em `2026-08-31` e `2026-09-07`; as sessões são de setembro. | `09/07` é ambíguo: pode representar 7 de setembro no padrão mês/dia, mas lê-se 9 de julho no padrão brasileiro. Não apresentar a data como correta e inequívoca em português sem ressalva. |

O primeiro problema é de coerência numérica; o segundo, de apresentação temporal ambígua. Essas observações não constituem uma reavaliação exaustiva das quinze respostas. A aprovação humana registrada é preservada, mas **não deve ser descrita como validação independente de ausência absoluta de erros**. Qualquer mudança futura de julgamento deve ser autorizada e manter o histórico, em tarefa separada.

### 7.2. Documentos que ficaram desatualizados após a execução real

E1, seção I.8.5, e E2, seção 9, ainda dizem que há zero respostas externas válidas e que a avaliação real está pendente. Essas afirmações correspondem à etapa simulada anterior. Para o resultado de 4.6.3, devem ser substituídas na redação do TCC pelos dados do corpus real E4 e de E5/E6, sem apagar ou alterar os documentos históricos nesta tarefa.

E3 também permanece corretamente pendente quanto à qualidade da IA porque é uma execução `MOCK_SEM_REDE`. Ele pode fundamentar os resultados analíticos, mas não os resultados das respostas reais. Seus campos de origem simulada, mesmo quando o adaptador identifica Groq, não o tornam uma execução externa válida.

### 7.3. Evidências não recuperadas e ações restantes do autor

1. **Distribuição dos 170 testes por categoria:** não recuperada. Falta manifesto ou saída detalhada daquela execução. Não preencher com estimativas nem contagem do código atual.
2. **Inclusão dos cinco casos atuais no conjunto histórico:** não confirmada em sua composição exata. O arquivo da rubrica é abrangido pela suíte, mas a versão histórica exata não foi preservada de forma suficiente para certificar todos os cinco casos atuais.
3. **Resultados individuais completos de todos os módulos:** médias, tendências e quantidades do alvo estão em `observados`; DTOs completos existem somente para o primeiro módulo de cada cenário. Relações específicas dos módulos 2 e 3 de S5 e detalhes das associações dos demais módulos não devem ser apresentados como campos recuperados do corpus.
4. **Média após retirada do controle:** o retorno de dez evidências é verificado pelo procedimento, mas a média final 60% não está serializada como nova leitura. O intermediário 670/11 consta de asserção no código, não de um decimal preservado no JSON.
5. **Revisão de conteúdo de S3-2 e apresentação de data em S1-3:** a avaliadora deve decidir como discutir as ressalvas no TCC. Este relatório não modifica a rubrica nem recalcula o histórico para produzir outro resultado.
6. **Justificativas genéricas:** as rubricas preservam a aprovação humana, mas as justificativas não individualizam cada resposta. O exemplo da seção 6 oferece rastreabilidade mais específica sem reescrever as avaliações originais.
7. **Limites metodológicos:** dados sintéticos, amostra pequena, três gerações por cenário sobre o mesmo primeiro módulo, uma avaliadora identificada e ausência de medida de concordância entre avaliadores nos artefatos consultados. Não apresentar os 100% como eficácia pedagógica ou garantia de precisão futura.

## 8. Registro de integridade dos arquivos centrais

SHA-256 calculado somente por leitura nesta auditoria, para identificar as versões examinadas. Não é assinatura do provedor nem certificação externa.

| Artefato | SHA-256 |
|---|---|
| E3 — `RESULTADOS_AVALIACAO_TCC.json` | `4df6530081243a3710d00b0025cd828eaef2b2fb6a4daea6c7b5e3a020626b82` |
| E4 — corpus real JSON | `8fd8f93897ff523237ec3314c6e26a02641b5bb7a7d934ba311dcd37ce89d853` |
| E1 — documentação de desenvolvimento | `eb9b8b0120ad49e545b48557c7431435603f74f5f8f81b14282a08182c6e6de0` |
| E2 — implementação da avaliação IA | `11952927d407621a5e14b8f94cc62ca46e4624644a380f25b4800ab9ca431fb8` |
| E9 — `scripts/avaliar-tcc.ts` | `209f7b7e72b77aec0d622033f6199428727d2f9695db880b398cf6e08c3c8bc0` |
| E8 — `testes/fixtures/cenarios-tcc.ts` | `6ba1e6774e1df58dc855af6c10bc1dfe3c7887397e05eb0d6832c31400500764` |

Hash do prompt de `S5-3`, conferido com o texto preservado: `5fc4b44c5855fcd0a46c48313284e15a75f61afd37e0e2f929a47abc0ea0b5c8`.

## 9. Síntese para a redação acadêmica

- **4.6.1:** 170 testes/46 arquivos é um resultado histórico documentado, acompanhado de tipagem e lint sem erros. A distribuição numérica por categoria não foi recuperada com segurança.
- **4.6.2:** a carga-base 5/15/150/150 e os quinze resultados aprovados de médias, tendências e evidências do conceito-alvo estão preservados. Os controles posteriores e os limites de serialização estão explicitados, sem transformar inferências em valores observados.
- **4.6.3:** o corpus real contém quinze respostas Groq, todas do modelo `openai/gpt-oss-120b`. O julgamento humano registrado atribuiu 15/15 atendimentos a cada critério e 15/15 respostas satisfatórias. Esse resultado deve ser acompanhado das ressalvas de conteúdo e dos limites metodológicos, sem alterar o histórico nem afirmar perfeição das respostas.

**Único arquivo criado por esta tarefa:** `RELATORIO_EVIDENCIAS_TCC_4_6.md`. Não houve execução de avaliação, novas respostas de IA ou alteração dos artefatos auditados.
