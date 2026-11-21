# Auditoria técnica — Sistema de recomendação do TCC

**Data de referência:** 5 de novembro de 2026. **Agente:** Guanabara.

**Escopo:** código atual da árvore de trabalho. As constatações foram obtidas exclusivamente de implementação, composição das páginas, contratos e testes existentes. Nenhum relatório anterior foi usado como prova do comportamento. A Seção 4.3, a Tabela 4 e o texto integral do TCC não foram fornecidos: a comparação documental limita-se às definições transcritas no pedido e a formulações que o código permite ou não sustenta.

**Preservação:** apenas este novo relatório foi criado em AiFiles/RELATORIOS/AUDITORIA_SISTEMA_RECOMENDACAO_TCC.md, atendendo à entrega solicitada. Não foram alterados arquivos existentes, banco, dados, código, configurações, índices ou memória. Não houve chamadas de IA nem operações de persistência. Foram realizadas inspeção estática e 16 verificações exploratórias em memória sobre funções puras existentes, além da execução em memória dos três exemplos ilustrativos apresentados adiante. Isso não equivale à execução da suíte Vitest, do sistema completo ou de uma avaliação de qualidade do modelo.

## 1. Visão geral do mecanismo

O mecanismo determinístico de revisão de materiais está em recomendarMateriais, no arquivo src/dominio/analises/recomendacoes-materiais.ts, linhas 15–49. A função recebe indicadores por conceito e uma lista de materiais candidatos. Seleciona conceitos com sinais de atenção, ordena-os, limita a seleção a três e produz objetos RecomendacaoMaterial com regra, indicadores, amostra, justificativa e limitações. Não chama IA, não escreve no banco e não calcula os indicadores brutos: estes chegam prontos do serviço e do domínio analítico. [C01–C03]

obterAprendizagemModuloPessoal, em src/servidor/aprendizagem-modulo.ts, consulta o módulo autorizado, obtém sessões/evidências/conceitos, chama analisarAprendizagemModulo e então recomendarMateriais. O resultado é devolvido em aprendizagem.recomendacoes. A função pode ser chamada para páginas e projeções sem que haja qualquer solicitação externa de IA. Não há persistência de uma entidade Recomendacao nesse fluxo; trata-se de resultado calculado sob demanda. [C02]

**Conclusões centrais da auditoria:**

- As condições de atenção são desempenho <70%, compreensão <3/5 ou dificuldade ≥3/5, desde que o indicador respectivo esteja disponível.
- A ordenação usa grupo de prioridade, desempenho ascendente e identificador do conceito. Compreensão, dificuldade e quantidade de evidências não são desempates.
- RM-01 e RM-02 podem ser produzidas com zero, uma ou duas evidências; nesse caso, nivelEvidencia é LIMITADA. Com três ou mais, é DESCRITIVA.
- As recomendações integram a entrada de IA do módulo pessoal. O DTO pessoal não as inclui; o contexto de sala não as inclui; no compartilhamento direto são substituídas por array vazio.
- Existe componente específico para exibir regras, mas ele não está montado nas páginas atuais. Os insights visíveis não têm campo que identifique cada recomendação como RM-01/RM-02/RM-03.
- A contingência local de insights é um mecanismo separado e não lê dto.recomendacoes. Assim, disponibilidade do cálculo determinístico não significa exibição dessas recomendações quando a IA falha.

Os identificadores C01–C20 remetem à tabela de rastreabilidade da seção 10. “Comprovado por inspeção” descreve código e conexões estáticas; influência efetiva da recomendação no texto de um modelo externo não foi medida nesta tarefa.

## 2. Indicadores e critérios de seleção

### 2.1. Condições exatas

| Indicador em ConceitoRecomendacao | Seleciona quando | Limites que não ativam sozinhos |
|---|---|---|
| desempenhoMedio | Não é null e é estritamente menor que 70 | 70 e valores superiores não atendem a esta condição |
| compreensaoMedia | Não é null e é estritamente menor que 3 | 3 e valores superiores não atendem a esta condição |
| dificuldadeMedia | Não é null e é maior ou igual a 3 | Valores menores que 3 não atendem a esta condição |

As três condições são combinadas por OU. Basta uma verdadeira. Um conceito com desempenho de 80%, compreensão de 4 e dificuldade de 3 continua selecionável pela dificuldade. Nenhuma condição exige simultaneamente baixo desempenho e baixa compreensão. [C01, linhas 24–28]

Cada indicador nulo é ignorado em sua própria comparação, sem ser convertido em zero. O conceito ainda pode ser selecionado por outro indicador disponível. Se os três são nulos, ou se nenhum disponível atende ao limiar, o conceito fica fora da seleção. O número de evidências não aparece no filtro de atenção. Um conceito sem evidências pode ser selecionado a partir do autorrelato; sem percentual e sem sinais de atenção percebida, não é selecionado.

A função pura pressupõe entradas tipadas e coerentes, não executa validação numérica geral adicional sobre cada argumento. A validade dos percentuais e a contagem distinta são estabelecidas antes, pelo fluxo analítico. Não atribuir à função recomendarMateriais uma validação universal de qualquer objeto arbitrário.

### 2.2. Origem dos indicadores e recorte

Em analisarAprendizagemModulo, os grupos conceituais possuem Map de sessões e de evidências por identificador. São calculadas médias dos valores disponíveis: compreensão percebida das sessões do conceito, dificuldade percebida das sessões do conceito e percentual das evidências válidas do conceito. A contagem evidencias é o tamanho do Map de evidências desse conceito. Essas médias conceituais não devem ser confundidas com outras médias de sessão que exigem um número mínimo de percepções para publicação. [C03, linhas 295–322]

No serviço, apenas conceitos ativos do módulo entram no catálogo. O conceito analisado é encaminhado ao recomendador quando sua chave possui correspondente nesse catálogo, com seu id real. Não se recomenda automaticamente todo conceito cadastrado: a entrada resulta dos grupos formados a partir dos dados observados e das correspondências do catálogo. [C02, linhas 122, 129–155]

Sessões e evidências são consultadas no módulo do proprietário. O período selecionado delimita sessões pelo início e evidências por dataEvento; o domínio também exclui sessões/evidências posteriores à referência quando aplicável. Sessões válidas devem estar concluídas, com término e duração inteira de ao menos cinco minutos; arquivamento de sessão não a elimina automaticamente da métrica. A contagem de evidências e o filtro de material são descritos nas seções 5 e 2.3. [C02, C03, C04]

O recomendador não usa diretamente nome do conceito, método estudado, formato preferido, duração, tendência, índice exploratório de compreensão/dificuldade, ordem do dashboard ou frequência de estudo como condição de atenção. Esses dados podem participar de outras análises do sistema, mas não do predicado RM.

### 2.3. Identificação e elegibilidade dos materiais

A elegibilidade é estabelecida em dois níveis, que não devem ser confundidos:

| Etapa | Condições efetivamente aplicadas | Fonte |
|---|---|---|
| Consulta do módulo | Módulo da conta, não arquivado e não rascunho; materiais ativos | C02, linhas 118–125 |
| Adaptação para o recomendador | Somente funcao === REFERENCIA; mapeia id/título, usuário/módulo do contexto, disponivel: true e IDs dos conceitos associados | C02, linha 157 |
| Filtro em recomendarMateriais | Material ainda não escolhido nesta chamada, disponivel verdadeiro, mesmo usuarioId, mesmo moduloId e conceitoIds contém o id do conceito | C01, linha 36 |
| Seleção entre candidatos | Ordena pelo id usando localeCompare e toma o primeiro | C01, linhas 36–38 |

A função pura não recebe o campo funcao do material. Portanto, a exigência de referência decorre do chamador atual, não de uma verificação interna de funcao em recomendarMateriais. disponivel: true é a projeção feita pelo serviço para os materiais ativos consultados; não significa que o recomendador tenha testado download, existência do binário ou validade de URL.

Não há preferência por formato, título, data mais recente, qualidade avaliada, número de acessos, método, nível cognitivo, tamanho do arquivo ou minutos estimados. Também não é exigida análise de material com situação CONCLUIDA para recomendação: é necessário que os vínculos conceituais relevantes estejam presentes.

**Precisão temporal:** o serviço calcula materiaisNoPeriodo para a linha do tempo, mas a lista enviada ao recomendador vem de modulo.materiais, filtrada por REFERENCIA, e não de materiaisNoPeriodo. Assim, os indicadores respeitam o recorte de dados, enquanto o catálogo de referência elegível é o conjunto ativo atual do módulo; não afirmar que materiais recomendados são necessariamente criados no mesmo intervalo. [C02, linhas 144–161]

## 3. Ordenação e desempate dos conceitos

### 3.1. Comparador implementado

A linha 28 de recomendarMateriais aplica exatamente esta cadeia:

~~~typescript
prioridade(a) - prioridade(b)
  || (a.desempenhoMedio ?? 100) - (b.desempenhoMedio ?? 100)
  || a.id.localeCompare(b.id)
~~~

prioridade vale 0 quando o desempenho existe e é <70; vale 1 nos demais casos. O comparador só é aplicado aos conceitos que já passaram no filtro de atenção. [C01, linhas 23–28]

| Ordem | Critério | Consequência |
|---|---|---|
| 1 | prioridade: 0 antes de 1 | Baixo desempenho explícito precede seleção motivada apenas por percepção |
| 2 | desempenhoMedio crescente, com null tratado como 100 apenas para ordenar | Dentro do grupo, percentuais menores vêm antes; valores não disponíveis não viram desempenho real de 100% |
| 3 | a.id.localeCompare(b.id) | Empate numérico é resolvido pelo identificador do conceito, não pelo nome |

### 3.2. O que não é desempate

Compreensão, dificuldade, quantidade de evidências, quantidade de sessões, recência e título não participam do comparador. Compreensão e dificuldade permitem entrar na seleção, mas não decidem a ordem final. Duas médias apenas próximas não formam uma categoria de empate: 49,9 vem antes de 50,0. Não há tolerância, arredondamento prévio ou faixa de “desempenhos semelhantes” no comparador.

O domínio analítico ordena a sua própria lista conceitual por evidências, sessões e nome em outro ponto (C03, linha 322), mas recomendarMateriais executa nova ordenação. Não transportar os critérios daquela lista para a prioridade das recomendações.

Para as mesmas entradas coerentes, IDs únicos e mesmo ambiente de execução, o resultado é reproduzível: não usa sorteio, horário, IA nem ordem aleatória. localeCompare é a operação textual real, sem locale explícito nessa função; não descrevê-la como uma regra pedagógica nem como comparação binária de bytes. Se uma chamada artificial contiver IDs duplicados e dados contraditórios, o comparador pode empatar totalmente; não há um quarto critério. A consulta ordinária fornece IDs persistidos únicos.

### 3.3. Limite e efeito da seleção de materiais

Depois de ordenar, conceitos.slice(0, 3) seleciona no máximo três conceitos. RM-01 ou RM-02 é produzida para cada um deles. Se nenhum atende ao filtro, a função retorna um único item RM-03, não um array vazio.

Os materiais são escolhidos sequencialmente. Ao escolher um, seu ID entra em materiaisSelecionados; ele não pode reaparecer em outra recomendação dessa chamada. Isso pode fazer um conceito posterior receber RM-02 mesmo havendo um material associado que já foi consumido pelo conceito anterior. Não existe busca global da melhor combinação de conceitos e materiais. Um quarto conceito não substitui um dos três primeiros por ter material disponível. [C01, linhas 34–48]

## 4. Funcionamento das regras RM-01 a RM-03

### 4.1. RM-01 — conceito selecionado com material elegível remanescente

**Ativação:** o conceito está entre os três primeiros após o filtro/ordenação e há ao menos um material que passa pelos filtros, inclusive a condição de não ter sido escolhido antes nesta chamada. Seleciona o menor id segundo localeCompare, registra esse material como utilizado e gera uma recomendação. Não depende de n ≥3.

**Dados:** conceito com id, nome, médias e evidencias; usuário/módulo da entrada; material com id, título e associação conceitual. **Tipo retornado:** MATERIAL. **Identificadores:** moduloId da entrada, conceitoId do conceito, materialId e tituloMaterial do candidato escolhido. **Regra:** RM-01.

**Justificativa:** texto de revisão exploratória do conceito, informando que o material o aborda e que a seleção não demonstra superioridade de formato. indicadoresUtilizados contém o próprio objeto do conceito; tamanhoAmostra recebe conceito.evidencias; nivelEvidencia é calculado pelo limiar descrito na seção 5. [C01, linhas 35–45]

### 4.2. RM-02 — conceito selecionado sem material elegível remanescente

**Ativação:** conceito entre os três primeiros, mas nenhum candidato restante passa pelos filtros. Isso cobre ausência de referência associada, candidato de outro contexto, indisponibilidade, ou material já alocado a conceito anterior. A regra não conclui ausência absoluta de qualquer arquivo no módulo.

**Tipo retornado:** SEM_MATERIAL. **Identificadores:** moduloId e conceitoId preenchidos; materialId e tituloMaterial nulos. **Regra:** RM-02. Mantém indicadoresUtilizados, tamanhoAmostra e nivelEvidencia por conceito. A justificativa informa ausência de material elegível para aquele conceito e sugere revisão e novo registro de desempenho. [C01, linhas 36–46]

### 4.3. RM-03 — nenhum conceito passa no filtro de atenção

**Ativação:** a lista filtrada tem comprimento zero. Pode ocorrer por início a frio, todos os indicadores ausentes, nenhuma condição atendida ou nenhum conceito observado encaminhado pelo catálogo. Também pode ocorrer com muitos registros e desempenhos/percepções sem sinais de atenção. Portanto, RM-03 não significa necessariamente “não existem dados”.

