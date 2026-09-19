# Requisitos e escopo congelado das Entregas A e B

> Atualizado em 2026-09-15. Esta versão substitui o escopo anterior baseado em aluno, professor e administrador. As seções históricas abaixo permanecem apenas para rastrear o produto de origem; em caso de conflito, prevalecem as Seções 8 a 12 desta atualização.

## 1. Escopo aprovado para execução técnica

O MVP é uma plataforma web local, com banco SQLite e dados sintéticos, para demonstrar o ciclo:

`estudar → registrar → avaliar → analisar → recomendar → reavaliar`

O domínio demonstrativo é Fundamentos de Programação, inicialmente com o tópico Loops. Os papéis são aluno e professor. O acesso é feito por contas sintéticas selecionadas na tela de entrada.

## 2. Atores e necessidades

| Ator | Objetivo | Informação necessária | Ação principal | Limite de permissão |
|---|---|---|---|---|
| Aluno | Refletir sobre o próprio estudo | Última nota, evidências, tópicos, materiais e recomendação explicada | Estudar, responder quiz e consultar painel | Apenas dados próprios |
| Professor | Orientar e curar materiais | Média por tópico, tamanho de amostra, sinal de atenção e materiais | Consultar turma e aprovar/rejeitar recurso | Apenas turmas e curadoria vinculadas |
| Autor do TCC | Demonstrar o artefato | Cenário reprodutível e dados sintéticos coerentes | Reiniciar banco e seguir roteiro | Controle local do projeto |

## 3. Jornadas críticas

### J-001 — Aluno estuda e avalia

Pré-condição: aluno sintético autenticado e material ativo no tópico.

1. Aluno abre o painel e escolhe um tópico.
2. Sistema mostra materiais, formato e selo de curadoria quando houver.
3. Aluno inicia sessão de estudo.
4. Sistema cria sessão ativa vinculada a aluno, tópico e recurso.
5. Aluno encerra sessão.
6. Sistema calcula a duração e classifica a sessão como concluída ou inválida.
7. Aluno responde o quiz.
8. Servidor corrige respostas, grava tentativa e apresenta nota normalizada.

Pós-condição: os registros ficam disponíveis para cálculo analítico posterior.

### J-002 — Aluno sem evidência suficiente

Pré-condição: tópico sem evidência ou com menos de duas evidências válidas.

1. Aluno abre tópico.
2. Sistema identifica evidência insuficiente.
3. Sistema sugere material preferencialmente aprovado e de formato ainda não observado.
4. Interface declara que a sugestão é exploratória e não define estratégia definitiva.

### J-003 — Aluno com histórico observável

Pré-condição: ao menos duas evidências válidas simples no mesmo tópico.

1. Sistema agrupa evidências por formato.
2. Sistema calcula média e nível de evidência.
3. Sistema seleciona recurso elegível e gera justificativa.
4. Interface informa contagem, resultado observado, contexto e limitação.

### J-004 — Professor identifica necessidade de atenção

Pré-condição: professor sintético autenticado e turma vinculada.

1. Professor abre o painel.
2. Sistema apresenta média recente e tamanho da amostra por tópico.
3. Sistema indica quantos alunos possuem última nota abaixo de 60%.
4. Interface alerta que esse dado exige interpretação pedagógica e não é ranking ou diagnóstico.

### J-005 — Professor realiza curadoria

1. Professor abre a seção de materiais.
2. Escolhe aprovar ou rejeitar um recurso.
3. Sistema registra situação e evento de auditoria.
4. Recursos aprovados recebem selo e têm prioridade em recomendações exploratórias.

