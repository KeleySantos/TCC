# Plano de implementação da reorganização do módulo em sub-abas

> Atualização 2026-10-10: protocolo e execução atuais estão em PLANO_AJUSTES_TCC_2026_10_10.md e no relatório de ajustes. Confirmação manual foi removida definitivamente; os passos históricos abaixo não autorizam restaurá-la.
> **Para agentes executores:** SUB-SKILL OBRIGATÓRIO: usar `superpowers:executing-plans` para executar este plano tarefa por tarefa. As etapas usam caixas de seleção para acompanhamento.

**Objetivo:** reorganizar a página do módulo em três sub-abas internas, consolidar resultados por métodos e formatos e apresentar rankings explicáveis de conceitos.

**Arquitetura:** a página de servidor continuará carregando e autorizando todos os dados do módulo. Um componente cliente controlará somente a sub-aba visível, mantendo o cabeçalho montado. As novas regras ficarão em funções puras do domínio e serão entregues à interface por um DTO do serviço existente.

**Stack:** TypeScript estrito, Next.js 16 App Router, React, Recharts, Prisma, SQLite e Vitest.

**Especificação:** `AiFiles/Planos/DESENHO_REORGANIZACAO_MODULO_SUBABAS.md`

## Restrições globais

- Manter uma única página em `/modulos/[identificador]`; as três áreas são sub-abas internas.
- Preservar o cabeçalho do módulo durante a troca de sub-aba.
- Usar somente sessões válidas e evidências válidas e não futuras.
- Não afirmar causalidade entre método, formato e resultado.
- Não inventar dados para completar rankings ou resultados.
- Manter regras analíticas fora dos componentes React.
- Reutilizar ações, consultas e componentes operacionais atuais.
- Não alterar o schema ou criar migração: os vínculos necessários já existem.
- Preservar todas as alterações não commitadas existentes; não criar commits sem pedido explícito.
- Deixar o servidor iniciado ao final da implementação.

## Foco da revisão

- Uma evidência posterior sem conceito em comum não pode ser associada apenas pela ordem temporal.
- Um vínculo explícito deve relacionar a evidência à sessão mesmo quando a associação textual de conceito estiver ausente.
- A mesma evidência alcançada por várias sessões não pode ser contada mais de uma vez no mesmo método ou formato.
- Conceitos fora da janela de 90 dias ou com menos de duas observações não podem entrar nos rankings.
- Troca de sub-aba por mouse ou teclado não pode desmontar o cabeçalho nem provocar rolagem horizontal na página.

---

### Tarefa 1: Consolidar as análises de contexto e os rankings no domínio

**Arquivos:**

- Modificar: `src/dominio/analises/aprendizagem-modulo.ts`
- Modificar: `src/dominio/analises/aprendizagem-modulo.test.ts`

**Interfaces:**

- Consome: `SessaoAprendizagemModulo`, `EvidenciaAprendizagemModulo` e catálogo de conceitos existentes.
- Produz: `ResultadoContextoAprendizagem`, `ClassificacaoConceitoAprendizagem` e os campos `metodosResultados`, `formatosResultados`, `conceitosMaiorDificuldade` e `conceitosMaiorCompreensao` no retorno de `analisarAprendizagemModulo`.
- Ampliar `EvidenciaAprendizagemModulo` com `sessaoIdsExplicitos: string[]`.

- [x] **Etapa 1: escrever testes inicialmente falhos para resultados consolidados**

Adicionar casos que comprovem, para método e formato:

- média de compreensão percebida;
- média e quantidade de evidências posteriores;
- quantidade de sessões e compreensões;
- deduplicação de evidência;
- associação por vínculo explícito;
- rejeição de associação baseada somente em data;
- janela máxima inclusiva de 30 dias;
- evidência pendente ou futura excluída.

- [x] **Etapa 2: executar o teste e confirmar a falha**

Executar: `npm run testar -- aprendizagem-modulo`

Resultado esperado: falha porque os novos campos e regras ainda não existem.

- [x] **Etapa 3: implementar o agregador compartilhado**

Criar `agruparResultadosPorContexto<T extends string>(sessoes, evidencias, selecionar): ResultadoContextoAprendizagem<T>[]`.

Cada resultado deve expor:

- `chave`;
- `quantidadeSessoes`;
- `quantidadeCompreensoes`;
- `compreensaoMedia`;
- `quantidadeEvidenciasPosteriores`;
- `desempenhoMedioPosterior`;
- `amostraEvidenciasSuficiente`.

- [x] **Etapa 4: escrever testes inicialmente falhos para rankings de conceitos**

Cobrir:

- fórmula de dificuldade;
- fórmula de compreensão;
- janela de 90 dias;
- máximo de cinco resultados;
- mínimo de duas observações;
- conceito apenas com percepções e mensagem de evidência insuficiente;
- desempate por recência, quantidade de observações e nome;
- estado vazio sem classificação artificial.

- [x] **Etapa 5: implementar as classificações de conceitos**

Criar constantes centralizadas:

- `JANELA_CONCEITOS_DIAS = 90`;
- `LIMITE_CONCEITOS_DESTAQUE = 5`;
- `MINIMO_OBSERVACOES_CONCEITO = 2`.

Implementar a normalização `((média - 1) / 4) × 100`, as duas médias de sinais descritas na especificação e o desempate determinístico.

- [x] **Etapa 6: executar os testes do domínio**

Executar: `npm run testar -- aprendizagem-modulo`

Resultado esperado: todos os testes do arquivo aprovados.

### Tarefa 2: Adaptar o serviço e o contrato entregue à interface

**Arquivos:**

- Modificar: `src/servidor/aprendizagem-modulo.ts`
- Modificar: `src/servidor/aprendizagem-modulo.test.ts`
- Modificar, se o contrato analítico utilizado exigir: `src/servidor/ia/interpretacoes.ts`
- Modificar, se aplicável: `src/servidor/ia/interpretacoes.test.ts`

**Interfaces:**

- Consome: retorno ampliado de `analisarAprendizagemModulo` da Tarefa 1.
- Produz: DTO de aprendizagem com resultados consolidados, rankings, linha do tempo e evidências pendentes.

- [x] **Etapa 1: escrever testes inicialmente falhos para montagem do DTO**

Com mocks do Prisma, verificar que:

- `vinculosSessoes.sessionId` chega como `sessaoIdsExplicitos`;
- somente conceitos pertencentes ao módulo são resolvidos;
- datas futuras não entram nas análises;
- a linha do tempo mantém os tipos de evento existentes;
- evidências válidas ficam disponíveis automaticamente.

- [x] **Etapa 2: executar os testes e confirmar a falha**

Executar: `npm run testar -- servidor/aprendizagem-modulo servidor/ia/interpretacoes`

- [x] **Etapa 3: ampliar a consulta Prisma e montar o novo DTO**

Selecionar `vinculosSessoes: { select: { sessaoId: true } }` nas evidências e passá-los ao domínio. Preservar a consulta única do módulo e a autorização por `usuarioId`.

- [x] **Etapa 4: manter compatibilidade da interpretação da IA**

Atualizar apenas os campos consumidos pela IA que forem afetados pela consolidação. A IA continuará recebendo dados confirmados, agregados e sem identificadores ou conteúdo bruto.

- [x] **Etapa 5: executar os testes do serviço e da IA**

Executar: `npm run testar -- servidor/aprendizagem-modulo servidor/ia/interpretacoes`

Resultado esperado: testes aprovados.

### Tarefa 3: Criar a navegação acessível por sub-abas

**Arquivos:**

- Criar: `src/app/modulos/[identificador]/subabas-modulo.tsx`
- Criar: `src/app/modulos/[identificador]/subabas-modulo.test.ts`
- Modificar: `src/app/modulos/[identificador]/page.module.css`

**Interfaces:**

- Consome: propriedades `dashboard`, `linhaDoTempo` e `sessoesMateriais` do tipo `ReactNode`.
- Produz: `SubabasModulo`, com Dashboard ativo inicialmente.

- [x] **Etapa 1: escrever teste inicialmente falho da estrutura semântica**

Verificar no HTML inicial:

- `role="tablist"`;
- três botões com `role="tab"`;
- Dashboard com `aria-selected="true"`;
- painéis relacionados por `aria-controls` e `aria-labelledby`;
- cabeçalho ausente do componente, pois continuará sob responsabilidade da página.

- [x] **Etapa 2: executar o teste e confirmar a falha**

Executar: `npm run testar -- subabas-modulo`

- [x] **Etapa 3: implementar `SubabasModulo`**

Usar estado local, teclas `ArrowLeft`, `ArrowRight`, `Home` e `End`, foco na aba selecionada e painéis ocultos com o atributo `hidden`. Não usar navegação de rota nem `router.push`.

- [x] **Etapa 4: implementar estilos funcionais**

Adicionar barra de sub-abas com rolagem horizontal contida em telas estreitas, foco visível e indicação da seleção sem depender somente de cor.

- [x] **Etapa 5: executar o teste do componente**

Executar: `npm run testar -- subabas-modulo`

Resultado esperado: teste aprovado.

