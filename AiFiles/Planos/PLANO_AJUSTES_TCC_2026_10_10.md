# Plano de ajustes de implementação — TCC / Learning Analytics

**Destinatário:** Codex, atuando no repositório da plataforma.
**Objetivo:** corrigir divergências identificadas na auditoria técnica, concluir o núcleo de Learning Analytics e recomendação e preparar o sistema para uma avaliação acadêmica reproduzível.
**Referências:** `AUDITORIA_TECNICA_COMPARACAO_IMPLEMENTACAO_TCC.md` (10/10/2026), TCC em PDF disponível no contexto do usuário e orientações do professor.
**Tipo de trabalho:** ajustes enxutos de implementação, testes essenciais e documentação técnica. **Não editar o PDF do TCC nesta execução.**

> **Instrução principal:** implemente no código REAL o mínimo necessário para uma **prova de conceito de TCC**, preservando a arquitetura e os padrões existentes. **Não reintroduza o fluxo de confirmação de evidências**: ele foi descontinuado por decisão do projeto. Não faça uma reescrita da aplicação, não acrescente funcionalidades sociais e não transforme melhorias opcionais em requisitos de entrega. Ao terminar, entregue um relatório verificável com arquivos alterados, testes e pendências. Se algo ficar para o futuro, documente sem inventar implementação.

## 0. Contexto e escopo obrigatório

A plataforma evoluiu de um modelo centrado em **tópicos, avaliações convencionais, acertos/erros e tentativas** para outro baseado em **módulos, sessões de estudo, conceitos, percepções e evidências posteriores registradas**.

A auditoria identificou, entre outros pontos:

- Métricas determinísticas de sessões e análises por conceito já implementadas.
- Rankings de conceitos que combinam compreensão percebida, dificuldade percebida e desempenho registrado.
- Divergência de normalização da escala 1–5 (`valor * 20` versus `(valor - 1) / 4 * 100`).
- Regra acadêmica de **três observações para destacar tendências** divergindo de análises que consideram duas observações.
- **Fluxo antigo de confirmação de evidências** ainda presente em serviços, componentes e filtros, apesar de ter sido retirado do produto. O objetivo agora é **removê-lo completamente** e garantir que evidências utilizáveis alimentem as análises sem aprovação humana.
- Ausência de motor independente de **recomendação personalizada de materiais**; a IA e a contingência local já geram reflexões/experimentos.
- Média simples dos percentuais das evidências, independentemente do número de questões/pontos.
- Taxa de acerto a partir de questões e análise operacional de Bloom não implementadas de ponta a ponta.
- Seeds atuais insuficientes para o plano acadêmico de 5 usuários, 15 módulos e 150 sessões, além de dados de avaliação/evidências compatíveis.
- IA com métricas calculadas no backend, mas sem verificação factual completa de números apresentados nas respostas.

### 0.1. Decisão de escopo para entrega rápida

Esta é uma **prova de conceito de TCC**, não um produto comercial pronto. Não buscar perfeição, novas camadas de arquitetura, telemetria avançada, telas de administração ou validação automática sofisticada. **Quando uma melhoria não for essencial ao ciclo registro → métricas → visualização → recomendação → avaliação, documente como trabalho futuro em vez de implementá-la.** A decisão de retirar a confirmação de evidências é definitiva para esta fase.

### 0.2. ATENÇÃO: divergência entre versões do PDF

O relatório da auditoria afirma que o PDF consultado contém **sete métricas** e referencia **Qwen**, mas o PDF enviado na conversa lista **nove métricas na seção 3.4.1** (incluindo tentativas e Bloom) e cita **Gemini API** na seção 3.2. Portanto:

1. Não use as afirmações da auditoria sobre o conteúdo do PDF como fonte definitiva.
2. Se o PDF estiver no repositório, identifique o arquivo/versão antes de comparar; se não estiver, use o conjunto de requisitos abaixo como referência operacional.
3. **Não modifique o TCC acadêmico automaticamente** para adequá-lo ao software. Registre em relatório o que deverá mudar no texto após a estabilização do código.

### 0.3. Regras de execução

