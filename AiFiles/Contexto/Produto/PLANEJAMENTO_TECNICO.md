# Planejamento técnico — Plataforma de Learning Analytics

> Documento de planejamento para execução assistida por IA. Este arquivo não contém implementação do projeto.

## 1. Controle do documento

| Campo | Valor |
|---|---|
| Projeto | Plataforma educacional de Learning Analytics com foco no estudante |
| Tipo | Planejamento técnico executável por fases |
| Stack inicialmente definida | TypeScript, Next.js, React, Tailwind CSS, Recharts, SQLite e Prisma |
| Estado | Planejamento inicial; decisões marcadas como pendentes precisam ser validadas |
| Fonte conceitual | Contexto fornecido pelo autor do TCC em 30/08/2026 |
| Regra de execução | Não iniciar uma fase sem satisfazer as entradas e os critérios de saída da fase anterior |

### 1.1 Objetivo deste documento

Orientar a construção futura da plataforma de ponta a ponta, sem depender de inferências livres da IA executora. O plano descreve decisões, tarefas, artefatos, verificações e pontos de aprovação. Ele deve ser atualizado durante a execução, mas toda alteração de escopo precisa ser registrada.

### 1.2 Regra para arquivos auxiliares da IA

Todo arquivo de planejamento, acompanhamento, relatório temporário, anotações, inventários, prompts, decisões provisórias e resultados de auditoria que não pertença ao produto deve ficar em `AiFiles/`.

Estrutura recomendada para esses arquivos:

A estrutura vigente e as regras para novos arquivos estão em `../../INDICE.md`. Esse índice deve permanecer curto e apontar para instruções, contexto, memória, agentes e relatórios sem duplicar seus conteúdos.

Não criar esses arquivos adicionais antes de serem necessários. Arquivos reais do produto — código, testes, documentação pública, migrações, assets e configurações — devem permanecer na estrutura normal do projeto.

### 1.3 Como a IA executora deve trabalhar

Para cada tarefa futura:

1. Ler `../../INDICE.md` e carregar este planejamento apenas quando a tarefa envolver roadmap, fase ou escopo; consultar também `../../Memoria/ACOMPANHAMENTO.md` e os arquivos citados na fase atual.
2. Confirmar que as dependências da tarefa estão concluídas.
3. Inspecionar o estado real do repositório antes de alterar qualquer arquivo.
4. Implementar somente o escopo descrito na tarefa.
5. Executar as validações indicadas.
6. Corrigir falhas antes de prosseguir.
7. Atualizar o acompanhamento com data, arquivos alterados, comandos executados, resultados, decisões e pendências.
8. Não declarar uma fase concluída enquanto algum critério de saída estiver sem evidência.

Se houver ambiguidade que altere comportamento, dados coletados, metodologia científica, privacidade ou escopo do MVP, interromper a tarefa e registrar uma decisão pendente; não escolher silenciosamente.

## 2. Visão do produto e limites conceituais

### 2.1 Resultado pretendido

A plataforma deve registrar evidências do processo de estudo, transformar eventos em indicadores compreensíveis e ajudar o aluno a responder: “quais estratégias apresentaram melhores resultados para mim até agora neste conteúdo e contexto?”. O professor terá visão complementar para orientação, intervenção e curadoria.

Fluxo conceitual obrigatório:

```text
Estudar → Medir → Analisar → Recomendar → Avaliar novamente
```

### 2.2 Princípios inegociáveis

- Não classificar estudantes em estilos de aprendizagem fixos.
- Não afirmar causalidade quando os dados mostrarem apenas associação temporal ou correlação.
- Contextualizar toda conclusão por aluno, tópico, formato, período e quantidade de evidências.
- Exibir incerteza e informar quando não houver dados suficientes.
- Permitir que novas observações alterem conclusões anteriores.
- Não confundir preferência declarada com efetividade observada.
- Separar dado bruto, métrica derivada, insight e recomendação.
- Explicar de forma simples por que uma recomendação foi apresentada.
- Minimizar coleta de dados pessoais e respeitar finalidade, transparência e controle de acesso.
- Tratar métricas como apoio à decisão, nunca como diagnóstico clínico, capacidade fixa ou julgamento definitivo do aluno.

### 2.3 Fora do escopo inicial recomendado

Até que a Fase 2 aprove algo diferente, considerar fora do MVP:

- substituição de Moodle, Google Classroom ou outro LMS;
- geração automática de vídeos, PDFs, podcasts ou mapas mentais;
- integração real com serviços institucionais;
- coleta passiva invasiva de navegação, webcam, áudio ou biometria;
- aplicativo móvel nativo;
- recomendação baseada em redes neurais, LLM ou perfil psicológico;
- chat entre usuários, gamificação extensa ou rede social;
- criação de provas complexas, proctoring ou correção discursiva automática;
- análise causal ou experimento adaptativo automatizado sem protocolo acadêmico aprovado;
- implantação multi-institucional e escala de produção.

## 3. Escopo funcional de referência

Este é um ponto de partida a validar na Fase 2, não uma decisão científica já aprovada.

### 3.1 Perfil aluno

- entrar em uma conta de demonstração ou conta local;
- visualizar tópicos e materiais disponíveis;
- abrir um material identificado por formato;
- iniciar e encerrar uma sessão de estudo;
- registrar o tempo de estudo de modo transparente;
- responder a quizzes objetivos associados a tópico e material;
- visualizar desempenho, evolução e histórico por tópico;
- comparar formatos apenas quando houver evidências minimamente comparáveis;
- receber recomendações explicáveis;
- informar se uma recomendação foi útil, sem tratar esse feedback como prova de aprendizagem.

### 3.2 Perfil professor

- visualizar resumo da turma e indicadores por tópico;
- identificar alunos/tópicos que atendam a regras transparentes de atenção;
- inspecionar dados agregados e, quando autorizado, dados individuais;
- cadastrar ou recomendar materiais;
- aprovar/rejeitar materiais candidatos e atribuir selo de recomendação;
- visualizar justificativa e nível de evidência das recomendações.

### 3.3 Administração mínima

Usar seed e rotinas locais para dados de demonstração. O MVP inclui um painel administrativo local e sintético, restrito ao cadastro de professores; ele não administra alunos, turmas ou dados reais.

## 4. Arquitetura de referência

### 4.1 Forma recomendada

Monólito modular em Next.js, com interface React, operações de servidor no mesmo projeto, Prisma para persistência e SQLite local. Essa forma reduz complexidade operacional e atende ao caráter acadêmico, preservando separação interna suficiente para testes.

### 4.2 Camadas lógicas

```text
Interface (páginas e componentes)
        ↓
Casos de uso / serviços de aplicação
        ↓
Domínio (regras, métricas, recomendação)
        ↓
Repositórios / Prisma
        ↓
SQLite
```

