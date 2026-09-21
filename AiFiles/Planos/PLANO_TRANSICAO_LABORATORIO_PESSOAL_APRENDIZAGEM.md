# Plano de transição — Laboratório Pessoal de Aprendizagem

## 1. Identificação

| Campo | Valor |
|---|---|
| Data | 2026-09-09 |
| Estado | **ENTREGAS A E B CONCLUÍDAS E VALIDADAS LOCALMENTE; FASES 12 A 14 FORA DO CORTE** |
| Agente planejador | Cebolinha |
| Origem | `C:\Users\keley\Downloads\roadmap_tecnico_tcc_laboratorio_aprendizagem.md` |
| Natureza | Evolução faseada do MVP existente; não é construção a partir de repositório vazio |
| Escopo temporal | MVP demonstrável, incrementos MVP+ e evoluções posteriores |
| Autorização atual | Execução autorizada pelo autor com Guanabara; corte da banca: Entregas A e B |

### 1.1 Fontes consultadas

- planejamento, requisitos, arquitetura, modelo de dados e contratos canônicos em `AiFiles/Contexto/`;
- especificação científica, protocolo de medição, política de linguagem e checklist ético;
- acompanhamento, decisões, matriz de requisitos/testes e registro de riscos em `AiFiles/Memoria/`;
- `package.json`, `prisma/schema.prisma` e implementação atual em `src/`, `scripts/` e `prisma/`.

### 1.2 Regra de uso

Este plano descreve a transição proposta, mas a execução deve parar ao final da Fase 0 enquanto as decisões QD-01, QD-02 e QD-03 não estiverem aprovadas e refletidas nas fontes canônicas. A aprovação do plano não autoriza coleta de dados reais nem avaliação com participantes.

## 2. Objetivo verificável

Evoluir o artefato local existente para um laboratório pessoal no qual uma conta sintética consiga:

1. criar um módulo e seus tópicos;
2. cadastrar materiais simples;
3. registrar uma sessão de estudo com método e autoavaliação;
4. concluir uma avaliação objetiva;
5. obter métricas determinísticas contextualizadas por módulo e tópico;
6. visualizar dashboards por módulo e geral;
7. receber uma interpretação por Gemini com linguagem controlada e resposta local de contingência.
8. selecionar um método de estudo controlado e registrar desafios pessoais de experimentação;
9. acompanhar comparações contextuais desses desafios e o desempenho por nível de Bloom, sempre com amostra e limitação explícitas.

O resultado só é aceito quando o ciclo for reproduzível por seed, protegido no servidor, coberto por testes e demonstrável sem depender de dados reais ou da disponibilidade de serviço externo.

## 3. Escopo e cortes de entrega

### 3.1 Entrega A — MVP demonstrável

- conta sintética autenticada e área pessoal única, sem papéis;
- módulos, tópicos e materiais simples de texto ou link;
- sessões com cronômetro oficial, método, dificuldade percebida, compreensão percebida e observações;
- avaliações objetivas e taxa de acerto calculada no servidor;
- métricas determinísticas por módulo, tópico, formato e método;
- comparação entre percepção e resultado observado;
- dashboard do módulo e dashboard geral;
- interpretação por Gemini como camada opcional, validada e com resposta local de contingência;
- cenário sintético e roteiro de demonstração.

### 3.2 Entrega B — MVP+

- catálogo de métodos de estudo;
- desafios de experimentação;
- armazenamento do nível de Bloom e análise por nível cognitivo;
- atualização dinâmica do histórico quando novas evidências contradisserem padrões anteriores.

### 3.3 Entrega C — acompanhamento individual

- compartilhamento explícito de módulo;
- escopos de visibilidade, revogação e comentários do convidado;
- auditoria das ações sensíveis.

### 3.4 Entrega D — evolução posterior

Salas, membros, convites, agregados de sala, upload multimodal e análise de arquivos. Esses itens não integram o critério de conclusão do MVP e não devem atrasar a banca.

### 3.5 Fora do escopo

- dados de pessoas reais;
- login social, recuperação por e-mail ou implantação pública;
- aplicativo móvel nativo;
- ranking de estudantes;
- inferência causal, estilos fixos de aprendizagem ou diagnóstico;
- IA calculando métricas oficiais, corrigindo avaliações ou decidindo autorização;
- integrações com LMS ou sistemas institucionais.

## 4. Estado atual observado

| Área | Evidência atual | Consequência para a transição |
|---|---|---|
| Fundação | Next.js `16.3.3`, React `19.2.8`, TypeScript `5.9.3`, Prisma `7.10.0`, SQLite, Recharts, Zod e Vitest em `package.json` | Reutilizar a stack; não recriar o projeto |
| Dependências locais | `node_modules/next` e `node_modules/next/dist/docs/` não estavam disponíveis durante a inspeção | Restaurar dependências e consultar a documentação local antes de alterar Next.js |
| Identidade | `Usuario` possui `PapelUsuario`; há `PerfilAluno`, `PerfilProfessor`, `Turma` e `Matricula` | O modelo de conta do roadmap conflita com o vigente |
| Autenticação | Login local, senha sintética com hash e cookie HTTP-only | Preservar; não rebaixar a segurança atual |
| Conteúdo | `Topico`, `RecursoConteudo`, curadoria e página por tópico existem | Introduzir módulo e propriedade sem apagar conteúdo |
| Sessões | APIs calculam duração no servidor e invalidam menos de 5 minutos | Enriquecer; não aceitar duração oficial livre do cliente |
| Avaliações | Quiz objetivo, gabarito e nota no servidor | Reutilizar e ligar ao contexto aprovado |
| Analytics | Evidências por tópico/formato e recomendador `regras-base-v1` | Ampliar funções puras; não transferir cálculo para IA |
| Interface | Painéis de aluno, professor e administrador; gráfico com tabela | Migrar incrementalmente e preservar acessibilidade |
| Dados | Migração versionada e seed sintético reproduzível | Cada mudança exige nova migração, seed e verificador |
| Pendências | E2E, autorização granular de turma e auditoria completa por teclado/leitor de tela | Não declarar cobertura sem nova evidência |

