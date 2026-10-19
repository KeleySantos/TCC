# Auditoria da geração e validação das respostas da IA — TCC

> Registro histórico da implementação auditada em 2026-10-12. A seleção de provedores descrita abaixo foi substituída pela D-054 em 2026-10-17; o fluxo ativo atual é Groq → contingência local.

Data da auditoria: 12 de outubro de 2026  
Escopo: implementação vigente no repositório, incluindo alterações locais ainda não consolidadas  
Natureza: inspeção técnica somente leitura; nenhuma chamada a provedor externo foi realizada

> Atualização de 12 de outubro de 2026: as lacunas de persistência experimental, preenchimento C1–C5, cálculo 4/5, consolidação 14/15 e exportação foram implementadas posteriormente. Consulte [`IMPLEMENTACAO_AVALIACAO_IA_TCC.md`](IMPLEMENTACAO_AVALIACAO_IA_TCC.md). A auditoria abaixo permanece como registro do estado anterior e como delimitação da validação automática.

## 1. Resumo executivo

A plataforma possui um fluxo operacional de interpretação assistida por IA com três provedores possíveis — Groq, Gemini e Qwen — e uma contingência local determinística. Em cada solicitação do usuário, o servidor monta um único contexto estruturado, percorre os provedores configurados em ordem de prioridade e devolve a primeira resposta considerada tecnicamente válida. O resultado final contém de um a três insights; as tentativas de provedores não são três respostas independentes apresentadas ao usuário.

A validação automática atual é real, mas limitada. Ela confirma a estrutura JSON, a quantidade de insights, os tipos, os comprimentos, os campos obrigatórios e uma lista de expressões explicitamente proibidas. Também rejeita respostas vazias, não parseáveis ou que violem esse contrato. Entretanto, não compara semanticamente os números citados pela IA com o DTO, não comprova que cada afirmação está apoiada nos dados, não valida de forma geral a coerência entre reflexão, experimento e recomendação oficial e não detecta toda informação inventada. Por isso, não é correto afirmar que o sistema possui um detector abrangente de alucinações.

O prompt instrui o modelo a usar somente os dados fornecidos, não recalcular métricas, não inventar fatos, não afirmar causalidade, não diagnosticar e não classificar estilos fixos. Essas instruções reduzem o risco, mas não constituem validação executável. A garantia efetiva termina no schema e nos padrões textuais verificados pelo servidor.

Existe ainda um protocolo de avaliação sintética com cinco cenários e três execuções por cenário, totalizando 15 respostas. No modo padrão, porém, essas respostas vêm de um provedor simulado, sem rede, e a rubrica C1–C5 permanece sem preenchimento. Esse procedimento valida o encadeamento técnico e a reprodutibilidade das entradas, mas não mede a qualidade, a variabilidade ou a taxa de aprovação de um modelo real. O modo real está preparado, exige autorização explícita e não foi executado nesta auditoria.

Conclusão para a seção 3.4.3 do TCC: a implementação pode ser descrita como geração estruturada com validação sintática, contratual e lexical, fila de contingência e avaliação qualitativa humana planejada. Não deve ser descrita como validação semântica automática completa, detecção automática de alucinações ou experimento real já concluído.

## 2. Fluxo atual de geração

### 2.1 Acionamento

O fluxo é iniciado por ação do usuário:

- no Dashboard pessoal, ao abrir o painel lateral, o componente dispara a geração uma vez; a função `abrir` chama `gerar` quando ainda não existe resposta ([`src/componentes/interpretacao-automatica.tsx`, linhas 30–48 e 61–76](../../src/componentes/interpretacao-automatica.tsx));
- na página de um módulo, o mesmo componente chama o endpoint específico do módulo ([`src/componentes/interpretacao-automatica.tsx`, linhas 30–48](../../src/componentes/interpretacao-automatica.tsx));
- na visão autorizada de membro de sala, há um botão explícito “Gerar feedback” ([`src/app/salas/interpretacao-membro.tsx`, linhas 10–22](../../src/app/salas/interpretacao-membro.tsx)).

