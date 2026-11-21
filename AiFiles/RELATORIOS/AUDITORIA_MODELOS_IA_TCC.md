# Auditoria técnica — Identificação dos modelos de IA utilizados no TCC

## 1. Modelo atualmente configurado na aplicação

Na configuração local disponível, o modelo destinado às chamadas externas da aplicação é **GPT-OSS 20B**, com o identificador `openai/gpt-oss-20b` e provedor **Groq**. O experimento de 18/10/2026 selecionou **GPT-OSS 120B** separadamente.

`MODELO_GROQ_PADRAO` define 20B. Ao carregar o catálogo, `modeloAmbiente` lê `GROQ_MODEL`, remove espaços nas extremidades e aceita identificadores compostos por letras, números e os caracteres `/._-`. Ausência, vazio ou formato inválido acionam o padrão. Esse filtro é sintático. A disponibilidade do modelo na API depende do provedor. O arquivo de exemplo também especifica 20B. O `.env` local e o ambiente do processo de inspeção não definiam `GROQ_MODEL`. A conclusão se aplica ao checkout e à configuração local consultada. O ambiente de um servidor já iniciado ou de uma implantação externa não foi inspecionado diretamente.

`listarCredenciaisAtivas` combina o modelo do catálogo com a credencial Groq global do administrador, desde que ativa e fora de bloqueio. O banco local contém um registro global ativo. A inspeção do banco retornou somente contagens e metadados de análise. A tela administrativa exibe o modelo do catálogo e gerencia a credencial e sua ativação. O esquema de `ConfiguracaoIa` não possui campo de modelo por conta.

Para insights, `criarProvedor` passa o modelo da credencial a `criarProvedorGroq`, e o adaptador inclui `model: opcoes.modelo` na requisição ao endpoint de chat da Groq. Para materiais, o envio é direto com `model: credencial.modelo`. A API usa um protocolo compatível com OpenAI. O provedor chamado é a Groq.

O catálogo atual contém somente Groq. A contingência gera uma resposta por heurísticas locais, com origem `LOCAL` e modelo nulo. Uma falha da chamada externa pode, portanto, resultar em conteúdo local mesmo com 20B configurado. 120B pode ser selecionado com uma configuração explícita de `GROQ_MODEL`, mas o código atual não o cadastra como segunda tentativa.

## 2. Modelos utilizados por funcionalidade

| Funcionalidade | Provedor e modelo no fluxo externo local | Origem da escolha e contingência |
|---|---|---|
| Insights no dashboard pessoal e no módulo próprio | Groq, `openai/gpt-oss-20b` | `gerarInterpretacaoPessoal` e `gerarInterpretacaoModuloPessoal` usam o catálogo global por `listarCredenciaisAtivas`. Resposta local quando aplicável. |
| Insights em módulo compartilhado | Groq, `openai/gpt-oss-20b` | `gerarInterpretacaoCompartilhada` usa `interpretarDtoAutorizado` com a mesma seleção. O contexto de dados é específico do compartilhamento. |
| Feedback individual de membro de sala | Groq, `openai/gpt-oss-20b` | `gerarInterpretacaoMembroSala` usa o mesmo catálogo e as condições de autorização do contexto. |
| Análise textual de materiais | Groq, `openai/gpt-oss-20b` | `analisarTextoMaterial` consulta a credencial global no fluxo normal. Em contingência retorna `gerarAnaliseMaterialLocal`, com modelo nulo. |
| Resumo, conceitos, pontos de revisão, métodos sugeridos, próximas sessões e perguntas sobre material | Groq, `openai/gpt-oss-20b` | Campos solicitados juntos no JSON de análise. A sincronização posterior de conceitos ocorre no código da aplicação. |
| Extração de texto e OCR de materiais | Bibliotecas locais, incluindo Tesseract com dados em português para imagens | A extração antecede a análise textual. O OCR usa o próprio mecanismo de reconhecimento, sem seleção de GPT-OSS para essa etapa. |
| Teste administrativo da conexão | Groq, `openai/gpt-oss-20b` | `testarChaveIa` usa a definição do catálogo e o adaptador envia uma solicitação curta com o mesmo modelo. |
| Cálculo de indicadores e recomendações RM-01 a RM-03 | Processamento local determinístico | `recomendarMateriais` usa indicadores e referências. No módulo próprio, seu resultado pode integrar a entrada para interpretação externa. |

Os valores 20B da tabela correspondem ao modelo que o fluxo externo solicita com o ambiente disponível. Para confirmar o uso histórico, os logs locais preservam três sucessos de interpretação pessoal com Groq e 20B. Na base SQLite local, a consulta de `AnaliseMaterial` encontrou cinco registros com origem `LOCAL` e modelo nulo e um registro sem origem nem modelo. A configuração externa de materiais é comprovada pelo código. Nessa base, os registros consultados documentam resultados locais, sem comprovação de uma análise de material executada com 20B.

## 3. Modelo empregado na avaliação das 15 respostas

O corpus real identifica o experimento `real-2026-10-18T16-52-33-625Z`, iniciado em 18/10/2026 às 16:52:33.625 UTC. As 15 posições de S1-1 a S5-3 foram conferidas no JSON original.