**Tipo retornado:** EXPLORACAO. **Identificadores:** moduloId preenchido; conceitoId, materialId e tituloMaterial nulos. **Regra:** RM-03. indicadoresUtilizados é null; tamanhoAmostra é fixado em 0 e nivelEvidencia em LIMITADA. A justificativa orienta registrar sessão e evidência, sem definir preferência de aprendizagem. Materiais existentes não forçam uma seleção quando não há conceito elegível. [C01, linhas 29–33]

**Cuidado de redação:** o n=0 desse objeto é um metadado fixo da regra genérica, sem conceito-alvo selecionado; não é uma contagem de todas as evidências do módulo. O exemplo 3 demonstra esse caso.

### 4.4. Estrutura comum e destino

| Campo de RecomendacaoMaterial | Conteúdo |
|---|---|
| tipo | MATERIAL, SEM_MATERIAL ou EXPLORACAO |
| moduloId | Contexto do resultado |
| conceitoId | Conceito selecionado, ou null em RM-03 |
| materialId / tituloMaterial | Material escolhido em RM-01; null nas demais |
| regraId | RM-01, RM-02 ou RM-03 |
| indicadoresUtilizados | ConceitoRecomendacao completo, ou null em RM-03 |
| tamanhoAmostra | Número de evidências distintas do conceito em RM-01/RM-02; 0 fixo em RM-03 |
| nivelEvidencia | LIMITADA ou DESCRITIVA |
| justificativaEstruturada | String montada por regra; apesar do nome, não é objeto JSON de justificativa |
| limitacoes | Três avisos: associação sem causalidade/domínio; dificuldade não controlada e ausência de superioridade; amostra por evidências distintas |

Após a geração, todos os tipos seguem o mesmo retorno aprendizagem.recomendacoes do serviço, sem gravação própria e sem rotas exclusivas por regra. Seu encaminhamento posterior depende do contexto descrito na seção 6. A definição geral fornecida no pedido corresponde às três regras, desde que RM-02 se refira à elegibilidade remanescente e RM-03 à ausência de conceito elegível, não obrigatoriamente à ausência de dados.

## 5. Classificação do nível de evidência

| Situação | Valor exato de nivelEvidencia | Efeito |
|---|---|---|
| RM-01 ou RM-02, evidencias < 3 | LIMITADA | A recomendação continua sendo produzida; a contagem e o nível acompanham o objeto |
| RM-01 ou RM-02, evidencias >= 3 | DESCRITIVA | Mesma regra de seleção e mesma ordenação; não significa comprovação de eficácia |
| RM-03 | LIMITADA | tamanhoAmostra = 0, fixado pelo ramo da regra |

O código não possui a classificação SUFICIENTE para RecomendacaoMaterial. A condição numérica em C01, linha 43, é o único critério que distingue LIMITADA de DESCRITIVA em RM-01/RM-02. A qualidade estatística, o controle de dificuldade, a atualidade da evidência, a variância e a confiança do modelo não entram nessa classificação. A expressão “amostra suficiente” usada em outros cálculos não deve substituir os nomes deste campo.

A contagem é por conceito: analisarAprendizagemModulo valida o percentual (finito, entre 0 e 100), a data do evento e o recorte temporal, deduplica evidências pelo identificador e mantém um mapa de evidências em cada agrupamento de conceito. A mesma evidência associada ao mesmo conceito por diversas questões ou vínculos conta uma vez; vinculada a conceitos diferentes pode contar uma vez em cada um. Questões, sessões, menções textuais e materiais de referência não são unidades dessa contagem. [C02, linhas 140–155; C03, linhas 283–322]

O serviço inclui evidências sem recurso associado ou ligadas a material ativo com função AVALIACAO; depois aplica a validação analítica. Não exige situacaoConfirmacao como filtro de validade nesse caminho. A extração de desempenho de material pode produzir percentual explícito ou calculado de questões; ausência de percentual válido não é convertida em nota zero. As sessões válidas alimentam compreensão/dificuldade e contexto, mas não incrementam diretamente evidencias. [C02, linhas 63–110, 125, 140–155; C04]

Menos de três evidências não impede a seleção por compreensão, dificuldade ou desempenho. A função pura aceita inclusive evidencias = 0 com outro sinal de atenção: a saída continua RM-01/RM-02, classificada LIMITADA. Isso foi verificado em memória. A classificação altera os metadados da recomendação; não há comprovação de que seja exibida diretamente na interface ativa. O componente específico que a exibe está desacoplado das páginas atuais, conforme seção 7. Em RM-03, tamanhoAmostra = 0 não é contagem do total de evidências do módulo: pode haver muitas evidências, todas sem sinais que atinjam os critérios.

## 6. Integração das recomendações com a IA

### 6.1. Caminho e contextos efetivamente implementados

| Contexto | O mecanismo é calculado? | Entrada da interpretação | Recomendações encaminhadas ao modelo? |
|---|---|---|---|
| Módulo pessoal próprio | Sim, obterAprendizagemModuloPessoal | gerarInterpretacaoModuloPessoal chama criarDtoInterpretacaoModulo com aprendizagem | Sim, array completo, se a chamada externa superar os controles prévios |
| Dashboard pessoal geral | O carregamento do dashboard calcula aprendizagem dos módulos, mas projeta apenas análises | gerarInterpretacaoPessoal usa métricas/sessões e criarDtoInterpretacaoPessoal | Não: esse DTO não inclui recomendações nem aprendizagemModulo |
| Dashboard de módulo compartilhado diretamente | Sim, na obtenção de aprendizagem do proprietário autorizada ao acesso | criarDtoCompartilhado fornece recomendações = [], evidencias = [] e linhaDoTempo = [] | Não: remoção explícita antes da construção da entrada externa |
| Módulos/salas e feedback individual autorizado | Resumos de aprendizagem podem calcular e projetar somente analises | gerarInterpretacaoMembroSala constrói DTO MEMBRO_SALA com métricas, sem array de recomendações | Não |

Referências: C02, C05, C09, C13 e C14. “Calculado” não significa automaticamente incluído no DTO, devolvido pela rota ou mostrado ao usuário. Em módulo compartilhado, o DTO aproveita o construtor de módulo, mas a lista já foi esvaziada. Não se trata de enviar recomendações anonimizadas.

### 6.2. Conteúdo enviado e instrução ao modelo

criarDtoInterpretacaoModulo inclui literalmente recomendacoes: aprendizagem.recomendacoes. São enviados todos os campos do objeto descritos na seção 4.4: tipo, módulo, conceito, material, título, regra, indicadores completos, tamanho da amostra, nível, justificativa e limitações. O DTO ainda contém métricas e resumos de aprendizagem. prepararDtoParaProvedor compacta outras partes da entrada, mas preserva o array de recomendações pelo espalhamento do DTO. criarInstrucaoInterpretacao serializa a entrada com JSON.stringify. [C05, linhas 141–156, 180–196; C06, linhas 48–50]