Regras:

- componentes visuais não consultam Prisma diretamente;
- cálculos analíticos não ficam dentro de componentes React;
- regras de autorização são verificadas no servidor;
- funções puras devem concentrar fórmulas e classificação de evidência;
- datas são persistidas em UTC e apresentadas no fuso do usuário;
- duração oficial vem de eventos válidos da sessão, não de valor livre enviado pelo cliente;
- respostas da interface recebem DTOs, não entidades Prisma indiscriminadamente.

### 4.3 Estrutura de produto sugerida

```text
src/
├── app/
│   ├── (public)/
│   ├── (student)/
│   ├── (teacher)/
│   └── api/
├── components/
│   ├── ui/
│   ├── charts/
│   └── domain/
├── features/
│   ├── auth/
│   ├── content/
│   ├── study-sessions/
│   ├── assessments/
│   ├── analytics/
│   ├── recommendations/
│   └── teacher-curation/
├── server/
│   ├── db/
│   ├── repositories/
│   └── services/
├── domain/
│   ├── analytics/
│   ├── recommendations/
│   └── shared/
├── lib/
├── types/
└── test/
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
docs/
```

Não criar diretórios vazios. Criar cada parte quando a fase correspondente começar.

## 5. Modelo conceitual de dados

O modelo definitivo será validado nas Fases 4 e 5. Entidades mínimas sugeridas:

| Entidade | Finalidade | Campos conceituais essenciais |
|---|---|---|
| Usuário | identidade e autorização | id, nome, nome de usuário normalizado, hash de senha, papel e timestamps |
| StudentProfile | dados acadêmicos mínimos | userId, identificador pseudônimo, turmaId |
| TeacherProfile | vínculo docente | userId |
| Class | agrupamento para painel docente | id, nome, período, status |
| Enrollment | vínculo usuário-turma | studentId, classId, data, status |
| Topic | unidade de análise | id, nome, descrição, parentId opcional, status |
| ContentResource | material estudado | id, título, formato, URL/caminho, duração estimada, tópico, origem, status |
| ResourceApproval | curadoria docente | resourceId, teacherId, decisão, observação, timestamp |
| StudySession | exposição a material | id, aluno, recurso, tópico, início, fim, duração válida, status |
| Assessment | instrumento avaliativo | id, título, tópico, regra de pontuação, status |
| Question | item objetivo | assessmentId, enunciado, alternativas, resposta correta, peso |
| AssessmentAttempt | tentativa avaliativa | aluno, avaliação, tópico, início, fim, acertos, total, nota normalizada |
| QuestionResponse | rastreabilidade da tentativa | attemptId, questionId, resposta, correto, pontos |
| LearningEvidence | ligação analítica | aluno, tópico, recurso/sessão, tentativa posterior, janela temporal, validade |
| MetricSnapshot | resultado derivado reproduzível | escopo, período, versão do cálculo, valor, timestamp |
| Recommendation | sugestão emitida | aluno, tópico, formato/recurso, motivo, confiança, status, validade |
| RecommendationFeedback | reação do estudante | recommendationId, ação, utilidade declarada, timestamp |
| AuditEvent | ações sensíveis | ator, ação, alvo, metadados mínimos, timestamp |

### 5.1 Enumerações iniciais

- `PapelUsuario`: `ALUNO`, `PROFESSOR` e `ADMINISTRADOR`.
- `ContentFormat`: `VIDEO`, `PDF`, `TEXT`, `MIND_MAP`, `PODCAST`, `QUIZ`, `PRACTICAL_EXERCISE`.
- `SessionStatus`: `ACTIVE`, `COMPLETED`, `ABANDONED`, `INVALIDATED`.
- `RecommendationStatus`: `PENDING`, `VIEWED`, `ACCEPTED`, `DISMISSED`, `EXPIRED`.
- `EvidenceLevel`: `INSUFFICIENT`, `INITIAL`, `MODERATE`, `STRONG`.
- `ApprovalStatus`: `PENDING`, `APPROVED`, `REJECTED`.

### 5.2 Invariantes de dados

- Nota normalizada deve ficar entre 0 e 100.
- Taxa de acerto deve ficar entre 0 e 1 ou entre 0 e 100, nunca alternar; a decisão deve ser registrada.
- Duração não pode ser negativa e deve possuir limite superior para detecção de sessão esquecida.
- Uma tentativa concluída não pode ter mais respostas corretas do que questões válidas.
- Evidência precisa referenciar uma sessão anterior e uma avaliação compatível com o mesmo tópico.
- Dados derivados precisam registrar versão do algoritmo para permitir reprodução.
- Exclusão lógica é preferível para conteúdo já referenciado por evidências.
- Um professor só acessa turmas às quais esteja vinculado.
- Um aluno só acessa seus próprios dados detalhados.

## 6. Especificação analítica inicial

### 6.1 Unidade de análise

A menor unidade comparável recomendada é a combinação:

```text
aluno + tópico + formato de conteúdo + janela temporal
```

O recurso específico também deve ser preservado para rastreabilidade. Não agregar tópicos não equivalentes sem justificativa metodológica.

### 6.2 Métricas primárias

- `scoreNormalized`: pontuação da tentativa em escala de 0 a 100.
- `accuracyRate`: respostas corretas / respostas válidas.
- `studyDurationMinutes`: duração válida da sessão.
- `attemptCount`: número de tentativas comparáveis.
- `scoreDelta`: nota atual menos nota anterior comparável no mesmo tópico.
- `topicProgress`: diferença entre uma linha de base e a média recente, com regra temporal explícita.
- `formatMeanScore`: média das notas posteriores a exposições a um formato no mesmo tópico.
- `formatEvidenceCount`: quantidade de pares sessão-avaliação válidos.
- `recencyWeight`: peso opcional que reduz a influência de dados antigos; usar apenas após aprovação metodológica.

### 6.3 Regras de comparabilidade

Uma sessão e uma tentativa só formam evidência quando:

- pertencem ao mesmo aluno e tópico;
- a sessão terminou antes do início da avaliação;
- a avaliação ocorreu dentro da janela definida na Fase 3;
- a sessão atingiu duração mínima válida;
- a tentativa está concluída e não invalidada;
- não existe duplicação do mesmo vínculo;
- a dificuldade da avaliação é equivalente ou explicitamente controlada.

Se mais de um material foi usado antes da mesma avaliação, não atribuir automaticamente o resultado a um único formato. Marcar o caso como exposição mista ou aplicar regra metodológica aprovada.

### 6.4 Nível de evidência proposto

Os limiares abaixo são hipóteses e precisam de validação metodológica:

| Nível | Condição mínima sugerida | Linguagem permitida |
|---|---|---|
| Insuficiente | 0–1 evidência válida | “Ainda não há dados suficientes.” |
| Inicial | 2 evidências válidas | “Os primeiros resultados sugerem...” |
| Moderada | 3–4 evidências válidas e resultado consistente | “Até o momento, este formato está associado a...” |
| Forte | 5+ evidências válidas, consistentes e comparáveis | “Nos dados observados neste tópico e período...” |

Mesmo no nível forte, não usar “comprovou”, “causou” ou “este aluno aprende melhor por”.

### 6.5 Motor de recomendação explicável — baseline

Implementar primeiro um sistema determinístico por regras, não machine learning:

1. Receber aluno e tópico.
2. Buscar evidências válidas dentro da janela aprovada.
3. Agrupar por formato.
4. Calcular contagem, média, dispersão e recência por grupo.
5. Classificar o nível de evidência.
6. Se não houver evidência suficiente, recomendar exploração de formato ainda não testado ou pouco testado.
7. Se houver dificuldade recente, priorizar recurso aprovado pelo professor em formato alternativo.
8. Se um formato possuir resultado consistentemente melhor, priorizá-lo sem excluir alternativas.
9. Impedir repetição excessiva da mesma recomendação.
10. Salvar versão da regra, dados resumidos usados e texto explicativo.

Desempates recomendados: selo do professor, aderência ao tópico, formato menos explorado e ordem estável por identificador. Nunca usar ordenação aleatória sem semente, pois prejudica reprodutibilidade.

### 6.6 Contratos de explicabilidade

Toda recomendação precisa conseguir responder:

- O que está sendo sugerido?
- Para qual tópico?
- Com base em quantas observações?
- Qual período foi analisado?
- Qual resultado foi observado?
- Qual é o nível de evidência?
- Qual limitação deve ser conhecida?
- O material tem curadoria docente?

Exemplo de texto aceitável:

> Em 3 sessões recentes sobre Loops, atividades práticas foram seguidas por média de 78%, contra 61% após PDFs. Esta é uma evidência moderada e representa apenas os dados observados até agora. Experimente este exercício aprovado pelo professor e avalie novamente seu desempenho.

## 7. Estratégia de testes e qualidade

### 7.1 Pirâmide de testes

- Testes unitários: fórmulas, validadores, regras de recomendação, autorização e transformações.
- Testes de integração: Prisma + SQLite de teste, repositórios, transações e rotas/ações do servidor.
- Testes de componentes: estados vazios, erro, carregamento, conteúdo e acessibilidade.
- Testes ponta a ponta: jornadas críticas de aluno e professor.
- Testes exploratórios: responsividade, legibilidade dos gráficos e entendimento das mensagens.

### 7.2 Casos obrigatórios do motor analítico

- zero dados;
- apenas uma evidência;
- empate entre formatos;
- melhora real no conjunto sintético;
- resultado contraditório;
- exposição mista;
- sessão inválida;
- avaliação fora da janela;
- nota fora da faixa;
- mudança de tópico;
- dado antigo fora do recorte;
- recomendação repetida;
- conteúdo rejeitado pelo professor;
- algoritmo em versão anterior;
- tentativa de acesso de outro aluno ou professor sem vínculo.

### 7.3 Critério global de pronto

Uma funcionalidade só está pronta quando:

- cumpre o requisito rastreável;
- possui tratamento de loading, vazio, sucesso e erro;
- possui validação no cliente apenas para UX e validação obrigatória no servidor;
- aplica autorização no servidor;
- possui testes proporcionais ao risco;
- não introduz erro de lint, tipos, build ou testes;
- funciona nos breakpoints acordados;
- usa linguagem não determinista e não estigmatizante;
- atualiza documentação pública quando necessário;
- não inclui segredos, dados pessoais reais ou arquivos auxiliares fora de `AiFiles/`.

## 8. Fases de execução

---

## Fase 0 — Governança, inventário e rastreabilidade

### Objetivo

Preparar os controles que impedem perda de contexto, alterações silenciosas de escopo e arquivos auxiliares espalhados pelo projeto.

### Entradas

- este planejamento;
- repositório disponível;
- contexto conceitual do TCC.

### Tarefas

#### F0.1 — Inspecionar o repositório

1. Listar arquivos normais e ocultos.
2. Identificar `AGENTS.md`, README, configurações, lockfile, código existente e alterações não commitadas.
3. Registrar no acompanhamento o estado inicial, sem modificar arquivos do usuário.
4. Se já houver implementação, mapear o que corresponde ou conflita com este plano.

#### F0.2 — Criar controles auxiliares

Criar dentro de `AiFiles/Memoria/`:

- `ACOMPANHAMENTO.md`: tabela com fase, tarefa, estado, evidência, data e observações;
- `DECISOES_DO_PROJETO.md`: identificador, pergunta, impacto, opções, recomendação, responsável e decisão;
- `REGISTRO_DE_RISCOS.md`: probabilidade, impacto, mitigação, gatilho e responsável;
- `MATRIZ_REQUISITOS_TESTES.md`: requisito, origem, prioridade, caso de teste e situação.

#### F0.3 — Definir convenções

Registrar no repositório, em local de documentação apropriado:

- padrão de nomes e imports;
- convenção de commits, se houver Git;
- política de branches, se aplicável;
- comandos oficiais de instalação, desenvolvimento, validação e seed;
- versão suportada de Node e gerenciador de pacotes;
- política de variáveis de ambiente;
- idioma da interface e idioma do código.

### Validações

- nenhum recurso destinado à IA está fora de `AiFiles/`, exceto adaptadores obrigatórios de descoberta;
- toda decisão ainda desconhecida possui identificador;
- não houve alteração funcional.

### Critério de saída

Inventário registrado, controles criados e convenções aprovadas.

---

## Fase 1 — Delimitação científica e ética

### Objetivo

Transformar a proposta conceitual em limites mensuráveis e linguagem cientificamente defensável.

### Tarefas

#### F1.1 — Formular problema, objetivo e perguntas

Produzir uma página de especificação com:

- problema central;
- objetivo geral;
- objetivos específicos;
- perguntas de pesquisa;
- hipóteses, apenas se o método do TCC exigir;
- contribuições esperadas;
- população e contexto de uso pretendidos;
- limitações conhecidas.

Separar claramente avaliação do software, avaliação de usabilidade e avaliação do possível efeito pedagógico.

#### F1.2 — Definir terminologia

Criar glossário para: sessão de estudo, tentativa, tópico, formato, evidência, efetividade observada, progresso, recomendação, confiança, curadoria e intervenção. Cada termo deve ter definição operacional verificável.

#### F1.3 — Criar política de linguagem

Listar frases permitidas, frases proibidas e substituições. Incluir mensagens para dados insuficientes, resultados contraditórios, ausência de progresso e risco de interpretação causal.

#### F1.4 — Privacidade, ética e LGPD

