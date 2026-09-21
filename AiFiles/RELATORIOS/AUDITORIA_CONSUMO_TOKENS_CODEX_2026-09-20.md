# Auditoria do consumo de tokens no Codex — 2026-09-20

## Escopo correto

Este relatório trata dos tokens usados pelo Codex para desenvolver o site nesta conversa. Não trata das API Keys de Groq, Gemini ou Qwen nem dos tokens consumidos pelas análises de estudo do produto.

## Limitação da medição

O Codex disponibilizou o uso agregado da conta, mas não um contador exato exclusivo desta tarefa. A documentação oficial informa que a atividade pode ser consultada por resumo e agrupamentos diários da conta; ela não descreve, nessa interface, uma divisão completa por conversa.

No momento da auditoria, a conta apresentava:

- 48% usados na janela de cinco horas, com reinício previsto para 20/09/2026 às 15:55 no horário de Brasília;
- 44% usados na janela semanal, com reinício previsto para 26/09/2026 às 12:28;
- uso ainda permitido e nenhum limite atingido;
- esses percentuais são da conta inteira, não apenas desta conversa.

Por isso, as causas abaixo são determinadas pelo histórico e pelos padrões de execução observados, não por uma atribuição numérica exata por mensagem.

## Diagnóstico executivo

O maior fator de consumo é manter todo o desenvolvimento das Fases 0 a 7 dentro de uma única conversa longa e altamente operacional. Cada nova solicitação precisa preservar ou compactar decisões, código alterado, resultados de testes e instruções anteriores.

Esta tarefa já passou por compactação de contexto. A compactação reduz o tamanho das próximas entradas, mas também exige uma etapa de processamento e confirma que a conversa ultrapassou o tamanho confortável de uma tarefa comum.

## Principais causas, em ordem de impacto

### 1. Uma única conversa concentrou todo o projeto — impacto muito alto

A conversa acumulou:

- definição das fases e decisões funcionais;
- implementação das Fases 1 a 7;
- migrações, banco, serviços, interface e testes;
- revisões de segurança e documentação;
- configuração de três provedores;
- diagnóstico real do Gemini;
- auditorias posteriores.

Mesmo com resumos e compactação, o agente precisa receber contexto suficiente para não desfazer decisões anteriores. Quanto mais longa a tarefa, maior tende a ser a entrada de cada novo turno.

### 2. Saídas extensas de ferramentas — impacto muito alto

Os maiores blocos desta tarefa não foram as respostas resumidas ao usuário, mas as saídas internas usadas para trabalhar:

- arquivos Markdown lidos integralmente;
- arquivos TypeScript e schema completos;
- resultados de `rg` com muitas ocorrências;
- logs de lint, testes, Prisma e build do Next.js;
- `git status` com dezenas de arquivos;
- documentação de skills e ferramentas;
- resultados longos de documentação oficial.

Essas saídas entram no contexto operacional do agente. Repetir uma leitura ou retornar milhares de linhas pode custar mais tokens do que várias mensagens normais.

### 3. Inspeções de navegador muito grandes — impacto alto

A validação visual e o diagnóstico do Google AI Studio retornaram snapshots extensos da árvore de acessibilidade. Um único snapshot pode conter navegação, gráficos, tabelas e controles de toda a página.

Também foi necessário carregar integralmente a documentação do recurso de navegador antes do primeiro uso. Isso é útil para segurança, mas adiciona bastante contexto à tarefa.

### 4. Validações completas repetidas — impacto alto

Durante as fases foram executados repetidamente:

- scanner de segredos;
- ESLint;
- TypeScript;
- todos os testes;
- geração do Prisma;
- build completo do Next.js;
- verificadores de banco e cenários.

Executar esses comandos é apropriado no encerramento de uma fase. O desperdício aparece quando uma correção pequena leva novamente à validação completa, especialmente quando os logs são devolvidos integralmente ao contexto.

### 5. Diagnósticos com tentativas sucessivas — impacto alto nesta parte da conversa

O problema do Gemini exigiu várias hipóteses e chamadas: formato REST, schema, política de linguagem, timeout e erros `503`. Cada ciclo envolveu leitura de código, execução, análise do resultado e nova validação.

A auditoria seguinte foi inicialmente interpretada como consumo dos provedores do site, não como consumo do Codex. Essa interpretação incorreta gerou pesquisa, navegação, consultas e um relatório que não respondiam ao problema real. Esse trabalho adicional foi uma causa evitável de consumo, e a responsabilidade pela interpretação foi do agente.

