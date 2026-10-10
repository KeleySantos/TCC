# Cenário sintético e resultados esperados

## Base reproduzível

O `seed` cria cinco contas pessoais fictícias, seis módulos, 21 materiais ativos, 39 sessões concluídas válidas e uma sessão curta inválida. O conjunto não contém tópicos, avaliações, questões, tentativas, respostas, notas ou níveis de Bloom.

Ana, Bruno, Carla, Diego e Elisa usam a senha sintética `Laboratorio@2026`. Os registros existem somente para demonstração local e não representam pessoas reais.

## Cenário rico de Diego

O perfil `diego.alves` recebe um bloco determinístico próprio para validar o Dashboard pessoal, o módulo JavaScript e a entrada da interpretação opcional da IA:

- 24 sessões concluídas dentro da janela recente de 90 dias;
- quatro métodos usados de forma recorrente: Técnica de Feynman, Recuperação ativa, Pomodoro e Repetição espaçada;
- duas ou três modalidades em cada sessão, variando entre dez formatos;
- dificuldade e compreensão percebidas preenchidas em todas as sessões, cobrindo os níveis 1 a 5;
- dificuldade média de 3,3/5, suficiente para exercitar o card de maior dificuldade percebida;
- cinco arquivos TXT sintéticos, fisicamente armazenados e com análise concluída;
- 26 conceitos extraídos, cada um mencionado em quatro ou cinco sessões;
- descrições detalhadas e vínculos com materiais para alimentar o DTO da IA.

No banco criado pelo `seed`, o módulo JavaScript de Diego possui oito materiais: três materiais gerais e os cinco arquivos do cenário rico. O histórico do módulo possui 24 sessões. Ao aplicar somente o enriquecimento sobre um banco existente, sessões anteriores de Diego são preservadas, portanto o total histórico pode ser maior.

## Resultados esperados para Diego

Na referência de 22 de setembro de 2026:

| Superfície | Resultado esperado |
|---|---|
| Dashboard pessoal | 24 sessões recentes e quatro métodos recentes distintos. |
| Card “Método associado à maior compreensão” | Repetição espaçada, com média histórica de 4,1/5 em 8 sessões analisadas. |
| Card “Maior dificuldade percebida” | JavaScript, média aproximada de 3,3/5 em 24 sessões. |
| Card “Compreensão percebida” | Média aproximada de 3,3/5 em 24 sessões. |
| Mapa de conceitos observados | 26 conceitos, com quatro ou cinco menções por conceito. |
| Módulo JavaScript | Card “Conceitos observados” preenchido com os mesmos 26 conceitos. |
| Entrada da IA | Pelo menos 24 descrições, quatro métodos e dez formatos disponíveis; no banco já existente, as sessões anteriores também podem entrar no histórico. |

Essas leituras descrevem registros e autorrelatos. Elas não medem desempenho objetivo, domínio, eficácia de método ou causalidade.

## Comandos

Para recriar toda a base sintética:

```powershell
npm run banco:reiniciar
npm run banco:verificar-cenario
```

Para enriquecer somente Diego no banco atual, preservando as outras contas e as sessões anteriores dele:

```powershell
npm run banco:enriquecer-diego
npm run banco:verificar-diego
```

O enriquecimento é idempotente para o bloco rico: novas execuções substituem somente as 24 sessões marcadas e os cinco arquivos desse bloco, sem acumulá-los.

## Observação metodológica

Os padrões foram definidos manualmente para testar estados visuais, agregações, filtros, conceitos e a composição do contexto da IA. Eles não devem aparecer no TCC como resultado de pesquisa empírica.