Produzir análise inicial contendo:

- finalidade de cada dado coletado;
- base legal a ser validada pelo responsável acadêmico/jurídico;
- minimização e retenção;
- uso de dados sintéticos durante desenvolvimento;
- consentimento/assentimento quando aplicável;
- tratamento de menores de idade, se aplicável;
- anonimização ou pseudonimização para pesquisa;
- exportação e exclusão;
- controle de acesso e auditoria;
- protocolo de incidente;
- necessidade de submissão a comitê de ética, a confirmar com a instituição.

Não coletar participantes reais antes das aprovações institucionais necessárias.

### Entregáveis

- especificação científica;
- glossário;
- política de linguagem;
- checklist ético e de privacidade.

### Critério de saída

Orientador ou responsável aprova limites, perguntas e linguagem; decisões éticas bloqueadoras estão resolvidas.

---

## Fase 2 — Descoberta, requisitos e congelamento do MVP

### Objetivo

Validar usuários, jornadas e escopo. Esta fase decide se o escopo de referência da Seção 3 será mantido.

### Tarefas

#### F2.1 — Mapear atores e necessidades

Para aluno, professor e eventual administrador, registrar:

- objetivo do ator;
- informação necessária;
- ação esperada;
- risco de interpretação;
- permissão mínima;
- frequência de uso;
- dispositivo provável.

#### F2.2 — Escrever jornadas

No mínimo:

1. aluno estuda um material, realiza avaliação e consulta resultado;
2. aluno ainda não possui evidência suficiente e recebe sugestão exploratória;
3. aluno acumula evidência e recebe recomendação contextualizada;
4. professor encontra dificuldade recorrente em um tópico;
5. professor revisa e aprova um material;
6. usuário visualiza estado vazio, erro e dados contraditórios.

Cada jornada deve ter pré-condição, passos, dados gerados, resposta do sistema e pós-condição.

#### F2.3 — Especificar requisitos funcionais

Numerar como `RF-001`, `RF-002` etc. Para cada requisito registrar:

- descrição inequívoca;
- ator;
- prioridade MoSCoW;
- dados de entrada;
- regras;
- resultado esperado;
- erros previstos;
- critério de aceite Given/When/Then;
- caso de teste associado.

#### F2.4 — Especificar requisitos não funcionais

Numerar como `RNF-001` etc. Cobrir:

- acessibilidade alvo WCAG 2.2 nível AA;
- responsividade;
- navegadores suportados;
- desempenho mensurável;
- segurança;
- privacidade;
- observabilidade;
- manutenibilidade;
- reprodutibilidade analítica;
- execução local sem serviço de banco externo;
- idioma e formatação regional.

#### F2.5 — Priorizar e congelar MVP

Construir matriz `Must/Should/Could/Won't`. O MVP recomendado contém somente:

- dois papéis, aluno e professor;
- uma turma de demonstração;
- catálogo de tópicos e materiais;
- sessões de estudo;
- quizzes objetivos;
- analytics descritivo;
- recomendação determinística explicável;
- dashboard do aluno;
- visão agregada do professor;
- curadoria e selo docente;
- dados sintéticos reproduzíveis.

Registrar explicitamente tudo que foi adiado.

### Decisões obrigatórias antes de sair da fase

- público e faixa etária;
- domínio de conteúdo usado na demonstração;
- autenticação local, simplificada ou biblioteca dedicada;
- quantidade de turmas e professores no MVP;
- se materiais serão links externos, arquivos locais ou ambos;
- como a avaliação será vinculada à sessão;
- formato de nota e dificuldade das questões;
- janela temporal de atribuição;
- limiar de evidência;
- dados reais versus exclusivamente sintéticos;
- ambiente final de demonstração.

### Critério de saída

Backlog priorizado e aprovado, todos os itens Must com critérios de aceite e decisões bloqueadoras resolvidas.

---

## Fase 3 — Protocolo de medição e avaliação acadêmica

### Objetivo

Garantir que os dados coletados permitam análises válidas para o objetivo declarado.

### Tarefas

#### F3.1 — Criar dicionário de eventos

Para cada evento, registrar nome, emissor, momento, campos, validação, finalidade e retenção. Eventos mínimos candidatos:

- `study_session_started`;
- `study_session_paused`;
- `study_session_resumed`;
- `study_session_completed`;
- `resource_opened`;
- `assessment_started`;
- `question_answered`;
- `assessment_completed`;
- `recommendation_shown`;
- `recommendation_opened`;
- `recommendation_dismissed`;
- `recommendation_feedback_submitted`.

Evitar evento sem finalidade analítica documentada.

#### F3.2 — Definir validade da sessão

Decidir e documentar:

- duração mínima e máxima;
- comportamento em aba inativa;
- pausa e retomada;
- encerramento abrupto;
- deduplicação;
- múltiplas abas;
- diferença entre material aberto e efetivamente estudado;
- regra para sessões abandonadas.

#### F3.3 — Definir instrumentos comparáveis

Especificar como quizzes sobre o mesmo tópico terão dificuldade, quantidade e pontuação comparáveis. Se isso não for possível, limitar conclusões e registrar a dificuldade como variável de controle.

#### F3.4 — Definir métricas e fórmulas

Para cada métrica: fórmula, unidade, arredondamento, dados ausentes, período, exemplo calculado e teste de referência. Aprovar ou corrigir as métricas da Seção 6.

#### F3.5 — Planejar avaliação do artefato

Separar:

- verificação técnica: corretude, segurança, desempenho e compatibilidade;
- usabilidade: tarefas, taxa de conclusão, erros, tempo e questionário validado quando apropriado;
- utilidade percebida: clareza e relevância dos insights;
- avaliação pedagógica exploratória: somente se desenho, amostra e ética permitirem.

Definir amostra, recrutamento, roteiro, instrumentos, análise e limitações antes da coleta.

### Critério de saída

Dicionário de eventos, regras de validade, fórmulas e protocolo de avaliação revisados pelo responsável acadêmico.

---

## Fase 4 — Projeto de arquitetura e contratos

### Objetivo

Fixar decisões estruturais antes de gerar telas e regras espalhadas.

### Tarefas

#### F4.1 — Registrar ADRs

Criar decisões arquiteturais para:

- monólito modular;
- App Router e fronteira cliente/servidor;
- estratégia de autenticação e sessão;
- Route Handlers versus Server Actions;
- validação de entrada;
- tratamento de erros;
- geração e invalidação de analytics;
- estratégia de testes;
- SQLite em desenvolvimento/demonstração;
- forma de servir materiais.

Cada ADR deve conter contexto, decisão, alternativas, consequências e estado.

#### F4.2 — Modelar componentes e fluxo de dados

Desenhar diagramas C4 de contexto e contêiner, além de sequência para:

- concluir sessão;
- enviar tentativa;
- recalcular indicadores;
- gerar recomendação;
- aprovar material;
- abrir painel docente.

#### F4.3 — Definir contratos de entrada e saída

Para cada caso de uso, especificar DTO, validação, autorização, retorno, erros e efeitos colaterais. Padronizar erros como código estável + mensagem segura, sem detalhes internos.

#### F4.4 — Definir observabilidade local

Planejar logs estruturados para erros e ações sensíveis, sem registrar respostas completas, senha, token ou dado pessoal desnecessário. Definir correlação por requisição e limpeza de logs.

### Critério de saída

ADRs aprovados, fluxos desenhados e contratos das funcionalidades Must definidos.

---

## Fase 5 — Modelagem física, migrações e dados sintéticos

### Objetivo

Transformar o modelo conceitual em schema consistente, reproduzível e testável.

### Tarefas

#### F5.1 — Desenhar DER

Detalhar cardinalidade, nulabilidade, unicidade, índices, deleção e histórico. Revisar especialmente vínculos aluno–turma, recurso–tópico, sessão–tentativa e recomendação–evidência.

#### F5.2 — Especificar Prisma schema

Antes de implementar, listar cada model, enum, índice e constraint. Planejar timestamps, IDs, nomes de relações e políticas de deleção. Evitar JSON onde uma relação tipada for adequada.

#### F5.3 — Planejar migrações

- uma migração por mudança coerente;
- nomes descritivos;
- nunca editar migração aplicada sem justificativa;
- validar banco vazio e banco migrado;
- manter SQLite de desenvolvimento fora do versionamento, salvo decisão contrária;
- documentar reset seguro apenas para dados sintéticos.

#### F5.4 — Construir cenário sintético de referência

Definir seed determinístico contendo:

- professor;
- turma;
- no mínimo 6 alunos com padrões distintos e não estigmatizantes;
- 3 a 5 tópicos relacionados;
- múltiplos materiais e formatos por tópico;
- materiais aprovados, pendentes e rejeitados;
- sessões válidas, inválidas e mistas;
- tentativas com evolução, estabilidade, queda e contradição;
- recomendações em níveis diferentes de evidência.

Guardar a semente aleatória ou usar dados fixos. Criar tabela de resultados esperados para que os cálculos possam ser testados.

### Validações

- schema formata e valida;
- migração funciona em banco limpo;
- seed pode ser executado repetidamente conforme política definida;
- constraints rejeitam dados inválidos;
- resultados analíticos esperados podem ser calculados manualmente.

### Critério de saída

DER aprovado, schema e seed especificados, matriz de dados sintéticos com resultados esperados pronta.

---

## Fase 6 — UX, interface, gráficos e acessibilidade

### Objetivo

Validar compreensão antes da implementação visual completa.

### Tarefas

#### F6.1 — Arquitetura de informação

Definir rotas e navegação separadas por papel. Sugestão a validar:

```text
/entrar
/aluno/inicio
/aluno/topicos
/aluno/topicos/[id]
/aluno/materiais/[id]
/aluno/avaliacoes/[id]
/aluno/desempenho
/aluno/recomendacoes
/professor/inicio
/professor/turmas/[id]
/professor/alunos/[id]
/professor/materiais
```

#### F6.2 — Wireframes

Criar wireframes de baixa fidelidade para todas as jornadas críticas. Em cada tela representar loading, vazio, erro, dados insuficientes e sucesso.

#### F6.3 — Hierarquia e design system mínimo

Definir tokens de cor, tipografia, espaçamento, raio e elevação; componentes de botão, campo, card, tabela, badge, alerta, modal e skeleton; estados de foco, hover, disabled e erro.

Não usar apenas cor para comunicar desempenho, risco ou aprovação.

#### F6.4 — Especificar gráficos

Para cada gráfico definir pergunta respondida, eixo, unidade, período, tooltip, legenda, estado vazio e alternativa textual/tabular. Sugestões:

- linha de evolução por tópico;
- barras de desempenho médio por formato;
- resumo de sessões e tentativas;
- distribuição de dificuldade por tópico na turma.

Evitar ranking de alunos no MVP. Evitar gráfico de pizza quando comparação precisa for necessária.

#### F6.5 — Teste de compreensão

Apresentar protótipo a usuários representativos ou avaliadores. Perguntar o que cada insight significa, se parece causal/determinista e qual ação tomariam. Revisar textos que gerem interpretação indevida.

### Critério de saída

Rotas, wireframes e textos aprovados; fluxos críticos compreensíveis sem explicação oral; checklist WCAG preparado.

---

## Fase 7 — Fundação técnica do projeto

### Objetivo

Criar a base executável sem implementar ainda as regras verticais completas.

### Ordem exata

1. Confirmar versão estável suportada de Node e versões atuais compatíveis da stack no momento da execução.
2. Inicializar Next.js com TypeScript, App Router, Tailwind e lint.
3. Fixar gerenciador e lockfile.
4. Configurar aliases e estrutura mínima.
5. Configurar Prisma e variável do SQLite em `.env` não versionado.
6. Criar `.env.example` sem segredo.
7. Configurar validação de ambiente.
8. Configurar formatter, lint, typecheck e testes.
9. Configurar pipeline local/CI, se o repositório remoto for aprovado.
10. Criar página mínima e health check sem dados sensíveis.

### Scripts esperados

Os nomes finais podem variar, mas devem existir equivalentes para:

- desenvolvimento;
- build;
- start;
- lint;
- typecheck;
- teste unitário;
- teste de integração;
- teste E2E;
- Prisma generate/migrate/seed;
- validação completa.

### Validações

- instalação limpa a partir do lockfile;
- desenvolvimento inicia;
- build de produção conclui;
- lint e typecheck passam;
- teste mínimo passa;
- variável ausente falha com mensagem clara;
- banco e arquivos locais ignorados corretamente.

### Critério de saída

Base reproduzível e documentada, sem warnings relevantes e sem funcionalidade simulada apresentada como pronta.

---

## Fase 8 — Identidade, autenticação e autorização

### Objetivo

Garantir isolamento de dados antes das funcionalidades de aluno e professor.

### Tarefas

1. Implementar a estratégia aprovada na Fase 2.
2. Criar usuários sintéticos por papel.
3. Proteger rotas no servidor e reforçar autorização em cada caso de uso.
4. Implementar login, logout, sessão expirada e acesso negado.
5. Normalizar nome de usuário e proteger credenciais por hash.
6. Registrar ações sensíveis sem armazenar segredo.
7. Testar acesso horizontal e vertical indevido.

### Casos de teste mínimos

- aluno acessa seus dados;
- aluno não acessa outro aluno;
- aluno não acessa painel docente;
- professor acessa turma vinculada;
- professor não acessa turma não vinculada;
- sessão ausente ou expirada é rejeitada;
- alteração de papel no cliente não concede permissão.

