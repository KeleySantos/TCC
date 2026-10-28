# Desenho da Sala como organizadora de módulos privados

**Estado:** implementado e validado em 2026-10-28  
**Agente de execução previsto:** Guanabara  
**Origem:** correção funcional solicitada em 2026-10-28 sobre o desenho anterior da Sala

## Intenção

A Sala deve funcionar somente como uma pasta que agrupa módulos compartilhados. Autorização, convite, participação, dashboard e compartilhamento de dados pertencem a cada módulo, nunca à Sala inteira.

Essa separação impede que o acesso a um módulo revele ou autorize qualquer outro módulo da mesma Sala. Ela mantém o funcionamento atual das instâncias pessoais: no primeiro acesso ao módulo compartilhado, o participante cria um módulo pessoal com o mesmo nome ou vincula um módulo pessoal existente.

## Objetivos

- tornar a participação em módulo a fonte de verdade da autorização;
- gerar e aceitar convites exclusivamente para um módulo identificado;
- ocultar integralmente módulos não autorizados, inclusive nome, descrição e participantes;
- manter dashboards agregados e individuais somente na página do módulo;
- permitir ao administrador visualizar, na Sala, a união dos participantes dos seus módulos e as respectivas participações;
- fazer o acesso do participante à Sala surgir com sua primeira participação ativa e terminar com a última;
- preservar propriedade e privacidade dos módulos pessoais, sessões e materiais.

## Não objetivos e antiobjetivos

- não criar dashboard consolidado da Sala;
- não permitir convite ou entrada genérica na Sala;
- não revelar aos participantes a lista geral da Sala nem módulos sem autorização;
- não transferir a propriedade de um módulo pessoal;
- não criar papéis administrativos delegáveis nesta entrega;
- não alterar fórmulas, amostras mínimas ou linguagem observacional dos dashboards.

Será considerado erro de segurança se um participante do módulo A conseguir descobrir, consultar ou alterar o módulo B apenas por ambos estarem na mesma Sala. Também será erro usar a presença em `MembroSala` como autorização suficiente para qualquer módulo.

## Restrições

- a aplicação permanece em Next.js, TypeScript estrito, Prisma e SQLite;
- toda decisão de acesso deve ser verificada no servidor;
- esta versão usa somente dados sintéticos;
- convites persistem somente o resumo criptográfico do código, com expiração e revogação;
- desligamentos preservam apenas a evidência histórica mínima e pseudonimizada já prevista;
- a migração deve preservar vínculos e evidências existentes sem ampliar acesso.

## Abordagens consideradas

### 1. Participação própria por módulo — escolhida

Criar uma entidade de participação no módulo, separada do vínculo com a instância pessoal. O convite cria essa participação; o primeiro acesso cria ou associa a instância. A Sala deriva seus participantes da união das participações ativas.

**Vantagens:** representa o estado "participa, mas ainda não vinculou uma instância", simplifica a autorização e reduz vazamento de metadados.  
**Custo:** exige migração de schema, serviços, convites, consultas e testes.

### 2. Transformar o vínculo atual em participação

Tornar `moduloPessoalId` opcional em `VinculoModuloSala` e usar o mesmo registro para acesso e compartilhamento. Exige menos entidades, mas mistura autorização, primeiro acesso e compartilhamento, criando estados ambíguos.

### 3. Manter membro da Sala e acrescentar permissões

Preservar `MembroSala` como porta de entrada e adicionar permissões por módulo. Altera menos o legado, porém mantém duas fontes de autorização e contradiz a Sala como simples pasta.

## Modelo de dados proposto

### `ParticipacaoModuloSala`

Será a fonte de verdade para acesso ao módulo compartilhado:

- identifica `ModuloSala` e `Usuario`;
- diferencia `ADMINISTRADOR` e `PARTICIPANTE`;
- registra situação ativa ou encerrada e datas de entrada e saída;
- possui unicidade por módulo e usuário;
- cada módulo criado recebe uma participação administrativa do proprietário da Sala;
- nesta entrega, somente o proprietário da Sala pode ocupar o papel administrativo.

### `ConviteModuloSala`

Substitui novos convites genéricos de Sala:

- aponta obrigatoriamente para um `ModuloSala`;
- registra criador, resumo criptográfico do código, expiração e revogação;
- pode ser criado e revogado somente pelo administrador;
- aceitar um convite cria ou reativa apenas a participação naquele módulo;
- o código em texto puro é exibido apenas no momento da criação.

### `VinculoModuloSala`

Continua conectando a participação a um `ModuloAprendizagem` pessoal:

- passa a referenciar `ParticipacaoModuloSala` em vez de depender de `MembroSala` para autorização;
- somente uma participação ativa pode criar ou reativar o vínculo;
- a ausência de vínculo é normal logo após aceitar o convite;
- quando ativo, alimenta automaticamente dashboard, comparações e interpretação;
- ao sair do módulo, é encerrado e preserva as evidências históricas mínimas.

### Papel de `MembroSala`

`MembroSala` deixa de autorizar consultas. Os registros existentes permanecem como histórico durante a transição, mas novas entradas comuns não dependem deles. A presença na Sala passa a ser calculada pela existência de ao menos uma `ParticipacaoModuloSala` ativa.

## Regras de autorização

### Administrador

O proprietário da Sala:

- vê todos os módulos ativos da Sala;
- cria, arquiva e administra módulos;
- gera e revoga convites dentro de cada módulo;
- acessa as abas `Dashboard` e `Membros` de cada módulo;
- vê na Sala a lista deduplicada de participantes, excluindo a si próprio, com os módulos de cada pessoa.

