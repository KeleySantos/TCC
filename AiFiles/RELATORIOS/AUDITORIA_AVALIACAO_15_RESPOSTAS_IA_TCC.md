# Auditoria documental — Avaliação individual das 15 respostas de IA do TCC

A revisão documental de 28 de outubro de 2026 reproduz o resultado informado para a Seção 4.6.3. Foram 14 respostas satisfatórias em 15 (93,33%). A avaliação inicial de 18 de outubro registrava 15 satisfatórias. As duas versões se referem às mesmas gerações.

## 1. Fontes documentais utilizadas

| Ref. | Arquivo ou conjunto | Papel documental |
| --- | --- | --- |
| F1 | [real-groq-gpt-oss-120b-20261018-165231.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.json) | Corpus original com as 15 entradas, prompts, respostas, tentativas e avaliações registradas em 18/10. |
| F2 | [15 rubricas de entrada, identificadas individualmente na seção 9](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S1-1.json) | Julgamentos e justificativas iniciais de C1–C5. |
| F3 | [real-groq-gpt-oss-120b-20261018-165231.md](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.md), [real-groq-gpt-oss-120b-20261018-165231.csv](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.csv), [real-groq-gpt-oss-120b-20261018-165231-metadados.md](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231-metadados.md) | Exportações e metadados da execução original. Registram 15/15 satisfatórias. |
| F4 | [avaliacao-revisada-S1-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/avaliacao-revisada-S1-3.json), [avaliacao-revisada-S3-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/avaliacao-revisada-S3-2.json) | Rubricas de entrada da revisão autorizada. |
| F5 | [revisao-documental-20261028-r01.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/revisao-documental-20261028-r01.json) | Corpus consolidado final escolhido para a conferência da Seção 4.6.3. |
| F6 | [revisao-documental-20261028-r01.csv](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/revisao-documental-20261028-r01.csv), [revisao-documental-20261028-r01.md](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/revisao-documental-20261028-r01.md) | Exportações do resultado revisado. |
| F7 | [metadados-revisao-documental-20261028-r01.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/metadados-revisao-documental-20261028-r01.json) | Manifesto da revisão, com estados anterior e novo, autorização, datas e hashes. |
| F8 | [AUDITORIA_DOCUMENTAL_S3_2_S1_3_TCC.md](C:/Codigos/TCC/AiFiles/RELATORIOS/AUDITORIA_DOCUMENTAL_S3_2_S1_3_TCC.md), [RELATORIO_EVIDENCIAS_TCC_4_6.md](C:/Codigos/TCC/RELATORIO_EVIDENCIAS_TCC_4_6.md), [RELATORIO_REVISAO_FINAL_AVALIACAO_IA_TCC.md](C:/Codigos/TCC/RELATORIO_REVISAO_FINAL_AVALIACAO_IA_TCC.md) | Relatórios de apoio que descrevem as ocorrências e a consolidação. Os julgamentos foram conferidos nas rubricas e nos corpora. |

## 2. Identificação das 15 respostas

O experimento `real-2026-10-18T16-52-33-625Z` começou em `2026-10-18T16:52:33.625Z`. Todas as 15 respostas selecionadas registram origem `GROQ`, modelo `openai/gpt-oss-120b`, prompt `interpretacao-aprendizagem-v1` e validação automática para inclusão. O histórico armazena 28 tentativas anteriores fora desse conjunto (21 COTA, 4 REQUISICAO_INVALIDA e 3 RESPOSTA_INVALIDA, conforme F3).

Cada cenário usa seu primeiro módulo, apresentado como “Módulo 1” em `entrada.modulos[0].referencia`. As três repetições de um cenário se referem a esse mesmo módulo. O ID abaixo consta em `entrada.recomendacoes[].moduloId` no corpus. O índice se refere ao array `execucoes` de F1 e F5 e começa em zero.

