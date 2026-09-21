# Auditoria de consumo de tokens da IA — 2026-09-20

## Resumo executivo

O consumo observado no projeto Gemini não corresponde a uso normal contínuo da aplicação. Ele foi concentrado nos testes repetidos de conexão e nas chamadas técnicas realizadas durante o diagnóstico do adaptador Gemini.

O projeto `TCC-local` está no **nível gratuito** e o painel informa que **não há faturamento configurado**. Portanto, a auditoria não encontrou gasto financeiro; houve consumo de cota gratuita.

O painel do Google AI Studio apresentou, no único dia com atividade:

- aproximadamente 14 solicitações totais de API;
- aproximadamente 13 solicitações de geração com Gemini 3.7 Flash;
- cerca de 2,261 mil tokens de entrada;
- cerca de 2,332 mil tokens de saída;
- até 7 erros `503 ServiceUnavailable`;
- nenhum faturamento configurado para o projeto.

Como a chave e o projeto foram criados no mesmo dia e o gráfico possui apenas esse período ativo, os máximos diários foram tratados como aproximação dos totais atuais. O painel não disponibilizou a tabela textual completa, por isso os números devem ser lidos como aproximados.

## Evidências locais

O banco contém dois provedores configurados:

- Groq ativo e com último teste bem-sucedido;
- Gemini ativo, mas sujeito a indisponibilidades `503` transitórias;
- Qwen ainda não configurado.

Com Groq saudável e em primeiro lugar na fila, uma análise normal para no Groq. Assim, o Gemini não deveria consumir tokens durante o uso comum enquanto o Groq responder corretamente. O consumo Gemini observado foi provocado principalmente pelo botão de teste e pela investigação técnica.

O conjunto atual possui cinco sessões válidas. Sem enviar nenhum conteúdo à rede, a serialização local mediu:

| Escopo | Sessões | Caracteres do DTO | Entrada estimada |
|---|---:|---:|---:|
| Conta inteira | 5 | 3.822 | ~956 tokens |
| Módulo 1 | 4 | 2.944 | ~736 tokens |
| Módulo 2 | 1 | 1.470 | ~368 tokens |

A estimativa usa a aproximação oficial de cerca de quatro caracteres por token. O prompt fixo e o schema acrescentam tokens, portanto o valor real de uma análise é um pouco maior.

## Principais causas

### 1. O teste de conexão gera uma resposta completa — impacto alto e causa atual

`testarProvedorConfigurado` não faz apenas uma verificação de autenticação. Ele envia um prompt e exige quatro grupos de texto estruturado: padrões, feedbacks, conselhos e perguntas.

Cada clique em **Testar conexão** é, portanto, uma inferência completa. Durante a correção foram necessárias diversas chamadas para identificar o formato REST incorreto, respostas `503`, timeout e validação final. Essas chamadas explicam o volume atual.

O consumo médio observado ficou em torno de 174 tokens de entrada e 179 tokens de saída por solicitação de geração. Esse perfil pequeno é compatível com o DTO técnico vazio usado no teste, e não com análises repetidas das sessões reais.

### 2. O teste manual não participa do limite de cinco análises por hora — impacto alto

O limite local protege apenas `gerarInterpretacaoPessoal` e `gerarInterpretacaoModuloPessoal`. O teste de provedor chama o adaptador diretamente e pode ser repetido sem consumir essa cota local.

Consequência: cliques repetidos em **Testar conexão** podem consumir a cota do provedor sem bloqueio da aplicação.

### 3. A cota local existe apenas na memória do processo — impacto alto

`ControleCotaInterpretacoes` usa um `Map` em memória. Reiniciar o servidor apaga todo o histórico da janela de uma hora.

Como o servidor de desenvolvimento é reiniciado frequentemente, o limite efetivo pode voltar a zero diversas vezes no mesmo período. Ele também não funcionaria de forma coordenada entre múltiplas instâncias.

### 4. A aplicação não registra metadados de tokens — impacto alto para diagnóstico

As respostas dos provedores incluem informações de uso, mas os adaptadores descartam esses campos. Atualmente não há registro local de:

- tokens de entrada;
- tokens de saída;
- tokens de raciocínio;
- tokens em cache;
- provedor/modelo por chamada;
- custo estimado ou cota consumida.

Sem essa telemetria segura, a atribuição exata depende do painel externo. Nenhum prompt, descrição, resposta ou chave precisa ser armazenado para registrar esses números.

### 5. Toda análise reenvia o histórico completo — impacto baixo agora, alto no futuro

Cada análise pessoal reenvia todas as sessões válidas, suas descrições, métodos, formatos, percepções e métricas. Não existe janela temporal, resumo incremental ou cache por versão dos dados.