1. **Leia `AGENTS.md` e as convenções do projeto antes de implementar.** Respeite a organização vigente; arquivos exclusivos de contexto/relatório para IA devem ficar em `AiFiles/`, se essa for a convenção aplicável.
2. Faça um inventário inicial de branches, alterações não commitadas, schema Prisma, rotas, serviços, componentes e testes. Não sobrescreva alterações preexistentes do usuário.
3. Trabalhe incrementalmente, com mudanças pequenas, testes a cada etapa e sem refatoração ampla sem justificativa.
4. Para remover o fluxo legado, faça somente migrações de banco **necessárias e seguras**; preserve os dados históricos relevantes. Não execute seeds sobre banco pessoal/produção; use banco de testes isolado.
5. Preserve os dados atuais, o isolamento por usuário/módulo e as regras de autorização.
6. Preserve a distinção **“o sistema calcula; a IA interpreta”**. Indicadores e a seleção básica de recomendações não podem depender de texto gerado pelo modelo.
7. Não converta associações observacionais em afirmações causais, diagnósticos, “estilos de aprendizagem” fixos ou prova de domínio.
8. Não exija chamadas pagas a provedores externos durante testes automáticos; use mocks/fixtures. Testes reais da IA somente se houver configuração, credenciais e autorização para consumir a API.
9. Não marque uma tarefa como concluída apenas porque seu serviço existe; valide o fluxo **registro de evidência utilizável → cálculo → interface → teste**, sem etapa de confirmação.

---

## 1. P0 — Remover completamente o fluxo legado de confirmação de evidências

**Decisão de escopo já tomada pelo projeto:** o sistema **não possui mais confirmação manual de evidências** e **essa funcionalidade não deve voltar**. Por ser uma prova de conceito acadêmica com prazo curto, não queremos implementar tela, botão, fila de revisão, aprovação, rejeição ou confirmação de evidências. Remova esse fluxo do código, em vez de restaurá-lo.

**Objetivo:** o sistema deve conseguir registrar e utilizar evidências de desempenho **sem depender de intervenção humana de confirmação**, mantendo apenas as verificações básicas de integridade necessárias para não calcular indicadores com dados incompletos ou inválidos.

### Ações obrigatórias

- [ ] **Localizar todas as peças exclusivamente ligadas à confirmação**, incluindo componentes visuais ocultos, rotas, server actions, serviços, validações, tipos, enums, estados (`PENDENTE`, `CONFIRMADA`, `REJEITADA` ou equivalentes), mensagens, testes, seeds e filtros `status=confirmado`.
- [ ] **Remover código morto** de tela, botões, ações e endpoints de revisar/confirmar/rejeitar evidências. Não substituir por uma nova interface de aprovação.
- [ ] Ajustar o ponto em que as evidências são criadas/registradas: quando os dados mínimos estiverem válidos, devem ficar disponíveis às análises **automaticamente**, sem uma transição de status controlada pelo usuário.
- [ ] Atualizar consultas, cálculos, rankings, dashboards, recomendações e payloads enviados à IA para **não exigirem flag de confirmação humana**. Remover filtros de confirmação que deixariam evidências utilizáveis de fora das métricas.
- [ ] **Preservar controles básicos de validade**, sem recriar o fluxo antigo: não usar evidência sem desempenho confiável ou sem os campos necessários ao cálculo. Uma extração incompleta/falha pode ser descartada das métricas ou tratada como ausência de dados, mas **não deve criar uma fila de confirmação**.
- [ ] Preservar o isolamento por usuário/módulo, os vínculos com conceitos e a deduplicação. Não interpretar evidências geradas automaticamente como "aprovadas pelo estudante"; documentar a origem de cada tipo de dado, quando já estiver disponível.
- [ ] Revisar registros antigos com status pendente/confirmado: adotar uma regra de compatibilidade **simples e segura** baseada na validade efetiva do registro. Não apagar evidências existentes; não incluir rascunhos incompletos em médias; evitar contagens duplicadas.
- [ ] Remover do schema Prisma e do banco os campos/enums específicos de confirmação **se forem exclusivos desse fluxo e a remoção for segura**. Se houver risco de perda de dados ou dependência real, preserve temporariamente o campo somente como legado técnico, tire-o totalmente do fluxo de negócio e documente a pendência pontual (não fazer migração destrutiva precipitada).
- [ ] Atualizar nomenclaturas do código e da UI: não chamar os registros de **“confirmados”** se não existe mais confirmação. Preferir **“evidências registradas”**, **“evidências de desempenho”** ou **“evidências válidas”**, conforme o significado real de cada indicador.
- [ ] Excluir/substituir testes da confirmação manual por **testes pequenos do fluxo simplificado**: evidência válida entra no cálculo sem intervenção; evidência incompleta não altera desempenho; registro legado válido continua utilizável; usuário não acessa dados de outro usuário.
- [ ] Remover documentação técnica interna que instrua o usuário a confirmar/rejeitar evidências ou que trate confirmação como requisito atual. **Não editar o PDF do TCC**; apenas anotar mudanças que precisaremos refletir nele depois.

### Critérios de aceitação

