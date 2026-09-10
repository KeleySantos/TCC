# Sistema multiagentes do projeto

## 1. Finalidade

Este documento define o ciclo de vida dos especialistas persistentes usados nas sessões de trabalho do projeto. O sistema existe para permitir que o usuário crie e reutilize agentes com identidade, função, personalidade, especialização, limites e memória próprios, mantendo uma única identidade operacional em cada sessão.

O usuário pode manter várias sessões simultâneas, inclusive com agentes diferentes. A exclusividade é local à sessão: selecionar ou trocar um agente em uma conversa não altera o agente ativo em nenhuma outra conversa.

O sistema coordena o trabalho assistido por IA no repositório; ele não faz parte da aplicação web de Learning Analytics e não cria usuários, tabelas ou rotas do produto.

## 2. Localização adotada

As pastas dos agentes ficam em:

```text
AiFiles/
├── Agentes/
│   ├── CATALOGO.md
│   ├── MODELO_DE_AGENTE.md
│   └── <DiretorioDoAgente>/
│       ├── AGENT.md
│       └── arquivos complementares opcionais
└── Instrucoes/
    └── SISTEMA_MULTIAGENTES.md
```

`AiFiles/` é a pasta canônica e obrigatória para todos os recursos destinados à IA. O `AGENTS.md` raiz é apenas um adaptador de descoberta exigido por ferramentas e aponta para as instruções canônicas.

## 3. Estados e transições

Uma sessão possui um dos estados abaixo:

| Estado | Trabalho de projeto permitido | Transições permitidas |
|---|---|---|
| Sem agente | Apenas listar, selecionar ou criar agente | selecionar existente; criar novo |
| Agente ativo | Trabalho dentro das regras globais e do agente | continuar; trocar explicitamente |
| Trocando | Apenas curar memória e carregar o próximo agente | novo agente ativo |

O agente ativo é mantido somente no contexto de cada conversa. Não existe arquivo `ATIVO.md`, campo de agente atual no catálogo ou outro estado global persistente. Essa ausência de estado global permite que sessões independentes usem agentes diferentes sem interferência.

## 4. Início de sessão

1. Ler `AGENTS.md` apenas para descobrir as regras globais de inicialização.
2. Considerar que não há agente ativo, independentemente da seleção feita em sessões anteriores.
3. Antes de consultar o contexto funcional ou começar qualquer trabalho relevante, perguntar: **"Qual agente você deseja usar nesta sessão?"**
4. Se necessário, apresentar os nomes e resumos de `AiFiles/Agentes/CATALOGO.md`.
5. Após a escolha, validar a entrada do catálogo e a existência do `AGENT.md` correspondente.
6. Carregar todos os arquivos Markdown da pasta do agente, com `AGENT.md` primeiro.
7. Ler `AiFiles/INDICE.md` e somente os documentos indicados para a tarefa antes de qualquer alteração.
8. Confirmar de forma breve o agente ativado e começar o trabalho solicitado.

Se catálogo e pasta divergirem, não ativar silenciosamente uma configuração incompleta. Informar a inconsistência e repará-la apenas quando a intenção puder ser determinada com segurança.

## 5. Criação a partir de linguagem natural

### 5.1 Entrada mínima

A entrada é suficiente quando permite identificar:

- um nome de agente inequívoco;
- uma função, responsabilidade ou resultado esperado compreensível.

Perguntar apenas pelo dado essencial ausente. Preferências adicionais podem ser inferidas de maneira conservadora a partir da função e do contexto já documentado do projeto.

### 5.2 Enriquecimento obrigatório

Antes de criar o arquivo final:

1. Interpretar a intenção sem usar literalmente a frase do usuário como configuração completa.
2. Consultar as fontes globais e selecionar somente o contexto pertinente ao papel.
3. Delimitar responsabilidades, tarefas típicas e tarefas fora do escopo.
4. Definir especializações, abordagem de trabalho, comunicação, personalidade e critérios verificáveis de qualidade.
5. Incluir as regras metodológicas, técnicas, éticas e de privacidade aplicáveis.
6. Definir como o agente coopera com o projeto sem assumir a identidade de outros agentes.
7. Produzir o `AGENT.md` usando todas as seções obrigatórias do modelo canônico.
8. Criar a pasta, atualizar o catálogo e verificar links, unicidade de nome e consistência de escopo.
9. Ativar o novo agente na sessão atual, salvo instrução contrária.