### 6. Compactação da conversa — impacto médio

A documentação oficial explica que a compactação preserva o estado relevante com menos tokens para turnos futuros. Ela é adequada para tarefas longas, mas a própria passagem de compactação possui contabilização de entrada, saída e raciocínio.

Portanto, a compactação ajuda a continuar, mas não torna uma conversa muito longa gratuita. Depois de um marco fechado, uma nova tarefa costuma ser mais econômica.

### 7. Instruções fixas e schemas de ferramentas — impacto estrutural

O Codex recebe instruções de sistema, regras do projeto, catálogo de ferramentas e contratos de segurança. Parte desse conteúdo é fixa e necessária em cada execução ou pode ser reutilizada por cache, dependendo da infraestrutura.

Esse custo não foi criado pelo código do site e não pode ser eliminado pelo usuário, mas cresce em importância quando muitas ferramentas e plugins estão disponíveis.

### 8. Trabalho agentivo exige mais raciocínio do que uma conversa comum — impacto estrutural

Editar banco, código e documentação com segurança exige inspeção, decisões, chamadas de ferramenta e verificação. Uma solicitação como “implemente a fase” é muito mais cara que uma pergunta textual curta, mesmo quando a resposta final é resumida.

## O que não foi a principal causa

- As respostas finais curtas em português representam uma fração pequena do consumo.
- Manter o servidor ligado não consome tokens do Codex por si só.
- Reiniciar o servidor só aumenta consumo quando logs extensos são devolvidos e analisados.
- As API Keys e os tokens de Groq, Gemini e Qwen são sistemas separados.
- Não foram usados subagentes nesta etapa, portanto paralelização não causou o consumo.
- O tamanho físico do repositório só importa quando arquivos são lidos ou suas saídas entram no contexto.

## Medidas recomendadas

### Aplicação imediata

1. Encerrar esta conversa após fechar a auditoria e iniciar a Fase 8 em uma nova tarefa.
2. Na nova tarefa, apontar apenas para `ORDEM_IMPLEMENTACAO_MODULOS_SESSOES.md`, `DECISOES_FUNCIONAIS_MODULOS_SESSOES.md` e o acompanhamento, sem colar novamente todo o histórico.
3. Manter uma fase principal por tarefa do Codex.
4. Continuar entregando ao usuário somente resumos; detalhes permanecem em `.md`.

### Durante a implementação

5. Ler apenas trechos necessários dos arquivos, evitando `Get-Content -Raw` em documentos grandes.
6. Limitar a saída de comandos e buscas ao conjunto relevante.
7. Rodar testes direcionados durante a implementação e a validação completa somente no fechamento da fase.
8. Evitar repetir build completo depois de mudanças apenas documentais.
9. Usar navegador somente quando a verificação visual ou uma sessão autenticada for realmente necessária.
10. Capturar regiões específicas da página em vez de snapshots completos.
11. Consolidar várias verificações pequenas em uma única execução com saída resumida.

### Organização das próximas tarefas

12. Criar uma tarefa separada para cada um destes marcos:
    - Fase 8 — consumidores dependentes;
    - Fase 9 — remoção definitiva do legado;
    - Fase 10 — validação ponta a ponta.
13. Para bugs isolados, abrir uma tarefa curta que leia somente o arquivo afetado, o teste e o contrato relacionado.
14. Evitar misturar implementação, pesquisa de produto e auditorias não relacionadas na mesma tarefa.

## Fluxo econômico recomendado

```text
Documento de estado persistente
        ↓
Nova tarefa curta para uma fase
        ↓
Leitura seletiva dos arquivos afetados
        ↓
Testes direcionados durante o trabalho
        ↓
Uma validação completa no fechamento
        ↓
Atualização do documento de estado
        ↓
Encerrar a tarefa
```

## Referência oficial

- [Codex App Server — uso agregado e atividade diária de tokens](https://learn.chatgpt.com/docs/app-server)
- [Compaction — preservação do estado com contexto reduzido](https://developers.openai.com/api/docs/guides/latest-model?gallery=open&galleryItem=trivia-quiz-game&model=gpt-5.3-codex&translationFallback=de-DE)

## Conclusão

O consumo elevado não decorre de respostas longas ao usuário, mas da combinação de uma conversa muito extensa, trabalho agentivo em muitas fases, grandes saídas de ferramentas, navegador, validações repetidas e ciclos de diagnóstico. A medida com maior impacto é começar a Fase 8 em uma nova tarefa e usar os documentos já salvos como memória persistente, em vez de continuar carregando todo o histórico desta conversa.
