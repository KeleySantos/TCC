# Decisões funcionais — módulos orientados a sessões

## Estado

- **Situação:** aprovado pelo autor em 2026-09-19
- **Origem:** nova direção informada em 2026-09-19
- **Documento relacionado:** [`ORDEM_IMPLEMENTACAO_MODULOS_SESSOES.md`](ORDEM_IMPLEMENTACAO_MODULOS_SESSOES.md)
- **Efeito:** contrato funcional liberado para detalhamento técnico e execução da Fase 1

## Direção já informada pelo autor

- tópico deixa de existir como conceito da jornada;
- o módulo passa a ser organizado por sessões de estudo;
- cada sessão registra data e hora de início e fim;
- cada sessão possui uma descrição dos conteúdos estudados;
- cada sessão aceita um ou vários métodos de estudo;
- cada sessão aceita um ou vários formatos;
- a duração em minutos ou horas é calculada automaticamente.

## Decisões confirmadas pelo autor

- haverá registro manual e cronômetro;
- dificuldade e compreensão percebidas serão obrigatórias;
- materiais pertencerão ao módulo e poderão ser vinculados opcionalmente às sessões;
- sessões concluídas poderão ter todos os campos editados, com recálculo dos dados derivados;
- sessões arquivadas continuarão participando das métricas;
- sessões sobrepostas serão bloqueadas;
- datas futuras serão permitidas como sessões planejadas, fora das métricas até a conclusão;
- a apresentação usará o fuso do navegador;
- descrições das sessões serão sempre incluídas quando uma interpretação por IA for solicitada;
- a IA apenas interpretará métricas e contexto, sem gerar avaliações;
- avaliações objetivas, questões, tentativas, taxa de acerto e análise de Bloom baseada em respostas serão retiradas da jornada nova.

## 1. Forma de registro da sessão

### Registro manual

O usuário informa início e fim no mesmo formulário. O servidor valida os horários e calcula a duração. Permite registrar estudos anteriores e não exige que a aplicação permaneça aberta.

Decisões associadas:

- quão antiga pode ser a sessão;
- se uma sessão em andamento pode ser registrada;
- se horários podem ser corrigidos posteriormente;
- como tratar sessões que atravessam a meia-noite.

### Cronômetro

O servidor grava o início quando o usuário seleciona “Iniciar sessão” e grava o fim ao selecionar “Encerrar”. A sessão permanece ativa entre as duas operações.

Decisões associadas:

- quantidade de sessões ativas por conta;
- retorno após fechar o navegador;
- tratamento de sessão esquecida;
- duração mínima;
- possibilidade de correção posterior.

### Ambos

O módulo oferece “Iniciar agora” e “Registrar sessão concluída”. Os modos precisam produzir o mesmo contrato final e impedir duplicidade, sobreposição indevida e múltiplas sessões ativas incompatíveis.

### Recomendação provisória

Começar pelo registro manual e preparar o modelo para cronômetro posterior. Se o cronômetro for requisito central, os dois modos devem ser definidos antes da migração.

## 2. Dificuldade e compreensão percebidas

Essas escalas representam percepção, não resultado objetivo.

- **Dificuldade percebida:** quão difícil foi estudar o conteúdo.
- **Compreensão percebida:** quanto o usuário considera ter compreendido.

Alternativas:

- manter ambas obrigatórias: mais consistência, mais atrito;
- manter ambas opcionais: registro simples, amostra parcial;
- manter somente uma: reduz a interface e a análise;
- remover ambas: elimina percepção versus resultado.

Se forem mantidas, métricas e interface devem informar quantas sessões realmente possuem as escalas. Associação com nota não pode ser apresentada como causalidade.

### Decisão aprovada

Dificuldade e compreensão percebidas serão obrigatórias para concluir uma sessão. Sessões apenas planejadas ainda não exigem esses valores.

## 3. Materiais no novo modelo

Sem tópico, um material pode passar a pertencer diretamente ao módulo. A sessão pode selecionar zero ou vários materiais utilizados.

O vínculo deve ser opcional porque o estudo pode usar aula presencial, anotações físicas, discussão ou conteúdo não cadastrado. Os formatos devem continuar declarados na sessão e não ser inferidos exclusivamente dos materiais.

Alternativas:

- remover a biblioteca;
- manter biblioteca apenas no módulo;
- manter biblioteca e permitir vínculo opcional com sessões;
- exigir material em toda sessão.

### Decisão aprovada

Biblioteca por módulo e vínculo opcional de vários materiais por sessão.

## 4. Avaliações no novo modelo

### Decisão aprovada

O novo modelo não terá avaliações objetivas. Não haverá quiz, questões com gabarito, tentativas ou taxa de acerto. Dificuldade e compreensão percebidas continuarão como registros subjetivos da sessão, sem serem apresentadas como avaliação objetiva.