O modelo recebe decisões previamente calculadas, não a tarefa de descobrir de novo RM-01/RM-02/RM-03. PROMPT_BASE afirma que as métricas já foram calculadas pelo sistema e determina que as recomendações estruturadas não tenham materialId, conceitoId, moduloId, indicadores, amostra ou nível alterados; solicita explicar a decisão fornecida. Também restringe inferências causais, diagnósticos e superioridade de métodos/formatos. Isso demonstra a intenção do contrato textual, não comprova obediência do modelo. [C06, linhas 32–46]

A inclusão no contexto permite que as recomendações fundamentem as sugestões e reflexões do modelo no módulo próprio. Não há pós-processamento que obrigue cada insight a citar uma regra, nem mapeamento insight → recomendação. O contrato de saída contém observacao, resumoEvidencias, perguntaReflexiva, experimentoSugerido e confianca, mas não exige regraId ou materialId. A validação estrutural/lexical não verifica correspondência factual integral com os indicadores ou preservação semântica da decisão. Portanto, não é comprovável pelo código que toda recomendação produza um insight, que todo insight derive de RM ou qual seja sua influência empírica. Nenhuma chamada externa foi feita nesta auditoria. [C06; C07]

### 6.3. Condições para efetivamente haver chamada externa

A presença de recomendações no DTO não basta para enviá-las à API. O fluxo aplica condições de sessões válidas, cota local, credencial, limite de entrada e disponibilidade/validade da resposta. Entre os motivos de resposta local estão DADOS_INSUFICIENTES, COTA_LOCAL, SEM_CHAVE, ENTRADA_EXCEDIDA, TODOS_INDISPONIVEIS e RESPOSTA_INVALIDA, conforme o caminho e o contrato. A entrada serializada tem limite de 50.000 caracteres; as chamadas são controladas por cota local de cinco por hora no controlador observado. Sem sessões válidas, pode haver aprendizagem/evidência e até RM calculada, mas a interpretação retorna local sem chamar o provedor. [C05, linhas 15–61, 217–264, 275–337; C07]

O adaptador externo chama a integração compatível com OpenAI do provedor Groq com a instrução e o esquema de saída. A resposta validada é transformada em InterpretacaoAutomatica. montarInterpretacao usa o DTO para metadados e limitações, mas não devolve o array RM no contrato de interpretação. Essa distinção impede tratar o retorno da API de insights como uma API de recomendações estruturadas. [C07; C20]

## 7. Apresentação dos resultados ao usuário

### 7.1. Resultado direto das regras

Existe o componente PainelRecomendacoesMateriais, em src/app/modulos/[identificador]/painel-recomendacoes-materiais.tsx, linhas 4–18. Ele renderiza “Recomendações de estudo”, justificativas, códigos de regra, contagem, base limitada/descritiva, indicadores e limitações. Porém, a pesquisa de referências e a composição das páginas atuais não identificaram importação/montagem desse componente em produção: as referências encontradas são sua declaração e o teste isolado. A existência do arquivo e de teste de renderização não comprova acesso pelo usuário. [C11, C12]

O dashboard do módulo recebe um subconjunto de aprendizagem para resumo, contextos e conceitos; não repassa recomendações ao componente de dashboard. Os dashboards compartilhados e de salas também projetam dados sem o array. Não foi identificado outro endpoint ou caminho de interface ativo que exponha diretamente os objetos RM-01/RM-02/RM-03. Trata-se de conclusão da inspeção de referências e dos caminhos atuais, não de navegação ou teste E2E realizado nesta auditoria. [C12–C15]

### 7.2. Caminho visível dos insights

| Página/contexto | Ação e apresentação observadas no código | Conteúdo exibido |
|---|---|---|
| Dashboard pessoal | Botão “Gerar interpretação da IA”; abre dialog em modalidade lateral e inicia a geração | Insights textuais e metadados de origem/modelo |
| Módulo próprio | InterpretacaoAutomatica montado com identificadorModulo e modalLateral; mesmo botão | Insights do fluxo de módulo, que pode ter recebido RM no contexto |
| Módulo compartilhado diretamente | InterpretacaoAutomatica com moduloCompartilhadoId e modalLateral | Insights sem recomendações RM no DTO |
| Feedback individual de sala | Botão “Gerar feedback”, em InterpretacaoMembroSala | Resultado em seção na própria página, sem o modal lateral genérico |

Referências: C10, C12 e C15. No componente genérico, abrir o diálogo dispara a geração; não existe uma segunda confirmação obrigatória dentro dele. O código da página de módulo próprio usa a ação do dashboard para esse modal; não sustenta a descrição de um painel fixo exclusivo de RM.

A interface distingue a origem da resposta como Groq ou local, informa o modelo quando disponível e mostra a mensagem de contingência. Os níveis de confianca dos insights são apresentados como “Evidência inicial” (BAIXA), “Evidência moderada” (MODERADA) e “Padrão recorrente” (FORTE). Eles não são nivelEvidencia = LIMITADA/DESCRITIVA e não constituem visualização das classificações de RM. [C10, C15]

Não há marcação por insight que identifique “esta sugestão veio de RM-01” ou separe uma recomendação determinística da interpretação textual. O selo local/Groq identifica a origem da resposta inteira. Assim, no módulo próprio uma RM pode contribuir indiretamente ao contexto de interpretação, mas seu consumo não assegura a exibição de regra, material ou justificativa original. Nos demais contextos citados, nem esse encaminhamento ocorre.

Observação de escopo temporal: o componente genérico prepara parâmetros de período, mas o ramo pessoal utiliza a URL literal /api/interpretacoes; os ramos de módulo/compartilhamento acrescentam a consulta. Logo, o código não autoriza afirmar que a interpretação pessoal sempre usa o mesmo filtro temporal visível no dashboard. Essa observação registra o caminho atual, sem alterar ou propor implementação. [C10, linhas 37–40]

## 8. Contingência local e diferenças entre os mecanismos

| Mecanismo | Entradas e decisão | Relação com RM | Saída e acesso atual |
|---|---|---|---|
| RM-01/RM-02/RM-03 | Indicadores por conceito e materiais de referência elegíveis | É o próprio mecanismo auditado | RecomendacaoMaterial[] no serviço; contexto da IA somente no módulo próprio; painel direto não montado |
| Contingência local de insights | DTO de interpretação, resumos analíticos e métricas de sessões | Não lê dto.recomendacoes | InterpretacaoGerada com origem LOCAL, exibida pelo mesmo componente de insights |
| Heurística local de estratégia | Registros de métodos no DTO; frequência e compreensão | Não consulta materiais ou códigos RM | Texto de experimento/reflexão dentro do insight local |
| proximoExperimento do dashboard | Cobertura de métodos e menor frequência observada | Campo calculado independente de RM e da IA | Campo do objeto analítico; sem consumidor de interface identificado na versão atual |