- Criar uma evidência utilizável no fluxo atual faz com que ela seja considerada nos indicadores na consulta seguinte, **sem clique ou aprovação manual**.
- Nenhuma tela, serviço ou regra ativa exige confirmação, aprovação ou rejeição para a evidência ser usada.
- Registros inválidos ou incompletos não contaminam métricas; dados históricos válidos permanecem preservados.
- Dashboard, cálculos, IA e recomendação operam com a mesma definição simplificada de **evidência válida**.
- A busca por referências à confirmação identifica, no máximo, código estritamente legado ainda necessário à compatibilidade do banco e documentado, **sem caminho funcional ativo**.
- Os testes essenciais do fluxo simplificado passam.

> **Não implementar:** nova fila de pendências, revisão humana, botão “confirmar”, workflow de aprovação, auditoria complexa de evidência, versionamento de revisões ou novas páginas. Essas ideias ficam fora do escopo da prova de conceito.

---

## 2. P0 — Criar recomendação determinística mínima e explicável

**Por que:** o TCC tem **sistema de recomendação educacional** como contribuição central, e o professor exige lógica computacional verificável, distinta da IA. A auditoria encontrou apenas análises, experimentos sugeridos e interpretações, sem motor independente de seleção de materiais.

### Escopo proposto (MVP, não motor complexo)

Implementar um serviço de recomendação **baseado em regras**, utilizando dados já calculados: módulo, conceito, sinais de dificuldade/compreensão, desempenho registrado, amostra válida, formatos/métodos associados e materiais existentes. A implementação exata deve seguir o modelo atual, sem inventar dependências ou redesenhar a aplicação.

### Ações

- [ ] Criar/centralizar uma função **determinística e testável** que receba um DTO analítico, contexto do aluno e catálogo elegível de materiais, produzindo recomendações **estruturadas e rastreáveis**.
- [ ] Definir explicitamente as regras de prioridade, elegibilidade e desempate. Sugestão de sequência inicial:
  1. Identificar conceitos com evidências de dificuldade ou baixo desempenho **no módulo atual**.
  2. Verificar se existe histórico **suficiente e comparável** para recomendar um formato/método de maneira contextualizada.
  3. Selecionar material disponível e vinculado ao conceito; filtrar materiais indisponíveis, duplicados ou não autorizados.
  4. Quando não houver evidências suficientes, sugerir **experimentação exploratória** ou coleta de novas evidências, **sem** declarar que algum formato é superior.
  5. Quando não existir material elegível, retornar um estado explícito de ausência de recomendação de material e, quando cabível, sugerir uma ação de estudo não materializada.
- [ ] Definir um limite conservador de amostras para **afirmações comparativas** (ver seção 3); não transformar a contagem de sessões em quantidade de evidências independentes.
- [ ] Evitar rankings ingênuos que confundam atividades com dificuldades diferentes: comparar preferencialmente o mesmo conceito, módulo e condições conhecidas; explicitar limitações quando a comparabilidade não puder ser garantida.
- [ ] Retornar no DTO, no mínimo: `tipo`, `moduloId`, `conceitoId` quando aplicável, `materialId` quando aplicável, `regraId`, `indicadoresUtilizados`, `tamanhoAmostra`, `justificativaEstruturada`, `limitacoes` e `nivelEvidencia` (adaptar nomes ao padrão do repositório).
- [ ] Integrar esse DTO no backend e apresentá-lo de forma simples no módulo ou Dashboard, junto da justificativa curta. **Não é necessário criar um painel complexo.**
- [ ] Entregar as recomendações pré-calculadas à IA como contexto opcional. A IA pode explicar e contextualizar, mas **não** modificar identificadores, métricas, seleção de material ou grau de evidência.
- [ ] Reutilizar a lógica de `proximoExperimento`/contingência local, se fizer sentido; evitar criar duas regras conflitantes.

### Critérios de aceitação

- Para o mesmo conjunto de dados, o motor retorna a mesma decisão e os mesmos motivos.
- Uma recomendação pode ser rastreada até uma regra e os indicadores de entrada.
- Existe um caso de **início a frio** sem falsa personalização.
- Dados insuficientes, conceitos de outros módulos, materiais indisponíveis e empates são tratados.
- A indisponibilidade da API de IA não impede o cálculo nem a visualização da recomendação estruturada.
- Os testes cobrem recomendações coerentes e situações em que o sistema **deve se abster** de recomendar um formato/material específico.

> **Não implementar agora:** filtragem colaborativa, embeddings de recomendação, treino de modelo preditivo, perfis fixos de estilo de aprendizagem ou feed social. O propósito é provar a lógica computacional de recomendação do núcleo do TCC.

---