### Participante

Um participante comum:

- acessa a Sala somente enquanto possui ao menos uma participação ativa;
- recebe do servidor apenas os cards dos módulos autorizados;
- não recebe nomes, descrições, contagens ou participantes dos demais módulos;
- não vê a lista geral de participantes;
- não vê abas administrativas nem dashboards de outros participantes;
- pode criar ou vincular sua instância pessoal no primeiro acesso;
- pode sair de um módulo ou sair da Sala, encerrando neste caso todas as participações ativas.

Quando a última participação é encerrada, o participante perde automaticamente o acesso à Sala e deixa a lista geral.

## Fluxos

### Criação de módulo

1. O proprietário usa o botão discreto `+` na Sala.
2. O servidor cria `ModuloSala` e sua participação administrativa na mesma transação.
3. O card aparece na grade da Sala.

### Convite e entrada

1. O administrador abre o módulo e entra na aba `Membros`.
2. Gera um código ou link contextualizado para aquele módulo.
3. O convidado autenticado vê Sala e módulo antes de confirmar.
4. A confirmação cria ou reativa somente a participação no módulo convidado.
5. O participante é direcionado à página desse módulo.

### Primeiro acesso e instância

1. Sem vínculo ativo, a página oferece criar uma instância pessoal com o mesmo nome ou vincular um módulo pessoal elegível.
2. A escolha cria o `VinculoModuloSala` e inicia o compartilhamento automático dos indicadores permitidos.
3. Materiais, descrições de sessão e outros dados brutos permanecem privados.

### Saída

- `Sair do módulo` encerra uma participação e seu vínculo, sem apagar o módulo pessoal.
- `Sair da Sala` encerra em uma transação todas as participações e vínculos ativos do participante na Sala.
- evidências históricas pseudonimizadas permanecem somente no agregado, conforme a regra vigente.

## Interface

### Página da Sala

- mantém cabeçalho, nome e descrição;
- prioriza a grade de cards de módulos e o botão discreto `+`;
- não contém dashboard da Sala;
- para administrador, mostra abaixo da grade a lista geral de participantes e suas participações;
- para participante, renderiza somente seus módulos autorizados e o controle de saída.

### Página do módulo

- o administrador recebe as abas `Dashboard` e `Membros`;
- `Dashboard` apresenta apenas o agregado daquele módulo;
- `Membros` lista participantes comuns, permite gerar ou revogar convites e abre à direita o dashboard individual selecionado;
- participantes sem instância aparecem como `Aguardando vínculo`, sem dashboard individual;
- o participante comum recebe somente seu fluxo de instância e o acesso ao próprio módulo pessoal.

## Dashboard e privacidade

- somente vínculos ativos contribuem com dados vivos;
- participações sem instância não entram nas métricas;
- o agregado continua sujeito à amostra mínima vigente;
- lista nominal e dashboard individual ficam restritos ao administrador;
- a Sala não agrega nem compara dados entre módulos;
- consultas filtram autorização antes de carregar metadados, evitando vazamento por resposta, erro ou contagem.

## Migração e compatibilidade

1. Criar as novas entidades e restrições por migração versionada.
2. Criar participação administrativa para o proprietário em cada módulo ativo.
3. Para cada `VinculoModuloSala` ativo, criar ou reativar participação no mesmo módulo e associar o vínculo a ela.
4. Manter registros históricos e evidências sem ampliar o escopo de nenhum vínculo.
5. Revogar convites de Sala ainda ativos, pois não é possível inferir com segurança qual módulo pretendiam autorizar.
6. Membros antigos sem vínculo ativo deixam de ter acesso, pois não possuem participação demonstrável.
7. Preservar tabelas históricas legadas enquanto necessárias; elas não participam de novas decisões de acesso.

## Estados e erros esperados

- convite inválido, expirado ou revogado não revela Sala nem módulo;
- convite já aceito informa participação existente sem duplicidade;
- módulo arquivado não aceita convites ou novas participações;
- participante sem instância vê o fluxo de primeiro acesso;
- participante sem participações ativas recebe recurso não encontrado ao abrir a Sala;
- módulo não autorizado usa resposta indistinguível de módulo inexistente;
- falha ao encerrar um vínculo reverte toda a operação de saída correspondente.

## Critérios de aceitação

1. Um convite identifica exatamente um módulo e nunca concede acesso aos demais.
2. Um participante do módulo A não recebe metadado dos módulos B e C.
3. Aceitar o primeiro convite torna a Sala acessível; convites adicionais acrescentam somente os respectivos cards.
4. O primeiro acesso oferece criar instância homônima ou vincular módulo pessoal existente.
5. Sair do último módulo remove automaticamente o acesso à Sala.
6. A página da Sala não possui dashboard consolidado.
7. O administrador vê participantes deduplicados e suas participações; participantes comuns não veem essa lista.
8. As abas `Dashboard` e `Membros` existem somente para o administrador dentro do módulo.
9. Participações sem instância aparecem como pendentes e não contribuem com métricas.
10. Saída e migração preservam o módulo pessoal e as evidências históricas permitidas.

## Decisões do construtor sujeitas à conferência

- o proprietário da Sala é o único administrador de seus módulos nesta entrega;
- `Sair da Sala` permanece como atalho para sair de todos os módulos;
- convites genéricos antigos ainda ativos serão revogados na migração por não possuírem escopo seguro;
- participantes aceitos, mas sem instância, aparecem como `Aguardando vínculo`.