### Critério de saída

Matriz de autorização implementada e testada no servidor.

---

## Fase 9 — Catálogo de tópicos, materiais e curadoria

### Objetivo

Entregar a base de conteúdo usada nas sessões e recomendações.

### Ordem de implementação

1. consulta de tópicos ativos;
2. consulta de recursos por tópico e formato;
3. detalhe do recurso;
4. cadastro/edição conforme papel aprovado;
5. fluxo de aprovação docente;
6. selo e filtro de aprovação;
7. auditoria das decisões de curadoria.

### Regras

- validar URL/protocolo ou caminho permitido;
- impedir conteúdo rejeitado de ser recomendado automaticamente;
- preservar histórico de aprovação;
- diferenciar “recomendado pelo algoritmo” de “aprovado pelo professor”;
- fornecer alternativa para link indisponível no cenário de demonstração;
- nunca executar HTML arbitrário fornecido em material.

### Critério de saída

Catálogo navegável, curadoria rastreável e permissões testadas.

---

## Fase 10 — Sessões de estudo e telemetria transparente

### Objetivo

Registrar exposição a materiais com regras de validade reproduzíveis.

### Fluxo obrigatório

1. aluno abre material;
2. interface explica o que será registrado;
3. servidor cria sessão ativa;
4. eventos de pausa/retomada obedecem à política;
5. servidor encerra e calcula duração válida;
6. sessão recebe estado final;
7. interface apresenta confirmação e próximo passo.

### Condições de borda

- refresh;
- fechamento da aba;
- conexão perdida;
- duas sessões simultâneas;
- relógio do cliente incorreto;
- sessão muito curta;
- sessão além do máximo;
- usuário tenta alterar duração;
- recurso removido durante a sessão.

### Critério de saída

Sessões são rastreáveis, idempotentes onde necessário e resistentes à manipulação simples do cliente.

---

## Fase 11 — Avaliações e tentativas

### Objetivo

Produzir medidas de desempenho coerentes e vinculáveis ao estudo.

### Ordem de implementação

1. modelos de avaliação, questão e alternativa;
2. leitura de avaliação sem expor gabarito;
3. início de tentativa;
4. submissão validada no servidor;
5. pontuação transacional;
6. feedback ao aluno conforme política pedagógica;
7. histórico de tentativas;
8. vínculo analítico com sessões elegíveis.

### Regras

- o cliente nunca é fonte oficial da correção;
- uma tentativa finalizada não pode ser reenviada;
- pontuação usa pesos e arredondamento documentados;
- questão anulada ou alterada requer política de versionamento;
- não registrar resposta correta em logs;
- vínculo sessão–tentativa precisa indicar exposição única ou mista.

### Critério de saída

Pontuação correta em casos normais e extremos, gabarito protegido e evidência criada somente quando válida.

---

## Fase 12 — Camada de Learning Analytics

### Objetivo

Converter dados brutos em métricas reproduzíveis sem acoplá-las à interface.

### Ordem de implementação

1. funções puras para cada fórmula;
2. seleção de evidências válidas;
3. agregação aluno+tópico+formato;
4. evolução temporal;
5. nível de evidência;
6. serviço de consulta;
7. snapshot/cache apenas se necessário;
8. apresentação textual equivalente aos gráficos.

### Requisitos técnicos

- versão explícita do algoritmo;
- resultados determinísticos para a mesma entrada;
- datas e recortes explícitos;
- tratamento de nulos e divisão por zero;
- precisão e arredondamento uniformes;
- consulta sem N+1 relevante;
- agregados docentes não expõem mais dados do que o permitido;
- possibilidade de recalcular resultados a partir dos dados brutos.

### Teste-ouro

Usar o cenário sintético da Fase 5. Para cada aluno, calcular manualmente ao menos um indicador e comparar com a saída do sistema. Qualquer divergência bloqueia a fase.

### Critério de saída

Métricas corretas no teste-ouro, versionadas e expostas por contratos testados.

---

## Fase 13 — Recomendação educacional explicável

### Objetivo

Gerar sugestões úteis com regras auditáveis e linguagem proporcional à evidência.

### Ordem de implementação

1. transformar a Seção 6.5 em tabela formal de decisão;
2. escrever testes para cada linha da tabela antes ou junto da regra;
3. implementar geração de candidatos;
4. filtrar por tópico, estado e curadoria;
5. pontuar/ordenar com desempate estável;
6. gerar explicação a partir de dados estruturados;
7. persistir recomendação, versão e resumo das evidências;
8. registrar visualização, aceite, descarte e feedback;
9. implementar expiração e limitação de repetição;
10. revisar linguagem com a política da Fase 1.

### Regras de segurança conceitual

- baixa nota isolada não define dificuldade permanente;
- falta de dados gera exploração, não personalização falsa;
- ausência de melhora não é atribuída ao aluno;
- feedback de utilidade não substitui desempenho;
- conteúdo aprovado recebe sinalização, não garantia de eficácia;
- toda sugestão pode ser ignorada;
- recomendação nunca restringe acesso a outros formatos.

### Critério de saída

Todas as regras possuem teste e explicação; cenários insuficientes e contraditórios são tratados corretamente.

---

## Fase 14 — Dashboard e experiência do aluno

### Objetivo

Integrar conteúdo, sessões, avaliações, métricas e recomendações numa jornada compreensível.

### Blocos mínimos

- resumo do período e último acesso;
- tópicos em estudo;
- evolução por tópico;
- comparação contextual por formato;
- recomendações com justificativa;
- histórico de sessões/tentativas;
- indicação de dados insuficientes;
- próximos passos acionáveis.

### Ordem de implementação

1. estados e contratos;
2. layout móvel;
3. layout desktop;
4. cards sem gráficos;
5. gráficos com alternativa textual;
6. detalhes e filtros;
7. recomendações e feedback;
8. testes de acessibilidade e compreensão.

### Critério de saída

Aluno conclui as três tarefas críticas — encontrar dificuldade, interpretar evidência e escolher próximo recurso — sem ajuda e sem interpretar o resultado como estilo fixo.

---

## Fase 15 — Painel docente e intervenção

### Objetivo

Fornecer visão complementar e acionável sem transformar o painel em ranking ou vigilância.

### Blocos mínimos

- resumo da turma;
- dificuldade agregada por tópico;
- alunos que atendem a critérios transparentes de atenção;
- detalhe autorizado de aluno;
- formatos associados a resultados por contexto;
- fila de materiais para curadoria;
- registro de recomendação manual, se aprovado no MVP.

### Regras