## 3. P1 — Uniformizar métricas, definições e regras de evidência

### 3.1. Normalização da escala de percepção (1 a 5)

**Problema:** a auditoria encontrou `compreensao * 20` em parte das análises e `(compreensao - 1) / 4 * 100` nos rankings.

- [ ] Rastrear todos os pontos que normalizam **compreensão e dificuldade**, inclusive gráficos, calibração, rankings, DTOs e prompts.
- [ ] Adotar **uma única convenção documentada** para comparações em escala 0–100. Como proposta: `normalizado = ((valor - 1) / 4) * 100`, portanto 1→0, 2→25, 3→50, 4→75, 5→100.
- [ ] Centralizar a função e fazer todos os consumidores utilizarem a mesma definição; deixar claro que **valor normalizado de percepção não equivale a percentual de acertos**.
- [ ] Revisar limiares ou rótulos de calibração que dependiam da normalização antiga, com testes de regressão e análise das consequências em gráficos antigos.
- [ ] Documentar os limites de escala, arredondamento e ausência de percepção.

**Aceitação:** a mesma percepção 1–5 gera o mesmo valor em rankings, calibração, APIs e gráficos; testes verificam todos os cinco pontos da escala.

### 3.2. Amostra mínima e qualificação de tendências

**Problema:** há regras com 2 observações e o TCC prevê **pelo menos 3 observações válidas no mesmo contexto para destacar tendências**.

- [ ] Catalogar quais cálculos são **descritivos**, quais são **rankings exploratórios** e quais são **tendências/recomendações baseadas em padrão**.
- [ ] Padronizar o mínimo de **3 evidências/observações comparáveis, conforme o indicador**, para declarações de tendência e superioridade contextual. Não aplicar essa regra cegamente a médias descritivas que exibam claramente `n`.
- [ ] Em `tendenciaEvidencias`, revisar a regra atual de primeira versus última evidência (variação ≥ +10 ou ≤ −10 pontos). Não apresentar tendência categórica com duas evidências; apresentar “dados insuficientes”.
- [ ] Nos rankings de conceitos, que atualmente aceitam dois sinais somados de percepção/evidência, manter o caráter de **índice exploratório**, expor `n` por fonte e evitar rotular como aprendizagem comprovada.
- [ ] Preservar e documentar a janela de **30 dias** de associação de evidência posterior à sessão e a janela de **90 dias** dos rankings, salvo bug demonstrado.
- [ ] Diferenciar evidência **válida**, percepção declarada e referência textual a conceito; esses registros não devem ser contados como se fossem uma mesma observação objetiva.
- [ ] Exibir indicação de “base limitada/dados insuficientes” quando o algoritmo não sustentar uma conclusão mais forte.

**Aceitação:** nenhum destaque de tendência usa amostra inferior ao limite declarado; médias descritivas podem existir com `n` visível; testes cobrem `n=0`, `n=1`, `n=2`, `n=3`, alterações de contexto e janela temporal.

### 3.3. Média de desempenho das evidências

**Problema:** `analisarAprendizagemModulo` aparentemente usa média simples de `desempenhoPercentual`, e não taxa agregada de acertos.

- [ ] Preservar a métrica existente como **“desempenho médio por conceito com evidências válidas”** se sua semântica for média de percentuais de evidências válidas.
- [ ] Documentar exatamente: `media = soma(percentuais das evidencias validas) / quantidade de evidencias validas`, a deduplicação, exclusões e arredondamento.
- [ ] Não renomear essa métrica como “taxa de aprendizagem” nem “taxa de acerto agregada”.
- [ ] Investigar os dados disponíveis por evidência: pontos obtidos/pontos possíveis, questões válidas, acertos, erros, parciais e registros sem pontuação.
- [ ] **Não implementar agora** um novo módulo de taxa agregada apenas por causa do texto antigo. Primeiro verificar se já há cálculo confiável e fácil de aproveitar; caso não haja, recomendar ajustar o TCC para usar o desempenho médio por evidências.
- [ ] Se uma taxa agregada já existir ou puder ser aproveitada com alteração pequena, manter fórmula e testes separados. Não inferir acertos de dados incompletos.

**Aceitação:** métrica atual permanece matematicamente rastreável; se não houver taxa agregada implementada, isso é informado como limitação documental e não como tarefa obrigatória de novo desenvolvimento.

### 3.4. Índices compostos de conceitos e nomenclatura

A auditoria relata, para a janela de 90 dias:

```text
compreensao_normalizada = (compreensao - 1) / 4 * 100
dificuldade_normalizada = (dificuldade - 1) / 4 * 100

indice_sinais_compreensao = media(
  compreensao_normalizada,
  100 - dificuldade_normalizada,
  desempenho_das_evidencias_validas
)

indice_sinais_dificuldade = media(
  dificuldade_normalizada,
  100 - compreensao_normalizada,
  100 - desempenho_das_evidencias_validas
)
```

Somente sinais disponíveis integram cada média.

- [ ] Confirmar essas fórmulas no código e preservar seu significado **exploratório**, a menos que haja erro demonstrável.
- [ ] Utilizar rótulos precisos: **“Conceitos com maiores sinais de compreensão”** e **“Conceitos com maiores sinais de dificuldade”**. Evitar “maior/menor taxa de aprendizagem” e “domínio comprovado”.
- [ ] Quando faltarem evidências de desempenho válidas, identificar o índice como **baseado em percepções**; mostrar `n` e fontes consideradas.
- [ ] Impedir que um conceito com mera menção textual e sem observações válidas seja classificado como forte sinal de aprendizagem/dificuldade.
- [ ] Verificar ordenação, empates, limites de cinco conceitos, conceitos inativos e isolamento por módulo.

**Aceitação:** rankings retornam valores reprodutíveis e informam os sinais que compuseram cada escore; interfaces não afirmam que os índices são porcentagens de aprendizagem.

### 3.5. Integridade de associações método/formato/evidência

- [ ] Confirmar associação entre sessão e evidência por vínculo explícito ou conceito comum + mesmo módulo + evidência **posterior** em até 30 dias.
- [ ] Preservar deduplicação de evidências dentro de cada grupo.
- [ ] Confirmar que métodos/formatos múltiplos são **contextos não exclusivos** (percentuais de grupos podem somar >100%).
- [ ] Não apresentar essas associações como efeito causal do método/formato.
- [ ] Verificar isolamento entre usuários/módulos e exclusão de evidências incompletas/inválidas; não usar status de confirmação.

**Aceitação:** testes de associação temporal, deduplicação, contextos múltiplos, não causalidade e isolamento.

---

## 4. P2 — Ajustes mínimos na integração de IA, sem transferir cálculos para o modelo

**Situação relatada pela auditoria:** provedores Groq (principal), Gemini (alternativo), Qwen (legado) e resposta local determinística; DTO estruturado, validação de schema, filtro de linguagem causal e fallback.

### Ações

- [ ] Validar, no código atual, o provedor e a ordem reais; documentar configuração e comportamento de fallback **sem expor credenciais**.
- [ ] Assegurar que a IA receba somente métricas calculadas e recomendações estruturadas; não pedir que rederive indicadores ou selecione material sem regra computacional.
- [ ] Manter a geração de **explicações, reflexões e sugestões de experimentação**; restringir afirmações de causalidade, estilo fixo, diagnóstico e domínio comprovado.
- [ ] **Somente se houver tempo e for simples:** acrescentar uma verificação básica para números sem suporte. Não construir um sistema novo de checagem semântica; manter schema/filtros existentes e registrar a limitação para o TCC.
- [ ] Impedir que uma saída textual inválida substitua a recomendação estruturada correta; usar fallback local seguro e logar o motivo.
- [ ] Priorizar poucos testes essenciais: saída fora do schema, causalidade indevida e indisponibilidade do provedor. Checagem factual automática completa pode ficar como trabalho futuro.
- [ ] Para a avaliação do TCC, registrar prompt, provedor/modelo, entradas sintéticas e respostas obtidas, sem criar infraestrutura complexa de observabilidade.

### Critérios de aceitação

- IA pode explicar uma decisão, mas não altera porcentagens, indicadores e IDs que vêm do sistema.
- Falha externa da API não derruba indicadores ou recomendações determinísticas.
- Os testes existentes continuam passando e as respostas não são autorizadas a inventar fatos; validação numérica semântica completa não é exigência para o MVP.

---

## 5. P1 — Criar avaliação sintética simples e reproduzível para o TCC

**Problema:** o seed atual contém 5 usuários, 6 módulos, ~39 sessões válidas e poucas evidências válidas; a metodologia acadêmica originalmente prevê 5 usuários × 3 módulos × 10 sessões = **15 módulos e 150 sessões**, além de **150 avaliações** e 15 respostas de IA. A aplicação atual opera com **evidências**, que não são automaticamente equivalentes a avaliações convencionais.

### Ações