gerarRespostaLocal não adapta nem reapresenta as recomendações do array RM. A leitura completa do arquivo não contém acesso a dto.recomendacoes. Uma verificação em memória, mantendo o restante do DTO e variando esse array, produziu o mesmo resultado. Os mecanismos podem compartilhar indicadores de origem, mas isso não cria dependência entre suas saídas. A contingência também pode ocorrer mesmo quando havia RM prontas no DTO. [C08]

### 8.1. Regras locais de insights efetivamente presentes

Quando não há sessões válidas, gerarRespostaLocal retorna orientação inicial de registro. Nos demais casos, combina insightsDeAprendizagem e insightDeEstrategia, limita a três e, na ausência deles, usa insightGeral. [C08, linhas 89–95]

insightsDeAprendizagem procura um conceito com possivelSuperestimacao e médias disponíveis para texto de calibração; procura também associação de contexto com pelo menos três sessões, amostraSuficiente e desempenho posterior abaixo de 60 para uma sugestão de comparação. A confiança varia com a quantidade disponível em cada ramo. Esses limiares e classificações são de insights locais, distintos da seleção RM por desempenho abaixo de 70. O arquivo também contém ramos para evolucaoAprendizagem e bloom; os construtores atuais inspecionados não fornecem esses campos opcionais, de modo que sua existência não demonstra participação rotineira no fluxo atual. [C05; C08, linhas 12–58]

insightDeEstrategia filtra registros de método com compreensão média não nula, ordena por quantidadeSessoes decrescente e depois pelo contexto, e seleciona o primeiro. Com menos de três registros de compreensão, usa linguagem de hipótese; com base maior, sugere repetir e comparar. Não seleciona material por conceito, não usa os identificadores RM e não determina o melhor método por eficácia. Os registros vêm dos resumos de módulos, sem uma consolidação automática de todos os registros do mesmo método entre módulos nessa função. [C08, linhas 60–75]

### 8.2. Métodos no dashboard

calcularDashboardObservacional calcula coberturaMetodos e proximoExperimento. Este último existe quando há sessões válidas e módulos e escolhe a menor quantidade de sessões; no empate, o reduce preserva o primeiro item do catálogo. A pesquisa de uso não identificou renderização de proximoExperimento na interface atual. Não se deve documentá-lo como sugestão visível ao aluno apenas porque é retornado pelo cálculo. O dashboard também pode mostrar destaques observacionais de compreensão associada a métodos, o que não corresponde a RM nem comprova superioridade causal. [C16]

## 9. Exemplos de funcionamento

Os dados abaixo são inteiramente hipotéticos e ilustrativos; não foram cadastrados nem extraídos do banco. As três saídas foram obtidas executando em memória a função pura recomendarMateriais existente, com usuarioId = u1 e moduloId = mod1. Não foram produzidas respostas de IA. As limitações comuns são as descritas na seção 4.4.

### 9.1. RM-01 — Recursão

| Entrada do conceito | Valor |
|---|---|
| id | c1 |
| nome | Recursão |
| desempenhoMedio | 40 |
| compreensaoMedia | 2 |
| dificuldadeMedia | 4 |
| evidencias | 2 |

Materiais candidatos: m-a (“Referência de recursão”), pertencente a u1/mod1, disponível e vinculado a c1.

Processamento: desempenho 40 < 70, compreensão 2 < 3 e dificuldade 4 >= 3 selecionam c1. O material m-a passa pelos filtros e é escolhido. Duas evidências não bloqueiam a recomendação.

Saída (campos decisórios; indicadores completos foram preservados nas duas primeiras regras):

```json
{
  "tipo": "MATERIAL",
  "moduloId": "mod1",
  "conceitoId": "c1",
  "materialId": "m-a",
  "tituloMaterial": "Referência de recursão",
  "regraId": "RM-01",
  "tamanhoAmostra": 2,
  "nivelEvidencia": "LIMITADA",
  "justificativaEstruturada": "Revisão exploratória de Recursão: há sinais de atenção neste módulo. O material aborda o conceito; sua seleção não indica superioridade de formato."
}
```

Destino: o objeto integra aprendizagem.recomendacoes. No pedido de interpretação de módulo próprio, pode compor o JSON enviado ao modelo, se os controles prévios permitirem chamada externa. No dashboard pessoal, compartilhamento direto e feedback de sala não é enviado como RM. Não há painel direto montado que apresente esse objeto nas páginas atuais. A contingência local não o consome.

### 9.2. RM-02 — Grafos

| Entrada do conceito | Valor |
|---|---|
| id | c2 |
| nome | Grafos |
| desempenhoMedio | 80 |
| compreensaoMedia | 4 |
| dificuldadeMedia | 3 |
| evidencias | 5 |

Materiais candidatos: lista vazia.

Processamento: dificuldade exatamente 3 atende ao critério, apesar de desempenho 80 e compreensão 4 não atenderem aos outros limites. Não há material elegível. Cinco evidências classificam a base como DESCRITIVA.

Saída (campos decisórios; indicadores completos foram preservados nas duas primeiras regras):

```json
{
  "tipo": "SEM_MATERIAL",
  "moduloId": "mod1",
  "conceitoId": "c2",
  "materialId": null,
  "tituloMaterial": null,
  "regraId": "RM-02",
  "tamanhoAmostra": 5,
  "nivelEvidencia": "DESCRITIVA",
  "justificativaEstruturada": "Não há material elegível para Grafos. Revise o conceito e registre nova evidência de desempenho."
}
```

Destino: o objeto integra aprendizagem.recomendacoes. No pedido de interpretação de módulo próprio, pode compor o JSON enviado ao modelo, se os controles prévios permitirem chamada externa. No dashboard pessoal, compartilhamento direto e feedback de sala não é enviado como RM. Não há painel direto montado que apresente esse objeto nas páginas atuais. A contingência local não o consome.

### 9.3. RM-03 — Ordenação

| Entrada do conceito | Valor |
|---|---|
| id | c3 |
| nome | Ordenação |
| desempenhoMedio | 85 |
| compreensaoMedia | 4 |
| dificuldadeMedia | 2 |
| evidencias | 8 |

Materiais candidatos: m-b (“Referência de ordenação”), pertencente a u1/mod1, disponível e vinculado a c3.

Processamento: desempenho 85, compreensão 4 e dificuldade 2 não atendem a nenhum critério. A existência de oito evidências e de material associado não muda a seleção: é retornada a exploração genérica. tamanhoAmostra = 0 é valor fixo de RM-03, não a quantidade real de evidências do módulo.

Saída (campos decisórios; indicadores completos foram preservados nas duas primeiras regras):

```json
{
  "tipo": "EXPLORACAO",
  "moduloId": "mod1",
  "conceitoId": null,
  "materialId": null,
  "tituloMaterial": null,
  "regraId": "RM-03",
  "tamanhoAmostra": 0,
  "nivelEvidencia": "LIMITADA",
  "justificativaEstruturada": "Sem sinais suficientes para selecionar um material. Registre uma sessão e uma evidência de desempenho; a exploração inicial não define preferência de aprendizagem."
}
```

