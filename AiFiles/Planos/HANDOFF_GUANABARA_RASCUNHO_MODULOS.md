# Handoff para Guanabara — criação de módulos em rascunho

## Identificação

- **Estado:** CONCLUÍDO E VALIDADO LOCALMENTE EM 2026-09-13.
- **Origem:** solicitação do autor em 2026-09-13 para simplificar a página de Módulos e iniciar a configuração dentro do módulo recém-criado.
- **Responsável por esta etapa:** agente Guanabara.
- **Dependência posterior:** concluída pelo agente Araki em 2026-09-13; cards mínimos, botão discreto e primeira configuração em tela cheia foram integrados e validados.
- **Escopo desta etapa:** banco, migração aditiva, serviços, consultas, ações de servidor, redirecionamentos, testes e documentação técnica.
- **Requisito relacionado:** RLP-002 — CRUD de módulos.

## Objetivo

Permitir que um clique no comando “Criar novo módulo” produza um módulo pessoal em estado de rascunho e redirecione imediatamente a conta proprietária para a página interna desse módulo. Nome e descrição serão informados e validados somente nessa página, na primeira configuração.

O Front End não deve criar nomes artificiais, fabricar descrições nem tentar simular um rascunho apenas no navegador.

## Experiência esperada após a integração com Araki

1. A pessoa abre `/modulos`.
2. Aciona um botão discreto “+”, com nome acessível “Criar novo módulo”.
3. Uma ação de servidor cria um rascunho pertencente à conta autenticada.
4. A ação redireciona diretamente para `/modulos/<identificador-temporario>`.
5. A página interna reconhece `rascunho: true` e prioriza a primeira configuração do módulo.
6. A pessoa informa título e descrição.
7. Ao salvar, o backend aplica as validações atuais, gera o identificador definitivo, marca `rascunho: false` e redireciona para a URL definitiva.
8. Se a pessoa sair antes de salvar, o rascunho permanece disponível para continuação, sem entrar nos indicadores do Dashboard.

## Problema no contrato atual

Atualmente:

- `ModuloAprendizagem.titulo` e `ModuloAprendizagem.descricao` são obrigatórios;
- `esquemaModulo` exige pelo menos três caracteres nos dois campos;
- `criarModuloPessoal` recebe título e descrição antes de criar o registro;
- o identificador da rota é derivado do título;
- `/modulos` utiliza o mesmo resumo agregado consumido pelo Dashboard;
- as métricas pessoais consideram todo módulo não arquivado.

Esse contrato não permite criar e abrir primeiro um módulo ainda sem nome. Inserir silenciosamente “Novo módulo” e uma descrição fictícia não é aceitável: isso mistura conteúdo real e placeholder, cria conflitos e não identifica rascunhos abandonados.

## Decisão de modelo para esta entrega

Adicionar ao modelo `ModuloAprendizagem`:

```prisma
rascunho Boolean @default(false)
```

Manter `titulo` e `descricao` como `String` não anuláveis. Um registro com `rascunho: true` poderá armazenar strings vazias exclusivamente durante a criação inicial. O campo explícito `rascunho` diferencia esse estado de um módulo configurado e evita espalhar `null` por contratos existentes.

Todos os módulos existentes devem receber `rascunho = false` pela migração. Não editar migrações já aplicadas; criar uma nova migração aditiva.

## Identificador temporário

O rascunho deve receber identificador opaco, exclusivo por conta e independente do título, no formato:

```text
rascunho-<uuid>
```

Requisitos:

- gerar no servidor com fonte aleatória adequada, como `crypto.randomUUID()`;
- não derivar de nome, horário isolado ou quantidade atual de módulos;
- respeitar `@@unique([usuarioId, identificador])`;
- não expor dado pessoal no identificador;
- permitir dois ou mais rascunhos simultâneos na mesma conta.

Ao concluir a primeira configuração, usar a regra atual de `criarIdentificador(titulo)`. O retorno do serviço deve conter o identificador definitivo para o redirecionamento.

## Serviço obrigatório

Criar em `src/servidor/modulos.ts` uma operação com contrato equivalente a:

```ts
export async function criarRascunhoModuloPessoal(usuarioId: string) {
  // cria somente para a conta informada
  // titulo: ""
  // descricao: ""
  // rascunho: true
  // identificador temporário único
}
```

