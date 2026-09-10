# Pesquisa de arquitetura de contexto para IA

## Objetivo e recorte

Pesquisa realizada em 2026-09-09 para orientar a organização de instruções, contexto, memória, agentes e prompts deste repositório. Foram priorizadas fontes oficiais e especificações abertas de ferramentas de programação assistida. A estrutura final adapta os princípios ao porte real deste projeto; não replica integralmente nenhuma convenção proprietária.

## Práticas pesquisadas

### Ponto de entrada curto e conhecimento navegável

A experiência publicada pela OpenAI recomenda usar o arquivo de instruções como mapa, não como manual monolítico. Um índice curto apontando para fontes versionadas permite divulgação progressiva do contexto, reduz competição por tokens e facilita verificações de atualização e links. Fonte: [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/).

O formato aberto `AGENTS.md` também recomenda um arquivo previsível na raiz para comandos, convenções, testes e segurança, com instruções mais locais apenas quando o tamanho do repositório justificar. Fonte: [AGENTS.md](https://agents.md/).

### Instruções globais e específicas sem conflito

O GitHub Copilot distingue instruções de repositório e instruções condicionadas por caminho. Sua documentação alerta que conjuntos aplicáveis podem ser combinados sem uma precedência geral, portanto conflitos devem ser evitados e a aplicabilidade precisa ser clara. Fonte: [Adding custom instructions for GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions).

O Gemini CLI usa contexto hierárquico e inclui arquivos específicos apenas quando ferramentas acessam a área correspondente. Isso sustenta a decisão de separar o conhecimento por domínio e carregá-lo sob demanda. Fonte: [Provide context with GEMINI.md files](https://geminicli.com/docs/cli/gemini-md/).

### Memória curada e índice pequeno

A documentação do Claude Code separa instruções de memória automática, recomenda regras específicas por assunto ou caminho e registra apenas informação útil que não possa ser derivada do código ou de instruções existentes. O índice de memória é mantido curto e os detalhes ficam em arquivos temáticos carregados sob demanda. Fonte: [How Claude remembers your project](https://code.claude.com/docs/en/memory).

### Separação entre prompts, recursos e ferramentas

O Model Context Protocol distingue prompts escolhidos pelo usuário, recursos contextuais controlados pela aplicação e ferramentas executadas pelo modelo. Essa separação evita tratar toda orientação como prompt permanente e apoia a criação de uma biblioteca de prompts apenas quando existirem fluxos reutilizáveis reais. Fonte: [MCP — Server features overview](https://modelcontextprotocol.io/specification/2025-06-18/server/index).

## Diagnóstico da estrutura anterior

- Havia 23 arquivos Markdown de IA em `AI Files/`, dos quais 20 estavam no mesmo nível.
- `PLANEJAMENTO_TECNICO.md` tinha aproximadamente 55 KB e era exigido em toda alteração, mesmo quando a tarefa não dependia do roadmap completo.
- `AGENTS.md` acumulava política multiagentes, contexto científico, convenções técnicas e rastreabilidade, duplicando assuntos existentes.
- `DECISOES_PENDENTES.md` continha principalmente decisões já tomadas; o nome não representava o conteúdo.
- O sistema multiagentes possuía catálogo e modelo, mas os arquivos estavam separados de parte de suas instruções e usavam o caminho antigo.
- Não havia prompts reutilizáveis reais nem contexto temporário persistido; criar pastas vazias para essas categorias aumentaria navegação sem benefício.
- As referências usavam `AI Files/`, em conflito com a regra explícita mais recente de centralização em `AiFiles/`.

Não foram encontrados documentos equivalentes que pudessem ser consolidados sem perda semântica. O planejamento contém sobreposição histórica com especificações posteriores, mas permanece fonte do roadmap e foi preservado integralmente.

## Decisões aplicadas

1. Manter `AGENTS.md` na raiz apenas como adaptador de descoberta entre ferramentas; toda regra editável e todo contexto ficam em `AiFiles/`.
2. Criar `AiFiles/INDICE.md` como mapa e tabela de roteamento por tipo de tarefa.
3. Separar regras (`Instrucoes`), conhecimento autoritativo (`Contexto`), estado vivo (`Memoria`), identidades (`Agentes`) e evidências fechadas (`RELATORIOS`).
4. Dividir contexto em três domínios reais do projeto: Produto, Científico e Técnico.
5. Carregar o planejamento completo apenas para planejamento, escopo ou fases; tarefas comuns consultam documentos específicos.
6. Renomear `DECISOES_PENDENTES.md` para `DECISOES_DO_PROJETO.md` e `ARQUITETURA_E_DECISOES.md` para `ARQUITETURA.md`.
7. Não criar diretórios vazios de prompts, templates genéricos, conhecimento ou temporários. O modelo de agente fica próximo do catálogo.
8. Manter memória por agente isolada em `AiFiles/Agentes/<Nome>/` e memória compartilhada em `AiFiles/Memoria/`.
9. Definir precedência explícita e exigir atualização conjunta de índices e referências após movimentos.

## Limitações e melhorias futuras

- O repositório ainda não possui verificador permanente de links e estrutura; um script deve ser criado somente se a manutenção manual começar a falhar.
- Prompts reutilizáveis devem nascer de repetição observada, não de antecipação.
- Se uma área técnica crescer a ponto de possuir regras exclusivas e frequentes, poderá receber instruções locais; hoje isso seria complexidade prematura.
- A revisão periódica de documentos antigos e decisões superadas pode futuramente ganhar uma rotina de jardinagem documental.