| Campo documental | Valor confirmado nas 15 posições |
|---|---|
| `provedorPlanejado` e `origemResposta` | `GROQ` |
| `modeloPlanejado` | `openai/gpt-oss-120b` |
| `modeloEfetivo` e `resposta.modelo` | `openai/gpt-oss-120b` |
| Tentativa de sucesso em `tentativasProvedores` | Modelo `openai/gpt-oss-120b` |
| `validacaoAutomatica.validaParaExperimento` | `true` |

O modo real de `scripts/avaliar-tcc.ts` seleciona o modelo com `TCC_IA_MODELO` e o passa explicitamente a `interpretarComFila`. O script de repetição confere essa seleção com o modelo planejado e usa o identificador gravado no experimento. Esse caminho explica a diferença em relação à configuração normal com `GROQ_MODEL`.

Os campos solicitados e registrados coincidem. O rótulo `modeloEfetivo` é metadado produzido pela aplicação. No adaptador Groq, a resposta externa é convertida em conteúdo estruturado e a identificação registrada vem do modelo solicitado quando inexiste `obterModeloUtilizado`. O corpus comprova a solicitação de 120B e o sucesso externo registrado nas 15 posições. Uma comparação independente com o campo `model` do envelope HTTP bruto fica sem evidência nesse corpus. A revisão documental de 28/10 tratou de rubricas das respostas existentes.

## 4. Histórico de alterações identificado

| Marco | Evidência | Conclusão |
|---|---|---|
| 21/09/2026, commit `1cf72ed` | Catálogo inclui Groq com `openai/gpt-oss-20b`. | 20B já estava configurado antes da avaliação. |
| 10/10/2026, commit `e90b00f` | Introduz `MODELO_GROQ_PADRAO`, mantém 20B e adiciona a seleção por `GROQ_MODEL`. | A parametrização mudou. O valor padrão continuou 20B. |
| 12/10/2026, commit `1310a477` | Referência Git do experimento informada nos metadados. O catálogo desse commit mantém 20B como padrão e ainda contém Gemini e Qwen. | A referência de código do ensaio e a configuração explícita da sua execução são evidências distintas. Os metadados registram um checkout com alterações. |
| 18/10/2026, execução real | Corpus identifica Groq e 120B nas 15 respostas válidas. | Uso de 120B comprovado para o experimento. |
| 19/10/2026, commit `a7dafb5` | Adiciona os arquivos do corpus real e restringe o catálogo ativo à Groq, preservando 20B como padrão. | O histórico distingue a retirada de outros provedores da seleção de 120B no experimento. |
| Checkout auditado, HEAD `6f7539b` | Catálogo e configuração local compatíveis com o padrão 20B. Logs do servidor registram sucessos do dashboard pessoal com 20B. | O padrão final permanece 20B e há evidência de uso em requisições da aplicação. Os trechos de log consultados não estabelecem uma data civil segura para esses sucessos. |

A busca no histórico de `src`, `scripts` e `.env.example` não encontrou uma substituição versionada do identificador 20B por 120B como padrão da aplicação. A data de 18/10 identifica a execução experimental com 120B. Uma eventual sobreposição de ambiente da plataforma em outro momento não pôde ser datada ou confirmada.

## 5. Divergências entre a documentação e o código

A Tabela 1 e a Seção 4.6.3 citadas no pedido descrevem contextos diferentes. A identificação “GPT-OSS 20B” é compatível com o padrão da versão final. A identificação `openai/gpt-oss-120b` corresponde à configuração do experimento. A ambiguidade surge quando se lê a tabela de tecnologias como identificação do modelo avaliado ou se generaliza o modelo experimental para os dashboards da aplicação. A comparação documental usa as identificações fornecidas no pedido.

## 6. Correções necessárias no TCC

| Local | Redação proposta |
|---|---|
| Tabela 1, Seção 3.2 | **Groq — GPT-OSS 20B (`openai/gpt-oss-20b`), modelo padrão da aplicação, configurável por `GROQ_MODEL`.** |
| Seção 4.4 | Explicar que os fluxos externos de interpretação dos dashboards e de análise textual de materiais compartilham a configuração Groq. Resumo e conceitos integram a análise textual. A contingência usa processamento local. Registrar que a avaliação experimental selecionou 120B separadamente. |
| Seção 4.6.3 | **As 15 respostas da avaliação qualitativa de 18 de outubro de 2026 foram obtidas via API da Groq com o modelo `openai/gpt-oss-120b`, selecionado na configuração do experimento.** |

O relato histórico pode situar a adoção da configuração por variável de ambiente e a restrição posterior do catálogo à Groq. Os registros sustentam a distinção entre padrão da aplicação e modelo do experimento. Uma migração do padrão para 120B permanece sem evidência.

## 7. Arquivos e evidências consultados