Destino: o objeto integra aprendizagem.recomendacoes. No pedido de interpretação de módulo próprio, pode compor o JSON enviado ao modelo, se os controles prévios permitirem chamada externa. No dashboard pessoal, compartilhamento direto e feedback de sala não é enviado como RM. Não há painel direto montado que apresente esse objeto nas páginas atuais. A contingência local não o consome.

Esses destinos decorrem da leitura do encadeamento de serviços e componentes; somente as saídas da função pura foram executadas nos exemplos.

## 10. Arquivos, funções e testes relacionados

### 10.1. Mapa das fontes de implementação

As linhas referem-se ao conteúdo atual inspecionado; podem mudar em revisões posteriores. Os identificadores C01–C20 usados no texto apontam para esta tabela.

| Referência | Arquivo | Linhas relevantes | Função/elemento e fundamento |
|---|---|---|---|
| C01 | src/dominio/analises/recomendacoes-materiais.ts | 15–49 | recomendarMateriais: filtros, ordenação, regras e metadados |
| C02 | src/servidor/aprendizagem-modulo.ts | 63–110; 115–165 | extrairEvidenciaMaterial; registrarEvidenciaDoMaterial; obterAprendizagemModuloPessoal: consulta, vínculos, período e candidatos |
| C03 | src/dominio/analises/aprendizagem-modulo.ts | 283–341 | evidenciaValida; analisarAprendizagemModulo: validação, deduplicação, agrupamentos e médias |
| C04 | src/dominio/analises/metricas-sessoes.ts | 95–107; 198 em diante | sessaoValida; calcularMetricasSessoes: sessões válidas e métricas, não classificação RM |
| C05 | src/servidor/ia/interpretacoes.ts | 15–61; 112–196; 217–337 | criarDtoInterpretacaoModulo/Pessoal; prepararDtoParaProvedor; interpretarComFila; gerarInterpretacaoPessoal/ModuloPessoal/MembroSala; interpretarDtoAutorizado |
| C06 | src/servidor/ia/contrato-provedores.ts | 5–68 | PROMPT_BASE; criarInstrucaoInterpretacao; extrairRespostaEstruturada: contrato textual e saída |
| C07 | src/dominio/interpretacoes/esquema.ts | 8–58; 60–119 | DtoInterpretacao; validarConteudoInterpretacao; montarInterpretacao: contratos e validação |
| C08 | src/dominio/interpretacoes/resposta-local.ts | 3–95 | insightsDeAprendizagem; insightDeEstrategia; insightGeral; gerarRespostaLocal: contingência independente |
| C09 | src/servidor/ia/interpretacao-compartilhada.ts | 7–31 | criarDtoCompartilhado; gerarInterpretacaoCompartilhada: remoção explícita e revalidação de acesso |
| C10 | src/componentes/interpretacao-automatica.tsx | 8–80 | InterpretacaoAutomatica: chamada, modal, origem, confiança e renderização |
| C11 | src/app/modulos/[identificador]/painel-recomendacoes-materiais.tsx | 4–18 | PainelRecomendacoesMateriais: renderizador de RM sem montagem atual identificada |
| C12 | src/app/modulos/[identificador]/page.tsx | 85; 129; 153–160 | Composição da página e projeção de aprendizagem para o dashboard |
| C13 | src/servidor/dashboard-observacional.ts | 8–35 | obterDashboardObservacionalPessoal: calcula aprendizagem e projeta analises |
| C14 | src/servidor/aprendizagem-sala.ts | 30–55 | serializarResumoAprendizagemSala; obterResumoAprendizagemVinculoSala: projeção sem RM |
| C15 | src/app/salas/interpretacao-membro.tsx | 9–22 | InterpretacaoMembroSala: botão, fetch e seção de feedback |
| C16 | src/dominio/analises/dashboard-observacional.ts | 113–159; 254–256 | selecionarMetodoMaiorCompreensao; calcularDashboardObservacional: cobertura, destaque e proximoExperimento |
| C17 | src/servidor/dashboard-compartilhado.ts | 13–41 | obterDashboardCompartilhado: saída projetada sem recomendações |
| C18 | src/app/modulos/[identificador]/conteudo-dashboard-modulo.tsx | 32–35 | ConteudoDashboardModulo: composição dos gráficos e conceitos sem painel RM |
| C19 | src/app/dashboard/page.tsx | 30 | Página pessoal: ação de interpretação em modal lateral |
| C20 | src/servidor/ia/openai-compativel.ts | 46–62 | criarProvedorOpenAiCompativel, operação interpretar: instrução, esquema e chamada externa |

Complementos de composição e transporte:

| Arquivo | Fundamento |
|---|---|
| src/app/salas/compartilhados/[moduloId]/dashboard-compartilhado.tsx:47 | Interpretação compartilhada em modal lateral |
| src/app/salas/[identificador]/modulos/[moduloId]/page.tsx:75 | Montagem de InterpretacaoMembroSala |
| src/app/api/interpretacoes/route.ts | POST de interpretação pessoal; devolve interpretacao |
| src/app/api/modulos/[identificador]/interpretacoes/route.ts | POST de módulo próprio; período e autorização; devolve interpretacao |
| src/app/api/compartilhamentos/modulos/[moduloId]/interpretacoes/route.ts | POST do compartilhamento; utiliza fluxo sem array RM |
| src/app/api/salas/[identificador]/vinculos/[vinculoId]/interpretacoes/route.ts | POST do feedback individual de sala |

### 10.2. Testes automatizados existentes: inspeção, sem execução da suíte

Os arquivos abaixo foram lidos para identificar as asserções existentes. Não se declara que passaram nesta auditoria. A suíte Vitest não foi executada; parte dos testes de integração usa SQLite temporário e persistência, incompatíveis com a restrição de não executar operações que alterem dados persistidos. Não foram executados seed, migrações, scripts de avaliação de IA ou inicialização do sistema.