A operação:

- não recebe título ou descrição do cliente;
- não aceita `usuarioId` vindo de formulário;
- cria somente um registro não arquivado da conta autenticada;
- retorna ao menos `id`, `identificador` e `rascunho`;
- não cria tópico, material, sessão ou avaliação;
- não consulta Gemini nem calcula métricas.

## Finalização do rascunho

Estender `atualizarModuloPessoal` sem enfraquecer `esquemaModulo`:

- título continua entre 3 e 120 caracteres após `trim`;
- descrição continua entre 3 e 500 caracteres após `trim`;
- duplicidade do identificador definitivo continua bloqueada dentro da conta;
- ao salvar um rascunho válido, persistir título, descrição, identificador definitivo e `rascunho: false` na mesma atualização;
- um erro de validação ou duplicidade deve manter o registro como rascunho e preservar sua URL temporária;
- atualizações de módulos já configurados continuam funcionando como hoje;
- nunca alterar módulo pertencente a outra conta.

## Consultas e separação entre listagem e Dashboard

Rascunhos devem aparecer na biblioteca pessoal de `/modulos`, mas não podem contaminar indicadores ou análises.

Implementar uma separação explícita:

1. a consulta usada pelo Dashboard deve considerar somente:

```ts
{ usuarioId, arquivado: false, rascunho: false }
```

2. `obterMetricasPessoais` deve usar o mesmo filtro `rascunho: false`;
3. a consulta da biblioteca de módulos deve poder incluir rascunhos e devolver o campo `rascunho`;
4. `obterModuloPessoal` deve continuar permitindo que a proprietária abra um rascunho não arquivado;
5. `obterMetricasModuloPessoal` não deve calcular nem expor métricas de um rascunho; deve retornar ausência controlada ou um contrato explicitamente definido para esse estado;
6. a quantidade “Módulos ativos” do Dashboard não inclui rascunhos;
7. rascunhos não entram em recorrências, taxa geral, melhor método, frequência ou DTO enviado à interpretação por IA.

Preferir uma consulta própria para a biblioteca, por exemplo:

```ts
listarModulosPessoais(usuarioId: string, { incluirRascunhos: true })
```

ou tornar a inclusão um parâmetro explícito. Não fazer o Dashboard e a página de Módulos dependerem implicitamente do mesmo filtro.

## Ação de servidor e redirecionamento

Adicionar em `src/app/modulos/acoes.ts` uma ação com contrato equivalente a:

```ts
export async function criarRascunhoModulo() {
  const usuario = await exigirUsuario();
  const modulo = await criarRascunhoModuloPessoal(usuario.id);
  revalidatePath("/modulos");
  redirect(`/modulos/${modulo.identificador}`);
}
```

Requisitos:

- autenticação obrigatória;
- nenhum campo oculto identifica a proprietária;
- redirecionamento imediato para o rascunho criado;
- falha controlada volta para `/modulos?erro=...`;
- revalidar `/modulos`;
- não revalidar métricas do Dashboard na criação do rascunho, pois ele não participa delas;
- na primeira configuração concluída, revalidar `/modulos`, `/dashboard`, a URL temporária e a URL definitiva.

A ação atual `criarModulo(formulario)` pode permanecer temporariamente para compatibilidade, mas o novo botão do Araki usará exclusivamente `criarRascunhoModulo`. Removê-la só é permitido após confirmar que nenhum outro consumidor existe.

## Rascunhos abandonados e arquivamento

Nesta entrega, um rascunho abandonado deve ser preservado e reaparecer na biblioteca para continuação. Não implementar exclusão automática por tempo.

- o contrato da listagem deve expor `rascunho: true`;
- o Front End poderá mostrar um nome neutro como “Módulo sem nome”, sem gravar esse texto como título;
- o arquivamento lógico existente deve aceitar um rascunho próprio;
- registros não devem ser apagados fisicamente;
- um rascunho arquivado não aparece na biblioteca nem no Dashboard.

## Arquivos de alteração obrigatória

- `prisma/schema.prisma`
- nova migração em `prisma/migrations/<data>_modulo_rascunho/`
- `src/servidor/modulos.ts`
- `src/servidor/consultas.ts`
- `src/servidor/metricas.ts`
- `src/app/modulos/acoes.ts`
- testes de serviço e propriedade relacionados a módulos

