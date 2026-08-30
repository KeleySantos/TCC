# Requisitos e escopo congelado do MVP

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

O escopo pode avançar para a Fase 3 quando autor e orientador confirmarem que os requisitos Must representam a demonstração pretendida. Alterações posteriores devem receber novo identificador em `DECISOES_PENDENTES.md` e atualizar a matriz de testes.