- [ ] Criar dados sintéticos em **banco de teste isolado**, com script simples e repetível, sem substituir o seed pessoal de desenvolvimento.
- [ ] Preferir preservar o desenho de **5 usuários × 3 módulos × 10 sessões**, porque já está escrito no TCC. Se incompatível com o modelo de evidências e o prazo, apresentar claramente a alternativa mínima e a mudança necessária no documento.
- [ ] Definir explicitamente o que representará a antiga “avaliação” no modelo atual (evidência válida, conjunto de questões ou outra entidade real), e preparar registros suficientes para validar o fluxo. **Não fingir equivalência 1 sessão = 1 avaliação** sem modelagem comprovada.
- [ ] Construir cinco cenários com parâmetros e resultados esperados **pré-calculados de forma independente** das funções sob teste:

| Cenário | Dados sintéticos | O que precisa ser detectado |
|---|---|---|
| S1 — Formato e método | Evidências posteriores comparáveis por conceito com diferentes métodos/formatos | Associações corretas, sem afirmar causalidade; recomendação contextual apenas com amostra adequada |
| S2 — Contexto de módulo | Mesmo usuário, resultados diferentes em módulos/conceitos diferentes | Isolamento; sem perfil global fixo de aprendizagem |
| S3 — Evolução | Evidências cronológicas com melhora e piora predefinidas | Tendência por conceito e atualização após novos registros |
| S4 — Dados insuficientes | Grupos com 0, 1 e 2 observações e casos sem materiais | Abstinência/experimentação no início a frio, sem conclusão categórica |
| S5 — Percepção × evidência | Percepções altas com evidência baixa, e vice-versa | Calibração, índices compostos e reflexão coerente |

- [ ] Incluir casos de controle: sessão <5 minutos; sessão não concluída; sessão arquivada; evidência incompleta/inválida; conceitos vinculados a vários materiais; múltiplos conceitos; contextos com grupos sobrepostos; janela de 30/90 dias; avaliação com dados faltantes; usuários diferentes.
- [ ] Salvar fixtures e resultados esperados simples e documentar como reproduzir a execução **em ambiente de teste**.
- [ ] Criar matriz que ligue **cenário → dados de entrada → cálculo esperado → resultado observado → aprovação/reprovação → evidência**.
- [ ] Separar testes unitários, integração com banco/API e UI, adicionando apenas os testes necessários para demonstrar os fluxos principais.
- [ ] Preparar protocolo de **5 cenários × 3 execuções de interpretação = 15 respostas de IA**, com rubrica pré-definida:
  - C1: fidelidade aos dados;
  - C2: identificação adequada dos padrões e limites de amostra;
  - C3: recomendação/reflexão coerente com as evidências;
  - C4: ausência de causalidade indevida, diagnósticos e estilos fixos;
  - C5: clareza e orientação prática.
- [ ] Propor sucesso individual em **≥4/5 critérios, com C1 e C4 obrigatórios**; sucesso global conforme o TCC: **≥14/15 respostas satisfatórias**. Este é um critério de avaliação proposto, a ser registrado formalmente no texto acadêmico.
- [ ] Registrar as respostas e a avaliação em tabela ou Markdown; não é preciso construir um painel nem uma automação complexa para julgar IA. A avaliação qualitativa pode ser manual, com critérios documentados.
- [ ] Não disparar 15 chamadas reais pagas sem autorização/configuração; preparar execução com mock e comando explícito para o experimento real.

### Critérios de aceitação

- Os dados sintéticos podem ser carregados novamente e produzir as mesmas métricas determinísticas.
- Os cinco cenários possuem gabaritos independentes e testes vinculados.
- O plano acadêmico de volume é atendido **ou** qualquer diferença é explicitamente justificada, com proposta de revisão documental — não ocultada.
- Um terceiro desenvolvedor consegue executar a avaliação seguindo o README técnico.

---

## 6. P2 — Decisões de escopo sobre taxa de acerto, tentativas e Bloom

**Importante:** estes elementos aparecem no PDF recebido, mas não estão operacionais de ponta a ponta no software. **Não implementar grandes subsistemas adicionais automaticamente.** Tomar decisões com base na disponibilidade dos dados, no esforço e na contribuição real ao núcleo.

### 6.1. Taxa de acerto

- [ ] Verificar se já existe no banco informação suficiente e confiável de questões respondidas (`ACERTO`, `PARCIAL`, `ERRO`, `NAO_INFORMADO`) ou de pontos obtidos/possíveis.
- [ ] Se houver implementação quase pronta e reutilizável, completar o indicador **separado da média dos percentuais** com teste simples; caso contrário, deixá-lo fora do código nesta entrega.
- [ ] Se não for viável, **não inventar taxa de acerto**: registrar proposta explícita de atualizar o TCC para “desempenho médio por conceito baseado em evidências válidas” e descrição das evidências.

### 6.2. Quantidade de tentativas