| Resposta | Cenário | Repetição | ID do Módulo 1 | Geração (UTC) | Índice |
| --- | --- | --- | --- | --- | --- |
| S1-1 | S1 — Formato e método | 1 | `cmve2czfs0005d4vvn0e2vumi` | `2026-10-18T16:52:39.698Z` | 0 |
| S1-2 | S1 — Formato e método | 2 | `cmve2czfs0005d4vvn0e2vumi` | `2026-10-18T16:54:27.027Z` | 1 |
| S1-3 | S1 — Formato e método | 3 | `cmve2czfs0005d4vvn0e2vumi` | `2026-10-18T16:54:49.333Z` | 2 |
| S2-1 | S2 — Contexto de módulo | 1 | `cmve2d03r0025d4vvl32gu9jr` | `2026-10-18T16:52:41.995Z` | 3 |
| S2-2 | S2 — Contexto de módulo | 2 | `cmve2d03r0025d4vvl32gu9jr` | `2026-10-18T16:55:11.670Z` | 4 |
| S2-3 | S2 — Contexto de módulo | 3 | `cmve2d03r0025d4vvl32gu9jr` | `2026-10-18T16:55:54.777Z` | 5 |
| S3-1 | S3 — Evolução | 1 | `cmve2d0vg0045d4vv5au0ehdb` | `2026-10-18T16:56:41.687Z` | 6 |
| S3-2 | S3 — Evolução | 2 | `cmve2d0vg0045d4vv5au0ehdb` | `2026-10-18T16:57:04.089Z` | 7 |
| S3-3 | S3 — Evolução | 3 | `cmve2d0vg0045d4vv5au0ehdb` | `2026-10-18T16:58:09.965Z` | 8 |
| S4-1 | S4 — Dados insuficientes | 1 | `cmve2d1um0065d4vvwd7sc6yl` | `2026-10-18T16:58:53.122Z` | 9 |
| S4-2 | S4 — Dados insuficientes | 2 | `cmve2d1um0065d4vvwd7sc6yl` | `2026-10-18T16:59:15.380Z` | 10 |
| S4-3 | S4 — Dados insuficientes | 3 | `cmve2d1um0065d4vvwd7sc6yl` | `2026-10-18T16:59:58.488Z` | 11 |
| S5-1 | S5 — Percepção × evidência | 1 | `cmve2d2ij0082d4vv2f5camx1` | `2026-10-18T17:01:04.708Z` | 12 |
| S5-2 | S5 — Percepção × evidência | 2 | `cmve2d2ij0082d4vv2f5camx1` | `2026-10-18T17:02:11.152Z` | 13 |
| S5-3 | S5 — Percepção × evidência | 3 | `cmve2d2ij0082d4vv2f5camx1` | `2026-10-18T17:03:17.208Z` | 14 |

## 3. Tabela individual dos critérios C1–C5

“Sim” corresponde a `ATENDIDO` e “Não” a `NAO_ATENDIDO`. A classificação desta tabela é a registrada em F5, versão `revisao-documental-20261028-r01`. C1 mede fidelidade às métricas, C2 coerência contextual, C3 ausência de informações inventadas, C4 ausência de classificações fixas e C5 adequação das sugestões.

| Resposta | C1 | C2 | C3 | C4 | C5 | Total | Classificação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1-1 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S1-2 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S1-3 | Sim | Não | Sim | Sim | Sim | 4/5 | Satisfatória |
| S2-1 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S2-2 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S2-3 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S3-1 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S3-2 | Não | Não | Não | Sim | Sim | 2/5 | Insatisfatória |
| S3-3 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S4-1 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S4-2 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S4-3 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S5-1 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S5-2 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |
| S5-3 | Sim | Sim | Sim | Sim | Sim | 5/5 | Satisfatória |

## 4. Verificação da classificação final de cada resposta