Não há geração periódica nem persistência automática da resposta. As rotas retornam `Cache-Control: no-store`, e a interface mantém o resultado apenas no estado do componente ([`src/app/api/interpretacoes/route.ts`, linhas 7–16](../../src/app/api/interpretacoes/route.ts); [`src/app/api/modulos/[identificador]/interpretacoes/route.ts`, linhas 7–22](../../src/app/api/modulos/%5Bidentificador%5D/interpretacoes/route.ts); [`src/app/api/salas/[identificador]/vinculos/[vinculoId]/interpretacoes/route.ts`, linhas 6–16](../../src/app/api/salas/%5Bidentificador%5D/vinculos/%5BvinculoId%5D/interpretacoes/route.ts)).

### 2.2 Montagem do contexto

O servidor calcula ou recupera as métricas antes de chamar o provedor. Há três DTOs de uso:

1. **Pessoal:** agrega o período e os módulos, incluindo sessões, frequência, percepções, métodos, formatos, evolução semanal e descrições das sessões. Não inclui o detalhamento de aprendizagem por conceito nem as recomendações oficiais do módulo (`criarDtoInterpretacaoPessoal`, [`src/servidor/ia/interpretacoes.ts`, linhas 147–160](../../src/servidor/ia/interpretacoes.ts)).
2. **Módulo:** inclui as métricas do módulo e, quando disponível, aprendizagem por conceito, associações de método/formato com resultados, padrões por objetivo, eventos de evidência, relação percepção × evidência e recomendações determinísticas (`criarDtoInterpretacaoModulo` e `mapearAprendizagemModulo`, [`src/servidor/ia/interpretacoes.ts`, linhas 101–144](../../src/servidor/ia/interpretacoes.ts)).
3. **Membro de sala:** só é criado quando `permitirIa` está ativo e envia as métricas do dashboard autorizado. A própria interface informa que materiais e descrições permanecem privados ([`src/servidor/ia/interpretacoes.ts`, linhas 300–323](../../src/servidor/ia/interpretacoes.ts); [`src/app/salas/interpretacao-membro.tsx`, linha 22](../../src/app/salas/interpretacao-membro.tsx)).

Antes do envio, o DTO é compactado: no máximo 12 pontos semanais, as 10 descrições mais recentes limitadas a 360 caracteres, 12 conceitos, 12 associações, 8 padrões por objetivo, 10 eventos e 12 pontos de evolução por conceito (`prepararDtoParaProvedor`, [`src/servidor/ia/interpretacoes.ts`, linhas 163–184](../../src/servidor/ia/interpretacoes.ts)). O limite global da entrada serializada é 50.000 caracteres ([`src/servidor/ia/interpretacoes.ts`, linhas 15–19 e 214–217](../../src/servidor/ia/interpretacoes.ts)).

As descrições livres são delimitadas por `<descricoes_nao_confiaveis>`, e o prompt ordena que instruções contidas nelas sejam ignoradas ([`src/servidor/ia/interpretacoes.ts`, linhas 86–96](../../src/servidor/ia/interpretacoes.ts); [`src/servidor/ia/contrato-provedores.ts`, linhas 30–47](../../src/servidor/ia/contrato-provedores.ts)). Isso é uma mitigação de injeção de prompt, não uma sanitização semântica garantida.

### 2.3 Prompt e geração

O prompt informa que os dados já foram calculados pelo sistema e determina que o modelo:

- não recalcule métricas;
- use somente as evidências estruturadas;
- preserve as recomendações fornecidas;
- não invente fatos, números ou relações;
- não declare causalidade, diagnóstico, estilo fixo, superioridade de método ou domínio comprovado;
- reconheça amostras pequenas;
- priorize evidência de desempenho, depois percepção e, por último, frequência;
- produza de um a três insights em português brasileiro e somente no JSON esperado.

Fonte: `PROMPT_BASE` e `criarInstrucaoInterpretacao` ([`src/servidor/ia/contrato-provedores.ts`, linhas 30–47](../../src/servidor/ia/contrato-provedores.ts)).

É essencial distinguir esse conteúdo prescritivo da validação automática: o prompt pede essas condutas, mas o servidor não verifica todas elas após a geração.

### 2.4 Provedores, modelos e ordem

O catálogo atual define:

| Provedor | Modelo padrão no código | Transporte | Limite padrão |
|---|---|---|---:|
| Groq | `openai/gpt-oss-20b` | API compatível com OpenAI e JSON Schema | 12 s |
| Gemini | `gemini-3.8-flash` | API Gemini com schema de resposta | 20 s |
| Qwen | `qwen3.7-flash-2026-07-15` | API compatível com OpenAI e JSON Object | 8 s |