| Evidência | Localizador | Constatação |
|---|---|---|
| [Catálogo da aplicação](C:/Codigos/TCC/src/servidor/ia/catalogo-provedores.ts:6) | Linhas 6–23, `MODELO_GROQ_PADRAO`, `modeloAmbiente` e `PROVEDORES_IA`. | 20B como padrão e sobreposição por `GROQ_MODEL`. |
| [Exemplo de ambiente](C:/Codigos/TCC/.env.example:7) | Linha 7. Conferência seletiva de `GROQ_MODEL` no `.env` e no processo de inspeção. | Exemplo com 20B e ausência de sobreposição na configuração local disponível. |
| [Configuração global](C:/Codigos/TCC/src/servidor/ia/configuracoes.ts:82) e [schema](C:/Codigos/TCC/prisma/schema.prisma:215) | Linhas 18, 33–64, 82–94 do serviço e modelo `ConfiguracaoIa` no schema. | Credencial global e modelo proveniente do catálogo. |
| [Administração de IA](C:/Codigos/TCC/src/app/configuracoes/ia/page.tsx:44) e [ação de teste](C:/Codigos/TCC/src/app/configuracoes/ia/acoes.ts:55) | Formulários e `testarChaveIa`, linhas 51–56 da ação. | A interface gerencia a credencial. O teste recebe o modelo do catálogo. |
| [Serviço de insights](C:/Codigos/TCC/src/servidor/ia/interpretacoes.ts:202) e [compartilhamento](C:/Codigos/TCC/src/servidor/ia/interpretacao-compartilhada.ts:18) | Linhas 52–61, 202–203, 217–264 e 275–337 do serviço. | Seleção do modelo, origem, contingência e chamadas por contexto. |
| [Adaptador Groq](C:/Codigos/TCC/src/servidor/ia/groq.ts:4) e [transporte](C:/Codigos/TCC/src/servidor/ia/openai-compativel.ts:46) | `criarProvedorGroq`, `criarProvedorOpenAiCompativel`, linhas 46–72 do transporte. | Endpoint, campo `model` e extração de conteúdo. |
| [Análise textual](C:/Codigos/TCC/src/servidor/ia/analise-materiais.ts:21), [orquestração](C:/Codigos/TCC/src/servidor/analises-materiais.ts:38) e [extração](C:/Codigos/TCC/src/servidor/extracao-materiais.ts:41) | Linhas 21 e 48–80 da análise, 38–72 da orquestração e função `extrairTextoMaterial`. | Resumo e conceitos na mesma chamada, persistência de origem/modelo e OCR local. |
| [Contingência de insights](C:/Codigos/TCC/src/dominio/interpretacoes/resposta-local.ts:89), [análise local](C:/Codigos/TCC/src/dominio/analises/analise-material.ts:34) e [recomendação](C:/Codigos/TCC/src/dominio/analises/recomendacoes-materiais.ts:15) | `gerarRespostaLocal`, `gerarAnaliseMaterialLocal` e `recomendarMateriais`. | Operações locais sem modelo generativo externo. |
| [Banco local](C:/Codigos/TCC/prisma/dev.db) | Leitura agregada de `AnaliseMaterial` por origem e modelo e contagem de configuração global ativa. | Cinco análises locais, um registro sem origem e uma configuração Groq global ativa. |
| [Script da avaliação](C:/Codigos/TCC/scripts/avaliar-tcc.ts:26) e [script de repetição](C:/Codigos/TCC/scripts/repetir-avaliacao-ia-tcc.ts:26) | Linhas 26–32, 103 e 132 do primeiro e 19–39 e 55 do segundo. | Modelo do experimento explicitamente selecionado e registrado. |
| [Corpus real](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231.json:8) e [metadados](C:/Codigos/TCC/AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-20261018-165231-metadados.md:3) | `experimento` e `execucoes[0..14]`. | 15 resultados externos Groq com 120B. |
| [Log de desenvolvimento](C:/Codigos/TCC/AiFiles/Temporario/site-dev-webpack.stdout.log:1235) | Linhas 1228–1241, 4892–4907 e 8488–8503. | Três conclusões bem-sucedidas de interpretação pessoal com 20B. |
| [Catálogo no checkout](C:/Codigos/TCC/src/servidor/ia/catalogo-provedores.ts:13) | Histórico Git do arquivo nos commits `1cf72ed`, `e90b00f`, `1310a477` e `a7dafb5`. | Continuidade do padrão e mudança da composição do catálogo. |

## 8. Síntese técnica para utilização no trabalho

A plataforma integra a API da Groq e adota GPT-OSS 20B (`openai/gpt-oss-20b`) como modelo padrão para interpretação dos dashboards e análise textual de materiais. A variável de ambiente `GROQ_MODEL` permite selecionar outro identificador no servidor. A análise de materiais retorna resumo e conceitos na mesma solicitação. Os fluxos de interpretação e de análise também dispõem de contingência por processamento local.

A avaliação qualitativa de 18 de outubro de 2026 configurou explicitamente GPT-OSS 120B (`openai/gpt-oss-120b`) para as 15 respostas obtidas via Groq. Os registros experimentais apresentam o mesmo identificador em todas as posições. Assim, o modelo reportado na seção de avaliação corresponde à configuração do experimento, e a tabela de tecnologias identifica o padrão da aplicação.