| Arquivo de teste | Comportamento coberto pelas asserções inspecionadas | Limite da evidência |
|---|---|---|
| src/dominio/analises/recomendacoes-materiais.test.ts | Material por ID estável; filtros de contexto; não reutilização; n = 0, 1, 2 com base limitada; exploração inicial | O teste de empate observado é de materiais, não demonstra por si só todos os empates entre conceitos |
| src/dominio/analises/aprendizagem-modulo.test.ts | Normalização, evidências, relações/contextos, padrões e limites de amostra | Não comprova encaminhamento ou interface de RM |
| src/dominio/analises/ajustes-tcc.test.ts | Validade sem depender de confirmação, deduplicação e mínimos de amostra analítica | Não torna o mínimo um bloqueio de RM |
| src/servidor/aprendizagem-modulo.test.ts | Extração de nota, vínculos de conceitos/questões e período com dependências simuladas | Não é execução contra o banco atual |
| src/servidor/ia/interpretacoes.test.ts | Resposta válida, erros, ausência de chave, contingência, cota e DTOs | Não demonstra fidelidade semântica de toda resposta real ao array RM |
| src/servidor/ia/insights-aprendizagem.test.ts | Validação, zero sessões, compactação, confiança e heurísticas locais | Campos opcionais sintéticos no teste não comprovam alimentação pelo fluxo atual |
| src/servidor/ia/interpretacao-compartilhada.test.ts | DTO sem recomendações/títulos privados/descrições; controle de acesso e revogação | Usa preparação persistida temporária; não executado nesta auditoria |
| src/servidor/aprendizagem-sala.test.ts | Projeção de resumo sem campos privados | Não é teste E2E do feedback |
| src/app/modulos/[identificador]/painel-recomendacoes-materiais.test.ts | Renderização isolada de recomendação e exploração | Não comprova montagem do painel na página atual |
| src/componentes/interpretacao-automatica-modal.test.ts | Abrir diálogo inicia geração e gerencia fechamento/foco, com fetch simulado | Não é chamada externa real |
| src/componentes/interpretacao-automatica.test.ts | Conteúdo estático e fluxo de geração sem segundo botão obrigatório | Não demonstra que um insight deriva de RM específica |

### 10.3. Verificações efetivamente executadas nesta auditoria

Foram carregados os módulos puros existentes por transpilação TypeScript em memória, com dependências restritas, sem escrever arquivos executáveis ou consultar serviços. Dezesseis verificações exploratórias com asserções passaram:

| Nº | Verificação |
|---|---|
| 1 | RM-01 com material elegível e n=3 |
| 2 | RM-02 sem material elegível |
| 3 | RM-03 sem sinais de atenção |
| 4 | Dificuldade exatamente 3 seleciona; compreensão 3 e desempenho 70 não selecionam sozinhos |
| 5 | Todos os indicadores nulos produzem RM-03 |
| 6 | Desempenho nulo não bloqueia seleção por compreensão |
| 7 | n=0,1,2 mantém RM-01 mas usa LIMITADA |
| 8 | Prioridade, desempenho ascendente, id e corte em três |
| 9 | Não há faixa de empate por semelhança: 49.9 antes de 50 |
| 10 | Compreensão, dificuldade e n não desempataram desempenho igual: prevaleceu id |
| 11 | Material por id, não por título ou posição de entrada |
| 12 | Filtros de usuário, módulo, disponibilidade e conceito |
| 13 | Sem reuso de material e sem reposição por quarto conceito |
| 14 | RM-03 n=0 é metadado fixo mesmo com evidências sem sinal |
| 15 | Contagem analítica deduplica id, exclui percentual inválido e conta por conceito |
| 16 | Contingência local não consome array de RM: mesmo resultado com/sem recomendações |

Os três exemplos da seção 9 também foram executados em memória. Esses resultados verificam as funções puras nas entradas escolhidas, não substituem a suíte, não avaliam a qualidade de respostas Groq e não comprovam navegação real. As conclusões de não encaminhamento e não montagem decorrem da inspeção de construtores, projeções, referências e composição atual. A influência efetiva das RM no texto do modelo permanece não medida.

### 10.4. Preservação e identificação do estado inspecionado

Foi mantida uma referência SHA-256 em memória dos arquivos de src (exceto gerado), de prisma e dos levantamentos anteriores de classes/operações, totalizando 290 arquivos. A comparação final foi usada para verificar preservação; não houve atualização desses relatórios, da memória do projeto ou de índices. Arquivos já modificados ou não rastreados antes da auditoria foram preservados. Para identificar o núcleo auditado, seguem os hashes das principais fontes:

| Arquivo | SHA-256 |
|---|---|
| src/dominio/analises/recomendacoes-materiais.ts | `47f7429ceef9c2125d579de2bbefa1defd62cdc6247bc096b8f4dc596c3a463f` |
| src/servidor/aprendizagem-modulo.ts | `a4358f9451550aa63feb0365cceb43b0ff77710354596dc3f0d3a07cd68a868c` |
| src/dominio/analises/aprendizagem-modulo.ts | `148d9def3af6ce297dda6eabe770d9eb4634321b60dd147c94161d8bab8a097c` |
| src/servidor/ia/interpretacoes.ts | `48f470014ecd8b617820ea26f13945f210ecce98b4ecb48d3ab24822a68da5e2` |
| src/servidor/ia/contrato-provedores.ts | `2332d422f88b396447a7633233e975386ce7514c6347c183cc614bfea7124867` |
| src/dominio/interpretacoes/esquema.ts | `e133e817ccb691878c844890c0897062ddf8c5096551772e4a3b0db73d97bbaa` |
| src/dominio/interpretacoes/resposta-local.ts | `4abfae99ec68e81091a49cc7bb190ea11f17bde9d7b1b3048f24584dce00d295` |
| src/servidor/ia/interpretacao-compartilhada.ts | `a8e366bf64d4be26d8abc8678f481efc99ce019f429f783ca453ec3a236edbb2` |
| src/componentes/interpretacao-automatica.tsx | `c4dfee99a2a7b82d4c2ee86100f75de51f98d325a568512195d311a791540820` |
| src/app/modulos/[identificador]/painel-recomendacoes-materiais.tsx | `9d77397be13ede369a00d806a7a698c7da25013b6af03731f3fe1d5300777935` |
| src/app/modulos/[identificador]/page.tsx | `4367a7d9b1c304cff6096e30f0f1c77d092df41f8fb952745ac43d12e99d9a3b` |
| src/servidor/dashboard-observacional.ts | `3d46540180ed388a9076d14a124daf0f7913c4790ef40e1066cd09e113f2f277` |
| src/servidor/aprendizagem-sala.ts | `529ac35c47cb991a5dc6d6c133af50a513f834ef405722f097cea3df490495cd` |

## 11. Divergências entre a implementação e a documentação atual

As três definições RM fornecidas no pedido são compatíveis com os ramos implementados, com as precisões abaixo. Como o texto integral da Seção 4.3, da Tabela 4 e da Seção 4.4 não foi disponibilizado, não se atribuem frases ou erros a esses trechos. A tabela distingue a formulação analisada de sua sustentação no código; serve para revisar o TCC, não como alegação de que todas essas formulações constam nele.