### 4.1 Componentes reutilizáveis

- autenticação, autorização e senhas em `src/servidor/`;
- análises e recomendador em `src/dominio/`;
- APIs de sessões e tentativas;
- cronômetro, quiz e gráfico em `src/componentes/`;
- seed, migração e scripts de verificação;
- estilos e recursos de acessibilidade já implementados.

### 4.2 Limitações estruturais

- `Topico` é global e não pertence a módulo nem usuário;
- `RecursoConteudo` não possui conteúdo textual próprio nem propriedade individual;
- `SessaoEstudo` não registra método, percepção ou observação;
- `TentativaAvaliacao` não referencia explicitamente a sessão;
- consultas não agregam por módulo, método ou percepção;
- `src/app/aluno/topicos/[identificador]/page.tsx` consulta Prisma diretamente, divergindo da fronteira arquitetural;
- não há isolamento de provedor de IA, desafio, compartilhamento, sala ou upload.

## 5. Questões bloqueadoras e recomendação

### QD-01 — Modelo de conta e continuidade dos papéis

**Conflito:** o roadmap afirma que todas as pessoas possuem o mesmo tipo de conta; D-004/D-012, o escopo científico e o código preservam aluno, professor e administrador.

**Decisão aprovada:** substituir os papéis de aluno, professor e administrador por uma única conta pessoal. Módulos, sessões e avaliações passam a pertencer diretamente a `Usuario`. Perfis, turmas, curadoria, administração e suas rotas deixam o escopo do produto; as estruturas legadas só podem subsistir temporariamente para uma migração segura de dados sintéticos.

**Impacto registrado:** requisitos, objetivos científicos, arquitetura, modelo de dados, contratos, matriz e riscos foram atualizados na Fase 0. A migração de banco deve ser aditiva e nunca editar a migração já aplicada.

**Estado:** DECIDIDA PELO AUTOR EM 2026-09-12.

### QD-02 — Função da Gemini API

**Conflito:** o roadmap inclui Gemini; D-009 e o escopo vigente definem recomendador determinístico e adiam LLM.

**Decisão aprovada:** manter métricas e recomendação oficial em algoritmo local determinístico e versionado. Gemini recebe somente DTO sintético agregado para interpretar padrões observados, gerar feedbacks, conselhos e perguntas de reflexão. A saída é validada e filtrada pela política de linguagem; qualquer falha usa resposta local de contingência.

**Limites obrigatórios:** Gemini não calcula métricas, não altera notas, dados ou permissões, não recebe nomes, respostas, observações ou chaves de API, não sustenta afirmações causais e não é requisito de disponibilidade para a demonstração.

**Estado:** DECIDIDA PELO AUTOR EM 2026-09-12.

### QD-03 — Vínculo explícito entre sessão e avaliação

**Conflito:** o roadmap associa avaliação à sessão; o protocolo atual infere evidência por janela de sete dias e exclui exposição mista.

**Decisão aprovada:** adiar a referência explícita `sessaoId`. A associação analítica atual por mesma conta, tópico, sessão válida e janela temporal continua; não há mudança metodológica nem coluna nova nesta entrega.

**Estado:** ADIADA PELO AUTOR EM 2026-09-12.

### 5.1 Decisões já fixadas

- a duração oficial continua calculada no servidor;
- dados continuam exclusivamente sintéticos;
- domínio próprio permanece em português do Brasil;
- métricas oficiais são determinísticas, versionadas e testáveis;
- o MVP pode ser demonstrado sem IA externa;
- módulos e dados privados exigem propriedade direta da conta verificada no servidor;
- exclusão de conteúdo referenciado será lógica.
- o corte da banca inclui as Entregas A e B; Entregas C e D não serão implementadas neste ciclo.

## 6. Requisitos propostos e aceite

Os identificadores são provisórios. Na Fase 0, itens aprovados devem ser promovidos às fontes canônicas e à matriz de requisitos/testes.