No cenário atual, o DTO pessoal possui apenas ~956 tokens estimados e não é a causa do pico. Entretanto, o limite técnico permite até 50 mil caracteres, aproximadamente 12,5 mil tokens antes do prompt e do schema. O custo por clique crescerá junto com o histórico.

### 6. Não há cache da interpretação — impacto médio

Solicitar novamente uma análise sem alterar sessões produz outra chamada externa com o mesmo contexto. A aplicação não guarda a última interpretação nem calcula um hash do DTO para reutilizá-la.

O cache implícito do Gemini só começa em 4.096 tokens para o Gemini 3.7 Flash. Os DTOs atuais estão abaixo desse valor, portanto não devem obter economia relevante por cache implícito.

### 7. O fallback pode consumir mais de um provedor — impacto condicionado a falhas

Uma análise pode tentar Groq, Gemini e Qwen na mesma solicitação quando as respostas anteriores falham, expiram ou não passam na validação. Cada provedor que efetivamente gerar conteúdo pode consumir sua própria cota.

O cooldown reduz repetições posteriores, mas uma chamada que expira no cliente pode já ter sido processada parcialmente pelo provedor.

### 8. Limites de saída estão folgados — impacto médio

Groq e Qwen permitem até 1.200 tokens de conclusão. O Gemini não recebe um limite explícito de saída. A resposta esperada é curta, mas o teto poderia ser mais conservador e monitorado.

O Gemini usa raciocínio `low`, o que já reduz a utilização quando comparado aos níveis mais altos. Ainda assim, modelos de raciocínio contabilizam tokens internos separadamente.

## O que não causou o consumo atual

- Não há chamadas automáticas ao carregar páginas; a análise depende de clique.
- Salvar uma chave não testa o provedor automaticamente.
- O build e os testes automatizados usam adaptadores simulados e não chamam provedores reais.
- Com Groq respondendo, a fila não chega ao Gemini durante uma análise normal.
- O volume atual de cinco sessões ainda produz um DTO pequeno.

## Recomendações priorizadas

### Prioridade 0 — impedir novo desperdício

1. Trocar o teste de conexão por uma verificação barata de autenticação/modelo, sem gerar quatro blocos de conteúdo.
2. Incluir testes de conexão no mesmo limite persistente das análises.
3. Persistir a cota no banco por conta e operação; não usar memória como fonte oficial.
4. Aplicar intervalo mínimo entre testes do mesmo provedor, por exemplo cinco minutos, salvo troca de chave.

### Prioridade 1 — medir antes de otimizar

5. Capturar de cada resposta apenas os metadados seguros de uso: provedor, modelo, operação, status, tokens de entrada, saída, raciocínio e cache.
6. Criar uma visualização local de consumo diário e mensal por provedor.
7. Adicionar orçamento configurável em tokens, com bloqueio local antes da chamada.

### Prioridade 2 — reduzir o custo das análises

8. Definir limite explícito e menor de saída para todos os provedores.
9. Reutilizar a interpretação quando o hash das sessões e métricas não mudou.
10. Enviar uma janela recente de sessões e um resumo determinístico do histórico antigo.
11. Separar análise do módulo de análise global e mostrar a estimativa de tokens antes do envio.

## Critérios de aceite sugeridos

- testar uma conexão consome no máximo uma solicitação barata e não gera uma análise pedagógica;
- nenhuma reinicialização do servidor reinicia a cota do usuário;
- cliques repetidos no mesmo estado reutilizam a resposta anterior;
- a interface mostra tokens consumidos por provedor sem armazenar prompt ou resposta;
- o usuário pode definir um limite diário/mensal de tokens;
- fallback informa quantos provedores foram acionados;
- descrições antigas não são reenviadas indefinidamente sem necessidade.

## Referências oficiais

- [Contagem de tokens do Gemini](https://ai.google.dev/gemini-api/docs/generate-content/tokens)
- [Cobrança e tratamento de solicitações com erro](https://ai.google.dev/gemini-api/docs/billing)
- [Cache de contexto do Gemini](https://ai.google.dev/gemini-api/docs/generate-content/caching)
- [Erros da API Gemini](https://ai.google.dev/gemini-api/docs/api-errors)

## Conclusão

Não existe gasto financeiro no momento. O consumo de aproximadamente 4,6 mil tokens visíveis foi gerado principalmente por cerca de 13 inferências técnicas realizadas no processo de teste e correção do Gemini. A causa estrutural mais importante é o teste de conexão ser uma geração completa e ficar fora de uma cota persistente. O crescimento futuro virá do reenvio integral do histórico e da ausência de cache e telemetria por chamada.
