# Instruções para execução da avaliação real da IA — TCC

Data da análise: 12 de outubro de 2026  
Estado: implementação pronta; execução real e avaliação humana pendentes

## 1. Conclusão da análise

A implementação está pronta para executar o experimento real. Não foi identificado bloqueio de código para o caminho recomendado com Groq.

O impedimento atual é operacional: as variáveis `TCC_IA_PROVEDOR`, `TCC_IA_MODELO` e `TCC_IA_CHAVE` ainda não estão configuradas no ambiente local.

Durante esta análise:

- nenhum dos 15 testes reais foi executado;
- nenhuma API de IA foi chamada;
- nenhum crédito de API foi consumido;
- nenhum código da aplicação foi modificado.

## 2. Provedores e modelos disponíveis

| Provedor | Modelo configurado ou compatível | Observação |
|---|---|---|
| Groq | `openai/gpt-oss-20b` | Modelo padrão atual do projeto. Usa JSON Schema estrito. |
| Groq | `openai/gpt-oss-120b` | Compatível sem alteração de código; maior capacidade e modelo recomendado para o experimento. |

Os modelos `openai/gpt-oss-20b` e `openai/gpt-oss-120b` são classificados pela Groq como modelos de produção e suportam JSON Schema. Na documentação consultada, o 120B custa US$ 0,15 por milhão de tokens de entrada e US$ 0,60 por milhão de tokens de saída; o 20B custa metade disso.

Fontes oficiais:

- [GPT-OSS 120B na Groq](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [Modelos disponíveis na Groq](https://console.groq.com/docs/models)

## 3. Modelo recomendado

Recomendação principal:

```text
Provedor: GROQ
Modelo: openai/gpt-oss-120b
```

Justificativa:

- é um modelo de produção, não de prévia;
- suporta JSON Schema estrito, como exige o adaptador implementado;
- o adaptador Groq não troca de modelo internamente;
- possui maior capacidade que o 20B para interpretar métricas, limitações e relações entre percepção e evidências;
- o custo adicional é pequeno para apenas 15 respostas;
- facilita manter todas as respostas no mesmo provedor e modelo.

O corpus simulado possui aproximadamente 158 mil caracteres de entrada. Considerando a limitação implementada de 700 tokens de conclusão por chamada, o custo estimado com o 120B fica aproximadamente entre US$ 0,01 e US$ 0,02. Essa é apenas uma estimativa; a cobrança real depende da tokenização e das regras vigentes na conta do provedor.

Se o objetivo for minimizar absolutamente o custo, a alternativa é `openai/gpt-oss-20b`, que já é o modelo padrão do projeto e provavelmente custará menos de US$ 0,01 para as 15 chamadas.

## 4. Configuração necessária

Abra um PowerShell na raiz do projeto:

```text
C:\Codigos\TCC
```

Configure as variáveis somente na sessão atual do terminal:

```powershell
$env:TCC_IA_PROVEDOR = "GROQ"
$env:TCC_IA_MODELO = "openai/gpt-oss-120b"
$env:TCC_IA_CHAVE = Read-Host "Cole a chave da Groq" -MaskInput
```

Confirme a configuração sem exibir a chave:

```powershell
$env:TCC_IA_PROVEDOR
$env:TCC_IA_MODELO
if ($env:TCC_IA_CHAVE) { "Chave configurada" } else { "Chave ausente" }
```

Não coloque a chave:

- no código-fonte;
- no JSON do experimento;
- em documentação;
- em arquivo versionado pelo Git.

O script não serializa a credencial no corpus produzido.

Para registrar a versão técnica do experimento, execute antes:

```powershell
git rev-parse HEAD
node --version
npm --version
git status --short
```

Essas informações permitem documentar o commit, a versão do Node.js, a versão do npm e o estado do repositório usados na avaliação.

## 5. Comando para iniciar a avaliação real

Defina um arquivo de saída único:

```powershell
$saida = "AiFiles/RELATORIOS/avaliacao-ia-tcc/real-groq-gpt-oss-120b-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
```

Depois execute:

```powershell
npm run testar:tcc -- --ia-real --autorizar-consumo --saida $saida
```

Esse comando realizará as 15 chamadas reais: cinco cenários, com três execuções independentes por cenário.

Durante a execução, o script:

- cria um banco temporário isolado;
- monta novamente os cinco cenários sintéticos;
- calcula as métricas e monta o DTO usado pela plataforma;
- gera o prompt correspondente;
- chama somente o provedor configurado para o experimento;
- salva cada resposta incrementalmente no JSON;
- registra provedor, modelo, horário, entrada, prompt, hash, resposta e validação.

As opções `--ia-real` e `--autorizar-consumo` são obrigatórias para evitar consumo acidental.

## 6. Garantia de uso do mesmo provedor e modelo

No modo experimental, o script aceita somente uma credencial Groq. Não existe tentativa de outro provedor externo.

Depois da execução, valide o corpus:

```powershell
$documento = Get-Content -Raw $saida | ConvertFrom-Json

$documento.resumo | Format-List

$documento.execucoes |
    Select-Object id, origemResposta, modeloEfetivo,
        @{Name="valida"; Expression={$_.validacaoAutomatica.validaParaExperimento}} |
    Format-Table
```

O resultado esperado é:

- `validasExperimento` igual a `15`;
- todas as origens iguais a `GROQ`;
- todos os modelos efetivos iguais a `openai/gpt-oss-120b`;
- todas as execuções com `valida` igual a `True`.

Uma contingência local ainda pode ser gerada se a API falhar. Entretanto, ela será registrada como inválida e não entrará nas 15 respostas válidas. Uma resposta de outro modelo ou provedor também será automaticamente excluída.

Se uma posição for inválida, mantenha exatamente as mesmas variáveis de ambiente e repita somente aquela posição:

```powershell
npm run avaliar:ia-tcc:repetir -- --arquivo $saida --cenario S1 --execucao 1 --autorizar-consumo
```

O comando de repetição:

- recusa um experimento simulado;
- recusa provedor ou modelo diferentes do experimento original;
- verifica o hash do prompt;
- preserva a geração anterior no histórico;
- substitui somente a posição inválida selecionada.

### Limite da reprodutibilidade

O mesmo identificador de modelo garante uniformidade dentro do experimento, mas não garante respostas idênticas em uma execução futura. O adaptador OpenAI-compatível utiliza temperatura `0.35`, e provedores podem atualizar internamente um modelo sem alterar seu identificador.

A implementação garante rastreabilidade por meio de:

- data e horário em UTC;
- provedor e modelo planejados;
- provedor e modelo efetivos;
- prompt completo;
- versão e hash SHA-256 do prompt;
- DTO efetivamente enviado;
- resposta completa;
- histórico de repetições.

## 7. Acesso às respostas geradas

O arquivo apontado por `$saida` é a fonte completa do experimento. Cada item de `execucoes` contém:

- `entrada`: métricas e registros enviados ao modelo;
- `prompt`: instrução integral;
- `resposta.insights`: resposta estruturada do modelo;
- `origemResposta` e `modeloEfetivo`;
- `validacaoAutomatica`;
- `avaliacao` manual.

Para visualizar uma execução específica:

```powershell
$documento = Get-Content -Raw $saida | ConvertFrom-Json

$execucao = $documento.execucoes |
    Where-Object { $_.cenario -eq "S1" -and $_.numeroExecucao -eq 1 }

$execucao |
    Select-Object cenario, usuario, entrada, resposta, validacaoAutomatica |
    ConvertTo-Json -Depth 100
```

Para a avaliação manual, o JSON deve ser considerado a fonte de verdade, pois contém toda a entrada e todos os campos da resposta.

## 8. Preenchimento manual dos critérios C1–C5

Faça uma cópia do modelo de avaliação para cada execução:

```powershell
Copy-Item `
  "AiFiles/RELATORIOS/MODELO_AVALIACAO_MANUAL_IA_TCC.json" `
  "AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacao-S1-1.json"
```

No arquivo copiado, preencha:

- `avaliador`;
- `resultado` de cada critério com `ATENDIDO` ou `NAO_ATENDIDO`;
- uma justificativa específica baseada na comparação entre `entrada` e `resposta`.

Os critérios devem ser interpretados da seguinte forma:

| Critério | Verificação manual |
|---|---|
| C1 | Os números, métricas e tendências citados concordam com a entrada fornecida pela plataforma. |
| C2 | A interpretação é coerente com o cenário, o período e os registros do usuário sintético. |
| C3 | Todas as afirmações factuais estão apoiadas nos dados; não foram inventadas informações. |
| C4 | A resposta não apresenta classificações fixas sobre perfil ou capacidade de aprendizagem. |
| C5 | Reflexões, perguntas e recomendações são compatíveis com as evidências e limitações disponíveis. |

Os campos `situacao` e `satisfatoria` podem permanecer inicialmente como `PENDENTE` e `null`, pois serão recalculados pelo sistema.

Registre a avaliação no corpus:

```powershell
npm run avaliar:ia-tcc:registrar -- `
  --arquivo $saida `
  --cenario S1 `
  --execucao 1 `
  --avaliacao "AiFiles/RELATORIOS/avaliacao-ia-tcc/avaliacao-S1-1.json"
```

Repita o processo para os cenários S1 a S5 e para as execuções 1 a 3.

Uma resposta é classificada como satisfatória quando:

- pelo menos quatro dos cinco critérios estão `ATENDIDO`;
- C3 está obrigatoriamente `ATENDIDO`;
- C4 está obrigatoriamente `ATENDIDO`.

O comando recusa o registro de avaliação em respostas simuladas, locais ou incompatíveis com o provedor e o modelo planejados.

## 9. Geração do relatório final

Depois de registrar as 15 avaliações humanas, execute:

```powershell
npm run avaliar:ia-tcc:relatorio -- --arquivo $saida
```

Serão produzidos na mesma pasta:

- um arquivo `.json`, contendo o corpus completo e auditável;
- um arquivo `.md`, contendo o relatório narrativo e a tabela por execução;
- um arquivo `.csv`, contendo uma linha por resposta e os resultados de C1–C5.

Confira o consolidado:

```powershell
$documento = Get-Content -Raw $saida | ConvertFrom-Json
$documento.resumo | Format-List
```

O resultado geral somente deixa de ser `PENDENTE` quando existirem:

- 15 respostas externas válidas;
- 15 avaliações manuais completas.

O experimento será considerado satisfatório se pelo menos 14 das 15 respostas forem satisfatórias.

O relatório Markdown apresenta:

- identificação do experimento;
- provedor e modelo;
- totais planejados, válidos, avaliados, satisfatórios e insatisfatórios;
- resultado de C1–C5 por execução;
- justificativas do avaliador;
- falhas agregadas por critério;
- limitações metodológicas.

O Markdown resume principalmente o campo `observacao` dos insights. Para revisar também `resumoEvidencias`, `perguntaReflexiva` e `experimentoSugerido`, consulte o JSON completo.

## 10. Uso dos resultados no Capítulo 4

O Capítulo 4 pode apresentar:

1. configuração do experimento: cinco cenários e três execuções por cenário;
2. provedor, modelo, data, commit e versão do prompt;
3. quantidade de respostas válidas e eventuais repetições;
4. resultado individual e consolidado de C1–C5;
5. quantidade de respostas satisfatórias entre as 15;
6. critérios com maior frequência de falha;
7. exemplos representativos de acertos e limitações;
8. limitações metodológicas da avaliação.

Devem permanecer explícitas as seguintes limitações:

- todos os dados utilizados são sintéticos;
- o conjunto contém somente 15 respostas;
- modelos generativos podem variar mesmo com a mesma entrada;
- a avaliação C1–C5 é qualitativa e manual;
- não é possível generalizar estatisticamente os resultados;
- respostas locais, falhas de API e trocas de modelo não contam como respostas válidas.

## 11. Impedimentos e riscos técnicos

Não há um defeito conhecido que impeça a execução recomendada com Groq. Permanecem os seguintes cuidados:

1. As variáveis `TCC_IA_PROVEDOR`, `TCC_IA_MODELO` e `TCC_IA_CHAVE` estão ausentes atualmente.
2. É necessário possuir uma chave Groq ativa e cota ou saldo disponível.
3. Não existe pré-validação real da chave sem realizar ao menos uma chamada externa.
4. Se o processo for interrompido antes da criação das 15 posições, o JSON parcial será preservado, mas o comando de repetição apenas processa posições existentes e inválidas; ele não cria posições ainda ausentes.
5. A inferência não é deterministicamente reproduzível.
6. Uma queda de energia ou encerramento do processo durante a escrita deve ser evitada; mantenha o terminal aberto até a conclusão.

## 12. Encerramento seguro

Depois de concluir a execução e as repetições necessárias, remova a chave da sessão do terminal:

```powershell
Remove-Item Env:TCC_IA_CHAVE
Remove-Item Env:TCC_IA_MODELO
Remove-Item Env:TCC_IA_PROVEDOR
```

## 13. Referências internas

- [`IMPLEMENTACAO_AVALIACAO_IA_TCC.md`](IMPLEMENTACAO_AVALIACAO_IA_TCC.md)
- [`PROTOCOLO_AVALIACAO_TCC.md`](PROTOCOLO_AVALIACAO_TCC.md)
- [`MODELO_AVALIACAO_MANUAL_IA_TCC.json`](MODELO_AVALIACAO_MANUAL_IA_TCC.json)
- [`../../scripts/avaliar-tcc.ts`](../../scripts/avaliar-tcc.ts)
- [`../../scripts/repetir-avaliacao-ia-tcc.ts`](../../scripts/repetir-avaliacao-ia-tcc.ts)
- [`../../scripts/registrar-avaliacao-manual-ia-tcc.ts`](../../scripts/registrar-avaliacao-manual-ia-tcc.ts)
- [`../../scripts/gerar-relatorio-avaliacao-ia-tcc.ts`](../../scripts/gerar-relatorio-avaliacao-ia-tcc.ts)