| ID | Entrega | Requisito | Critério objetivo de aceite |
|---|---|---|---|
| RLP-001 | A | Área pessoal autenticada | Conta válida abre seu painel; não autenticado é redirecionado; dados alheios não são retornados |
| RLP-002 | A | CRUD de módulos | Proprietário cria, lista, edita, arquiva e abre módulo; outra conta recebe 404/403 sem vazamento |
| RLP-003 | A | Tópicos por módulo | Tópico é criado e listado somente dentro do módulo proprietário |
| RLP-004 | A | Materiais simples | Texto ou link possui título, descrição, formato e tópico; URL e tamanho são validados no servidor |
| RLP-005 | A | Sessão enriquecida | Registra recurso, método, início/fim oficiais, escalas de 1 a 5 e observação limitada |
| RLP-006 | A | Histórico | Histórico cronológico mostra estado e contexto sem expor outra conta |
| RLP-007 | A | Resultado objetivo | Servidor persiste total, acertos e nota de 0 a 100 sem expor gabarito antes do envio |
| RLP-008 | A | Analytics | Funções puras calculam contagem, médias, evolução, tempo, tentativas, método, formato e percepção versus resultado |
| RLP-009 | A | Dashboard do módulo | Cards e gráficos reagem aos dados e apresentam amostra, período, vazio e alternativa textual/tabular |
| RLP-010 | A | Dashboard geral | Agrega sem apagar origem e distingue padrão local de recorrência em mais de um módulo |
| RLP-011 | A | Interpretação | Estrutura válida contém contexto, amostra e limitação; falha externa produz resposta local |
| RLP-012 | B | Catálogo de métodos | Métodos ativos são selecionados de catálogo controlado |
| RLP-013 | B | Desafio | Usuário define método, módulo e meta; progresso usa somente sessões válidas |
| RLP-014 | B | Bloom | Questões recebem nível opcional; painel não conclui dificuldade sem amostra declarada |
| RLP-015 | C | Compartilhamento | Proprietário concede escopos; convidado vê somente permitido; revogação invalida acesso |
| RLP-016 | C | Comentário | Apenas convidado autorizado comenta e a ação fica auditável |
| RLP-017 | D | Salas | Administrador gerencia membros e módulos sem ampliar acesso individual |
| RLP-018 | D | Uploads | Tipo/tamanho são validados no servidor e acesso exige autorização |
| RLP-NF-001 | Todas | Reprodutibilidade | Banco limpo é migrado, populado e conferido por script determinístico |
| RLP-NF-002 | Todas | Qualidade | `npm run validar` termina com código zero |
| RLP-NF-003 | Todas | Acessibilidade | Fluxos críticos funcionam por teclado, em 360 px e com alternativa a gráficos |
| RLP-NF-004 | Todas | Privacidade | Seed, prompts e logs não contêm dados reais, chaves ou respostas completas |
| RLP-NF-005 | Todas | Explicabilidade | Conclusões apresentam contexto, período, quantidade, nível e limitação |

## 7. Impactos transversais

| Dimensão | Impacto previsto | Obrigação de controle |
|---|---|---|
| Interface | Novas rotas pessoais, formulários, cards e gráficos; rotas por papel serão retiradas do fluxo | Preservar navegação por teclado, estados explícitos, alternativa tabular e 360 px |
| Servidor | Novos casos de uso e ampliação das APIs de sessão/tentativa | Validar com Zod, obter ator do cookie e aplicar propriedade em toda operação |
| Domínio | Novas métricas por módulo, método, percepção e Bloom | Manter funções puras, unidade de análise e versão do algoritmo |
| Banco | Módulo, relações de propriedade e modelos incrementais | Usar migrações aditivas, índices por proprietário/contexto, seed e verificador |
| Segurança | CRUD pessoal amplia a superfície horizontal | Testar proprietário, terceira conta, sessão ausente e não enumeração de recursos |
| Privacidade | Perfil, observação, prompt de IA e upload aumentam risco de conteúdo real | Aceitar somente dados sintéticos; minimizar DTOs e logs; nunca enviar observação livre à IA |
| Acessibilidade | Mais formulários e visualizações | Manter foco, rótulos, anúncios, contraste e equivalência não visual |
| Desempenho | Dashboards agregam mais dimensões e o painel docente atual faz consultas repetidas por aluno | Agregar em lote, evitar N+1, criar índices e medir com o seed antes de otimizar |
| Testes | Matriz atual não cobre o novo produto | Promover RLPs, adicionar domínio/integração/interface e registrar pendências manuais |
| Seed | Cenário atual não possui módulos, métodos, percepção ou desafios | Criar perfis A–E e expectativas determinísticas sem apagar casos existentes antes da migração |
| Documentação | Escopo, ciência, protocolo, arquitetura e contratos entram em conflito com o roadmap | Resolver na Fase 0 e atualizar acompanhamento após cada fase |
| Operação | Gemini acrescenta chave, cota, tempo limite e indisponibilidade | Tornar opcional, sem chamada externa na validação automatizada e com resposta local |

## 8. Arquitetura alvo

```text
Páginas e componentes React
        ↓ DTOs
Ações/rotas Next.js: autenticação, Zod e autorização por propriedade
        ↓
Serviços: módulos, sessões, avaliações e compartilhamento
        ↓
Domínio puro: evidências, métricas, recomendação e linguagem
        ↓                         ↘
Prisma + SQLite                  Adaptador opcional de IA
        ↓                         ↓
Dados sintéticos                 JSON validado + resposta local
```

- páginas não consultam Prisma diretamente quando houver regra de negócio;
- APIs obtêm o usuário pelo cookie, nunca por `usuarioId` do cliente;
- serviços filtram por proprietário antes de ler ou escrever;
- IA recebe somente DTO agregado e sintético;
- chave de API não é persistida pela aplicação;
- falha externa não altera métricas, sessão, tentativa ou navegação;
- toda métrica informa versão do algoritmo.

## 9. Estratégia de dados

### 8.1 Sequência segura

1. Criar backup recuperável do banco sintético antes de cada migração de desenvolvimento.
2. Adicionar estruturas novas antes de remover ou tornar colunas obrigatórias.
3. Popular módulos e ligar tópicos atuais de forma determinística.
4. Migrar propriedade de dados sintéticos existentes para `Usuario` de modo determinístico, sem inventar proprietário; manter estruturas legadas somente até a migração estar conferida.
5. Conferir contagens, notas e relações antes de apertar restrições.
6. Recriar o banco do zero com todas as migrações e seed.
7. Não editar `prisma/migrations/20260830160000_init/migration.sql`.