Fontes: [`src/servidor/ia/catalogo-provedores.ts`, linhas 5–28](../../src/servidor/ia/catalogo-provedores.ts), [`src/servidor/ia/groq.ts`, linhas 4–12](../../src/servidor/ia/groq.ts), [`src/servidor/ia/gemini.ts`, linhas 21–23 e 72–103](../../src/servidor/ia/gemini.ts) e [`src/servidor/ia/qwen.ts`, linhas 3–11](../../src/servidor/ia/qwen.ts).

Por padrão, a fila é **Groq → Gemini → Qwen → resposta local**. Se `AI_PRIMARY_PROVIDER=GEMINI`, passa a ser **Gemini → Groq → Qwen → resposta local**. Variáveis de ambiente podem substituir os modelos padrão; credenciais ativas e não bloqueadas do usuário têm precedência operacional, com chaves de ambiente como alternativa ([`src/servidor/ia/catalogo-provedores.ts`, linhas 14–28](../../src/servidor/ia/catalogo-provedores.ts); [`src/servidor/ia/configuracoes.ts`, linhas 66–79](../../src/servidor/ia/configuracoes.ts)). Portanto, o modelo efetivamente usado em uma execução só pode ser afirmado a partir do campo `modelo` devolvido naquela resposta ou de um registro experimental; o catálogo não prova qual credencial estava ativa no momento.

Groq e Qwen usam temperatura `0,35` e limite de 700 tokens na interpretação. O Gemini usa o mesmo contrato estruturado e possui repetição interna para falhas transitórias: até duas tentativas no modelo principal e uma no modelo de contingência quando o padrão é usado ([`src/servidor/ia/openai-compativel.ts`, linhas 46–62](../../src/servidor/ia/openai-compativel.ts); [`src/servidor/ia/gemini.ts`, linhas 79–130](../../src/servidor/ia/gemini.ts)).

### 2.5 Seleção da resposta

`interpretarComFila` percorre as credenciais ordenadas. Para cada provedor:

1. chama o adaptador;
2. valida novamente o conteúdo recebido;
3. encerra a fila na primeira resposta válida;
4. registra o código da tentativa;
5. avança para o próximo provedor quando ocorre timeout, cota, autenticação inválida, modelo/requisição inválidos, rede indisponível ou resposta inválida.

Se todas as tentativas falharem, o sistema produz uma resposta local. Se todas falharem especificamente por conteúdo inválido, o motivo final é `RESPOSTA_INVALIDA`; em falhas mistas, é `TODOS_INDISPONIVEIS` ([`src/servidor/ia/interpretacoes.ts`, linhas 208–255](../../src/servidor/ia/interpretacoes.ts)).

Cada solicitação retorna uma `InterpretacaoGerada` com **um a três insights**. A fila não combina respostas de vários modelos, não realiza votação e não seleciona “a melhor” entre múltiplas respostas válidas: a primeira válida vence.

## 3. Dados e métricas enviados

O contrato completo do DTO está em [`src/dominio/interpretacoes/esquema.ts`, linhas 8–58](../../src/dominio/interpretacoes/esquema.ts). De forma consolidada, podem ser enviados:

| Grupo | Conteúdo | Observação |
|---|---|---|
| Escopo e período | escopo pessoal/módulo/sala, versão, início e fim | Contextualiza a janela analisada. |
| Base | quantidade de sessões válidas e minutos válidos | Já calculados no servidor. |
| Módulos | referência opaca, sessões, minutos, dias com estudo, frequência | A referência evita enviar diretamente o título real do módulo no DTO pessoal/módulo. |
| Percepções | médias de compreensão e dificuldade | Autorrelato em escala de 1 a 5; pode ser nulo. |
| Contextos | métodos e formatos com quantidade de sessões, quantidade de respostas e médias percebidas | Associação descritiva; não prova efeito causal. |
| Evolução | agregados semanais | Limitados aos 12 pontos mais recentes no envio. |
| Descrições | texto das sessões válidas | Somente nos fluxos pessoal/módulo; marcadas como não confiáveis e compactadas. |
| Conceitos | sessões, evidências, desempenho, tendência e relação percepção × evidência | Somente quando o DTO de módulo recebe a análise detalhada. |
| Associações | método/formato, sessões, evidências posteriores, média e suficiência da amostra | Resultado observacional com vínculo já calculado. |
| Objetivos | padrões por objetivo de estudo | Limitados a oito itens. |
| Eventos | evidências válidas, percentuais, conceitos e vínculos | Limitados a dez itens. |
| Recomendações | regra, justificativa, ação e material opcional | Geradas deterministicamente antes da IA; o prompt pede preservação. |