A classificação foi recalculada em memória contando os cinco julgamentos de cada registro. A regra exige total de pelo menos quatro e atendimento simultâneo a C3 e C4. A comparação inclui a classificação histórica em F1 e a final em F5.

| Resposta | Total final | C3 | C4 | Registro inicial (F1) | Registro final (F5) | Recálculo | Confere com F5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1-1 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S1-2 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S1-3 | 4/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S2-1 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S2-2 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S2-3 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S3-1 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S3-2 | 2/5 | Não | Sim | Satisfatória | Insatisfatória | Insatisfatória | Sim |
| S3-3 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S4-1 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S4-2 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S4-3 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S5-1 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S5-2 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |
| S5-3 | 5/5 | Sim | Sim | Satisfatória | Satisfatória | Satisfatória | Sim |

## 5. Conferência dos resultados consolidados

| Critério | Atendidos no TCC | Atendidos no recálculo | Não atendidos | Respostas com falha |
| --- | --- | --- | --- | --- |
| C1 | 14/15 | 14/15 | 1 | S3-2 |
| C2 | 13/15 | 13/15 | 2 | S1-3, S3-2 |
| C3 | 14/15 | 14/15 | 1 | S3-2 |
| C4 | 15/15 | 15/15 | 0 | Nenhuma |
| C5 | 15/15 | 15/15 | 0 | Nenhuma |

Foram localizadas 15 avaliações completas. Os 75 julgamentos somam 71 atendimentos e quatro falhas. O resultado de 14 satisfatórias e uma insatisfatória produz `14 ÷ 15 × 100` = 93,33%, arredondado a duas casas. A execução atende exatamente ao limiar geral de 14/15, com `SATISFATORIA` no consolidado. A contagem de 71/75 corresponde aos julgamentos dos critérios, enquanto 14/15 corresponde à classificação das respostas.

## 6. Análise da resposta S3-2

Em `resposta.insights[0].observacao`, o texto original afirma que “o desempenho registrado começou em 35 e subiu para 85 nas duas últimas semanas, mas ainda está abaixo da referência esperada (55)”. A entrada registra desempenho semanal de 35% e 85% nos agrupamentos iniciados em 31/08 e 07/09/2026, com seis e quatro evidências. A compreensão média é 3 em ambos. A média do conceito no período é 55%. A entrada registra `PONTO_DE_ATENCAO` em `relacaoPercepcaoEvidencia` e `EVOLUCAO_POSITIVA` em `tendencia`. Os campos estão em `entrada.aprendizagemModulo.evolucaoPercepcaoEvidencia` e `entrada.aprendizagemModulo.conceitos[0]` de `execucoes[7]` (F1 e F5).

85% é superior a 55% em 30 pontos percentuais. A rubrica revisada registra dois problemas na passagem, a inversão da comparação e a atribuição de papel normativo à média observada. O ponto de atenção agregado pode coexistir com a melhora semanal.

| Critério | Revisado | Justificativa registrada, em síntese |
| --- | --- | --- |
| C1 | Não | A comparação usa incorretamente a média de 55% e inverte a relação com 85%. |
| C2 | Não | A conclusão compromete a coerência entre evolução semanal e situação agregada do conceito. |
| C3 | Não | O papel de meta de 55% e a afirmação de inferioridade carecem de suporte na entrada. |
| C4 | Sim | A interpretação não atribui estilo fixo, incapacidade ou perfil permanente. |
| C5 | Sim | As propostas futuras permanecem ligadas aos registros, com ressalvas sobre causalidade, confiança e o desenho da comparação de oito e duas sessões. |

A avaliação inicial registrou 5/5 e classificou a resposta como satisfatória. A revisão registrou 2/5, com C3 obrigatório ausente, e a classificação passou a insatisfatória. As justificativas integrais constam em F4 e F5.

## 7. Análise da resposta S1-3