## 4. Requisitos funcionais

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| RF-001 | Permitir entrada por conta sintética de aluno ou professor. | Must | Dado usuário listado, quando seleciona sua conta, então é direcionado ao painel correspondente. |
| RF-002 | Exibir tópicos e materiais ativos ao aluno. | Must | Dado aluno autenticado, quando abre tópico, então vê recursos com formato, descrição, duração e selo de aprovação quando houver. |
| RF-003 | Registrar início e término de sessão de estudo. | Must | Dado recurso ativo, quando aluno inicia e encerra, então sessão é persistida com aluno, tópico, recurso, datas, duração e situação. |
| RF-004 | Invalidar sessão abaixo de 5 minutos. | Must | Dada sessão encerrada antes de 5 minutos, então situação é `INVALIDADA` e ela não integra a evidência simples. |
| RF-005 | Aplicar quiz objetivo no servidor. | Must | Dada submissão válida, quando servidor recebe respostas, então cria tentativa, respostas, total, acertos e nota entre 0 e 100. |
| RF-006 | Calcular evidências por aluno, tópico e formato. | Must | Dada sessão válida única e tentativa compatível dentro de 7 dias, então sistema produz evidência; exposição mista não é atribuída a formato único. |
| RF-007 | Mostrar recomendação explicável ao aluno. | Must | Dado histórico suficiente ou insuficiente, quando aluno abre tópico, então vê sugestão com nível, quantidade, justificativa e limitação. |
| RF-008 | Mostrar painel individual do aluno. | Must | Dado aluno autenticado, quando abre painel, então vê apenas seus dados, tópicos, sessões, tentativas e resultados. |
| RF-009 | Mostrar painel agregado do professor. | Must | Dado professor vinculado, quando abre painel, então vê quantidade de alunos, métricas por tópico, amostra e sinal de atenção. |
| RF-010 | Permitir curadoria de recursos. | Should | Dado professor autenticado, quando aprova/rejeita recurso, então situação é persistida e auditada. |
| RF-011 | Mostrar gráfico de última nota por tópico. | Should | Dado aluno com tentativas, quando abre painel, então gráfico apresenta nota entre 0 e 100 e texto alternativo explicativo. |
| RF-012 | Registrar feedback de recomendação. | Could | Dada recomendação exibida, quando aluno aceita/descarta, então ação é persistida sem ser tratada como prova de aprendizagem. |
| RF-013 | Recomendação manual do professor. | Could | Dado professor vinculado, quando recomenda material, então aluno vê origem docente distinta da recomendação algorítmica. |

## 5. Requisitos não funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| RNF-001 | Idioma | Todo domínio próprio, banco, rota, interface e documentação do projeto usam português do Brasil. |
| RNF-002 | Privacidade | Versão atual usa apenas dados sintéticos e não inclui identificadores reais. |
| RNF-003 | Autorização | Servidor impede aluno de acessar dados de outro aluno e professor de acessar dados sem vínculo. |
| RNF-004 | Reprodutibilidade | `npm run banco:reiniciar` recria banco local e cenário sintético. |
| RNF-005 | Qualidade | `npm run validar` executa lint, tipos, testes e compilação sem erro. |
| RNF-006 | Responsividade | Painéis funcionam sem rolagem horizontal em viewport de 360 px. |
| RNF-007 | Acessibilidade | Fluxos críticos devem ser navegáveis por teclado, ter foco visível e não comunicar estado apenas por cor. |
| RNF-008 | Explicabilidade | Nenhuma recomendação pode ser exibida sem justificativa, quantidade de evidências e linguagem de limitação. |

## 6. Itens explicitamente adiados

- Login com credenciais reais, recuperação de senha, e-mail e produção multiusuário.
- Integrações com Moodle, Google Classroom ou sistemas institucionais.
- Aplicativo móvel nativo.
- Geração automática de conteúdo por IA.
- Machine learning, redes neurais ou perfis psicológicos.
- Dados reais, menores de idade e estudo com participantes sem aprovação.
- Ranking público de alunos, gamificação ou vigilância passiva.
- Feedback de recomendação e recomendação manual: itens Could para próximo incremento.

## 7. Critério de congelamento

O escopo pode avançar para a Fase 3 quando autor e orientador confirmarem que os requisitos Must representam a demonstração pretendida. Alterações posteriores devem receber novo identificador em `../../Memoria/DECISOES_DO_PROJETO.md` e atualizar a matriz de testes.

## 8. Escopo aprovado em 2026-09-12

O produto demonstrado na banca é um laboratório pessoal de aprendizagem local, com SQLite e dados exclusivamente sintéticos. Cada pessoa usa uma única conta pessoal; não existem papéis de aluno, professor ou administrador, nem turmas, curadoria ou compartilhamento na Entrega A.

O ciclo obrigatório é:

`entrar → criar módulo → organizar tópico e material → estudar → avaliar → analisar → refletir → reavaliar`

## 9. Jornadas críticas aprovadas

### JLP-001 — Preparar e estudar um assunto

1. A pessoa entra em sua conta pessoal.
2. Cria um módulo, tópicos e materiais próprios de texto ou link.
3. Inicia e conclui uma sessão vinculada ao material.
4. O servidor calcula a duração oficial e persiste método, percepção e observação limitada.

### JLP-002 — Avaliar e consultar o módulo

1. A pessoa conclui uma avaliação objetiva associada ao seu tópico.
2. O servidor corrige as respostas e grava total, acertos e nota de 0 a 100.
3. O dashboard do módulo apresenta métricas, amostra, período, estado vazio ou insuficiente e alternativa textual aos gráficos.

### JLP-003 — Refletir sobre o histórico pessoal

1. A pessoa abre o painel geral.
2. O sistema agrega os módulos sem apagar o contexto de cada um e diferencia um resultado local de uma recorrência.
3. Gemini, quando configurada, interpreta exclusivamente o resumo sintético agregado; sem chave, rede ou saída válida, a interface mostra a interpretação local de contingência.