Não são enviados no fluxo de sala os materiais nem as descrições. Também não se observa envio de senha ou chave de provedor no DTO; a chave é usada apenas pelo adaptador para autenticação. As credenciais salvas são cifradas e recuperadas no servidor ([`src/servidor/ia/configuracoes.ts`, linhas 41–50 e 66–79](../../src/servidor/ia/configuracoes.ts)).

## 4. Validação automática

### 4.1 O que é validado de fato

A resposta precisa obedecer ao schema:

- objeto com `insights`;
- de 1 a 3 insights;
- `tipo` em `OBSERVACAO`, `CALIBRACAO`, `ESTRATEGIA`, `PROGRESSO`, `DIFICULDADE` ou `EXPERIMENTO`;
- título entre 3 e 100 caracteres;
- observação entre 12 e 700 caracteres;
- resumo de evidências, pergunta reflexiva e experimento sugerido nulos ou entre 3 e 360 caracteres;
- confiança em `BAIXA`, `MODERADA` ou `FORTE`.

O contrato é imposto no pedido estruturado do provedor quando a API oferece esse recurso e é validado novamente no servidor com Zod ([`src/dominio/interpretacoes/esquema.ts`, linhas 4–6 e 60–70](../../src/dominio/interpretacoes/esquema.ts); [`src/servidor/ia/contrato-provedores.ts`, linhas 5–28 e 56–66](../../src/servidor/ia/contrato-provedores.ts)). Respostas em JSON puro ou dentro de cerca Markdown podem ser extraídas; texto vazio, JSON inválido e estrutura incompleta são rejeitados.

Após o schema, uma lista de expressões regulares rejeita frases que afirmem, entre outros padrões, “você aprende melhor”, “melhor método/formato”, “mais eficaz/eficiente”, “estilo de aprendizagem/fixo”, causalidade direta, comprovação, diagnóstico, garantia ou incapacidade fixa ([`src/dominio/interpretacoes/esquema.ts`, linhas 93–103](../../src/dominio/interpretacoes/esquema.ts)).

### 4.2 O que não é validado automaticamente

Não há código que:

- extraia todos os números da resposta e os confronte com o DTO;
- verifique se cada fato textual existe na entrada;
- detecte toda invenção ou alucinação por significado;
- identifique contradições sem usar uma expressão proibida;
- confirme que uma reflexão é realmente compatível com o indicador citado;
- compare semanticamente o experimento sugerido com a recomendação determinística;
- verifique se a IA preservou exatamente a justificativa e a ação recomendadas;
- atribua automaticamente C1–C5 ou decida a aprovação qualitativa.

Exemplo: uma resposta estruturalmente correta poderia afirmar que houve “8 sessões”, quando o DTO contém 6, e ainda passar se não contiver nenhuma expressão proibida. Da mesma forma, poderia sugerir uma ação pouco coerente sem violar o schema. Isso demonstra por que a validação existente deve ser chamada de **estrutural e lexical**, não de validação factual completa.

### 4.3 Prompt versus garantia executável

| Regra | Está no prompt? | É checada após a resposta? |
|---|---:|---:|
| Produzir JSON com 1–3 insights | Sim | Sim |
| Usar tipos, campos e confiança válidos | Sim/schema | Sim |
| Não usar certas formulações causais, diagnósticas ou de perfil fixo | Sim | Parcialmente, por expressões regulares |
| Não inventar números ou fatos | Sim | Não, de forma semântica |
| Não recalcular métricas | Sim | Não |
| Respeitar amostra pequena | Sim | Não de forma geral |
| Preservar recomendação oficial | Sim | Não semanticamente |
| Produzir reflexão e experimento coerentes | Sim | Não semanticamente |

## 5. Falhas e respostas inválidas

