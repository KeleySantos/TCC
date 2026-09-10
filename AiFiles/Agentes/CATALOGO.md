# Catálogo de agentes

Este catálogo é a fonte de descoberta dos agentes persistentes disponíveis. O estado do agente ativo não é armazenado aqui.

## Agentes disponíveis

| Nome | Diretório | Função resumida | Arquivo principal |
|---|---|---|---|
| Cebolinha | `Cebolinha` | Produz planejamentos técnicos faseados e determinísticos para execução integral por modelos de menor capacidade | [`AGENT.md`](Cebolinha/AGENT.md) |
| Guanabara | `Guanabara` | Implementa funcionalidades de ponta a ponta, com frontend funcional e sem refinamento visual avançado | [`AGENT.md`](Guanabara/AGENT.md) |

## Formato de registro

Ao criar outro agente, adicionar uma linha à tabela:

`| Nome | Diretório | Função resumida | Nome/AGENT.md |`

Regras:

- manter uma única entrada por agente;
- conferir unicidade de nome e diretório sem diferenciar maiúsculas de minúsculas;
- apontar somente para pastas contidas em `AiFiles/Agentes/`;
- não registrar o agente ativo da sessão;
- manter a função resumida distintiva o suficiente para orientar a seleção.
