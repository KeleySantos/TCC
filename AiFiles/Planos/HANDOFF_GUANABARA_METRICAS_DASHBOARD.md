# Handoff para Guanabara — métricas gerais do Dashboard

## Identificação

- **Estado:** CONCLUÍDO E VALIDADO LOCALMENTE EM 2026-09-13.
- **Origem:** solicitação do autor em 2026-09-13 para reorganizar o Dashboard geral.
- **Responsável por esta etapa:** agente Guanabara.
- **Dependência posterior:** concluída pelo agente Araki em 2026-09-13; os novos campos foram consumidos e a reorganização visual foi validada.
- **Escopo desta etapa:** domínio analítico, serviço de métricas, DTO do Dashboard, testes e rastreabilidade técnica.
- **Requisito relacionado:** RLP-010 — Dashboard geral.

## Objetivo

Entregar ao Front End duas métricas oficiais, determinísticas e prontas para exibição:

1. taxa geral de acerto ponderada entre todos os módulos ativos com avaliações válidas;
2. método com a maior média observada entre as recorrências que já satisfazem a exigência de aparecer em pelo menos dois módulos.

Os cálculos devem permanecer fora dos componentes React. O Front End não deverá reconstruir, ordenar ou interpretar essas métricas.

## Estado atual relevante

- `src/dominio/analises/metricas-modulo.ts` já calcula, por módulo, `respostasCorretas`, `totalQuestoes`, `taxaAcerto`, `quantidadeTentativas`, `desempenhoPorMetodo` e recorrências entre módulos.
- `calcularRecorrenciasEntreModulos` já exige o mesmo contexto em pelo menos dois módulos e produz média ponderada pela quantidade de evidências.
- `src/servidor/metricas.ts` consulta somente módulos ativos da conta autenticada e monta `metricasPorModulo`, `recorrencias` e `frequencia`.
- `src/servidor/paineis.ts` combina o resumo pessoal com as análises retornadas por `obterMetricasPessoais`.
- Não é necessária consulta adicional ao banco para produzir as duas métricas.

## Contrato 1 — taxa geral de acerto

Criar uma função pura de domínio com nome em português, preferencialmente:

```ts
calcularTaxaAcertoGeral(metricas: MetricasModulo[]): TaxaAcertoGeral
```

Contrato sugerido:

```ts
export type TaxaAcertoGeral = {
  respostasCorretas: number;
  totalQuestoes: number;
  quantidadeTentativas: number;
  quantidadeModulosComEvidencia: number;
  taxaAcerto: number | null;
  versaoAlgoritmo: string;
};
```

### Regra obrigatória

```text
respostasCorretasGerais = soma de respostasCorretas dos módulos
totalQuestoesGeral = soma de totalQuestoes dos módulos
taxaAcertoGeral = respostasCorretasGerais / totalQuestoesGeral
```

- `taxaAcerto` deve seguir o contrato existente e ficar entre `0` e `1`.
- Quando `totalQuestoesGeral` for zero, `taxaAcerto` deve ser `null`, nunca `0`.
- `quantidadeModulosComEvidencia` conta somente módulos cujo `totalQuestoes` seja maior que zero.
- `quantidadeTentativas` é a soma das tentativas válidas já reconhecidas pelo motor oficial.
- A agregação deve abranger somente os módulos ativos já entregues a `obterMetricasPessoais`.
- Não calcular média aritmética das porcentagens por módulo. A ponderação por questões impede que um módulo com uma questão tenha o mesmo peso de outro com muitas questões.
- Não alterar as regras que determinam se uma tentativa é válida.

Exemplo de aceite: um módulo com `1/1` e outro com `5/10` deve produzir `6/11`, aproximadamente `0,54545`, e não `0,75`.

## Contrato 2 — método com maior média observada

Criar uma função pura de domínio com nome em português, preferencialmente:

```ts
selecionarMetodoComMaiorMediaObservada(
  recorrencias: RecorrenciaContextual[],
): MetodoComMaiorMediaObservada | null
```