- [ ] Confirmar que `AnaliseMaterial.tentativas` corresponde a tentativas **técnicas de processamento**, não do estudante.
- [ ] Não reutilizar esse campo como métrica pedagógica.
- [ ] Se não houver tentativas educacionais no domínio real, propor remover essa métrica do TCC; não criar coleta artificial só para preencher o PDF.

### 6.3. Taxonomia de Bloom

- [ ] Verificar novamente se existe algum fluxo real e persistente para classificar questões/atividades por nível de Bloom.
- [ ] Se Bloom não for essencial ao MVP e continuar sem origem/cálculo/painel, registrar como **não implementado / trabalho futuro** e recomendar retirar a promessa operacional dos métodos/resultados do TCC.
- [ ] Se já houver um fluxo quase completo e simples de finalizar, documentar esforço e implementar somente se não comprometer P0/P1; classificação e cálculo precisam ser reais e testáveis.

### Critério de aceitação desta etapa

Produzir uma **tabela de decisão** contendo `funcionalidade`, `evidência do código`, `implementada/não implementada`, `decisão tomada`, `impacto no TCC` e `testes`. Nunca dizer que uma métrica existe apenas porque há campos opcionais/legados.

---

## 7. P1 — Correções de interface e consistência de dashboard

- [ ] Atualizar títulos, tooltips e legendas para refletir a **métrica real**, sobretudo nos rankings por conceito.
- [ ] Distinguir claramente **percepção**, **evidência válida**, **índice composto** e **recomendação/experimento**.
- [ ] Exibir `n`, janela temporal e a indicação de dados insuficientes nas visualizações relevantes.
- [ ] Verificar que o dashboard reflete novas evidências válidas registradas e não exibe métricas “falsamente atualizadas” por cache ou estado antigo.
- [ ] Não ativar componentes adicionais só para preencher dashboard; `proximoExperimento`, `descobertasRecentes` e mapa geral podem continuar fora da interface se não forem essenciais ao TCC.
- [ ] Garantir que gráficos de método/formato expliquem que os contextos podem ser múltiplos e que associação posterior não prova superioridade causal.
- [ ] Manter a interface limpa e objetiva, respeitando componentes de UI/UX já estabelecidos.

**Aceitação:** nomenclaturas e números concordam entre backend, DTO, interface, fallback e relatórios; estados vazios e amostras pequenas não induzem conclusões inválidas.

---

## 8. Arquivos e áreas para começar a investigação

Os caminhos abaixo foram relatados pelo Codex na auditoria. **Verifique a existência e o conteúdo antes de modificar**:

| Área | Referências para localizar |
|---|---|
| Banco/modelo | `prisma/schema.prisma` |
| Seed e cenário existente | `prisma/seed.ts`, `prisma/cenario-diego.ts` |
| Métricas de sessões | `src/dominio/analises/metricas-sessoes.ts` |
| Aprendizagem e rankings por conceito | `src/dominio/analises/aprendizagem-modulo.ts` |
| Dashboard observacional | `src/dominio/analises/dashboard-observacional.ts` |
| Consultas/backend | `src/servidor/metricas.ts`, `src/servidor/aprendizagem-modulo.ts`, `src/servidor/dashboard-observacional.ts` |
| Provedores e geração com IA | `src/servidor/ia/interpretacoes.ts`, `src/servidor/ia/contrato-provedores.ts`, `src/servidor/ia/catalogo-provedores.ts` |
| Schemas e fallback local | `src/dominio/interpretacoes/esquema.ts`, `src/dominio/interpretacoes/resposta-local.ts` |
| Confirmação antiga (para remoção) | Localizar actions, serviços, componentes, filtros e tipos legados |
| Testes | Localizar os 9 arquivos e 67 testes da auditoria; ampliar regressões e integrações |

---

## 9. Ordem de execução sugerida

**Lote 0 — Preflight e baseline**
- [ ] Ler regras e inspecionar `git status`, stack e testes existentes.
- [ ] Registrar versão inicial, testes baseline e mapeamento dos fluxos, sem alterar dados do usuário.

**Lote 1 — Simplificar o fluxo de evidências (sem confirmação)**
- [ ] Remover integralmente o fluxo antigo de confirmação de evidências (seção 1).
- [ ] Ajustar elegibilidade das evidências válidas e executar testes básicos de cálculo, histórico e autorização.

**Lote 2 — Garantir a integridade analítica**
- [ ] Normalização 1–5 (3.1).
- [ ] Limiares de tendência e amostragem (3.2).
- [ ] Distinção de médias, taxa de acerto opcional e índices de conceitos (3.3–3.5).
- [ ] Testes de regressão de fórmulas e fluxos.