## Arquivos condicionados ao contrato encontrado

- `src/servidor/paineis.ts`, para separar resumo do Dashboard e biblioteca;
- `scripts/verificar-servicos-modulos.ts`;
- `scripts/verificar-metricas-sinteticas.ts`, para provar que rascunhos não alteram agregações;
- `prisma/seed.ts`, somente se um rascunho sintético for necessário para teste reprodutível;
- `AiFiles/Contexto/Tecnico/MODELO_DE_DADOS.md`;
- `AiFiles/Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`;
- `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`;
- `AiFiles/Memoria/ACOMPANHAMENTO.md`.

Não alterar o seed apenas para demonstrar visualmente um rascunho. Prefira criar e remover o registro dentro do teste quando possível.

## Testes obrigatórios

### Criação

- cria rascunho com `titulo === ""`, `descricao === ""` e `rascunho === true`;
- cria identificador temporário não vazio e não derivado de dados pessoais;
- dois cliques processados criam identificadores distintos;
- o rascunho pertence à conta autenticada;
- nenhuma entidade filha é criada automaticamente.

### Propriedade

- outra conta não lê o rascunho pelo identificador;
- outra conta não finaliza, atualiza ou arquiva o rascunho;
- ausência de autenticação não cria registro.

### Primeira configuração

- título ou descrição com menos de três caracteres mantém o rascunho;
- entrada válida define título, descrição, identificador definitivo e `rascunho: false`;
- título duplicado mantém o rascunho e retorna erro de duplicidade;
- módulo já configurado continua atualizável;
- redirecionamento usa o identificador retornado pelo backend.

### Consultas e métricas

- biblioteca inclui rascunho próprio não arquivado;
- Dashboard não conta rascunhos em “Módulos ativos”;
- métricas pessoais ignoram rascunhos;
- interpretação por IA não recebe rascunhos;
- arquivar rascunho o remove da biblioteca;
- módulos existentes após a migração permanecem `rascunho: false`.

### Regressão

- CRUD atual de módulos configurados continua passando;
- tópicos e materiais não podem ser criados em rascunho antes da primeira configuração;
- sessões e avaliações existentes não são alteradas;
- taxa geral, melhor método e gráficos mantêm os mesmos resultados sintéticos.

## Critérios de aceite

- um comando sem campos cria o rascunho e fornece URL navegável;
- a proprietária consegue abrir e finalizar o rascunho;
- a primeira configuração continua sujeita às validações atuais;
- a URL temporária é substituída pela definitiva após salvar;
- rascunhos abandonados podem ser retomados pela biblioteca;
- Dashboard, métricas e interpretação ignoram rascunhos;
- isolamento entre contas permanece garantido no servidor;
- migração é aditiva e preserva módulos existentes;
- nenhum placeholder visual é persistido como conteúdo real;
- nenhuma mudança visual avançada é necessária nesta etapa.

## Validação mínima

Executar e registrar:

```powershell
npm.cmd run banco:gerar
npm.cmd run banco:reiniciar
npm.cmd run banco:verificar-cenario
npm.cmd run testar:servicos
npm.cmd run testar:metricas
npm.cmd run testar:integracao
npm.cmd run validar
```

Se algum script possuir limitação preexistente, Guanabara deve documentá-la com evidência e ainda executar os testes diretamente relacionados ao rascunho.

## Fora do escopo de Guanabara neste handoff

- redesenhar os cards da biblioteca;
- remover textos, métricas ou botões visuais dos cards;
- desenhar ou posicionar o ícone “+”;
- criar a composição visual em tela cheia;
- definir tipografia, cores, espaçamento ou animação;
- alterar os gráficos do módulo;
- adicionar exclusão física ou limpeza automática de rascunhos.

## Saída necessária para o Araki

Ao concluir, Guanabara deve informar:

1. caminho e assinatura de `criarRascunhoModuloPessoal`;
2. nome e assinatura da ação de servidor que o botão “+” deverá usar;
3. formato TypeScript do módulo listado, incluindo `rascunho`;
4. formato TypeScript do módulo detalhado em primeira configuração;
5. comportamento exato de erros e redirecionamentos;
6. URL temporária e URL definitiva esperadas;
7. confirmação de que Dashboard, métricas e IA ignoram rascunhos;
8. migração criada e efeito sobre registros existentes;
9. testes e comandos executados, com resultados;
10. qualquer divergência justificada em relação a este handoff.