O resultado deve ser uma especificação operacional. Não registrar cadeia de pensamento nem justificativas internas extensas.

### 5.3 Nome e diretório

- O nome de exibição respeita a forma fornecida pelo usuário.
- O nome e o diretório devem ser únicos, comparados sem diferenciar maiúsculas de minúsculas.
- O diretório deve ser legível e conter apenas letras, números, espaços, hífens ou sublinhados.
- São proibidos separadores de caminho, `.` e `..` como nome, caminhos absolutos e segmentos que escapem de `AiFiles/Agentes/`.
- Colisões ou nomes ambíguos exigem confirmação do usuário; agentes existentes não podem ser sobrescritos.

## 6. Conteúdo persistente

### 6.1 O que registrar

- decisões arquiteturais pertinentes ao papel;
- convenções estáveis;
- preferências recorrentes declaradas pelo usuário;
- descobertas técnicas verificadas;
- restrições e fronteiras de responsabilidade;
- mudanças duradouras de escopo;
- referências a decisões globais que afetam o agente.

### 6.2 O que não registrar

- transcrição da conversa ou cadeia de pensamento;
- tarefas efêmeras e estados que logo perderão validade;
- conjecturas não verificadas apresentadas como fatos;
- cópias integrais dos documentos globais;
- credenciais, segredos ou dados de pessoas reais;
- seleção de agente da sessão atual.

### 6.3 Curadoria

Ao concluir trabalho relevante e antes de uma troca explícita, avaliar se houve aprendizado duradouro. Só editar a memória se o ganho futuro justificar a alteração. Cada registro deve ser conciso, indicar data ou fonte quando isso evitar ambiguidade e não contradizer documentos globais. Se uma decisão for global, atualizar primeiro seu documento canônico e apenas referenciá-la na memória do agente.

Quando `AGENT.md` ficar extenso, mover detalhes para `CONTEXTO.md`, `DECISOES.md` ou `NOTAS.md` dentro da mesma pasta e manter links claros no arquivo principal.

## 7. Isolamento e tarefas fora do escopo

O agente selecionado permanece o único agente funcional da sessão. Ele pode usar ferramentas normais necessárias à sua tarefa, mas não deve assumir outra identidade, combinar personalidades ou delegar implicitamente a outro agente persistente.

Quando o pedido estiver fora de seu limite:

1. indicar a incompatibilidade de forma breve;
2. mencionar um agente cadastrado mais adequado, se houver;
3. oferecer continuar apenas no recorte compatível com o agente atual ou aguardar um pedido explícito de troca;
4. não carregar arquivos do outro agente nem iniciar sua atuação antes da escolha do usuário.

## 8. Troca explícita

Ao receber um comando inequívoco de troca:

1. concluir ou interromper com segurança a operação em curso;
2. curar a memória do agente atual, se houver informação duradoura;
3. verificar o catálogo e a pasta do agente de destino;
4. se ele não existir, solicitar a descrição mínima e aplicar o fluxo de criação;
5. carregar integralmente a configuração do destino;
6. descartar a identidade funcional anterior somente nesta sessão e declarar o novo agente como seu único ativo;
7. não alterar nem encerrar agentes ativos em outras sessões.

## 9. Precedência

A ordem de precedência é:

1. políticas de segurança e execução do ambiente;
2. instruções explícitas e mais recentes do usuário;
3. `DIRETRIZES_GLOBAIS.md` e fontes canônicas apontadas por `../INDICE.md`;
4. especificação do agente ativo;
5. memória contextual complementar do agente.

Uma especificação de agente não pode revogar segurança, privacidade, metodologia científica, rastreabilidade ou decisões globais do projeto.

## 10. Verificação operacional

Uma implementação ou alteração do sistema multiagentes só está consistente quando:

- a sessão nova exige seleção antes de trabalho relevante;
- há exatamente um agente ativo por sessão após a seleção, independentemente dos agentes usados em outras sessões;
- cada entrada do catálogo aponta para uma pasta com `AGENT.md` válido;
- cada agente possui todas as seções obrigatórias do modelo;
- criação e troca preservam o isolamento;
- a memória contém apenas informação duradoura e não sensível;
- não existe marcador global de agente ativo;
- caminhos e documentação permanecem em `AiFiles/`;
- o índice e as referências apontam para as fontes atuais.