**Lote 3 — Fechar o ciclo de recomendação**
- [ ] Motor mínimo determinístico e integração de interface (seção 2).
- [ ] Contrato de interpretação da IA, verificação de números e fallback (seção 4).
- [ ] Testes de início a frio, rastreabilidade e indisponibilidade de IA.

**Lote 4 — Prova de conceito e evidências**
- [ ] Dataset isolado e cinco cenários (seção 5).
- [ ] Gabaritos e testes automatizados.
- [ ] Protocolo documentado da avaliação de 15 respostas.

**Lote 5 — Finalização e entrega**
- [ ] Revisão da UI e nomenclatura (seção 7).
- [ ] Tabela de decisões sobre taxa de acerto/tentativas/Bloom (seção 6).
- [ ] Executar lint, typecheck, testes e build conforme scripts reais do projeto.
- [ ] Entregar relatório técnico final e instruções para atualizar o TCC.

> **Escopo da prova de conceito:** prioridade é **retirar a confirmação antiga**, manter os indicadores funcionando, padronizar cálculos essenciais e demonstrar uma recomendação baseada em regras simples. Validações avançadas de IA, novas métricas, instrumentação e refinamentos visuais ficam para trabalhos futuros. A avaliação sintética necessária ao TCC continua importante, mas pode ser feita com scripts e tabelas simples.

---

## 10. Critérios globais de conclusão (Definition of Done)

Considere a demanda concluída somente quando:

- [ ] **Não existe fluxo ativo de confirmação de evidências**: evidências válidas alimentam os indicadores sem aprovação manual; componentes e serviços antigos foram removidos.
- [ ] A normalização e os limiares de tendência estão uniformes e cobertos por testes.
- [ ] **Rankings de conceitos** possuem nomes, fórmulas, contagens e fontes rastreáveis.
- [ ] **Desempenho médio**, eventuais taxas ponderadas e indicadores de percepção não são confundidos entre si.
- [ ] **Motor de recomendação** determinístico existe, retorna decisões fundamentadas e oferece saída de início a frio.
- [ ] A IA interpreta os dados e as recomendações estruturadas sem ser responsável por cálculos oficiais.
- [ ] Sessões, conceitos, métodos, formatos e evidências respeitam o isolamento por usuário e módulo.
- [ ] Há testes automatizados para cálculos, associação de evidências, recomendação, segurança e fallback.
- [ ] Dataset e critérios de comparação acadêmica são reproduzíveis em ambiente de testes.
- [ ] A interface comunica limitações observacionais e não usa “taxa de aprendizagem” quando o indicador não a mede.
- [ ] Nenhuma alteração destrutiva foi feita nos dados do usuário.
- [ ] A documentação relata claramente o que **foi implementado**, o que **não foi implementado** e o que **precisa mudar no PDF**, sem alterar o PDF.

---

## 11. Formato obrigatório da devolutiva do Codex

Ao final, produza um relatório Markdown em `AiFiles/` (ou diretório de documentação compatível com as regras de `AGENTS.md`) com:

1. **Resumo do que foi feito**, separado por lote e prioridade.
2. **Arquivos alterados**, cada um com função e principais mudanças.
3. **Tabela de métricas**: nome, fórmula, fontes, denominadores, filtros, janela temporal, amostra mínima, usos no UI/IA e situação final.
4. **Tabela do recomendador**: regras, entradas, saídas, desempates, início a frio e justificativas.
5. **Fluxo simplificado de evidências**: como o registro é criado, quando é utilizável para o cálculo, como funciona a atualização dos dashboards e o que foi removido da confirmação legada.
6. **Testes executados**: comando, ambiente, quantidade de testes e resultados, incluindo falhas e limitações.
7. **Cenários sintéticos**: contagem efetiva de usuários/módulos/sessões/evidências, gabaritos e instruções para reprodução.
8. **Decisões de escopo**: taxa de acerto, tentativas, Bloom e componentes não exibidos.
9. **Diferenças remanescentes do TCC**: sugestão específica de alterações nas seções 3.2, 3.3, 3.4 e Capítulo 4; não reescrever o documento acadêmico nesta tarefa.
10. **Pendências e riscos**, priorizados, com explicação sobre por que não foram resolvidos.

### Orientação final

**Implemente de fato os ajustes priorizados, e não apenas uma nova auditoria.** É permitido fazer uma inspeção inicial curta para confirmar os achados, mas a entrega principal deve ser o código corrigido, testado e documentado. Se houver ambiguidade técnica, prefira uma solução pequena, reversível, demonstrável e coerente com o núcleo do TCC, registrando a decisão adotada.
