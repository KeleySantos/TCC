# Dashboards da sala espelhados — Plano de implementação

> Atualização 2026-10-10: protocolo e execução atuais estão em PLANO_AJUSTES_TCC_2026_10_10.md e no relatório de ajustes. Confirmação manual foi removida definitivamente; os passos históricos abaixo não autorizam restaurá-la.
> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use `superpowers:executing-plans` para implementar este plano tarefa por tarefa. Os passos usam caixas (`- [x]`) para acompanhamento.

**Objetivo:** Espelhar o Dashboard do Módulo nos painéis individuais autorizados e o Dashboard Principal no agregado da sala.

**Arquitetura:** Uma composição compartilhada renderizará o Dashboard do Módulo no contexto pessoal e na Sala. O serviço de painéis da Sala produzirá DTOs sanitizados de aprendizagem individual e reutilizará o domínio `DashboardObservacional` para consolidar os membros autorizados no painel geral.

**Tecnologias:** Next.js 16, React 19, TypeScript, Prisma, Vitest e React DOM Server.

**Especificação:** `AiFiles/Planos/DESENHO_DASHBOARDS_SALA_ESPELHADOS.md`

## Restrições globais

- Considerar somente membros ativos com `compartilharDashboard: true`.
- Manter o mínimo de três contribuidores com sessão válida no agregado geral.
- Não expor materiais, arquivos, descrições de sessões ou registros brutos.
- Manter `permitirComparacao` e `permitirIa` como permissões independentes.
- Não usar evidências históricas anonimizadas nos novos painéis espelhados.
- Não renderizar “Consistência dos métodos entre módulos” nem “Base das análises” no dashboard geral da sala.
- Não criar uma interpretação geral da sala por IA nesta entrega.

## Foco da revisão

- Vínculo revogado entre a consulta da sala e a montagem do painel não pode continuar fornecendo dados.
- Sessão anterior a `dadosDesde` não pode entrar em nenhum cálculo do vínculo.
- Análise inexistente ou sem evidência válida deve produzir estado vazio, sem quebrar o dashboard.
- Um membro ligado a mais de um módulo da sala deve contribuir uma vez por sessão em cada escopo correto.
- O DTO retornado ao administrador não pode carregar campos privados por conveniência interna.

---

### Tarefa 1: Composição compartilhada do Dashboard do Módulo

**Arquivos:**
- Criar: `src/app/modulos/[identificador]/conteudo-dashboard-modulo.tsx`
- Criar: `src/app/modulos/[identificador]/conteudo-dashboard-modulo.test.tsx`
- Modificar: `src/app/modulos/[identificador]/page.tsx`

**Interfaces:**
- Produz: `ConteudoDashboardModulo({ metricas, aprendizagem, tituloModulo, idTitulo?, tituloPainel? })`.
- Consome os tipos de exibição já aceitos por `PainelMetricasSessoes` e as análises já aceitas pelos outros dois painéis.

- [x] Escrever um teste de renderização que forneça métricas e aprendizagem completas e exija os títulos dos cards, “Métodos × Resultados”, “Formatos × Resultados”, “Conceitos com maior dificuldade” e “Conceitos com maior compreensão”.
- [x] Executar `npm run testar -- src/app/modulos/[identificador]/conteudo-dashboard-modulo.test.tsx` e confirmar falha porque o componente não existe.
- [x] Implementar `ConteudoDashboardModulo` compondo os três painéis existentes sem recalcular dados.
- [x] Substituir a composição inline da página do módulo pelo novo componente.
- [x] Executar novamente o teste e confirmar aprovação.

### Tarefa 2: DTO sanitizado de aprendizagem individual da Sala

**Arquivos:**
- Criar: `src/servidor/aprendizagem-sala.ts`
- Criar: `src/servidor/aprendizagem-sala.test.ts`
- Modificar: `src/servidor/paineis-salas.ts`
- Modificar: `scripts/verificar-dashboards-salas.ts`

**Interfaces:**
- Produz: `obterResumoAprendizagemVinculoSala(usuarioId: string, moduloPessoalId: string, moduloSalaId: string, dadosDesde: Date | null): Promise<ResumoAprendizagemSala>`.
- `ResumoAprendizagemSala` contém somente `resumoResultados`, `metodosResultados`, `formatosResultados`, `conceitosMaiorDificuldade` e `conceitosMaiorCompreensao`.
- `obterDashboardsSalaDoProprietario` passa a incluir `aprendizagem` em cada item de `individuais`.