### Tarefa 4: Dividir o painel de aprendizagem por responsabilidade

**Arquivos:**

- Criar: `src/app/modulos/[identificador]/painel-resultados-contextuais.tsx`
- Criar: `src/app/modulos/[identificador]/painel-resultados-contextuais.test.ts`
- Criar: `src/app/modulos/[identificador]/painel-conceitos-destaque.tsx`
- Criar: `src/app/modulos/[identificador]/painel-conceitos-destaque.test.ts`
- Criar: `src/app/modulos/[identificador]/painel-linha-tempo-modulo.tsx`
- Criar: `src/app/modulos/[identificador]/painel-linha-tempo-modulo.test.ts`
- Criar: `src/app/modulos/[identificador]/painel-confirmacao-evidencias.tsx`
- Criar: `src/app/modulos/[identificador]/painel-confirmacao-evidencias.test.ts`
- Remover ao final: `src/app/modulos/[identificador]/painel-aprendizagem-modulo.tsx`
- Remover ao final: `src/app/modulos/[identificador]/painel-aprendizagem-modulo.test.ts`
- Modificar: `src/app/modulos/[identificador]/page.module.css`

**Interfaces:**

- Consome: partes focadas do DTO produzido na Tarefa 2.
- Produz: quatro componentes independentes, destinados às sub-abas corretas.

- [x] **Etapa 1: escrever testes inicialmente falhos dos resultados contextuais**

Verificar que Métodos × Resultados e Formatos × Resultados apresentam conjuntamente compreensão, desempenho posterior, sessões, evidências e limitação não causal. Cobrir estados sem percepção, sem evidência e amostra insuficiente.

- [x] **Etapa 2: implementar `PainelResultadosContextuais`**

Reutilizar os formatadores de método e formato. Usar a mesma estrutura de visualização para os dois contextos, sem duplicar regra de cálculo no componente.

- [x] **Etapa 3: escrever testes inicialmente falhos dos rankings**

Verificar máximo de cinco itens, métricas explicativas, texto “Evidências ainda insuficientes” e estado vazio.

- [x] **Etapa 4: implementar `PainelConceitosDestaque`**

Exibir dois cartões compactos. Não mostrar o índice interno como se fosse uma medida científica; mostrar dificuldade, compreensão, desempenho e base que explicam a ordenação.

- [x] **Etapa 5: escrever e implementar o teste da linha do tempo**

Verificar ordem recebida, data, tipo, título, resumo, conceitos e estado vazio. Extrair a marcação existente sem recalcular eventos na interface.

- [x] **Etapa 6: escrever e implementar o teste do registro automático de evidências**

Preservar data, desempenho, conceitos gerais, conceitos por questão, tipo, resultado, pontuações, confirmação e rejeição.

- [x] **Etapa 7: remover o painel antigo e seus trechos redundantes**

Excluir as visualizações independentes Percepção × Evidência, Evolução por conceito e Padrões observados da interface. Manter cálculos ainda consumidos pela IA ou pelos rankings.

- [x] **Etapa 8: executar os testes dos quatro componentes**

Executar: `npm run testar -- painel-resultados-contextuais painel-conceitos-destaque painel-linha-tempo-modulo painel-confirmacao-evidencias`

Resultado esperado: testes aprovados.

### Tarefa 5: Remover métodos e formatos duplicados do painel de métricas

**Arquivos:**

- Modificar: `src/app/modulos/[identificador]/painel-metricas-sessoes.tsx`
- Modificar: `src/app/modulos/[identificador]/painel-metricas-sessoes.test.ts`
- Modificar: `src/app/modulos/[identificador]/painel-metricas-sessoes.module.css`

**Interfaces:**

- Consome: `MetricasSessoesExibicao` atual.
- Produz: painel restrito à visão geral, evolução temporal, dificuldade × compreensão e regularidade.

- [x] **Etapa 1: atualizar o teste para rejeitar visualizações duplicadas**

O teste deve confirmar que o componente não contém Métodos × Resultados nem Formatos × Resultados e continua exibindo evolução, percepções e regularidade.

- [x] **Etapa 2: executar o teste e confirmar a falha**

Executar: `npm run testar -- painel-metricas-sessoes`

- [x] **Etapa 3: remover `GraficoContexto` e estilos sem uso**

Não remover `porMetodo` e `porFormato` do contrato geral se ainda forem usados fora deste componente.

- [x] **Etapa 4: executar o teste do painel**

Executar: `npm run testar -- painel-metricas-sessoes`

Resultado esperado: teste aprovado.

### Tarefa 6: Compor a página com cabeçalho persistente e áreas exclusivas