### 8.2 Modelos por incremento

| Incremento | Alteração proposta |
|---|---|
| A | `ModuloAprendizagem`; propriedade direta por `Usuario`; tópicos e materiais aninhados; método/percepção em sessão; texto simples; sem vínculo direto de tentativa com sessão |
| B | `MetodoEstudo`, `DesafioExperimentacao`, vínculo ao desafio e nível de Bloom |
| C | `CompartilhamentoModulo`, escopos, `ComentarioCompartilhamento` e auditoria |
| D | `Sala`, `MembroSala`, vínculos de módulo e metadados de arquivo |

Nomes finais e chaves estrangeiras da Entrega A foram aprovados pela D-014. O executor cria somente migrações novas, aditivas e validadas sobre dados sintéticos.

### 8.3 Compatibilidade e recuperação

- migrações aceitam o cenário existente durante a transição;
- seed final é reproduzível por `banco:reiniciar`;
- falha de migração interrompe a fase; não excluir tabela manualmente para destravar;
- recuperação do ambiente demonstrativo usa apenas o script aprovado sobre banco sintético;
- qualquer dado não sintético interrompe a execução e aciona o checklist ético.

## 10. Fases ordenadas

## Fase 0 — Aprovar escopo e atualizar fontes

**Objetivo:** eliminar contradições antes do código. **Dependências:** nenhuma.

**Arquivos:** decisões, requisitos, planejamento técnico, especificação científica, protocolo, arquitetura, modelo de dados, contratos, matriz e riscos em `AiFiles/`.

**Passos:** obter respostas QD-01/QD-02 e validação QD-03; registrar escolhas e impactos; promover requisitos RLP aprovados; definir a entrega que encerra o escopo da banca; atualizar objetivos científicos se papéis ou IA mudarem.

**Validação:** `rg -n "AI Files|DECISÃO PENDENTE|QD-0" AiFiles AGENTS.md` e `git diff --check`.

**Saída:** CONCLUÍDA em 2026-09-12. D-014, D-015, D-016 e D-017 foram registradas; a matriz canônica contém os requisitos da Entrega A.

## Fase 1 — Restabelecer baseline e documentação da versão

**Objetivo:** provar que o estado anterior continua reproduzível. **Dependências:** F0.

**Passos:** executar `npm ci`; parar antes de alterar lock em caso de incompatibilidade; confirmar a versão em `node_modules/next/package.json`; ler guias aplicáveis em `node_modules/next/dist/docs/`; executar reset, verificador, integração e `npm run validar`; separar falhas preexistentes.

**Saída:** baseline registrado com versões, comandos e resultados; documentação Next.js local consultada.

## Fase 2 — Introduzir módulo e propriedade

**Objetivo:** criar a unidade central sem perda. **Dependências:** F1 e D-014.

**Arquivos:** `prisma/schema.prisma`, nova migração, `prisma/seed.ts`, verificador e modelo de dados.

**Passos:** adicionar `ModuloAprendizagem`; relacionar tópico de modo compatível; criar módulos determinísticos no seed; migrar tópicos; conferir órfãos antes da restrição final; manter `RecursoConteudo` como material canônico.

**Validações:** gerar cliente, resetar banco, conferir contagens/notas e executar testes/tipos.

**Saída:** todo tópico pertence a um módulo autorizado e o cenário anterior permanece calculável.

**Execução em 2026-09-12:** concluída. A migração `20260912190000_modulo_propriedade_pessoal` foi aplicada também a uma cópia recuperável do banco sintético anterior, sem violações de chave estrangeira, tópicos órfãos ou sessões sem proprietário direto. O reset cria cinco contas pessoais, cada qual com módulo e tópicos próprios; o verificador confirmou 15 tópicos, 15 materiais, 17 sessões válidas, uma inválida e as métricas de referência das contas A e C.

## Fase 3 — Área pessoal, perfil e navegação

**Objetivo:** oferecer a conta pessoal única sem enfraquecer a propriedade dos dados. **Dependências:** F2.

**Arquivos:** autenticação, autorização, consultas, páginas de entrada/layout; novos `src/app/dashboard/page.tsx`, redirecionamento legado em `src/app/painel/page.tsx`, `src/app/perfil/page.tsx` e ação de perfil.

**Passos:** retirar o roteamento e a autorização por papel do fluxo do produto; redirecionar a conta autenticada à área pessoal; validar nome, e-mail sintético opcional e troca de senha no servidor; exigir senha atual; preservar foco, atalho e 360 px.

**Validações:** credenciais, senha incorreta, acesso anônimo/horizontal, teclado e 360 px.

**Saída:** conta acessa painel pessoal sem obter dados de outra conta.

**Execução em 2026-09-12, com rota atualizada em 2026-09-13:** concluída. `UsuarioAtual` e autorização de API passaram a representar somente a conta autenticada; entrada, início e rotas legadas convergem para `/dashboard`, enquanto `/painel` redireciona por compatibilidade. Foram criados dashboard pessoal, perfil com validação de nome/e-mail sintético e troca de senha mediante senha atual. A validação local confirmou foco do atalho de conteúdo, largura de documento de 345 px em viewport de 360 px, páginas autenticadas e isolamento HTTP entre as contas A e B.