| Formulação/questão documental | Conclusão da auditoria | Redação tecnicamente sustentada |
|---|---|---|
| RM-01: conceito selecionado com material de referência elegível | Compatível | Material ativo de referência, do usuário e módulo, vinculado ao conceito e ainda não utilizado na mesma saída |
| RM-02: conceito selecionado sem material de referência elegível | Compatível com precisão | Sem material remanescente elegível no momento de processar o conceito; material já atribuído a outro conceito também é excluído |
| RM-03: nenhum conceito atende às condições | Compatível | Não equivale necessariamente a ausência de dados, de evidências ou de materiais |
| “Três ou mais evidências válidas, ou quantidade inferior a três” | Exige explicitar unidade e efeito | Evidências distintas por conceito; >= 3 gera DESCRITIVA e < 3 gera LIMITADA em RM-01/RM-02; não bloqueia recomendação |
| Base “suficiente” | Não é nome de nivelEvidencia em RM | Usar DESCRITIVA; não inferir validade causal, eficácia ou suficiência estatística |
| RM-03 indica zero evidências no sistema | Não sustentado | O zero da saída é fixado pela regra, mesmo com evidências observadas sem sinal de atenção |
| Desempate usa compreensão, dificuldade ou maior amostra | Não sustentado | Prioridade por desempenho < 70, depois desempenho crescente (null → 100 apenas na ordenação), depois ID por localeCompare |
| Desempenhos semelhantes são considerados empatados | Não sustentado | Não há tolerância ou faixa: apenas igualdade numérica leva ao próximo critério |
| IA recebe RM em todos os dashboards | Não sustentado | Array completo apenas no fluxo do módulo próprio; pessoal não inclui; compartilhado esvazia; sala não inclui |
| Toda recomendação aparece diretamente ao usuário | Não sustentado pela composição atual | O renderizador existe, mas não está montado; eventual participação é indireta no contexto da IA do módulo próprio |
| O selo local/IA identifica a origem de cada recomendação | Não sustentado | Identifica a origem da resposta de insights inteira; não existe vínculo obrigatório de cada insight com uma regra |
| Contingência local é uma aplicação de RM-01 a RM-03 | Não sustentado | gerarRespostaLocal usa heurísticas próprias e não lê dto.recomendacoes |
| A IA deve respeitar as decisões e, portanto, sua fidelidade é garantida | A primeira parte é instrução; a garantia não é demonstrada | O prompt restringe alterações; o validador estrutural/lexical não prova correspondência factual integral |
| proximoExperimento é sugestão atualmente apresentada | Não demonstrado | O campo é calculado, mas não foi identificado consumidor de interface atual |

Não foram inferidas funcionalidades planejadas, não foram usados relatórios antigos para confirmar implementação e não foram propostas alterações de produto. A ausência de montagem foi estabelecida por pesquisa de referências e leitura das páginas, não por teste de interface em execução.

## 12. Síntese técnica para utilização no TCC

### 12.1. Texto técnico sugerido para a Seção 4.3

O mecanismo de recomendação é determinístico e utiliza indicadores previamente calculados por conceito: desempenho médio registrado em evidências, compreensão percebida média e dificuldade percebida média. Um conceito é selecionado quando possui desempenho inferior a 70%, compreensão inferior a 3 ou dificuldade igual ou superior a 3, considerando apenas os indicadores disponíveis. Valores ausentes não são convertidos em baixo desempenho. Os conceitos com desempenho inferior a 70% recebem prioridade; a ordenação subsequente considera o desempenho crescente, tratando sua ausência como 100 exclusivamente para esse procedimento, e o identificador do conceito como desempate. São processados, no máximo, três conceitos. [C01–C03]

Para cada conceito selecionado, o sistema busca um material ativo de referência, pertencente ao usuário e ao módulo, associado ao conceito e ainda não escolhido na mesma saída. Havendo candidatos, seleciona o primeiro por identificador e produz RM-01. Sem candidato elegível remanescente, produz RM-02. Quando nenhum conceito satisfaz os critérios de seleção, retorna uma orientação genérica de exploração, identificada por RM-03. A escolha do material não expressa superioridade de formato ou eficácia pedagógica. [C01, C02]

Em RM-01 e RM-02, a base é classificada como LIMITADA quando há menos de três evidências válidas distintas do conceito, e DESCRITIVA quando há três ou mais. Esse limiar caracteriza a base observacional e não impede a geração da recomendação. Evidências repetidas para o mesmo conceito são deduplicadas pelo identificador; sessões e questões não são contadas como evidências independentes. RM-03 recebe, por construção, tamanho de amostra zero e nível LIMITADA, mesmo quando existem registros cujos indicadores não atingem os critérios de atenção. Os resultados incluem regra, identificadores, indicadores, contagem, justificativa textual e limitações, sem afirmar causalidade ou domínio. [C01–C04]

### 12.2. Proposta de precisão para a Tabela 4

| Regra | Condição implementada | Resultado | Classificação da base |
|---|---|---|---|
| RM-01 | Conceito entre os três primeiros selecionados e material elegível remanescente | MATERIAL; conceito/material identificados; indicadores, justificativa e limitações | LIMITADA se n < 3; DESCRITIVA se n >= 3 |
| RM-02 | Conceito entre os três primeiros selecionados e nenhum material elegível remanescente | SEM_MATERIAL; conceito identificado; material nulo; orientação de revisão e nova evidência | LIMITADA se n < 3; DESCRITIVA se n >= 3 |
| RM-03 | Nenhum conceito satisfaz os critérios de atenção | EXPLORACAO; conceito/material/indicadores nulos; orientação inicial genérica | LIMITADA e tamanhoAmostra = 0 fixos |

n representa evidências válidas distintas por conceito, não número de sessões ou total de evidências do módulo. A seleção usa a disjunção desempenho < 70%, compreensão < 3 ou dificuldade >= 3. A ordenação é prioridade por desempenho abaixo de 70%, desempenho crescente e identificador. A ausência de material não remove o conceito nem promove automaticamente um quarto conceito. [C01–C03]

### 12.3. Esclarecimento arquitetural para a Seção 4.4

O sistema calcula os indicadores e as decisões de recomendação; a IA recebe dados estruturados para produzir interpretações, perguntas e sugestões textuais. No fluxo de interpretação do módulo próprio, as recomendações prontas são incluídas no contexto enviado ao modelo, desde que as condições de uso do provedor permitam a chamada. O prompt orienta sua preservação e explicação. Entretanto, o contrato de resposta não exige referência explícita a cada regra, e a validação posterior não demonstra fidelidade factual integral. Não se pode, portanto, afirmar que cada recomendação necessariamente gere um insight. O fluxo pessoal geral não inclui esse array; o compartilhamento direto o remove, e o feedback individual de sala não o inclui. [C05–C09]

Nas páginas atuais, a interpretação pessoal, de módulo próprio e de módulo compartilhado é acessada por botão e apresentada em diálogo lateral. O feedback individual de sala aparece em seção da página. O componente dedicado às regras existe, mas não está montado nessas páginas; assim, não há demonstração de apresentação direta de RM-01/RM-02/RM-03 ao usuário na versão inspecionada. A interface identifica respostas de origem Groq ou local, sem rastrear a origem de cada insight a uma regra. A contingência local constitui um gerador independente de insights baseado em métricas e resumos e não consome o array de recomendações determinísticas. Esses limites devem ser explicitados para descrever fielmente a implementação. [C08, C10–C15, C17–C19]
