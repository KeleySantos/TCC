# Compartilhamento de dashboards de módulos — Plano de implementação

> Para execução por agentes: usar a skill `superpowers:executing-plans` para execução direta nesta sessão, ou `superpowers:subagent-driven-development` somente se o usuário escolher explicitamente delegação. Executar e verificar uma tarefa por vez.

**Objetivo:** compartilhar dashboards de módulos com até três convidados, por código, com leitura e IA autorizadas e revogação individual ou total.

**Arquitetura:** preservar o monólito modular Next.js. Acrescentar persistência e serviços específicos de compartilhamento, reutilizando cálculos e componentes existentes, sem ampliar permissões dos serviços pessoais nem misturar vínculos de Salas.

**Tecnologias:** TypeScript, Next.js App Router, React, Prisma, SQLite/better-sqlite3, Zod, Vitest e integração Groq existente.

**Desenho aprovado:** [DESENHO_COMPARTILHAMENTO_DASHBOARDS_MODULOS.md](DESENHO_COMPARTILHAMENTO_DASHBOARDS_MODULOS.md).

**Situação:** plano aprovado e executado diretamente na pasta existente, sem subagentes. Concluído em 18/10/2026; evidências e decisões no [relatório da implementação](../RELATORIOS/IMPLEMENTACAO_COMPARTILHAMENTO_MODULOS.md). A revisão final foi própria, sem revisão independente, conforme a escolha do usuário.

## Restrições globais

- Até 3 convidados ativos por módulo; proprietário não ocupa vaga.
- Convidados não podem editar dados, consultar materiais privados ou obter descrições privadas de sessões.
- Códigos de módulos e Salas são contextos distintos.
- Sem novas dependências, alteração de métricas, critérios C1–C5, corpus experimental ou redesign amplo.
- Abas de Salas iguais às abas vigentes da tela de Módulo; IA igual ao padrão atual do Dashboard principal.
- Validar autorização no servidor e novamente antes de devolver resultados demorados; não confiar em identificadores do proprietário enviados pelo cliente.
- Não executar gerações reais de IA nos testes; utilizar mocks.
- Preservar todas as alterações preexistentes. Não reiniciar banco, popular seed ou executar scripts de avaliação real.
- Antes de escrever código Next.js, ler os guias pertinentes em `node_modules/next/dist/docs/`, especialmente Route Handlers, Server/Client Components e cache/revalidação.
- Registrar requisitos/testes na matriz antes de implementar. Artefatos de IA ficam em `AiFiles/`.

## Pontos prioritários de revisão

1. Duas adesões simultâneas à última vaga nunca produzem quatro acessos: teste integrado da tarefa 1.
2. Revogação enquanto a IA aguarda o provedor impede a entrega da resposta: teste da tarefa 3.
3. Hash/código de um contexto não aceita convite do outro: testes da tarefa 1; código nunca aparece em logs.
4. Propriedade de outro módulo e descrição privada não vazam em JSON ou props enviados ao cliente: testes das tarefas 2 e 3.
5. Clipboard indisponível e perda de acesso em uma página aberta geram mensagens úteis sem manter a resposta privada visível após detecção: testes das tarefas 4 e 5.

## Mapa de arquivos e interfaces

### Persistência e acesso

- Alterar `prisma/schema.prisma`; criar `prisma/migrations/20261018210000_compartilhamento_modulos/migration.sql` (se o nome já existir, usar o próximo identificador cronológico livre).
- Criar `src/servidor/compartilhamento-modulos.ts`: geração, consulta, adesão, revogação, listagem e autorização. Usar Prisma existente; erros tipados `ErroCompartilhamentoModulo`.
- Criar `src/servidor/compartilhamento-modulos.test.ts` e `scripts/verificar-compartilhamento-modulos.ts`; testes integrados em SQLite temporário isolado, com fixtures sintéticas próprias e descarte restrito ao diretório criado pelo teste.
- Alterar `src/servidor/modulos.ts`: acrescentar `quantidadeCompartilhamentosAtivos: number` em `ModuloListadoPessoal`, sem remover campos existentes.

**Interfaces de servidor:**

```ts
type PeriodoCompartilhado = { inicio?: Date | null; fim?: Date };
type AcessoDashboardCompartilhado = {
  moduloId: string; identificador: string; titulo: string;
  proprietarioId: string; proprietarioNome: string;
};
type ResumoCompartilhamentoModulo = {
  moduloId: string; titulo: string; codigo: string | null;
  quantidadeAtivos: number; limite: 3;
  convidados: Array<{ usuarioId: string; nome: string }>;
};
```

Funções em `compartilhamento-modulos.ts`:

- `obterCompartilhamentoModulo(proprietarioId: string, moduloId: string): Promise<ResumoCompartilhamentoModulo>` — somente consulta, sem gerar código.
- `gerarCodigoCompartilhamentoModulo(proprietarioId: string, moduloId: string): Promise<ResumoCompartilhamentoModulo>` — conserva código ativo; gera novo após encerramento.
- `aceitarCodigoModulo(convidadoId: string, entrada: unknown): Promise<{ moduloId: string; jaPossuiAcesso: boolean }>`.
- `removerAcessoModulo(proprietarioId: string, moduloId: string, convidadoId: string): Promise<void>`.
- `encerrarCompartilhamentoModulo(proprietarioId: string, moduloId: string): Promise<void>`.
- `listarModulosCompartilhados(convidadoId: string): Promise<Array<Omit<AcessoDashboardCompartilhado, 'proprietarioId'>>>` — não expor IDs de proprietário sem necessidade.
- `exigirAcessoDashboardCompartilhado(convidadoId: string, moduloId: string): Promise<AcessoDashboardCompartilhado>` — referência interna, nunca devolver esse objeto integral ao navegador.

### Dashboard, APIs e IA

- Criar `src/servidor/dashboard-compartilhado.ts` e `.test.ts`: composição autorizada de métricas e serialização mínima.
- Criar `src/servidor/ia/interpretacao-compartilhada.ts` e `.test.ts`: autorização, DTO sem descrições e verificação final de acesso.
- Alterar minimamente `src/servidor/ia/interpretacoes.ts`: expor uma função para executar DTO autorizado com cota do solicitante, reutilizando `interpretarComFila`, validação e contingência.
- Criar rotas: `src/app/api/compartilhamentos/modulos/route.ts` (POST aceitar código); `src/app/api/modulos/[identificador]/compartilhamento/route.ts` (GET consultar, POST gerar, DELETE encerrar); `src/app/api/modulos/[identificador]/compartilhamento/[convidadoId]/route.ts` (DELETE remover); `src/app/api/compartilhamentos/modulos/[moduloId]/route.ts` (GET dashboard); `src/app/api/compartilhamentos/modulos/[moduloId]/interpretacoes/route.ts` (POST IA).
- Criar `src/app/salas/compartilhados/[moduloId]/page.tsx` e `dashboard-compartilhado.tsx`: página autenticada e contêiner cliente para exibir/limpar dashboard e tratar revogação.

**Interfaces:** `obterDashboardCompartilhado(convidadoId: string, moduloId: string, periodo?: PeriodoCompartilhado)` devolve `{ modulo: { id, titulo, proprietarioNome }, metricas, aprendizagem }`, usando os tipos já esperados por `ConteudoDashboardModulo` para `metricas` e `aprendizagem`; definir o tipo exportado `DashboardModuloCompartilhado` nesse serviço. `gerarInterpretacaoCompartilhada(convidadoId: string, moduloId: string, periodo?: PeriodoCompartilhado): Promise<InterpretacaoGerada>` devolve somente a resposta autorizada. `interpretarDtoAutorizado(solicitanteId: string, dto: DtoInterpretacao): Promise<InterpretacaoGerada>` reutiliza o motor existente; importar `DtoInterpretacao` e `InterpretacaoGerada` de `src/dominio/interpretacoes/esquema.ts`.

### Interface

- Criar `src/componentes/compartilhamento-modulo.tsx`, `.module.css` e `.test.ts`: modal do proprietário.
- Alterar `src/app/modulos/[identificador]/page.tsx` para ação Compartilhar e `src/app/modulos/page.tsx` para indicador nos cards.
- Criar `src/app/salas/abas-salas.tsx`, `.module.css` e `.test.ts`; alterar `src/app/salas/page.tsx` para compor as duas abas e manter o conteúdo existente.
- Criar `src/app/salas/modulos-compartilhados.tsx` e `.test.ts`: formulário por código, cards, estados e mensagens.
- Alterar `src/componentes/interpretacao-automatica.tsx` e testes para aceitar `moduloCompartilhadoId?: string` e `aoPerderAcesso?: () => void`; endpoint definido internamente, sem URL arbitrária recebida do usuário.
- Reutilizar `ConteudoDashboardModulo`, `FiltroPeriodoModulo` e estilos existentes; não criar cálculos ou gráficos paralelos.

## Tarefa 1 — Persistência, códigos e limite transacional