### 5.1 Resposta inválida de provedor

Quando o conteúdo não pode ser extraído ou não passa pelo schema/regex, o adaptador ou a orquestração lança `RESPOSTA_INVALIDA`. A resposta parcial não é mostrada. A tentativa é registrada e o próximo provedor da fila é chamado. Se nenhum provedor fornecer resultado válido, o usuário recebe a resposta local ([`src/servidor/ia/openai-compativel.ts`, linhas 46–62](../../src/servidor/ia/openai-compativel.ts); [`src/servidor/ia/gemini.ts`, linhas 103–130](../../src/servidor/ia/gemini.ts); [`src/servidor/ia/interpretacoes.ts`, linhas 220–254](../../src/servidor/ia/interpretacoes.ts)).

### 5.2 Outras contingências

A resposta local também é usada quando:

- não há sessão válida (`DADOS_INSUFICIENTES`);
- a entrada compactada ainda excede 50.000 caracteres (`ENTRADA_EXCEDIDA`);
- não há credencial disponível (`SEM_CHAVE`);
- a cota local de cinco solicitações por hora é excedida (`COTA_LOCAL`);
- a configuração ou todos os provedores falham (`TODOS_INDISPONIVEIS`).

A cota é mantida em memória do processo, por usuário. Ela não é persistente nem compartilhada entre múltiplas instâncias e pode ser reiniciada com o processo (`ControleCotaInterpretacoes`, [`src/servidor/ia/interpretacoes.ts`, linhas 15–19 e 38–50](../../src/servidor/ia/interpretacoes.ts)).

A contingência local é determinística e construída com regras sobre o próprio DTO. Ela pode gerar observação de falta de dados, calibração percepção × evidência, atenção a contexto frequente com resultado baixo, progresso, diferença Bloom quando esses campos existem, estratégia exploratória ou observação geral ([`src/dominio/interpretacoes/resposta-local.ts`, linhas 3–95](../../src/dominio/interpretacoes/resposta-local.ts)). Ela deve ser relatada separadamente de uma geração por modelo externo.

### 5.3 Exposição ao usuário e registro

Quando a contingência local é bem-sucedida, a API normalmente retorna HTTP 200 e a interface identifica “resposta local” ou “Reflexão local de contingência”, além do motivo e, no componente geral, do caminho de tentativas ([`src/componentes/interpretacao-automatica.tsx`, linhas 50–58](../../src/componentes/interpretacao-automatica.tsx)). Falhas inesperadas das rotas de módulo e sala produzem erro genérico 500; a rota pessoal não possui o mesmo `try/catch` local ([`src/app/api/interpretacoes/route.ts`, linhas 7–16](../../src/app/api/interpretacoes/route.ts)).

Em desenvolvimento há log diagnóstico de eventos, sem registro do corpo bruto da resposta no trecho auditado. Para configurações persistidas do usuário, o estado do provedor e um bloqueio temporário podem ser atualizados após a falha ([`src/servidor/ia/interpretacoes.ts`, linhas 187–205 e 220–251](../../src/servidor/ia/interpretacoes.ts); [`src/servidor/ia/configuracoes.ts`, linhas 92–96](../../src/servidor/ia/configuracoes.ts)). Não foi identificado histórico persistido das interpretações geradas.

## 6. Comparação com os cinco critérios metodológicos

Os cinco critérios solicitados podem ser mapeados para a rubrica já existente, mas sua cobertura automática é parcial:

| Critério solicitado | Correspondência no protocolo existente | Cobertura atual | Situação |
|---|---|---|---|
| 1. Métricas corretas | C1 — Fidelidade | O DTO contém métricas calculadas e o prompt proíbe recálculo; não há comparação numérica entre saída e entrada. | **Exige avaliação humana.** |
| 2. Coerência com o contexto | C2 — Padrões e limites e parte de C3 — Coerência | O prompt orienta contexto e amostra; schema não mede coerência. | **Exige avaliação humana.** |
| 3. Não inventar informação, obrigatório | Parte central de C1 — Fidelidade | Prompt proíbe invenção; regex só cobre formulações específicas e não detecta fatos inventados em geral. | **Não garantido automaticamente; deve permanecer obrigatório na rubrica humana.** |
| 4. Não criar classificações fixas | C4 — Linguagem, obrigatório no protocolo atual | Prompt proíbe estilo fixo e regex bloqueia algumas frases explícitas. | **Cobertura automática parcial; revisão humana ainda necessária.** |
| 5. Reflexões e recomendações compatíveis | C3 — Coerência e C5 — Clareza | Recomendações oficiais podem entrar no DTO de módulo e o prompt pede preservação; não há comparação semântica posterior. | **Exige avaliação humana.** |