**Arquivos:**

- Criar: `src/app/modulos/[identificador]/painel-materiais-modulo.tsx`
- Modificar: `src/app/modulos/[identificador]/page.tsx`
- Modificar: `src/app/modulos/[identificador]/page.module.css`
- Criar ou modificar teste de composição em `src/app/modulos/[identificador]/page.test.ts`

**Interfaces:**

- Consome: componentes das Tarefas 3 a 5 e dados carregados atualmente por `PaginaModulo`.
- Produz: página única com cabeçalho seguido por `SubabasModulo`.

- [x] **Etapa 1: escrever teste inicialmente falho da composição**

Verificar que:

- o cabeçalho fica fora de `SubabasModulo`;
- Dashboard recebe métricas, resultados contextuais, rankings e IA;
- Linha do tempo recebe somente a trajetória;
- Sessões e Materiais recebe sessões, biblioteca e registro automático de evidências;
- cada título analítico aparece em apenas uma área.

- [x] **Etapa 2: executar o teste e confirmar a falha**

Executar: `npm run testar -- app/modulos/[identificador]/page`

- [x] **Etapa 3: extrair `PainelMateriaisModulo` sem alterar comportamento**

Mover do `page.tsx` a biblioteca, formulários, arquivos, cronômetro e ações atuais. Manter ações de servidor, autorização e URLs existentes.

- [x] **Etapa 4: compor as três sub-abas**

Colocar `ProcessadorAnalisesPendentes` e o cabeçalho fora das sub-abas. Montar as áreas conforme a especificação e remover a grade lateral global anterior.

- [x] **Etapa 5: executar testes de composição e regressão**

Executar: `npm run testar -- app/modulos painel-metricas-sessoes`

Resultado esperado: testes aprovados.

### Tarefa 7: Atualizar rastreabilidade e validar o fluxo completo

**Arquivos:**

- Modificar: `AiFiles/Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`
- Modificar: `AiFiles/Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`
- Modificar: `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- Modificar: `AiFiles/Memoria/DECISOES_DO_PROJETO.md`
- Modificar: `AiFiles/Memoria/ACOMPANHAMENTO.md`
- Modificar, se surgir risco novo: `AiFiles/Memoria/REGISTRO_DE_RISCOS.md`

**Interfaces:**

- Consome: implementação concluída nas tarefas anteriores.
- Produz: documentação coerente e evidência final de validação.

- [x] **Etapa 1: documentar contratos e fórmulas**

Registrar janela de 30 dias, vínculos explícitos, deduplicação, janela de 90 dias, fórmulas dos rankings, mínimos de amostra e linguagem não causal.

- [x] **Etapa 2: atualizar matriz e acompanhamento**

Relacionar cada requisito aos testes correspondentes e registrar arquivos, comandos e resultados reais.

- [x] **Etapa 3: executar a validação completa**

Executar: `npm run validar`

Resultado esperado: verificação de segredos, lint, tipos, todos os testes e build aprovados.

- [x] **Etapa 4: validar o cenário sintético**

Executar: `npm run banco:verificar-diego`

Resultado esperado: cenário rico permanece íntegro e reproduzível.

- [x] **Etapa 5: iniciar o site**

Executar: `npm run desenvolver`

Resultado esperado: aplicação disponível em `http://localhost:3000`.

- [x] **Etapa 6: validar no navegador**

Com a conta sintética Diego Alves, verificar:

- cabeçalho persistente ao trocar sub-abas;
- conteúdo exclusivo de cada área;
- operação por mouse e teclado;
- rankings e resultados contextuais com dados reais do cenário;
- estados vazios em módulo sem dados;
- registro de evidência e formulários operacionais visíveis na sub-aba correta;
- viewport de 390 px sem rolagem horizontal;
- console sem erros ou alertas relacionados.

- [x] **Etapa 7: executar verificação final de diferenças**

Executar: `git diff --check`

Resultado esperado: nenhuma falha de whitespace; avisos de conversão LF/CRLF podem ser registrados sem alterar arquivos em massa.

## Autorrevisão do plano

- Cobertura da especificação: requisitos 1 a 17 distribuídos entre as Tarefas 1 a 7.
- Consistência de tipos: domínio produz os campos consumidos pelo serviço e pelos quatro componentes focados.
- Ausência de mudança de banco: `VinculoEvidenciaSessao` já existe e será apenas consultado.
- Responsabilidades separadas: domínio calcula, serviço autoriza e monta DTO, interface apresenta, componente cliente controla visibilidade.
- Escopo preservado: nenhuma página externa ao módulo precisa ser reformulada.