- explicar a regra que colocou um aluno em atenção;
- nunca ordenar publicamente alunos do melhor ao pior;
- permitir filtrar período e tópico;
- diferenciar ausência de dado de baixo desempenho;
- limitar dado individual ao vínculo de turma;
- mostrar tamanho da amostra ao lado de agregados;
- não inferir motivação, capacidade ou diagnóstico.

### Critério de saída

Professor identifica um tópico problemático, compreende a base do alerta e realiza uma ação prevista, com autorização e auditoria corretas.

---

## Fase 16 — Integração, robustez e segurança

### Objetivo

Verificar o produto integrado e reduzir riscos antes da avaliação.

### Checklist técnico

- lint, typecheck, testes e build;
- migração limpa + seed;
- jornadas E2E críticas;
- controle de acesso por papel e vínculo;
- validação de entrada e mensagens de erro;
- XSS, CSRF e injeção conforme superfície usada;
- headers e cookies seguros conforme ambiente;
- ausência de segredo no cliente/repositório/log;
- dependências sem vulnerabilidade crítica conhecida;
- tratamento de falhas de banco;
- páginas 404/erro;
- timezone e datas de borda;
- concorrência de submissão;
- backup e restauração do banco de demonstração;
- política de exclusão/anonimização testada, se aplicável.

### Checklist de qualidade da interface

- teclado completo;
- foco visível e ordem lógica;
- rótulos e mensagens associados;
- contraste AA;
- zoom 200%;
- leitores de tela nos fluxos críticos;
- alternativas a gráficos;
- mobile sem rolagem horizontal indevida;
- loading sem salto excessivo;
- estados vazios explicativos;
- linguagem consistente em português.

### Metas iniciais a validar

- página principal útil em até 2,5 s no ambiente de demonstração;
- interações comuns com resposta visual em até 200 ms quando não dependem de navegação;
- consultas de dashboard dentro do orçamento definido após medição;
- zero falha crítica ou alta aberta;
- zero violação de autorização conhecida;
- 100% das fórmulas críticas cobertas por testes de referência.

### Critério de saída

Relatório de testes sem bloqueadores, riscos residuais aceitos e versão candidata identificada.

---

## Fase 17 — Cenário de demonstração e validação dos dados

### Objetivo

Produzir uma demonstração repetível que evidencie o valor central do TCC.

### Roteiro recomendado

1. mostrar aluno sem dados suficientes;
2. realizar ou apresentar sessão com PDF e resultado baixo;
3. mostrar recomendação de exploração, sem conclusão prematura;
4. apresentar sessões práticas posteriores com melhora;
5. mostrar mudança gradual do nível de evidência;
6. abrir explicação e limitações;
7. mostrar painel do professor e dificuldade agregada;
8. aprovar um recurso;
9. voltar ao aluno e exibir selo docente distinto da recomendação algorítmica.

### Verificações

- o roteiro funciona após reset e seed;
- todos os números exibidos batem com cálculo independente;
- não depende de internet, salvo decisão explícita;
- não contém nome ou dado de pessoa real;
- existe plano alternativo por capturas ou vídeo local para falha técnica;
- tempo total cabe na apresentação.

### Critério de saída

Demonstração repetida ao menos duas vezes a partir de ambiente limpo, com valores conferidos.

---

## Fase 18 — Avaliação com usuários e análise dos resultados

### Objetivo

Executar somente o protocolo aprovado na Fase 3 e coletar evidências compatíveis com as alegações do TCC.

### Pré-condições bloqueadoras

- aprovação ética/institucional quando necessária;
- termo de consentimento/assentimento aprovado;
- instrumento e roteiro congelados;
- versão do sistema identificada;
- plano de anonimização e armazenamento definido;
- teste piloto concluído.

### Execução

1. aplicar piloto e ajustar ambiguidades antes da coleta principal;
2. registrar contexto e versão usados;
3. coletar somente dados previstos;
4. separar identificadores da base analítica;
5. documentar desistências e dados faltantes;
6. analisar conforme método pré-definido;
7. não selecionar apenas resultados favoráveis;
8. reportar limitações, vieses e tamanho amostral;
9. não generalizar além da população e do desenho.

### Critério de saída

Base anonimizada, análise reproduzível e conclusões compatíveis com os dados e o método.

---

## Fase 19 — Documentação técnica e relação com o TCC

### Objetivo

Permitir reprodução, manutenção e defesa acadêmica do artefato.

### Documentos do produto

- README com problema, escopo, requisitos e execução;
- arquitetura e ADRs;
- DER e dicionário de dados;
- dicionário de eventos;
- fórmulas e versão do analytics;
- regras do recomendador;
- matriz de autorização;
- estratégia e resultados de testes;
- guia de seed e demonstração;
- limitações e trabalho futuro;
- licença e atribuições de conteúdo/dependências.

### Rastreabilidade acadêmica

Manter uma tabela que ligue:

```text
objetivo específico → requisito → funcionalidade → dado → métrica → teste → evidência apresentada no TCC
```

### Figuras e resultados

- gerar diagramas a partir da arquitetura real;
- conferir que telas descritas existam na versão avaliada;
- registrar versão/commit das capturas;
- não usar resultado de seed como evidência empírica de eficácia;
- distinguir claramente demonstração sintética de estudo com participantes.

### Critério de saída

Outro desenvolvedor consegue executar o projeto e reproduzir os resultados técnicos usando apenas a documentação versionada.

---

## Fase 20 — Empacotamento, entrega e encerramento

### Objetivo

Entregar uma versão estável, reproduzível e coerente com o texto acadêmico.

### Tarefas

1. congelar funcionalidades;
2. corrigir apenas defeitos de entrega;
3. executar validação completa em ambiente limpo;
4. confirmar migrações e seed;
5. gerar versão/tag conforme fluxo adotado;
6. preparar banco exclusivamente sintético;
7. preparar roteiro e contingência da apresentação;
8. arquivar resultados de testes;
9. revisar licenças, créditos e referências;
10. registrar limitações e backlog futuro;
11. confirmar que arquivos da IA estão em `AiFiles/` e não contaminam a documentação do produto;
12. remover somente artefatos temporários previamente identificados, sem apagar material do usuário.

### Critério de saída

Pacote executável, documentação consistente, demonstração reproduzível e checklist final assinado pelo autor.

## 9. Sequência recomendada de incrementos verticais

Após as Fases 0–7, implementar em incrementos pequenos nesta ordem:

1. autenticar aluno sintético e listar tópicos;
2. abrir material e registrar sessão válida;
3. responder quiz e calcular nota;
4. vincular sessão e tentativa como evidência;
5. calcular um indicador por tópico;
6. mostrar o indicador ao aluno com estado insuficiente;
7. gerar recomendação exploratória;
8. acumular evidência e mudar recomendação;
9. adicionar visão agregada do professor;
10. adicionar curadoria e selo;
11. completar filtros, gráficos e estados de borda;
12. reforçar segurança, acessibilidade e desempenho.