## Fase 4 — CRUD de módulos, tópicos e materiais

**Objetivo:** concluir “criar módulo → preparar estudo”. **Dependências:** F3.

**Arquivos novos:** `src/app/modulos/**`, `src/app/modulos/acoes.ts`, `src/servidor/modulos.ts` e testes. **Alterar:** consultas, schema/seed se necessário, estilos e contratos.

**Passos:** filtrar por proprietário; criar formulários com Zod; arquivar em vez de excluir conteúdo referenciado; cadastrar texto/link; validar URL, limites e pertencimento; retirar Prisma direto da página de tópico; implementar estados acessíveis.

**Validações:** serviços positivos/negativos, duas contas e `npm run validar`.

**Saída:** uma conta cria “JavaScript”, “Loops” e material; outra não acessa.

**Execução em 2026-09-12:** concluída. Foram criados serviços pessoais para módulo, tópico e material; todas as leituras e escritas filtram a conta autenticada no servidor. A migração `20260912200000_materiais_texto_pessoal` incluiu texto próprio opcional em materiais, sem substituir links HTTP(S) validados. Ações de servidor implementam criação, edição e arquivamento lógico; a página de módulo não consulta Prisma diretamente. O script de serviço comprovou CRUD e isolamento entre as contas A e B, e a página autenticada do módulo foi conferida no servidor local.

## Fase 5 — Sessões enriquecidas

**Objetivo:** registrar contexto e duração confiável. **Dependências:** F4.

**Arquivos:** schema/migração, APIs de sessões, cronômetro, `src/servidor/sessoes.ts`, histórico, contratos, seed e verificador.

**Passos:** adicionar método, escalas 1–5 e observação limitada; manter relógio oficial no servidor; validar compatibilidade/propriedade; impedir sessões simultâneas se aprovado; persistir autoavaliação ao concluir; listar histórico sem usar inválidas como evidência.

**Validações:** escalas inválidas, 401, acesso horizontal, sessão curta e válida.

**Saída:** sessões distintas aparecem em histórico com contexto completo.

**Execução em 2026-09-12:** concluída. A migração `20260912210000_sessoes_contextualizadas` acrescentou método, dificuldade percebida, compreensão percebida e observação limitada. O serviço calcula a duração no servidor, exige escalas de 1 a 5 ao encerrar e devolve 404 para sessão que não pertence à conta. O cronômetro coleta o método e a autoavaliação, e `/historico` lista sessões próprias válidas e inválidas com seus contextos.

## Fase 6 — Avaliações, tentativas e Bloom armazenável

**Objetivo:** registrar medida objetiva no contexto de módulo e tópico. **Dependências:** F5.

**Arquivos:** schema/migração, API de tentativas, quiz, protocolo, seed, verificador, contratos e testes.

**Passos:** validar proprietário, tópico, módulo e tempo; derivar número de tentativa no servidor; manter gabarito e nota no servidor; não criar `sessaoId`; rejeitar avaliações e respostas inválidas.

**Validações:** notas 0/intermediária/100, total zero, vínculo incompatível e exposição mista.

**Saída:** sessão produz resultado rastreável sem quebrar evidências existentes.

**Execução em 2026-09-12:** concluída. A migração `20260912220000_tentativas_contextualizadas` adicionou `numeroTentativa` sequencial por conta e avaliação, além de nível de Bloom opcional em cada questão. O serviço de tentativas calcula a nota exclusivamente no servidor, grava respostas e rejeita respostas inválidas ou avaliações de outra conta; não cria vínculo direto com sessão. A verificação automatizada confirmou notas 0%, intermediária e 100%, total zero, sequência e isolamento entre contas.

## Fase 7 — Motor ampliado de Learning Analytics

**Objetivo:** produzir métricas oficiais antes da interface/IA. **Dependências:** F6.

**Arquivos:** alterar `src/dominio/analises/evidencias.ts`; criar `metricas-modulo.ts`, teste e DTOs; dividir consultas por contexto.

**Passos:** calcular acerto por módulo/tópico; evolução com amostra; tempo; desempenho por método/formato; tentativas; percepção versus nota; recorrência somente em dois ou mais módulos; versionar e ordenar resultados.

**Validações:** perfis A–E, vazio, uma observação, exposição mista, empate, contradição e módulos diferentes.

**Saída:** seed produz métricas esperadas sem IA, Prisma ou React nas funções puras.

**Execução em 2026-09-12:** concluída. O motor puro versionado `metricas-oficiais-v2` calcula acerto, média, evolução, tempo válido, desempenho contextual por formato e método, percepção versus resultado e métricas por tópico. Exposição mista não é atribuída a formato ou método; recorrência só é emitida quando o mesmo contexto aparece em dois ou mais módulos. Testes de domínio cobriram vazio, amostra única, empate, contradição, exposição mista e recorrência; o verificador confirmou os perfis sintéticos A–E.

## Fase 8 — Dashboard do módulo

**Objetivo:** responder “como estou aprendendo este assunto?”. **Dependências:** F7.

**Arquivos:** criar `src/componentes/grafico-evolucao.tsx`, `grafico-desempenho-contextual.tsx`, `grafico-percepcao-resultado.tsx` e componentes de indicadores; alterar `src/app/modulos/[identificador]/page.tsx`, `src/servidor/consultas.ts`, formatação e estilos.

**Passos:** cards de acerto/tempo/tópico/método; gráficos de evolução, tópico, método/formato e percepção; amostra/período/limite; estado insuficiente; tabela/descrição equivalente.