Araki somente deve conectar o novo fluxo após esses contratos estarem implementados e validados.

## Resultado da execução para Araki

1. Serviço criado em `src/servidor/modulos.ts`: `criarRascunhoModuloPessoal(usuarioId: string)`. Retorna `Promise<{ id: string; identificador: string; rascunho: boolean }>`; persiste `titulo: ""`, `descricao: ""`, `rascunho: true` e `identificador: "rascunho-${randomUUID()}"`, sem filhos.
2. Ação de servidor em `src/app/modulos/acoes.ts`: `criarRascunhoModulo()` (sem argumentos). O botão `+` deve usá-la diretamente, sem `FormData` nem identificador da interface. Ela chama `exigirUsuario`, revalida `/modulos` e redireciona para a página interna.
3. A listagem tem o tipo exportado `ModuloListadoPessoal`: `{ id: string; identificador: string; titulo: string; descricao: string; rascunho: boolean; _count: { topicos: number } }`. Use `listarModulosPessoais(usuarioId, { incluirRascunhos: true })` na biblioteca.
4. O detalhe vem de `obterModuloPessoal(usuarioId, identificador)`: um módulo não arquivado da proprietária, com `id`, `identificador`, `titulo`, `descricao`, `rascunho` e `topicos` ativos (com recursos e avaliações ativos). Para `rascunho: true`, os dois textos persistidos são vazios e a página atual já apresenta a primeira configuração funcional.
5. Erros de título/descrição inválidos (`DADOS_INVALIDOS`) ou de identificador final duplicado (`IDENTIFICADOR_DUPLICADO`) não alteram o rascunho e voltam a `/modulos/{identificador-temporario}?erro=dados|duplicado`. Não encontrado ou sem propriedade não permite leitura, atualização nem arquivamento; a criação que falhar volta a `/modulos?erro=...`.
6. A URL inicial é `/modulos/rascunho-{UUID}`. Após a configuração válida, a ação redireciona para `/modulos/{slug-do-titulo}?sucesso=modulo`; a URL temporária deixa de resolver porque o identificador é atualizado na mesma gravação.
7. Dashboard, métricas por módulo e pessoais, além do DTO consumido pela IA, filtram `rascunho: false`; `obterMetricasModuloPessoal` retorna `null` para um rascunho. A biblioteca é a única listagem que pode incluí-lo.
8. Migração aditiva criada: `prisma/migrations/20260913130000_modulo_rascunho/migration.sql`. Adiciona `rascunho BOOLEAN NOT NULL DEFAULT false` e o índice `(usuarioId, arquivado, rascunho)`; módulos existentes permanecem configurados (`false`).
9. Validações aprovadas: `npm.cmd run banco:gerar`, `banco:reiniciar`, `banco:verificar-cenario`, `testar:servicos`, `testar:metricas`, `testar:integracao`, `validar` e `compilar`. O reset foi autorizado e recriou exclusivamente o banco sintético local.
10. Não há divergência funcional relevante. A criação direta já existente foi mantida por compatibilidade; a página de detalhe recebeu apenas a interface funcional mínima de primeira configuração. A composição visual, cards e botão `+` permanecem deliberadamente para Araki.

## Resultado da integração do Front End

- Cada módulo configurado aparece em `/modulos` como um card clicável contendo somente ícone e nome.
- Rascunhos aparecem no mesmo padrão mínimo com o nome neutro “Módulo sem nome”, sem persistir esse texto no banco.
- O antigo card “Novo espaço de estudo” foi removido.
- Um único botão discreto “+”, nomeado de forma acessível como “Criar novo módulo”, chama diretamente `criarRascunhoModulo`.
- O redirecionamento abre uma primeira configuração focada em tela cheia, com nome, descrição, validações existentes, privacidade e arquivamento preservados.
- O campo de nome recebe foco após a criação; métricas, tópicos e gráficos não são exibidos enquanto `rascunho: true`.
- A inspeção autenticada confirmou cards sem descrição ou métricas, criação e abertura automática do rascunho, layout responsivo em 320 px e ausência de erros no console.
- `npm.cmd run validar` aprovou lint, tipos, 24 testes e build de produção.