- [x] Escrever testes que provem o recorte por `dadosDesde`, o remapeamento para o módulo da sala e o estado vazio sem análises.
- [x] Escrever no verificador de Sala asserções de que o individual autorizado possui aprendizagem e não possui descrição de sessão, material, arquivo ou conteúdo bruto.
- [x] Executar os testes focados e confirmar as falhas esperadas.
- [x] Implementar o adaptador usando `obterAprendizagemModuloPessoal` e projetando somente os campos permitidos.
- [x] Integrar o resumo aos vínculos autorizados em `paineis-salas.ts`.
- [x] Executar `npm run testar -- src/servidor/aprendizagem-sala.test.ts` e `npm run testar:dashboards-salas` até ambos passarem.

### Tarefa 3: Dashboard observacional agregado da Sala

**Arquivos:**
- Criar: `src/dominio/analises/dashboard-sala.ts`
- Criar: `src/dominio/analises/dashboard-sala.test.ts`
- Modificar: `src/servidor/paineis-salas.ts`
- Modificar: `scripts/verificar-dashboards-salas.ts`

**Interfaces:**
- Produz: `calcularDashboardObservacionalSala(entrada: EntradaDashboardSala): DashboardObservacional`.
- `EntradaDashboardSala` recebe módulos da sala, sessões sanitizadas e análises consolidadas dos vínculos autorizados.
- `obterDashboardsSalaDoProprietario` passa a retornar `geral.dados` quando o mínimo de contribuidores for atingido.

- [x] Escrever testes com três membros autorizados distribuídos em dois módulos e exigir os mesmos quatro cards e séries de métodos, formatos e evolução do Dashboard Principal.
- [x] Acrescentar testes para membro não autorizado, sessão anterior a `dadosDesde`, sessão duplicada e ausência de evidência válida.
- [x] Executar `npm run testar -- src/dominio/analises/dashboard-sala.test.ts` e confirmar as falhas esperadas.
- [x] Implementar o adaptador para reutilizar `calcularDashboardObservacional`, sem duplicar seus cálculos.
- [x] Integrar o cálculo ao estado geral apenas quando houver três contribuidores válidos.
- [x] Atualizar o verificador de Sala para garantir que históricos anonimizados e vínculos não autorizados não alimentam o novo `geral.dados`.
- [x] Executar os dois testes focados até passarem.

### Tarefa 4: Renderização dos painéis espelhados na Sala

**Arquivos:**
- Criar: `src/app/salas/[identificador]/dashboard-geral-sala.tsx`
- Criar: `src/app/salas/[identificador]/dashboard-geral-sala.test.tsx`
- Modificar: `src/app/salas/[identificador]/page.tsx`
- Modificar: `src/app/salas/dashboard-sala.module.css`

**Interfaces:**
- Produz: `DashboardGeralSala({ dados, nomeSala })`, composto por `CartoesInsightsDashboard` e `GraficosDashboard`.
- Consome `ConteudoDashboardModulo` nos painéis individuais.

- [x] Escrever teste de `DashboardGeralSala` que exija os títulos dos cards e gráficos do Dashboard Principal e rejeite “Consistência dos métodos entre módulos” e “Base das análises”.
- [x] Executar o teste e confirmar falha porque o componente não existe.
- [x] Implementar `DashboardGeralSala` reutilizando os componentes existentes.
- [x] Trocar o painel geral antigo da página pelo novo componente quando `geral.dados` estiver disponível.
- [x] Trocar cada `PainelMetricasSessoes` individual por `ConteudoDashboardModulo`, preservando a IA apenas sob `permitirIa`.
- [x] Ajustar somente contêineres, espaçamento e responsividade necessários no CSS da Sala.
- [x] Executar o teste de renderização e `npm run testar:dashboards-salas` até passarem.

### Tarefa 5: Validação integral, documentação e execução local

**Arquivos:**
- Modificar: `AiFiles/Documentacao/DECISOES_ARQUITETURAIS.md`
- Modificar: `AiFiles/Documentacao/REGISTRO_DECISOES_PROJETO.md`
- Modificar: `AiFiles/INDICE.md` se exigido pelo protocolo documental.

**Interfaces:**
- Registra o contrato final de autorização, privacidade e reutilização dos dashboards.

- [x] Registrar a decisão de usar somente membros ativos autorizados e de não usar evidências históricas nos painéis espelhados.
- [x] Executar `npm run testar:dashboards-salas` e confirmar sucesso.
- [x] Executar `npm run testar` e confirmar toda a suíte aprovada.
- [x] Executar `npm run verificar:segredos`, `npm run verificar-estilo`, `npm run verificar-tipos` e `npm run compilar`, confirmando código zero em todos.
- [x] Reiniciar o servidor de desenvolvimento com `npm run desenvolver` e confirmar resposta HTTP 200 em `/salas` e na página de uma sala disponível.
- [x] Inspecionar visualmente o dashboard geral e pelo menos um dashboard individual autorizado em largura desktop e móvel.