**Validações:** zero/uma/muitas observações, 360 px, teclado, contraste e atualização após novos dados.

**Saída:** dados alteram cards/gráficos previsivelmente e sem causalidade.

**Execução em 2026-09-12:** concluída. O painel de módulo usa exclusivamente o motor oficial e apresenta taxa de acerto, tempo válido, evolução, última nota, desempenho por formato e método, percepção versus resultado e uma tabela por tópico. Cada gráfico possui texto alternativo e tabela equivalente; ausência, amostra única e exposição mista têm estados explícitos. Sessões e tentativas concluídas acionam atualização do painel sem que identificadores internos sejam expostos na interface.

## Fase 9 — Dashboard geral e histórico dinâmico

**Objetivo:** agregar preservando origem. **Dependências:** F8.

**Arquivos:** alterar `src/app/dashboard/page.tsx`; manter `src/app/painel/page.tsx` como redirecionamento; criar ou extrair `src/servidor/paineis.ts` e componentes de frequência/recorrência; alterar navegação e testes de interface.

**Passos:** módulos ativos, frequência, evolução e métodos usados; separar local/recorrente; informar observações e atualização; recalcular com contradições; não persistir rótulo fixo.

**Validações:** perfil B não generaliza programação; perfil E muda após nova evidência.

**Saída:** usuário distingue padrões locais de recorrências.

**Execução em 2026-09-12:** concluída. O painel geral mostra frequência, tempo válido e resultados por módulo sem perder a origem. Recorrências de formato ou método são calculadas somente quando há exposição única em pelo menos dois módulos; com um módulo, a interface mostra explicitamente que não há base para generalização. O histórico passou a ordenar sessões e avaliações da própria conta em uma única linha do tempo contextual.

## Fase 10 — IA interpretativa opcional

**Objetivo:** interpretação profunda e segura sem terceirizar cálculo. **Dependências:** F9 e D-015.

**Arquivos novos propostos:** `src/servidor/ia/provedor-interpretacoes.ts`, `gemini.ts`, `src/dominio/interpretacoes/esquema.ts`, `resposta-local.ts`, testes e endpoint/ação definidos após ler docs Next.js. Alterar `.env.example`, painel, contratos, riscos e README; nunca versionar `.env` real.

**Passos:** consultar documentação oficial atual da Gemini; registrar SDK/modelo; enviar DTO agregado sem nomes/respostas/observações; solicitar padrões observados, feedbacks, conselhos e perguntas de reflexão; validar JSON, contexto e linguagem; aplicar tempo limite, cota e resposta local; registrar metadados mínimos se persistir; identificar interpretação automática na interface.

**Validações:** sucesso, JSON inválido, timeout, 401/429/500, ausência de chave, texto proibido e painel sem provedor.

**Saída:** remover rede/chave apenas ativa a resposta local.

**Execução em 2026-09-12:** concluída. Após consulta à documentação oficial atual da Gemini, o adaptador usa `generateContent` com saída JSON estruturada, tempo limite de sete segundos e modelo configurável (`gemini-2.5-flash` por padrão). Ele recebe somente um DTO agregado sem nome, resposta, observação livre ou identificador interno. Schema, política de linguagem, cota local e contingência impedem que configuração ausente, cota, timeout, falha HTTP ou resposta inválida interrompam o painel; nesses casos é retornada uma interpretação local baseada nas mesmas métricas oficiais.

## Fase 11 — Métodos, desafios e analytics de Bloom

**Objetivo:** Entrega B. **Dependências:** F9; IA não é dependência.

**Arquivos:** alterar schema e criar migração; alterar seed e verificador; criar `src/servidor/desafios.ts`, `src/dominio/analises/comparar-desafio.ts`, testes, páginas/ações de desafio e gráfico/tabela de Bloom.

**Passos:** seed de Feynman, recuperação ativa, repetição espaçada, Pomodoro, interleaving e prática distribuída; desafio com módulo/método/meta; vínculo explícito; comparação com contexto; Bloom somente com questões classificadas e amostra.

**Validações:** três sessões, inválida não conta, cancelamento preserva histórico, Bloom ausente não vira zero.

**Saída:** CONCLUÍDA E VALIDADA LOCALMENTE em 2026-09-15. O catálogo de seis métodos foi integrado sem remover a leitura dos valores históricos; desafios pessoais podem ser criados, vinculados opcionalmente a sessões compatíveis e cancelados sem apagar o histórico. As comparações usam apenas evidências únicas do mesmo módulo e método, exigem duas evidências por grupo e não expressam causalidade. A análise de Bloom usa exclusivamente respostas classificadas e não converte falta de amostra em zero. Reset, cenário sintético, testes de domínio/serviço/integração, tipos, lint e build de produção passaram.

**Integração visual em 2026-09-15:** concluída pelo Araki. A rota `/desafios` passou a apresentar o catálogo controlado, criação, estados e comparação contextual em uma composição responsiva própria, mantendo ações e DTOs do Guanabara. O painel Bloom foi destacado com gráfico, resumo de amostra e tabela equivalente que conserva níveis insuficientes sem taxa. Teclado, foco, alternativas tabulares, viewport de 320 px, lint, tipos, 35 testes e build foram validados.

