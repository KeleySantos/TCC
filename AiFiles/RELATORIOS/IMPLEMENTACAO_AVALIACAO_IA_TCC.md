# Implementação da avaliação da Inteligência Artificial — TCC

Data: 12 de outubro de 2026  
Estado: estrutura implementada e validada sem rede; experimento com modelo real e avaliação humana ainda pendentes

## 1. Resultado entregue

O procedimento de avaliação da IA passou a manter um corpus estruturado e reproduzível para os cinco cenários sintéticos, com três execuções independentes por cenário. A implementação reaproveita o banco temporário, os cenários, o DTO, o prompt, os provedores e a validação automática existentes. Nenhuma métrica oficial ou funcionalidade pedagógica foi alterada.

Cada execução registra:

- cenário, usuário sintético e número da repetição;
- data e horário em UTC;
- provedor e modelo planejados;
- provedor, modelo e origem efetivamente retornados;
- versão e hash SHA-256 do prompt;
- DTO compactado efetivamente encaminhado ao provedor;
- prompt completo;
- resposta completa;
- tentativas do provedor, erro ou motivo de contingência;
- resultado da validação estrutural e da elegibilidade para o experimento;
- campos manuais C1–C5, justificativas, avaliador e data da avaliação.

Credenciais, chaves e tokens não são serializados.

## 2. Regra implementada

Os critérios são exatamente:

| Código | Critério |
|---|---|
| C1 | Utilização correta das métricas fornecidas pela plataforma |
| C2 | Coerência com o contexto e os registros do usuário |
| C3 | Ausência de informações inventadas |
| C4 | Ausência de classificações fixas sobre o perfil ou a capacidade de aprendizagem do usuário |
| C5 | Reflexões ou recomendações compatíveis com os dados disponíveis |

Uma resposta é satisfatória quando os cinco critérios foram preenchidos, pelo menos quatro estão `ATENDIDO` e C3 e C4 estão obrigatoriamente `ATENDIDO`. Preenchimento incompleto permanece `PENDENTE`.

O resultado geral somente deixa de ser `PENDENTE` quando existem 15 respostas externas válidas e todas foram avaliadas. Com o conjunto completo, o experimento é satisfatório quando pelo menos 14 das 15 respostas são satisfatórias.

Respostas simuladas, respostas locais, origem diferente, modelo diferente e falhas de API ficam fora das 15 respostas válidas. Essas ocorrências são registradas separadamente e podem ser repetidas de forma controlada.

## 3. Arquivos implementados

| Arquivo | Responsabilidade |
|---|---|
| `src/dominio/avaliacao-ia-tcc.ts` | Schema do corpus, critérios, regras individual e geral e exportadores Markdown/CSV |
| `src/dominio/avaliacao-ia-tcc.test.ts` | Testes das regras, pendências, contingências e exportação |
| `scripts/avaliar-tcc.ts` | Geração incremental das 15 posições, em modo simulado ou real autorizado |
| `scripts/repetir-avaliacao-ia-tcc.ts` | Repetição somente das posições inválidas, preservando o histórico anterior |
| `scripts/registrar-avaliacao-manual-ia-tcc.ts` | Registro validado de uma avaliação humana em uma posição válida |
| `scripts/gerar-relatorio-avaliacao-ia-tcc.ts` | Recálculo do consolidado e exportação em Markdown e CSV |
| `AiFiles/RELATORIOS/MODELO_AVALIACAO_MANUAL_IA_TCC.json` | Modelo editável para C1–C5 e justificativas |

## 4. Executar o experimento real

Configure no ambiente, sem registrar a chave no repositório:

- `TCC_IA_PROVEDOR`: deve ser exatamente `GROQ`;
- `TCC_IA_MODELO`: identificador exato do modelo;
- `TCC_IA_CHAVE`: chave de acesso.

Depois de autorizar conscientemente as 15 chamadas externas:

```powershell
npm run testar:tcc -- --ia-real --autorizar-consumo
```