- [x] Registrar requisito e critérios na `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`.
- [x] Escrever testes inicialmente falhos: três adesões válidas, quarta bloqueada, duplicata idempotente, proprietário bloqueado, código inválido e código de Sala rejeitados, remoção liberando vaga, encerramento invalidando código, reinício sem reativação e novo código diferente.
- [x] Executar `npm run testar -- src/servidor/compartilhamento-modulos.test.ts`; confirmar falha relacionada à implementação ausente.
- [x] Criar `CompartilhamentoModulo` com `moduloId` único, `codigoHash` único anulável e código cifrado recuperável somente pelo proprietário. Usar AES-GCM do cofre existente com contexto exclusivo do módulo; não armazenar código em texto simples nem alterar a chave mestra.
- [x] Criar `AcessoModuloCompartilhado` com módulo, convidado, datas de concessão/revogação e `vaga` anulável. Vagas ativas são inteiros 1, 2 ou 3; revogação atribui `null`. Garantir `@@unique([moduloId, convidadoId])`, `@@unique([moduloId, vaga])`, CHECK SQL de faixa e FKs com cascade. A vaga, não um segundo booleano divergente, define o estado ativo.
- [x] Implementar as interfaces de compartilhamento. Código usa prefixo `MOD-` e aleatoriedade criptográfica de Salas; normalização e hash separados por contexto. Não refatorar o serviço de Salas.
- [x] Aceitar código com uma transação que serialize a escrita antes da seleção da vaga; restrição única é a segunda proteção. Tratar ocupação concorrente/SQLite ocupado com repetição limitada de até três tentativas, sem executar leituras sensíveis fora da transação para decidir a vaga.
- [x] Preparar o script integrado com banco temporário, aplicar migrações e testar duas adesões concorrentes à última vaga. Exigir exatamente três ativos; a requisição excedente recebe capacidade completa, não sucesso nem erro genérico de banco.
- [x] Executar testes e script isolado; verificar cascade por exclusão de conta/módulo e bloqueio por arquivamento/rascunho. Não alterar o seed ou corpus do TCC.

## Tarefa 2 — Consulta de dashboard com leitura restrita

- [x] Escrever testes falhos para convidado ativo, outro usuário, vínculo revogado, módulo arquivado, outro módulo e sentinelas de conteúdo privado.
- [x] Executar `npm run testar -- src/servidor/dashboard-compartilhado.test.ts` e confirmar falha esperada.
- [x] Implementar `obterDashboardCompartilhado`, autorizando pelo convidado e consultando métricas/aprendizagem com a identidade interna do proprietário. Não alterar os contratos de autorização pessoal.
- [x] Mapear apenas os dados consumidos pelos painéis: serializar datas e excluir sessões, descrições, materiais, evidências brutas, recomendações com dados privados e identificador interno do proprietário do retorno ao cliente. Consultar aprendizagem internamente não autoriza devolvê-la integralmente.
- [x] Implementar GET do dashboard e página autenticada; validar período pelo resolvedor existente. Respostas JSON usam `Cache-Control: no-store`; nenhuma resposta compartilhada entra em cache público.
- [x] Verificar acesso novamente após as consultas. Executar testes e comparar os indicadores do dashboard compartilhado com os mesmos cálculos do módulo pessoal.

## Tarefa 3 — IA com dados do proprietário e autorização do convidado

- [x] Escrever testes falhos com provedor mock que capture o DTO: dados do módulo correto, descrições vazias, cota do convidado, credencial global inalterada e ausência de mutação em estudos.
- [x] Adicionar teste em que o provedor aguarda uma promessa controlada, o acesso é revogado e, após a resposta do mock, o serviço nega entrega.
- [x] Executar `npm run testar -- src/servidor/ia/interpretacao-compartilhada.test.ts` e confirmar falha esperada.
- [x] Expor o executor de DTO autorizado no motor existente e implementar `gerarInterpretacaoCompartilhada`, sem reutilizar `gerarInterpretacaoModuloPessoal` como se o convidado fosse proprietário. Usar os indicadores calculados do módulo original e `descricoesSessoes: []`.
- [x] Implementar POST de interpretação com sessão, período validado, autorização inicial/final e `no-store`. Não persistir histórico ou aceitar métricas fornecidas pelo cliente.
- [x] Estender `InterpretacaoAutomatica` para o contexto compartilhado, preservando o padrão `compacto`/`modalLateral` do Dashboard principal. Em 403/404, limpar a resposta e avisar o contêiner por `aoPerderAcesso`.
- [x] Executar novos testes e os atuais de interpretação/contingência. Nenhuma chamada HTTP real à Groq é permitida durante a suíte.

## Tarefa 4 — Gerenciamento do proprietário e indicadores