**Revisão de produto aprovada em 2026-09-15:** o método passa a ser o núcleo da jornada. Desafio escrito pelo usuário e lista de desafios criados deixam o fluxo ativo; recomendações da IA tornam-se orientações opcionais apresentadas no modal do método. “Testar este método” deve iniciar uma experimentação em um ou mais módulos, com ou sem orientação selecionada, e expor o estado `EXPERIMENTANDO`. A implementação de backend está especificada em `HANDOFF_GUANABARA_EXPERIMENTACAO_GUIADA_METODOS.md`; o fluxo atual permanece provisoriamente ativo até a migração e a integração posterior do Araki.

## Fase 12 — Compartilhamento e comentários

**Objetivo atualizado:** fundação de compartilhamento seguro das salas, sem conceder acesso ao conteúdo dos módulos pessoais. **Dependências:** F9 e escopos aprovados.

**Arquivos:** schema e migração; `src/servidor/salas.ts`; fundação funcional sob `src/app/salas/`; testes de autorização; contratos, modelo de dados e auditoria. A especificação executável está em `FASE_12_FUNDACAO_COMPARTILHAMENTO_SALAS.md`.

**Passos atualizados:** convite por código/link com aprovação; vínculo entre módulo-pai e instância pessoal; consentimentos separados para comparação e IA; revogação imediata; comentários do proprietário para sala, módulo ou membro; auditoria sem conteúdo excessivo.

**Validações:** proprietário/convidado/terceiro, escopo parcial, revogação e não enumeração de contas.

**Saída:** o proprietário recebe somente o dashboard autorizado da instância do membro; nunca recebe materiais ou sessões. Revogação encerra o acesso individual e preserva o módulo pessoal.

**Execução em 2026-09-20:** concluída conforme `FASE_12_FUNDACAO_COMPARTILHAMENTO_SALAS.md`. A fundação funcional de `/salas` cobre criação, convite, aprovação, módulo-pai, instância, consentimentos, comentários, saída, remoção, arquivamento e exclusão lógica. Os dashboards agregados pertencem à Fase 13.

## Fase 13 — Salas colaborativas

**Objetivo:** Entrega D após compartilhamento. **Dependências:** F12.

**Arquivos:** schema e migração de evidências históricas; `src/servidor/paineis-salas.ts`; extensão segura de `src/servidor/salas.ts`; dashboards sob `src/app/salas/`; rota de interpretação consentida; testes de autorização e privacidade. A especificação executável está em `FASE_13_DASHBOARDS_SALAS.md`.

**Passos atualizados:** reutilizar métricas oficiais das sessões; exigir três contribuidores para agregados; expor dashboard individual somente ao proprietário enquanto o vínculo estiver ativo; comparar apenas consentidos e sem ranking; condicionar IA a consentimento separado; preservar somente evidências históricas pseudonimizadas no desligamento.

**Validações:** administrador/membro/terceiro, remoção, revogação e grupo pequeno.

**Saída:** sala não amplia permissões individuais.

**Execução em 2026-09-20:** concluída conforme `FASE_13_DASHBOARDS_SALAS.md`. A página da sala entrega os três níveis de dashboard, comparação optativa e IA consentida. Desvínculo, saída e remoção encerram o acesso individual, preservam o módulo pessoal e mantêm no agregado somente campos analíticos pseudonimizados, sem duplicidade na reativação.

## Fase 14 — Uploads e análise posterior

**Objetivo atualizado:** análise automática e segura de materiais sem tornar o upload dependente da IA. **Dependências:** F4, F7 e F13.

**Arquivos:** schema e migração de `AnaliseMaterial`; extração em `src/servidor/extracao-materiais.ts`; processamento em `src/servidor/analises-materiais.ts`; adaptador em `src/servidor/ia/analise-materiais.ts`; rotas, interface, testes, contratos e README. A especificação executável está em `FASE_14_ANALISE_AUTOMATICA_MATERIAIS.md`.

**Passos atualizados:** preservar o upload seguro já entregue; extrair texto localmente de PDF/TXT/DOCX/CSV/XLSX e imagens; analisar automaticamente em etapa separada; persistir conceitos e resultado compacto; comparar conceitos com descrições; substituir e excluir com limpeza compensatória. Áudio e vídeo permanecem fora da análise.

**Validações:** tipo/tamanho, nome malicioso, ausente, acesso horizontal e órfãos.

**Saída:** arquivo é recuperado somente por autorizado, não executa como código e alimenta um painel de conceitos sem persistir o texto integral.

**Execução em 2026-09-21:** concluída conforme `FASE_14_ANALISE_AUTOMATICA_MATERIAIS.md`. Upload compatível inicia análise separada, falhas não removem o material, conceitos alimentam comparação observacional e substituição/exclusão controlam o ciclo físico do arquivo.

## Fase 15 — Cenário, robustez, documentação e banca

**Objetivo:** fechar o corte autorizado. **Dependências:** fases do corte escolhido.

**Passos:** perfis sintéticos A–E; dois/três módulos completos; jornada módulo → sessão → resultado → dashboard → interpretação/resposta local; expectativas automatizadas; autorização/acessibilidade/responsividade/falha de IA; revisão de linguagem; README e rastreabilidade.

**Validações:** `npm run banco:reiniciar`, `npm run banco:verificar-cenario`, `npm run testar:integracao`, `npm run validar`, 360 px, teclado e demo sem IA.

**Saída:** corte reproduzível em máquina limpa e sem requisito sem evidência.