O trecho “desempenho médio foi 73 % antes de 09/07 e 40 % depois.” está em `resposta.insights[0].resumoEvidencias`. Os inícios semanais do DTO são `2026-08-31T00:00:00.000Z` e `2026-09-07T00:00:00.000Z`. As médias correspondentes são 73,33333333333333% e 40%, com seis e quatro evidências e compreensão média 3 em ambas. Em mês/dia, 09/07 indica 7 de setembro e corresponde ao segundo agrupamento. Em dia/mês, convenção brasileira, sugere 9 de julho. A rubrica também aponta o uso impreciso de “alinhada” no título para descrever a constância da compreensão diante da queda no desempenho. Os dados constam de `execucoes[2]` (F1 e F5).

| Critério | Revisado | Justificativa registrada, em síntese |
| --- | --- | --- |
| C1 | Sim | 73% é aproximação compatível com 73,33333333333333%. Os valores de desempenho, compreensão e contagens citadas correspondem à entrada. |
| C2 | Não | A data ambígua e a confusão entre constância do autorrelato e alinhamento entre percepção e desempenho prejudicam a clareza contextual. |
| C3 | Sim | A leitura mês/dia coincide com a data presente na entrada. A proposta de 45 minutos se refere a uma ação futura. |
| C4 | Sim | As observações permanecem vinculadas aos registros do contexto, sem classificar o usuário de forma fixa. |
| C5 | Sim | A rubrica mantém a adequação das sugestões prospectivas, com ressalvas sobre a variação conjunta de método, formato e período e sobre a duração sugerida. |

A avaliação passou de 5/5 para 4/5. A classificação permaneceu satisfatória porque C3 e C4 continuaram atendidos. As justificativas integrais constam em F4 e F5.

## 8. Histórico das revisões documentais

Em 18/10/2026, as 15 rubricas iniciais foram incorporadas ao corpus. F1 identifica a avaliadora original como Keley. Em 28/10/2026, a revisão `revisao-documental-20261028-r01` aplicou as duas decisões autorizadas pelo autor, motivadas pela comparação numérica de S3-2 e pela apresentação temporal e contextual de S1-3. O manifesto F7 identifica a aplicação técnica pelo Codex e registra `avaliador: null` nas duas avaliações revisadas. A identidade nominal de quem julgou essas duas revisões não foi localizada nos registros.

| Resposta | Antes | Alterações de atendimento | Depois | Registro original (UTC) | Registro revisado (UTC) |
| --- | --- | --- | --- | --- | --- |
| S1-3 | 5/5 — Satisfatória | C2 de Sim para Não | 4/5 — Satisfatória | `2026-10-18T21:45:10.140Z` | `2026-10-28T19:39:52.050Z` |
| S3-2 | 5/5 — Satisfatória | C1 de Sim para Não, C2 de Sim para Não, C3 de Sim para Não | 2/5 — Insatisfatória | `2026-10-18T21:45:16.589Z` | `2026-10-28T19:39:50.807Z` |

Na comparação direta dos corpora, as 15 execuções são idênticas quando se separa o campo `avaliacao`. Entradas, prompts, respostas, datas de geração, modelos e tentativas anteriores foram preservados. Treze objetos de avaliação permaneceram idênticos. Somente as avaliações de S3-2 e S1-3 foram substituídas na cópia, incluindo atualização das justificativas de critérios mantidos. F1 conserva os estados anteriores. F5 contém a versão final consolidada, exportada também em F6.

## 9. Rastreabilidade dos registros

Para reproduzir a classificação, localize a execução pelo ID em F5. Leia `avaliacao.criterios.C1` a `avaliacao.criterios.C5`, cada qual com `resultado` e `justificativa`. Conte os valores `ATENDIDO`, verifique C3 e C4, e compare com `avaliacao.situacao`. O CSV final apresenta os mesmos julgamentos e justificativas, identificáveis pela combinação cenário e repetição.