Para cada incremento: schema/migração se necessário → domínio → repositório → caso de uso → interface → testes → documentação → acompanhamento. Não construir todas as telas antes das regras e dos dados correspondentes.

## 10. Matriz inicial de riscos

| ID | Risco | Prob. | Impacto | Mitigação principal | Gatilho de bloqueio |
|---|---|---:|---:|---|---|
| R-01 | Confundir correlação com causalidade | Alta | Alto | política de linguagem, explicabilidade e revisão metodológica | texto determinista na interface/TCC |
| R-02 | Evidência insuficiente para personalizar | Alta | Alto | estado “insuficiente” e recomendação exploratória | sistema escolhe “melhor formato” com 0–1 caso |
| R-03 | Avaliações não comparáveis | Média | Alto | banco de itens/regras de dificuldade e limitação explícita | notas de instrumentos muito diferentes são comparadas |
| R-04 | Escopo excessivo | Alta | Alto | congelamento Must/Should/Could/Won't | item fora do MVP bloqueia fluxo crítico |
| R-05 | Violação de privacidade | Média | Alto | minimização, sintéticos, autorização e aprovação ética | uso de dados reais sem base e protocolo |
| R-06 | Métricas incorretas | Média | Alto | teste-ouro e fórmulas versionadas | divergência do cálculo manual |
| R-07 | Seed artificial usado como prova | Média | Alto | rotular demonstração e separar avaliação | conclusão científica baseada só no seed |
| R-08 | SQLite limitar ambiente escolhido | Baixa/Média | Médio | manter camada de repositório e documentar restrição | necessidade real de escrita concorrente/hosting incompatível |
| R-09 | Gráficos inacessíveis ou enganosos | Média | Médio | alternativa textual, amostra e eixos claros | insight depende apenas de cor/visual |
| R-10 | Materiais externos indisponíveis | Média | Médio | recursos locais/licenciados para demo | roteiro depende de URL instável |
| R-11 | Dados de sessão pouco confiáveis | Alta | Alto | regras de validade e telemetria transparente | tempo do cliente aceito sem validação |
| R-12 | IA executora expandir requisitos | Média | Alto | decisões pendentes e gates de fase | implementação sem RF/critério de aceite |

## 11. Decisões pendentes iniciais

Estas decisões devem ser registradas em `../../Memoria/DECISOES_DO_PROJETO.md` na Fase 0.

| ID | Decisão | Opção recomendada para o MVP | Quem valida |
|---|---|---|---|
| D-001 | Conteúdo temático da demonstração | fundamentos de programação, com tópicos comparáveis como condicionais, loops e funções | autor/orientador |
| D-002 | Público-alvo | estudantes adultos ou universitários para reduzir complexidade ética inicial | autor/orientador |
| D-003 | Tipo de autenticação | usuário e senha locais sintéticos, com hash de senha e sessão segura | responsável técnico |
| D-004 | Origem dos materiais | recursos locais/licenciados e links opcionais | autor |
| D-005 | Janela sessão–avaliação | definir por protocolo; não codificar antes da Fase 3 | orientador/metodologia |
| D-006 | Limiar de evidência | usar tabela da Seção 6.4 somente após validação | orientador/metodologia |
| D-007 | Dados de avaliação | seed para demonstração; participantes apenas com protocolo aprovado | autor/orientador |
| D-008 | Feedback após questão | após concluir tentativa, para evitar interferência não controlada | responsável pedagógico |
| D-009 | Implantação | execução local para defesa; hospedagem somente se requisito | autor/responsável técnico |
| D-010 | Administração | painel local para administrador cadastrar professores sintéticos | autor |
| D-011 | Exposição mista | armazenar e excluir da comparação simples inicialmente | metodologia |
| D-012 | Métrica principal de efetividade | nota normalizada posterior, acompanhada de contagem e contexto | metodologia |

## 12. Checklist mestre de aprovação

### Antes de codificar

- [ ] escopo Must aprovado;
- [ ] público e conteúdo definidos;
- [ ] protocolo de medição aprovado;
- [ ] fórmulas e comparabilidade definidas;
- [ ] privacidade e ética avaliadas;
- [ ] wireframes testados;
- [ ] arquitetura e schema revisados;
- [ ] critérios de aceite rastreáveis.

### Antes de usar dados reais

- [ ] autorização institucional/comitê verificada;
- [ ] consentimento/assentimento aplicável aprovado;
- [ ] minimização e retenção definidas;
- [ ] controle de acesso testado;
- [ ] anonimização/pseudonimização testada;
- [ ] protocolo e versão congelados;
- [ ] piloto concluído.

### Antes da entrega

- [ ] lint, tipos, testes e build passam;
- [ ] banco limpo migra e recebe seed;
- [ ] cálculos batem com teste-ouro;
- [ ] nenhuma recomendação usa linguagem causal/fixa;
- [ ] autorização horizontal e vertical testada;
- [ ] fluxos críticos são acessíveis e responsivos;
- [ ] roteiro de demonstração repetido;
- [ ] README permite reprodução;
- [ ] texto do TCC corresponde à versão entregue;
- [ ] limitações estão explícitas;
- [ ] nenhum dado pessoal real está no repositório;
- [ ] todo material auxiliar da IA está em `AiFiles/`.

## 13. Protocolo de atualização deste plano

Quando a execução revelar necessidade de mudança:

1. registrar o problema no acompanhamento;
2. criar decisão com identificador;
3. descrever opções e impacto em escopo, ciência, dados, testes e cronograma;
4. obter validação do responsável correto;
5. atualizar primeiro este plano e a matriz de requisitos;
6. somente então alterar a implementação;
7. registrar a evidência da validação.

Uma tarefa pode ser marcada como:

- `NÃO INICIADA`;
- `EM ANDAMENTO`;
- `BLOQUEADA`;
- `EM REVISÃO`;
- `CONCLUÍDA`;
- `ADIADA`.

“Concluída” exige evidência objetiva — arquivo, teste, relatório, captura ou aprovação registrada. Percentuais subjetivos não devem substituir estados e evidências.

## 14. Resultado esperado ao fim do projeto

Ao concluir todas as fases, deverá existir um artefato web local e reproduzível que:

- registre sessões e avaliações de forma transparente;
- calcule indicadores verificáveis por aluno, tópico e formato;
- comunique limites e quantidade de evidência;
- recomende exploração ou materiais com regras explicáveis;
- permita ao aluno refletir e tomar uma próxima ação;
- ofereça ao professor visão agregada, intervenção e curadoria;
- proteja dados por papel e vínculo;
- seja demonstrável com dados sintéticos consistentes;
- possua documentação e testes que sustentem as afirmações técnicas do TCC;
- não transforme associações observadas em estilos fixos ou causalidade indevida.