As estruturas antigas devem ser preservadas durante a migração e removidas somente depois que métricas, histórico, seed e demais consumidores não dependerem mais delas.

<!-- Registro das alternativas analisadas antes da decisão. -->

### Avaliação do módulo

É reutilizável e pode cobrir várias sessões. Facilita comparação entre tentativas, mas não identifica automaticamente qual sessão preparou o usuário.

### Avaliação da sessão

Verifica diretamente o conteúdo de uma sessão. Oferece contexto explícito, mas pode gerar avaliações descartáveis e dificulta reutilização entre sessões.

### Modelo híbrido

A avaliação pertence ao módulo e cada tentativa pode referenciar opcionalmente uma sessão. Preserva reutilização e acrescenta contexto quando ele existir.

Também precisam ser definidos:

- avaliação sem sessão anterior;
- várias tentativas por sessão;
- tentativa relacionada a mais de uma sessão;
- autoria manual ou rascunho gerado pela IA;
- permanência de nível de Bloom.

### Resultado

As alternativas de avaliação do módulo, da sessão ou híbrida foram rejeitadas para a nova jornada.

## 5. Edição e arquivamento de sessões concluídas

### Edição completa

Permite corrigir período, descrição, métodos, formatos, materiais e percepções. O servidor recalcula a duração e todas as métricas afetadas.

### Edição limitada

Preserva início e fim e permite alterar somente informações contextuais. Evita mudança de duração, mas não corrige horários digitados incorretamente.

### Correção com rastreabilidade

Permite edição e mantém data de atualização, indicação de correção e, se necessário, histórico de versões.

### Sem edição

A sessão incorreta é arquivada e substituída. Preserva imutabilidade, mas torna erros simples trabalhosos.

Arquivamento também exige uma regra: a sessão arquivada continua ou deixa de participar das métricas. Exclusão física não deve ocorrer quando houver tentativas, desafios ou outras evidências relacionadas.

### Decisão aprovada

Todos os campos de uma sessão concluída poderão ser editados. Horários alterados exigem novo cálculo de duração; métodos, formatos, descrição e percepções atualizam as métricas e interpretações posteriores. Sessões arquivadas continuarão participando das métricas.

## 6. Sobreposição, datas futuras e fuso horário

### Sobreposição

Duas sessões sobrepostas podem duplicar minutos. As opções são bloquear, permitir com aviso e regra de deduplicação, ou aceitar a soma integral.

### Datas futuras

Uma sessão futura representa planejamento, não evidência concluída. As opções são rejeitar datas futuras ou criar posteriormente uma entidade separada de sessão planejada.

### Fuso horário

Datas devem permanecer armazenadas em UTC e ser apresentadas no fuso aprovado: conta, navegador ou fuso fixo do projeto.

### Decisão aprovada

Sessões sobrepostas serão bloqueadas. Sessões futuras nascerão como planejadas e não participarão das métricas até serem concluídas. A apresentação usará o fuso do navegador e o armazenamento continuará em UTC.

## 7. Uso da descrição pela IA

### Não enviar

A IA recebe somente quantidade de sessões, duração, métodos, formatos, percepções, período e amostra. É a opção compatível com o contrato anterior de minimização de dados.

### Enviar integralmente

Permite feedback por conteúdo, mas a descrição pode conter dados pessoais, conteúdo sensível ou material protegido. Exige novo contrato de privacidade e aviso explícito.

### Envio opcional

O usuário autoriza determinadas descrições. Exige registrar a escolha, explicar o destino e definir retenção e limites.

Sanitização automática pode reduzir exposição, mas não deve ser considerada anonimização garantida.

Se a IA gerar avaliações a partir da descrição, também devem ser definidos revisão humana, não publicação automática, limite de conteúdo e contingência sem provedor.

### Decisão aprovada

As descrições serão incluídas sempre que o usuário solicitar uma interpretação. A IA somente interpretará métricas e contexto; não gerará avaliações, não calculará notas e não alterará registros.

## Encerramento da Fase 0

Não restam decisões funcionais pendentes para iniciar a Fase 1. Divergências técnicas descobertas durante a inspeção do repositório devem ser relatadas antes de alterar dados ou comportamento.

## Resumo executivo

A sessão substituirá o tópico como unidade central. Haverá registro manual e cronômetro, vários métodos e formatos, descrição enviada na análise por IA, percepções obrigatórias na conclusão, edição completa, bloqueio de sobreposição, materiais opcionais por sessão e sessões futuras planejadas. Não haverá avaliações objetivas. A IA será exclusivamente interpretativa.

O contrato funcional está aprovado e pronto para orientar o novo modelo de dados e a migração aditiva da Fase 1.
