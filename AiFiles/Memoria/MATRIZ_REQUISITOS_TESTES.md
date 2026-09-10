# Matriz de requisitos e testes

| ID | Requisito | Prioridade | Critério de aceite | Teste previsto | Estado |
|---|---|---|---|---|---|
| RF-001 | Aluno consulta tópicos e materiais | Must | Dado um aluno autenticado, quando abre o catálogo, então vê somente tópicos ativos e materiais elegíveis | E2E catálogo do aluno | IMPLEMENTADO; E2E PENDENTE |
| RF-002 | Aluno registra sessão de estudo | Must | Dado um material, quando o aluno inicia e encerra estudo válido, então uma sessão é persistida | Integração de sessão | IMPLEMENTADO; TESTE PENDENTE |
| RF-003 | Aluno realiza quiz | Must | Dada uma tentativa válida, quando enviada, então o servidor calcula nota entre 0 e 100 | Unitário + integração de tentativa | IMPLEMENTADO; TESTE DE INTEGRAÇÃO PENDENTE |
| RF-004 | Sistema calcula evidências por tópico/formato | Must | Dadas sessões e tentativas compatíveis, quando o cálculo é solicitado, então retorna contagem, média e nível de evidência | Unitário analytics | IMPLEMENTADO; TESTE-OURO PENDENTE |
| RF-005 | Sistema recomenda de forma explicável | Must | Dado contexto com/sem evidência, quando consultado, então retorna sugestão, justificativa e limitação | Unitário recomendador | IMPLEMENTADO; CENÁRIOS AVANÇADOS PENDENTES |
| RF-006 | Aluno consulta painel pessoal | Must | Dado aluno autenticado, quando abre painel, então vê métricas próprias e estados vazios corretos | E2E painel aluno | IMPLEMENTADO; E2E PENDENTE |
| RF-007 | Professor consulta turma vinculada | Must | Dado professor vinculado, quando abre painel, então vê agregados e não acessa turma alheia | Integração autorização + E2E | IMPLEMENTADO; AUTORIZAÇÃO GRANULAR PENDENTE |
| RF-008 | Professor aprova material | Should | Dado professor vinculado, quando aprova recurso, então selo é persistido e recurso pode ser priorizado | Integração curadoria | IMPLEMENTADO; TESTE PENDENTE |
| RF-009 | Usuário entra com credenciais e recebe a área correta | Must | Dadas credenciais sintéticas válidas, quando enviadas, então o servidor identifica o papel e redireciona para sua área | Unitário de senha + inspeção local da interface | IMPLEMENTADO; integração de submissão pendente |
| RF-010 | Administrador cadastra professor | Must | Dado administrador autenticado, quando envia nome, usuário e senha válidos, então cria conta de professor com perfil correspondente e auditoria | Integração de ação do servidor | IMPLEMENTADO; teste de integração pendente |
| RNF-001 | Interface responsiva e acessível | Must | Fluxos críticos utilizáveis por teclado e em viewport móvel | Auditoria manual + componentes | PARCIAL: foco visível, atalho para o conteúdo principal, hierarquia semântica, alternativa tabular para gráfico e entrada validada em 360 px sem rolagem horizontal; auditoria completa pendente |
| RNF-002 | Isolamento de acesso | Must | Tentativa de ler dados de outro usuário é rejeitada no servidor | Integração autorização | PARCIAL: verificação de integração confirma 401 sem sessão, 403 para professor e 404 quando Bruno tenta encerrar sessão de Ana; cobertura específica de vínculo entre turmas permanece pendente |
| RNF-003 | Reprodutibilidade | Must | Banco limpo migra e recebe cenário sintético com resultados esperados | Migração + seed + verificador de cenário | CONCLUÍDO: `banco:reiniciar` e `banco:verificar-cenario` passaram em ambiente limpo |