O protocolo atual define C1 (fidelidade) e C4 (linguagem) como obrigatórios e considera satisfatória a resposta que obtiver pelo menos 4 de 5, incluindo ambos. O conjunto solicitado pelo TCC explicita o critério 3, “não inventar informação”, como obrigatório. Isso não é necessariamente incompatível, pois a ausência de invenção já integra C1, mas a redação final deve deixar essa equivalência expressa. Se o trabalho desejar dois requisitos obrigatórios, uma formulação consistente seria: **aprovação em pelo menos 4/5, obrigatoriamente com fidelidade/ausência de invenção e linguagem não causal/não classificatória**.

Fonte da rubrica atual: [`AiFiles/RELATORIOS/PROTOCOLO_AVALIACAO_TCC.md`, linhas 32–44](PROTOCOLO_AVALIACAO_TCC.md).

### 6.1 Respostas diretas sobre a metodologia

- **É adequado avaliar manualmente 15 respostas?** Sim, como avaliação exploratória e qualitativa do artefato: cinco situações distintas e três repetições permitem observar adequação aos casos e alguma variação do modelo. O número não sustenta generalização estatística ampla nem estima com precisão uma taxa populacional de erro; essa limitação precisa ser declarada.
- **O código aplica automaticamente os cinco critérios?** Não. Schema e regex cobrem apenas partes formais e lexicais. C1–C5 continuam dependendo de leitura humana.
- **A regra de 4/5 com ausência obrigatória de invenção está implementada?** Não. Ela pertence à metodologia proposta. O JSON gerado pelo experimento mantém C1–C5 e `satisfatoria` como `null`.
- **O que registrar na avaliação manual?** Identificador do cenário e da execução; data/hora; prompt e DTO exatos; provedor, modelo efetivo e origem; resposta integral; caminho e códigos das tentativas; ocorrência de contingência local; decisão e justificativa de cada critério; decisão final; avaliador; e eventuais divergências entre avaliadores.
- **Qual é a divergência principal?** A metodologia descreve julgamento qualitativo de respostas reais, enquanto o fluxo padrão existente gera respostas simuladas e não atribui notas. O experimento real e o preenchimento humano da rubrica ainda precisam ser executados para produzir o resultado metodológico.

## 7. Testes automatizados existentes

### 7.1 Contrato, fila e provedores

[`src/servidor/ia/interpretacoes.test.ts`](../../src/servidor/ia/interpretacoes.test.ts) verifica:

- seleção da primeira resposta válida;
- avanço da fila após cota ou modelo inválido;
- contingência local sem chave ou quando todos falham;
- rejeição de frase causal e uso do provedor seguinte;
- cota de cinco interpretações por hora;
- mapeamento de erros HTTP;
- schema estruturado enviado ao Gemini;
- repetição do Gemini em falha transitória e troca para o modelo de contingência;
- teste de conexão simulado;
- uso de referências opacas;
- inclusão apenas de evidências consolidadas/válidas no DTO de módulo.

### 7.2 Conteúdo e contingência local

[`src/servidor/ia/insights-aprendizagem.test.ts`](../../src/servidor/ia/insights-aprendizagem.test.ts) verifica:

- JSON puro e cercado aceito;
- JSON inválido ou incompleto rejeitado;
- nenhuma chamada ao provedor quando não há sessão;
- compactação das descrições;
- linguagem cautelosa com poucos dados;
- calibração sem diagnóstico;
- contexto frequente com resultado baixo sem atribuição causal;
- cenários opcionais de Bloom/evolução na resposta local;
- seleção do provedor principal por ambiente.

### 7.3 Interface e credenciais