Contrato sugerido:

```ts
export type MetodoComMaiorMediaObservada = {
  chave: MetodoEstudo;
  mediaNotas: number;
  quantidadeEvidencias: number;
  quantidadeModulos: number;
  moduloIds: string[];
  versaoAlgoritmo: string;
};
```

### Regra obrigatória

1. considerar somente recorrências com `tipo === "METODO"`;
2. manter a exigência de `quantidadeModulos >= 2`;
3. ordenar por `mediaNotas` decrescente;
4. em empate, usar `quantidadeEvidencias` decrescente;
5. persistindo o empate, usar `quantidadeModulos` decrescente;
6. persistindo o empate, usar `chave.localeCompare` para resultado determinístico;
7. retornar `null` quando nenhuma recorrência de método for elegível.

O backend deve chamar o campo de `metodoComMaiorMediaObservada`. Não usar identificadores como `melhorMetodo`, pois os dados são observacionais e não demonstram superioridade causal ou universal.

## Integração esperada no serviço

Em `src/servidor/metricas.ts`:

1. construir `metricasPorModulo` como já ocorre;
2. calcular `recorrencias` uma única vez;
3. derivar `taxaAcertoGeral` das métricas por módulo;
4. derivar `metodoComMaiorMediaObservada` das recorrências;
5. devolver ambos no objeto de `obterMetricasPessoais`.

Formato esperado do retorno relevante:

```ts
return {
  metricasPorModulo,
  recorrencias,
  frequencia,
  taxaAcertoGeral,
  metodoComMaiorMediaObservada,
};
```

`src/servidor/paineis.ts` deve continuar entregando esses campos pelo DTO combinado. Se Guanabara decidir tipar explicitamente o retorno do painel, deve fazê-lo sem expor entidades Prisma além do que a interface já consome.

## Arquivos prováveis

### Alteração obrigatória

- `src/dominio/analises/metricas-modulo.ts`
- `src/dominio/analises/metricas-modulo.test.ts`
- `src/servidor/metricas.ts`

### Alteração condicionada à necessidade encontrada

- `src/servidor/paineis.ts`, somente para explicitar ou ajustar o DTO;
- `scripts/verificar-metricas-sinteticas.ts`, para conferir as novas agregações no cenário sintético;
- `AiFiles/Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`, para documentar a fórmula geral e a seleção observacional;
- `AiFiles/Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`, se o DTO do Dashboard estiver descrito nele;
- `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md` e `AiFiles/Memoria/ACOMPANHAMENTO.md`, após a implementação realmente passar nas validações.

## Testes obrigatórios

### Taxa geral

- coleção vazia retorna totais iguais a zero e `taxaAcerto: null`;
- módulos sem questões não transformam ausência em zero percentual;
- caso ponderado `1/1 + 5/10` resulta em `6/11`;
- módulos com taxa de `0%` continuam sendo evidência válida;
- contagem de módulos com evidência ignora módulos com `totalQuestoes === 0`;
- versão do algoritmo é preservada.

### Método com maior média observada

- retorna `null` sem recorrência de método;
- ignora recorrências de formato;
- escolhe a maior `mediaNotas`;
- desempata pela maior amostra;
- desempata depois pela quantidade de módulos;
- empate completo usa a chave em ordem determinística;
- preserva amostra, módulos, identificadores e versão do algoritmo no DTO.

### Regressão

- manter passando os testes atuais de métricas por módulo, exposição mista, evolução, percepção e recorrência;
- confirmar que nenhuma métrica passa a depender de rede, Gemini ou componente React.

## Critérios de aceite

- `obterPainelPessoal(usuarioId)` entrega `taxaAcertoGeral` e `metodoComMaiorMediaObservada` para a conta autenticada;
- a taxa geral é ponderada por questões e não por módulos;
- o método retornado possui evidência em pelo menos dois módulos;
- estados sem dados usam `null` e mantêm contagens reais;
- empates possuem resultado reproduzível;
- funções de domínio são puras e cobertas por testes;
- nenhuma informação de outra conta é consultada ou agregada;
- não há mudança de banco, schema Prisma, migração, seed ou dependência;
- textos e identificadores próprios permanecem em português do Brasil;
- nenhuma afirmação causal é introduzida.