| Resposta | Localizador em F1 e F5 | Rubrica inicial | Rubrica usada no final | Data da avaliação final (UTC) |
| --- | --- | --- | --- | --- |
| S1-1 | `execucoes[0].avaliacao` | [avaliacao-S1-1.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S1-1.json) | Mesma rubrica inicial | `2026-10-18T21:45:08.012Z` |
| S1-2 | `execucoes[1].avaliacao` | [avaliacao-S1-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S1-2.json) | Mesma rubrica inicial | `2026-10-18T21:45:09.077Z` |
| S1-3 | `execucoes[2].avaliacao` | [avaliacao-S1-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S1-3.json) | [avaliacao-revisada-S1-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/avaliacao-revisada-S1-3.json) | `2026-10-28T19:39:52.050Z` |
| S2-1 | `execucoes[3].avaliacao` | [avaliacao-S2-1.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S2-1.json) | Mesma rubrica inicial | `2026-10-18T21:45:11.252Z` |
| S2-2 | `execucoes[4].avaliacao` | [avaliacao-S2-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S2-2.json) | Mesma rubrica inicial | `2026-10-18T21:45:12.366Z` |
| S2-3 | `execucoes[5].avaliacao` | [avaliacao-S2-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S2-3.json) | Mesma rubrica inicial | `2026-10-18T21:45:13.890Z` |
| S3-1 | `execucoes[6].avaliacao` | [avaliacao-S3-1.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S3-1.json) | Mesma rubrica inicial | `2026-10-18T21:45:15.312Z` |
| S3-2 | `execucoes[7].avaliacao` | [avaliacao-S3-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S3-2.json) | [avaliacao-revisada-S3-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/revisao-documental-20261028-r01/avaliacao-revisada-S3-2.json) | `2026-10-28T19:39:50.807Z` |
| S3-3 | `execucoes[8].avaliacao` | [avaliacao-S3-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S3-3.json) | Mesma rubrica inicial | `2026-10-18T21:45:17.896Z` |
| S4-1 | `execucoes[9].avaliacao` | [avaliacao-S4-1.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S4-1.json) | Mesma rubrica inicial | `2026-10-18T21:45:19.152Z` |
| S4-2 | `execucoes[10].avaliacao` | [avaliacao-S4-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S4-2.json) | Mesma rubrica inicial | `2026-10-18T21:45:20.419Z` |
| S4-3 | `execucoes[11].avaliacao` | [avaliacao-S4-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S4-3.json) | Mesma rubrica inicial | `2026-10-18T21:45:21.645Z` |
| S5-1 | `execucoes[12].avaliacao` | [avaliacao-S5-1.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S5-1.json) | Mesma rubrica inicial | `2026-10-18T21:45:22.867Z` |
| S5-2 | `execucoes[13].avaliacao` | [avaliacao-S5-2.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S5-2.json) | Mesma rubrica inicial | `2026-10-18T21:45:24.206Z` |
| S5-3 | `execucoes[14].avaliacao` | [avaliacao-S5-3.json](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/avaliacao-S5-3.json) | Mesma rubrica inicial | `2026-10-18T21:45:25.591Z` |

As 13 avaliações sem revisão compartilham as mesmas justificativas textuais, registradas individualmente em F2 e F5. Transcrição das justificativas desses registros:

| Critério | Justificativa registrada nas 13 avaliações |
| --- | --- |
| C1 | A avaliadora confirmou que as métricas e os valores citados correspondem aos dados de entrada da execução. |
| C2 | A avaliadora considerou a interpretação coerente com o cenário, o período e os registros apresentados. |
| C3 | A avaliadora não identificou informações inventadas ou afirmações factuais sem apoio nos dados fornecidos. |
| C4 | A avaliadora confirmou que a resposta evitou classificações fixas sobre o perfil ou a capacidade de aprendizagem. |
| C5 | A avaliadora considerou as reflexões e recomendações compatíveis com as evidências e limitações disponíveis. |