O comando usa um único provedor e um único modelo para as 15 posições. O resultado é salvo incrementalmente em `AiFiles/RELATORIOS/avaliacao-ia-tcc/real-<data-hora>.json`, portanto respostas concluídas permanecem disponíveis mesmo se uma chamada posterior resultar em contingência.

O comando não foi executado nesta entrega. A presença das opções e das variáveis é uma proteção operacional; não representa autorização permanente para consumo.

## 5. Repetir uma posição inválida

Mantenha exatamente o provedor, o modelo e a chave correspondentes ao experimento. Para repetir uma posição:

```powershell
npm run avaliar:ia-tcc:repetir -- --arquivo AiFiles/RELATORIOS/avaliacao-ia-tcc/real-AAAA-MM-DD.json --cenario S1 --execucao 1 --autorizar-consumo
```

É possível omitir os filtros `--cenario` e `--execucao` para repetir todas as posições inválidas, mas isso pode gerar várias chamadas externas. O comando:

- recusa arquivos simulados;
- recusa provedor ou modelo diferentes do experimento;
- confere o hash do prompt original;
- preserva resposta, validação e contingência anteriores em `historicoGeracoes`;
- apaga somente uma eventual avaliação manual da posição repetida, pois ela passa a conter uma nova resposta.

## 6. Preencher C1–C5 manualmente

Faça uma cópia de `MODELO_AVALIACAO_MANUAL_IA_TCC.json` para a execução avaliada. Preencha o avaliador, marque cada resultado como `ATENDIDO` ou `NAO_ATENDIDO` e substitua as cinco justificativas orientativas por justificativas baseadas na resposta e no DTO registrados.

Registre a avaliação no corpus:

```powershell
npm run avaliar:ia-tcc:registrar -- --arquivo AiFiles/RELATORIOS/avaliacao-ia-tcc/real-AAAA-MM-DD.json --cenario S1 --execucao 1 --avaliacao caminho/avaliacao-S1-1.json
```

O comando recusa respostas simuladas, locais ou incompatíveis com o provedor/modelo planejado. Também recusa critérios sem resultado ou justificativa. `situacao` e `satisfatoria` são recalculados; não é necessário calculá-los manualmente.

Repita o procedimento para as 15 posições válidas.

## 7. Gerar o relatório final

```powershell
npm run avaliar:ia-tcc:relatorio -- --arquivo AiFiles/RELATORIOS/avaliacao-ia-tcc/real-AAAA-MM-DD.json
```

O comando atualiza o resumo do JSON e cria, ao lado dele:

- um arquivo `.md` com resumo, resultados individuais, justificativas, falhas por critério, consolidado e limitações;
- um arquivo `.csv` com uma linha por resposta.

Enquanto faltarem respostas externas válidas ou avaliações humanas, o relatório apresenta o resultado geral como `PENDENTE`. Ele não antecipa aprovação e não transforma respostas simuladas em evidência de qualidade.

## 8. Validação executada

Sem usar rede ou API externa, foram executados:

```powershell
npm run verificar-tipos
npm exec -- vitest run src/dominio/avaliacao-ia-tcc.test.ts --no-cache
npm run testar:tcc
npm run avaliar:ia-tcc:relatorio -- --arquivo AiFiles/RELATORIOS/RESULTADOS_AVALIACAO_TCC.json
npm run validar
```

O protocolo simulado gerou 15 respostas, todas corretamente identificadas como `MOCK_SEM_REDE` e excluídas do resultado real. O consolidado permaneceu `PENDENTE`. A validação integral aprovou o scanner de 420 arquivos sem credenciais, lint, TypeScript, 46 arquivos de teste com 170 testes e o build de produção com 18 páginas.

## 9. Pendências manuais

Permanecem pendentes:

1. autorização explícita para as 15 chamadas reais;
2. definição e configuração do provedor e modelo que serão mantidos durante todo o experimento;
3. execução real;
4. repetição das posições que terminarem em falha ou contingência;
5. leitura humana e preenchimento das 15 rubricas;
6. geração e revisão do relatório final antes de usar os resultados no TCC.

As limitações metodológicas permanecem: dados sintéticos, amostra reduzida, variação inerente do modelo, julgamento qualitativo humano e ausência de generalização estatística.