- [x] Escrever testes falhos para abrir modal, gerar/consultar/copiar código, clipboard recusado, contador, remoção com confirmação/cancelamento, encerramento e reinício.
- [x] Executar `npm run testar -- src/componentes/compartilhamento-modulo.test.ts` e confirmar falha esperada.
- [x] Implementar rotas proprietárias: obter módulo por identificador e proprietário autenticado antes de operar por ID. Corpo não define proprietário. Usar os serviços da tarefa 1 e validar entradas com Zod.
- [x] Implementar modal com `dialog`, nomes exibidos na conta, estado ocupado/erro, foco restaurado, fechamento por Escape e confirmação das ações destrutivas. Quando clipboard falhar, conservar código selecionável e informar cópia manual.
- [x] Integrar no cabeçalho de módulos configurados, sem alterar rascunhos e editores. Acrescentar contagem ativa à consulta/listagem e selo somente se maior que zero.
- [x] Após alterações, atualizar modal e dados da rota; ao retornar/focar a listagem, obter contagem atual sem prometer atualização por WebSocket inexistente. Testar alterações sem perder os campos/ações atuais dos cards.

## Tarefa 5 — Abas e dashboard do convidado

- [x] Escrever testes falhos para as duas abas, foco/teclado, aparência equivalente ao CSS vigente de Módulo, formulário de código, mensagens, estado vazio e cards com nome do proprietário.
- [x] Executar `npm run testar -- src/app/salas/abas-salas.test.ts src/app/salas/modulos-compartilhados.test.ts` e confirmar falhas esperadas.
- [x] Implementar `AbasSalas` com composição do conteúdo existente de Salas, sem filtro de período nessa barra. Reproduzir as propriedades de `listaSubabas`/`botaoSubaba` vigentes, tokens, espaçamento 20px e borda ativa inferior; seguir a mesma navegação por teclado e parâmetro `aba` para retorno à aba correta.
- [x] Implementar adesão POST e cards que direcionem a `/salas/compartilhados/[moduloId]`; tratar já possui acesso como informação sem duplicar vínculo. Mensagens distinguem inválido/inativo, sem vaga e módulo próprio.
- [x] Montar dashboard somente com os painéis compartilháveis da tarefa 2 e modal de IA da tarefa 3. Mostrar nome do proprietário e aviso de leitura; excluir controles de edição/arquivos/gerenciamento de convidados.
- [x] O contêiner revalida acesso ao retornar foco/visibilidade e em novas consultas de período/IA. Ao detectar perda, limpa conteúdo e exibe aviso com retorno a Compartilhado comigo. Listagem é reconsultada ao retornar foco para remover cards revogados; não implementar polling contínuo ou nova infraestrutura.
- [x] Testar que falha de rede é distinguida de revogação, que dados de uma requisição antiga não reaparecem após perda de acesso e que filtros preservam a rota compartilhada.

## Tarefa 6 — Verificação integrada, migração local e entrega

- [x] Executar testes HTTP/serviços em ambiente isolado: usuário não autenticado, não convidado, leitura permitida, mutações pessoais negadas, tentativa de trocar módulo, códigos cruzados e IA revogada durante processamento.
- [x] Executar regressões atuais de Salas e módulos em ambiente sintético isolado; não rodar scripts que mutem o banco da avaliação sem isolamento.
- [x] Validar migração em banco temporário antes do banco local. Aplicar somente a nova migração aprovada no banco local pelo fluxo `npm run banco:migrar`, após conferir o controle de migrações; não executar reset. Gerar cliente com `npm run banco:gerar`.
- [x] Executar `npm run verificar-estilo`, `npm run verificar-tipos`, `npm run testar` e `npm run compilar`. Se houver falha, determinar se é nova ou preexistente e apresentar evidência. Não declarar aprovação sem conferir saída e código de retorno.
- [x] Conferir a interface no navegador: modal/cópia/confirmações, três convidados, recusa do quarto, remoção, abas iguais às de Módulo, cards, dashboard de leitura e bloqueio após revogação. Testar IA apenas com mocks; eventual contingência local deve ser identificada como tal.
- [x] Atualizar `AiFiles/Memoria/ACOMPANHAMENTO.md`, matriz e decisões de persistência/autorização; criar `AiFiles/RELATORIOS/IMPLEMENTACAO_COMPARTILHAMENTO_MODULOS.md` com resultados reais, arquivos, migração, limitações e roteiro curto de validação.
- [x] Revisar o diff para excluir mudanças não relacionadas; não incluir alterações antigas em commits. Entregar resumo e pendências reais ao usuário.

## Revisão do plano

Todos os requisitos do desenho têm tarefas correspondentes: códigos/capacidade/ciclo de vida (1), leitura segura e métricas (2), IA e revogação em voo (3), proprietário/cards (4), abas e convidado (5), regressão/migração/entrega (6). Não foi autorizada delegação; a execução direta nesta sessão é a recomendação, sujeita à revisão do usuário.