## 10. Requisitos funcionais aprovados

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| RLP-001 | Área pessoal autenticada | Must | Conta válida abre `/dashboard`; sessão ausente é recusada e dados de outra conta não são retornados. A rota legada `/painel` redireciona para o dashboard. |
| RLP-002 | CRUD de módulos | Must | Proprietária cria, lista, edita, arquiva e abre módulo; terceira conta recebe 404 ou 403 sem vazamento. |
| RLP-003 | Tópicos por módulo | Must | Tópico é criado e listado somente no módulo da conta proprietária. |
| RLP-004 | Materiais simples | Must | Texto ou link possui título, descrição, formato e tópico; URL, tamanho e propriedade são validados no servidor. |
| RLP-005 | Sessão enriquecida | Must | Sessão registra material, método, início e fim oficiais, escalas de 1 a 5 e observação limitada; duração do cliente não é aceita como oficial. |
| RLP-006 | Histórico | Must | Histórico cronológico mostra estado e contexto da própria conta, sem expor outra conta. |
| RLP-007 | Resultado objetivo | Must | Servidor persiste total, acertos e nota de 0 a 100 sem expor gabarito antes do envio. |
| RLP-008 | Métricas oficiais | Must | Funções puras e versionadas calculam contagem, médias, evolução, tempo, tentativas, método, formato e percepção versus resultado. |
| RLP-009 | Dashboard do módulo | Must | Cards, gráficos e tabela respondem aos dados e mostram amostra, período, vazio, insuficiência e limitação. |
| RLP-010 | Dashboard geral | Must | Agrega sem apagar a origem e somente aponta recorrência quando houver evidência em dois ou mais módulos. |
| RLP-011 | Interpretação por Gemini | Must | Gemini recebe somente DTO sintético agregado e devolve resposta validada com contexto, amostra e limitação; falha, ausência de chave ou rede produz resposta local. |

## 11. Requisitos não funcionais aprovados

| ID | Requisito | Critério de aceite |
|---|---|---|
| RLP-NF-001 | Reprodutibilidade | Banco limpo é migrado, populado e conferido por script determinístico. |
| RLP-NF-002 | Qualidade | `npm run validar` termina com código zero. |
| RLP-NF-003 | Acessibilidade | Fluxos críticos funcionam por teclado, em 360 px e com alternativa a gráficos. |
| RLP-NF-004 | Privacidade | Seed, logs e DTOs enviados à Gemini não contêm dados reais, chaves, respostas completas ou observações livres. |
| RLP-NF-005 | Explicabilidade | Métricas e interpretações apresentam contexto, período, quantidade, nível e limitação; não afirmam causalidade ou classificam estilos fixos. |

Ficam fora do corte da banca: compartilhamento, comentários, salas, uploads, funções por papel, turmas, curadoria e administração.

## 12. Ampliação aprovada — Entrega B

Em 2026-09-15, o autor autorizou a ampliação do corte para a Entrega B. A versão continua local, com uma única conta pessoal e dados exclusivamente sintéticos. O novo ciclo é complementar ao da Entrega A: a pessoa seleciona um método controlado, pode registrar um desafio de experimentação no próprio módulo, vincula sessões ao desafio de forma explícita e consulta comparações apenas descritivas. A análise de Bloom usa exclusivamente questões já classificadas e nunca transforma ausência ou amostra insuficiente em resultado.

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| RLB-001 | Catálogo controlado de métodos | Must | A pessoa registra sessões com Feynman, recuperação ativa, repetição espaçada, Pomodoro, intercalamento ou prática distribuída; métodos históricos permanecem legíveis, sem ter seu significado alterado. |
| RLB-002 | Desafio de experimentação próprio | Must | A proprietária cria e cancela um desafio com módulo, método e meta válida; uma sessão pode vincular explicitamente esse desafio somente se ambos pertencerem à mesma conta, módulo e método. O cancelamento impede novos vínculos e preserva sessões já registradas. |
| RLB-003 | Comparação contextual do desafio | Must | O sistema compara apenas evidências de exposição única associadas ao desafio contra o mesmo módulo e método fora dele; cada grupo informa quantidade, nível de evidência e limitação. Sem duas evidências em ambos os grupos, nenhuma diferença é calculada ou interpretada como efeito do método. |
| RLB-004 | Análise por nível de Bloom | Must | O sistema agrega respostas de questões classificadas por nível de Bloom no contexto do módulo; cada nível só expõe taxa de acerto com pelo menos duas respostas classificadas. Ausência de classificação ou amostra não vira nota zero. |
| RLB-NF-001 | Reprodutibilidade e isolamento da Entrega B | Must | Migração, seed e verificador reproduzem desafios, métodos e Bloom sintéticos; escrita e leitura rejeitam dados de outra conta. |
| RLB-NF-002 | Linguagem responsável | Must | Comparações e interfaces descrevem registros observados, período, amostra e limitação, sem concluir que desafio ou método causou aprendizagem. |