- [`src/componentes/interpretacao-automatica.test.ts`](../../src/componentes/interpretacao-automatica.test.ts) cobre os modos de apresentação e textos essenciais.
- [`src/componentes/interpretacao-automatica-modal.test.ts`](../../src/componentes/interpretacao-automatica-modal.test.ts) cobre abertura, geração, fechamento e retorno de foco do painel lateral.
- [`src/servidor/ia/cofre-credenciais.test.ts`](../../src/servidor/ia/cofre-credenciais.test.ts) cobre o cofre de credenciais.

Nesta auditoria, os cinco arquivos acima foram executados sem cache: **5 arquivos e 31 testes aprovados**. Todos usam mocks ou lógica local; nenhuma API paga ou externa foi chamada.

Não há teste que injete uma resposta estruturalmente válida com número falso e comprove sua rejeição — ela não seria rejeitada pelo mecanismo atual. Também não há teste que compare semanticamente todos os fatos da interpretação com o DTO, que pontue automaticamente C1–C5 ou que valide a compatibilidade entre recomendação e resposta. O teste da frase causal cobre uma formulação inadequada específica; os testes de contingência local verificam linguagem cautelosa e ausência de diagnóstico em casos definidos, mas não constituem um classificador geral de invenções, contradições ou perfis fixos.

### 7.4 Avaliação sintética do TCC

O script [`scripts/avaliar-tcc.ts`](../../scripts/avaliar-tcc.ts) cria um banco temporário isolado, cinco usuários sintéticos, três módulos por cenário e dez sessões/evidências por módulo. Ele confirma gabaritos aritméticos de 15 módulos e, para a interpretação, executa três respostas para o primeiro módulo de cada um dos cinco cenários ([`scripts/avaliar-tcc.ts`, linhas 8–23, 26–85 e 90–114](../../scripts/avaliar-tcc.ts)).

No modo padrão:

- o provedor é simulado e não usa rede;
- a resposta textual é fornecida pelo próprio fixture;
- as 15 entradas recebem C1–C5 nulos e `satisfatoria: null`;
- o resultado não mede qualidade de modelo, variabilidade entre execuções nem taxa real de aprovação.

Os cinco cenários são: método/formato, contexto do módulo, evolução, dados insuficientes e percepção × evidência ([`testes/fixtures/cenarios-tcc.ts`, linhas 1–16](../../testes/fixtures/cenarios-tcc.ts)). O modo real só é habilitado simultaneamente por `--ia-real`, `--autorizar-consumo` e pelas variáveis de provedor, modelo e chave ([`scripts/avaliar-tcc.ts`, linhas 21–23 e 81–85](../../scripts/avaliar-tcc.ts)). Ele pode realizar 15 chamadas e não foi executado nesta auditoria.

## 8. Limitações e divergências

1. **Validação semântica ausente.** O servidor não confirma automaticamente fidelidade numérica, ausência geral de invenção ou coerência da recomendação.
2. **Regex tem cobertura finita.** Uma frase problemática com formulação não prevista pode passar; uma frase legítima contendo uma expressão prevista pode ser rejeitada.
3. **Primeira resposta válida, não melhor resposta.** Não há comparação, votação, crítica por segundo modelo ou escore de qualidade.
4. **Avaliação real pendente.** O protocolo possui 15 posições para respostas, mas a execução padrão é simulada e deixa a rubrica vazia.
5. **Resposta local e resposta de IA externa são naturezas diferentes.** Misturá-las na mesma taxa de sucesso distorceria o experimento.
6. **Contextos enviados não são equivalentes.** O módulo pode incluir evidências e recomendações detalhadas; o pessoal não inclui esse detalhamento; a sala exclui descrições e materiais.
7. **Quota apenas em memória.** Reinício e múltiplas instâncias podem alterar a efetividade do limite de cinco usos por hora.
8. **Sem histórico persistente de respostas.** O código auditado não mantém corpus versionado de geração, decisão da rubrica e reavaliação.
9. **Campos opcionais sem alimentação regular.** A contingência local sabe interpretar `bloom` e `evolucaoAprendizagem`, mas os construtores atuais de DTO pessoal/módulo não os preenchem diretamente.
10. **Diferença pequena no filtro de sessão.** A função local da IA aceita duração `>= 5`, enquanto o motor principal pode impor requisitos adicionais de integridade. Na prática, as consultas reutilizadas tendem a entregar dados já filtrados, mas o predicado não é uma fonte canônica única.
11. **Tratamento desigual de erro na API.** As rotas de módulo e sala convertem falhas inesperadas em erro genérico 500; a rota pessoal depende do tratamento global do framework.
12. **Modelo efetivo depende da execução.** Defaults do catálogo não demonstram qual modelo foi realmente usado por uma credencial configurada ou variável de ambiente.