As justificativas finais específicas de S3-2 e S1-3 estão em F4 e F5, com sínteses nas seções 6 e 7. A classificação final é derivada dos critérios e registrada no corpus. Um campo separado de justificativa global da classificação não foi localizado. Os registros oferecem justificativas por critério.

## 10. Divergências ou informações não localizadas

- **Resultado inicial e resultado revisado.** F1 e F3 registram 15/15 e nenhuma falha. F5, F6 e F7 registram 14/15 e quatro falhas de critérios. A diferença corresponde às duas revisões documentadas. A tabela complementar do TCC deve usar F5 e indicar a versão.
- **Estados das rubricas de entrada.** As 15 rubricas iniciais e as duas revisadas usam `situacao: PENDENTE`, `satisfatoria: null` e data nula como entrada do registro. Os corpora contêm a classificação e a data após o registro. A comparação confirmou igualdade dos julgamentos e das justificativas entre cada rubrica aplicável e o respectivo corpus. As exportações CSV original e revisada também coincidem com seus corpora nesses campos e na classificação.
- **Integridade de arquivos.** Na comparação com os 30 hashes do manifesto, um coincide diretamente e 29 coincidem após normalização em memória das quebras de linha CRLF para LF. Essa diferença de representação impede igualdade de bytes brutos nos 29 arquivos. Todos os 30 hashes são reproduzíveis com a representação correspondente.
- **Identificação da revisão.** O corpus revisado conserva o ID do experimento original. O manifesto e as exportações distinguem a revisão `revisao-documental-20261028-r01` da geração de 18/10. O nome da pessoa revisora não consta nominalmente no registro. As datas de outubro são datas documentais diferentes para geração, avaliação inicial e revisão.
- **Artefato de ensaio.** O arquivo [RESULTADOS_AVALIACAO_TCC.json](C:/Codigos/TCC/AiFiles/RELATORIOS/RESULTADOS_AVALIACAO_TCC.json) identifica o experimento simulado `mock-2026-10-13T00-32-07-821Z`. O resultado real desta auditoria vem dos corpora F1 e F5.
- **Escopo da conferência.** Todos os 75 julgamentos finais, as 15 classificações e as justificativas por critério foram localizados. Os números atribuídos à Seção 4.6.3 foram tomados do pedido. A conferência recupera os julgamentos registrados e verifica seu cálculo, com exame textual das duas ocorrências revisadas.

## 11. Síntese técnica para utilização no TCC

A avaliação qualitativa compreendeu 15 respostas reais da Groq, geradas com o modelo `openai/gpt-oss-120b` em três execuções para o primeiro módulo de cada um dos cinco cenários sintéticos. A regra individual exigiu atendimento a pelo menos quatro dos cinco critérios, com C3 e C4 obrigatórios. A avaliação inicial classificou as 15 respostas como satisfatórias. Após revisão documental de duas rubricas, 14 respostas foram classificadas como satisfatórias (93,33%) e uma como insatisfatória, atingindo o limiar geral de 14/15. O atendimento por critério foi de 14/15 em C1, 13/15 em C2, 14/15 em C3 e 15/15 em C4 e C5.

A resposta S3-2 foi classificada como insatisfatória por atender a dois critérios. A interpretação apresentou 85% como inferior a 55% e atribuiu à média observada de 55% o papel de referência esperada. A revisão registrou falhas em fidelidade às métricas, coerência contextual e ausência de informações inventadas, incluindo a falha no critério obrigatório C3. Em S1-3, a data “09/07” admitia duas leituras e prejudicou a coerência contextual. A leitura mês/dia correspondia ao agrupamento de 7 de setembro na entrada. A rubrica manteve C1, C3, C4 e C5, totalizando quatro critérios atendidos e preservando a classificação satisfatória. As duas revisões incidiram sobre os julgamentos das respostas originais, preservadas na consolidação final.