**Execução em 2026-09-12:** concluída para a Entrega A. O banco foi recriado e verificado com cinco migrações; os serviços, métricas, APIs e painéis foram validados. Lint, tipos, 18 testes unitários, integração HTTP e build de produção passaram. Em 360 px, a entrada ficou em 345 px sem rolagem horizontal e o atalho de conteúdo recebeu o primeiro foco por teclado. A documentação, o README, a matriz e o relatório técnico foram atualizados. Em 2026-09-15, o autor ampliou o corte para incluir a Entrega B; a Fase 11 foi implementada e validada com a sexta migração, cenário de desafios e Bloom, 35 testes, integração HTTP e build de produção. Fases 12 a 14 continuam fora do corte.

## 11. Estratégia de testes

| Camada | Casos | Evidência |
|---|---|---|
| Domínio | fórmulas, ausência, amostra, exposição mista, contradição e módulo | Vitest determinístico |
| Serviço | propriedade, vínculos, estados e transações | banco isolado/script controlado |
| API/ação | 400, 401, 403/404, sucesso e idempotência aplicável | integração |
| Interface | vazio, erro, processamento, teclado e alternativa de gráfico | componente e auditoria |
| Banco | migração, reset, seed e contagens | scripts/verificador |
| IA | schema, tempo limite, cota, linguagem e resposta local | adaptador falso; chamada real fora da integração contínua |
| Compartilhamento | matriz de atores e revogação | integração de autorização |

Nenhum teste depende de chave externa, relógio real não controlado ou ordem não determinística. Capturas são evidência complementar, não substituem asserções.

## 12. Riscos e respostas

| ID | Risco/gatilho | Prevenção | Contingência/parada |
|---|---|---|---|
| RP-01 | Migração de papéis legados deixa rota, dado ou permissão incoerente | Migração aditiva, remoção do fluxo por papel e testes de propriedade | Parar a fase e corrigir a nova migração/rota |
| RP-02 | Migração perde registros | Aditiva, backup e contagens | Restaurar banco sintético; corrigir migração nova |
| RP-03 | IA inventa causalidade/dado | DTO, schema, política e resposta local | Descartar saída |
| RP-04 | Serviço externo falha na banca | IA opcional | Desabilitar sem afetar dashboard |
| RP-05 | Generalização entre módulos | Agrupar com contexto/amostra | Mostrar somente local |
| RP-06 | Duração manipulada | Relógio do servidor | Invalidar conflito |
| RP-07 | Compartilhamento vaza dados | Escopo e autorização em toda consulta | Revogar e auditar |
| RP-08 | Escopo atrasa banca | Cortes A–D | Encerrar após A |
| RP-09 | Docs/dependências Next ausentes | Restaurar pelo lock | Parar F1; não presumir API |
| RP-10 | Dados reais em perfil/prompt/upload | Validação e revisão | Interromper e acionar processo ético |

## 13. Instruções ao executor

1. Não implementar antes da saída da Fase 0.
2. Executar fases em ordem; F10 e F11 estão autorizadas; F12–F14 só podem iniciar com nova autorização explícita.
3. Ler `AGENTS.md`, diretrizes e fontes indicadas pelo índice.
4. Antes de Next.js, restaurar dependência e ler `node_modules/next/dist/docs/`.
5. Não alterar lock, instalar SDK de IA ou framework E2E sem decisão registrada.
6. Não aceitar do cliente `usuarioId`, nota, duração, papel ou permissão como verdade.
7. Não acessar Prisma em componentes; mover regra/consulta para serviço testável.
8. Não editar migração usada; criar e validar nova migração.
9. Não usar dados reais, chaves versionadas ou conteúdo livre em prompt externo.
10. Parar quando escolha mudar arquitetura, dados, autorização, método, privacidade ou comportamento.
11. Após cada fase, validar e atualizar acompanhamento, matriz, decisões, riscos e documentação.
12. Não marcar conclusão com teste pendente sem limitação e aceite explícitos.

## 14. Checklist de rastreabilidade

| Roadmap | Fase | Evidência | Corte |
|---|---|---|---|
| Conta/navegação | F3 | autenticação, autorização, teclado, 360 px | A |
| Módulos/tópicos/materiais | F2/F4 | CRUD e isolamento | A |
| Sessões | F5 | integração, duração, histórico | A |
| Resultados | F6 | correção e limites | A |
| Analytics | F7 | testes-ouro A–E | A |
| Dashboard módulo | F8 | valores, vazio e tabela | A |
| Dashboard geral | F9 | local versus recorrente | A |
| IA | F10 | schema, linguagem, tempo limite e resposta local | A |
| Métodos/desafios/Bloom | F11 | progresso e amostra | B |
| Compartilhamento/comentários | F12 | autorização/revogação | C |
| Salas | F13 | membros/escopos/agregados | D |
| Uploads | F14 | tipo/tamanho/autorização | D |
| Dados/polimento | F15 | reset, verificador, validação e roteiro | Todos |

## 15. Condição para retirar o bloqueio

O estado passou para **APROVADO PARA EXECUÇÃO** em 2026-09-12 porque:

- D-014, D-015 e D-016 têm respostas registradas;
- o corte da banca é a Entrega A;
- requisitos, decisões, protocolo e matriz foram atualizados na Fase 0;
- Guanabara foi selecionado explicitamente como agente executor e recebeu autorização de execução;
- o baseline da Fase 1 foi reproduzido com Node.js 22.23.2 e `better-sqlite3` 12.x; reset, cenário, lint, tipos, testes unitários e build passaram. A integração legada falha apenas na expectativa de papel de professor, que será substituída pela autorização por propriedade da Entrega A.