## Validação mínima

Executar, corrigir falhas causadas pela alteração e registrar o resultado de:

```powershell
npm.cmd run testar
npm.cmd run testar:metricas
npm.cmd run verificar-tipos
npm.cmd run verificar-estilo
npm.cmd run compilar
```

`npm.cmd run validar` pode substituir lint, tipos, testes unitários e build, mas `testar:metricas` deve ser executado separadamente se não fizer parte de `validar`.

## Fora do escopo de Guanabara neste handoff

- editar `src/app/dashboard/page.tsx` ou seus estilos;
- criar ou redesenhar cards;
- remover o gráfico de tempo válido;
- alterar textos dos gráficos;
- criar a página `/modulos`;
- mover formulários ou listas de módulos;
- criar a barra lateral recolhível;
- alterar a identidade visual.

Essas mudanças pertencem à etapa posterior do Araki.

## Saída necessária para o handoff ao Araki

Ao concluir, Guanabara deve informar:

1. assinatura e caminho das funções puras criadas;
2. formato TypeScript final dos dois campos do DTO;
3. regra aplicada aos estados `null`;
4. regra de desempate do método;
5. testes e comandos executados, com seus resultados;
6. qualquer divergência entre este plano e o código encontrado.

Araki somente deve iniciar a substituição dos cards quando esses contratos estiverem implementados e validados.

## Resultado da execução para Araki

- Funções puras criadas em `src/dominio/analises/metricas-modulo.ts`:
  - `calcularTaxaAcertoGeral(metricas: MetricasModulo[]): TaxaAcertoGeral`;
  - `selecionarMetodoComMaiorMediaObservada(recorrencias: RecorrenciaContextual[]): MetodoComMaiorMediaObservada | null`.
- `obterMetricasPessoais` e, por composição, `obterPainelPessoal` entregam `taxaAcertoGeral` e `metodoComMaiorMediaObservada` sem consulta adicional ao banco.
- `taxaAcertoGeral` contém `respostasCorretas`, `totalQuestoes`, `quantidadeTentativas`, `quantidadeModulosComEvidencia`, `taxaAcerto` e `versaoAlgoritmo`. Sem questões, `taxaAcerto` é `null` e todas as contagens permanecem reais.
- `metodoComMaiorMediaObservada` é `null` sem recorrência elegível; caso exista, contém `chave`, `mediaNotas`, `quantidadeEvidencias`, `quantidadeModulos`, `moduloIds` e `versaoAlgoritmo`.
- O desempate respeita, nesta ordem: média observada, quantidade de evidências, quantidade de módulos e `chave.localeCompare`.
- Foram aprovados `npm.cmd run testar` (24 testes), `npm.cmd run testar:metricas` e `npm.cmd run verificar-tipos`. Não houve mudança de banco, schema, migração, seed, dependência ou componente visual.

## Resultado da integração do Front End

- O card “Taxa média de acerto” consome `taxaAcertoGeral` sem recompor a métrica no React.
- O card “Método com melhor resultado” consome `metodoComMaiorMediaObservada`, mantendo amostra e quantidade de módulos no texto de apoio.
- Lista e criação de módulos foram movidas para a rota própria `/modulos`.
- O gráfico de tempo válido foi removido; a evolução passou a comunicar “Sua taxa de acerto ao longo do tempo”.
- Dashboard, Módulos, Histórico, Perfil e detalhe do módulo reutilizam a barra lateral recolhível.
- `npm.cmd run validar` aprovou lint, tipos, 24 testes e build; a inspeção autenticada confirmou filtros, redirecionamento legado, persistência da barra e ausência de rolagem horizontal em 320 px e 360 px.