## 9. Recomendações para descrever corretamente no TCC

### 9.1 Redação tecnicamente segura para a seção 3.4.3

Sugestão de redação:

> A plataforma produz interpretações a partir de métricas previamente calculadas e organizadas em um objeto estruturado. Após a solicitação do usuário, o servidor encaminha esse contexto ao primeiro provedor configurado disponível e exige uma resposta JSON com um a três insights. A saída é validada quanto à estrutura, aos campos obrigatórios, aos limites textuais e a um conjunto de formulações proibidas relacionadas a causalidade, diagnóstico, superioridade de método e perfis fixos. Respostas inválidas acionam o provedor seguinte e, na ausência de uma resposta externa válida, uma reflexão local determinística é apresentada como contingência. Essa validação reduz erros de formato e alguns riscos de linguagem, mas não substitui a avaliação semântica: a fidelidade aos números, a ausência de informações inventadas e a coerência das reflexões e recomendações são avaliadas por rubrica humana.

### 9.2 Como relatar a avaliação

- Descrever os cinco cenários sintéticos e as três execuções, totalizando 15 respostas planejadas.
- Informar claramente se as respostas avaliadas vieram de modelo real ou de fixture simulada.
- Para experimento real, registrar data, provedor, modelo efetivo, versão do prompt/DTO, origem da resposta, tentativas e eventuais contingências.
- Manter os cinco critérios com decisão binária ou escala previamente definida.
- Tornar obrigatórios: fidelidade/ausência de invenção e linguagem sem causalidade, diagnóstico ou perfil fixo.
- Considerar satisfatória a resposta com pelo menos 4/5, desde que cumpra os obrigatórios, se esse limiar for formalmente adotado antes da análise.
- Calcular o resultado global apenas sobre respostas externas realmente geradas e avaliadas; relatar respostas locais de contingência em categoria separada.
- Não preencher retroativamente a rubrica sem conservar a resposta original e a identificação dos avaliadores.
- Se houver mais de um avaliador, definir resolução de discordâncias e, idealmente, uma medida de concordância.

### 9.3 Afirmações que devem ser evitadas

Não afirmar, no estado atual, que:

- “a plataforma detecta alucinações automaticamente”;
- “todas as informações inventadas são bloqueadas”;
- “as recomendações da IA são automaticamente validadas contra os dados”;
- “o modelo foi aprovado em 14 de 15 respostas”, sem executar o modo real e preencher a rubrica;
- “três respostas são geradas por solicitação”, pois as três execuções pertencem ao protocolo experimental, não ao fluxo comum;
- “Groq é sempre o provedor utilizado”, pois a prioridade, as credenciais, os bloqueios e as variáveis de ambiente podem alterar a execução;
- “a resposta local comprova qualidade da IA”, pois ela é uma contingência determinística.

### 9.4 Evidências que já podem ser afirmadas

É defensável afirmar que:

- existe contrato JSON estruturado e validação posterior no servidor;
- respostas inválidas não são apresentadas e acionam contingência;
- há fila ordenada de provedores e resposta local;
- há proteção lexical contra um conjunto explícito de formulações inadequadas;
- o prompt restringe o modelo aos dados estruturados e orienta linguagem observacional;
- existe um protocolo reproduzível com dados sintéticos e rubrica qualitativa;
- a execução padrão do protocolo não usa rede nem mede a qualidade real do modelo;
- a avaliação qualitativa real permanece uma etapa manual pendente.

## Registro da verificação

Comando executado, sem rede e sem banco:

```powershell
npm.cmd exec -- vitest run src/servidor/ia/insights-aprendizagem.test.ts src/servidor/ia/interpretacoes.test.ts src/servidor/ia/cofre-credenciais.test.ts src/componentes/interpretacao-automatica.test.ts src/componentes/interpretacao-automatica-modal.test.ts --no-cache
```

Resultado: **5 arquivos aprovados; 31 testes aprovados**. Nenhum arquivo de aplicação, prompt, modelo, configuração, banco, seed ou dado foi alterado por esta auditoria.
