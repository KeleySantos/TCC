# Metadados da execução real da avaliação da IA

- Experimento: `real-2026-10-18T16-52-33-625Z`
- Início: `2026-10-18T16:52:33.625Z`
- Última atualização: `2026-10-18T21:45:26.945Z`
- Provedor: `GROQ`
- Modelo planejado e efetivo nas 15 respostas válidas: `openai/gpt-oss-120b`
- Versão do prompt: `interpretacao-aprendizagem-v1`
- Commit de referência: `1310a477df47df75f2fce9baa8aa0ab2169d9d01`
- Estado do repositório: checkout com alterações não consolidadas anteriores e desta sessão
- Node.js: `v24.15.0`
- npm: `11.12.1`
- Credencial: cofre local da plataforma; não serializada nem copiada para arquivos de ambiente

## Resultado técnico

- Posições planejadas: 15
- Respostas externas válidas: 15
- Origem das respostas válidas: 15 `GROQ`
- Modelo efetivo das respostas válidas: 15 `openai/gpt-oss-120b`
- Respostas simuladas ou locais incluídas no resultado: 0
- Entradas, prompts e respostas ausentes: 0
- Avaliações humanas C1–C5 concluídas: 15
- Respostas satisfatórias: 15
- Respostas insatisfatórias: 0
- Falhas por critério C1–C5: 0
- Resultado geral: `SATISFATORIA`

## Falhas e repetições preservadas

O corpus mantém 28 gerações anteriores no campo `historicoGeracoes`. Elas não contam como respostas válidas:

- 21 tentativas classificadas como `COTA`;
- 4 tentativas classificadas como `REQUISICAO_INVALIDA`;
- 3 tentativas classificadas como `RESPOSTA_INVALIDA`.

As repetições mantiveram o mesmo provedor, modelo, entrada e hash do prompt. Nenhuma contingência local substituiu uma resposta real no conjunto final.

## Dados sintéticos reproduzidos

- Base: 5 usuários, 15 módulos, 150 sessões e 150 evidências.
- Controles finais: 152 sessões e 151 evidências físicas, mantendo 150 sessões e 150 evidências válidas conforme o protocolo.
- Cenários: S1 a S5, com três respostas válidas por cenário.

## Arquivos associados

- `real-groq-gpt-oss-120b-20261018-165231.json`: fonte completa e auditável; contém a entrada e a resposta de cada posição.
- `real-groq-gpt-oss-120b-20261018-165231.md`: relatório narrativo final com os critérios preenchidos.
- `real-groq-gpt-oss-120b-20261018-165231.csv`: tabela por execução.
- `avaliacoes-manuais-real-groq-gpt-oss-120b-20261018-165231/`: quinze rubricas C1–C5 preenchidas pela avaliadora Keley.

## Avaliação humana

Em 18 de outubro de 2026, a avaliadora Keley informou ter conferido as 15 respostas e considerado atendidos os critérios C1–C5 em todas elas. As rubricas foram registradas com `avaliar:ia-tcc:registrar` e o relatório foi regenerado. O cálculo implementado classificou as 15 respostas como satisfatórias e o resultado geral como `SATISFATORIA`.
