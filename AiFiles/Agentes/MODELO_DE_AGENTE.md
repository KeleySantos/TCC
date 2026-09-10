# Modelo canônico de agente

Este documento define a estrutura mínima de `AiFiles/Agentes/<DiretorioDoAgente>/AGENT.md`. Ao criar um agente, substituir as instruções entre colchetes por conteúdo específico, remover orientações do modelo e enriquecer a descrição inicial com o contexto pertinente do projeto.

```markdown
# Agente <Nome de exibição>

## Identidade

- **Nome:** <nome>
- **Resumo:** <descrição curta e distintiva>

## Função

<responsabilidade principal, resultado esperado e posição no projeto>

## Áreas de responsabilidade

- <responsabilidade concreta>

## Especializações

- <conhecimento ou disciplina relevante>

## Tarefas típicas

- <tipo de tarefa que deve executar>

## Fora do escopo

- <tipo de tarefa que não deve assumir>

## Abordagem de trabalho

<como analisa problemas, quais evidências consulta e como valida resultados, sem cadeia de pensamento>

## Estilo de comunicação

<tom, nível de detalhe, vocabulário e forma de apresentar incerteza>

## Personalidade

<características comportamentais úteis e compatíveis com o papel>

## Critérios de qualidade

- <critério observável ou verificável>

## Relação com o projeto

<fontes globais relevantes, dependências e forma de atuar sem assumir outro agente>

## Diretrizes específicas

- <regra própria do papel>

## Limites de atuação

- <fronteira de autoridade, responsabilidade, método, privacidade ou escopo>

## Contexto persistente

- <fato duradouro, relevante e preferencialmente ligado à fonte>

## Decisões relevantes

- <data ou identificador — decisão e impacto no papel>

## Preferências e padrões

- <convenção estável aplicável ao agente>

## Referências internas

- [`AGENTS.md`](../../../AGENTS.md)
- [`INDICE.md`](../../INDICE.md)
- [`PLANEJAMENTO_TECNICO.md`](../../Contexto/Produto/PLANEJAMENTO_TECNICO.md)
- <outros documentos canônicos realmente necessários ao papel>
```

## Regras de preenchimento

1. Todas as seções são obrigatórias; usar “Nenhum registrado até o momento” quando ainda não houver conteúdo histórico.
2. Escrever instruções concretas e específicas ao papel, evitando adjetivos vazios.
3. Não copiar integralmente documentos globais: referenciar a fonte e registrar somente o recorte necessário.
4. Não incluir cadeia de pensamento, transcrições, dados pessoais, credenciais ou seleção da sessão.
5. Critérios de qualidade devem ser verificáveis, como testes exigidos, fontes a consultar ou limites de linguagem.
6. O arquivo não pode conceder autoridade que contrarie `AGENTS.md`, decisões do projeto ou instruções do usuário.
7. Alterações de memória devem ser pequenas, curadas e úteis para sessões futuras.
