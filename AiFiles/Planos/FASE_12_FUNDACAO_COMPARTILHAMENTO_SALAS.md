# Fase 12 — Fundação de compartilhamento para salas

## Estado

- **Situação:** concluída e validada localmente
- **Origem:** decisões explícitas do autor em 2026-09-20
- **Agente de execução:** Guanabara
- **Dependência:** módulos pessoais orientados a sessões e remoção definitiva de tópicos e avaliações
- **Próxima fase:** Fase 13 — página e dashboards completos de salas

## Objetivo

Criar a fundação segura que permitirá acompanhar estudos em grupo sem transformar módulos pessoais em conteúdo coletivo. A sala organiza módulos-pai; cada participante usa uma instância pessoal criada do zero ou vincula um módulo que já possui. O proprietário enxerga somente dashboards autorizados, nunca sessões, materiais ou a administração interna da instância.

## Princípios obrigatórios

1. Qualquer conta autenticada pode criar uma sala e se torna sua proprietária.
2. Existem apenas os papéis `PROPRIETARIO` e `MEMBRO`.
3. A entrada ocorre por código ou link, sempre como solicitação pendente de aprovação.
4. Uma sala deve possuir de um a cinco módulos-pai quando estiver em uso; a fundação permite a criação inicial da sala vazia e conduz imediatamente à criação do primeiro módulo.
5. Um módulo-pai é contexto de agregação, não uma cópia de materiais ou sessões.
6. Cada vínculo aponta para um módulo pessoal independente pertencente ao membro.
7. O membro pode criar uma instância vazia ou vincular um módulo pessoal já existente.
8. Desvincular, sair, ser removido ou excluir a sala nunca apaga nem arquiva o módulo pessoal.
9. O proprietário não recebe acesso a materiais, sessões, descrições ou configurações da instância.
10. O proprietário pode publicar comentários para toda a sala, para um módulo-pai ou privadamente para um membro.
11. Membros não publicam comentários nesta entrega e não veem dashboards de outros membros.
12. Comparação nominal e interpretação por IA exigem consentimentos independentes e revogáveis.
13. A IA só poderá receber dados do membro quando o consentimento específico estiver ativo.
14. Não haverá ranking. Comparações futuras serão descritivas, contextuais e optativas.
15. Após revogação, nenhum dado novo alimenta o vínculo e o acesso individual termina imediatamente.
16. Na Fase 13, dados anteriores poderão permanecer somente como resumo agregado anônimo, sem reabrir acesso individual.

## Escopo funcional

### Sala

- criar com nome e descrição;
- gerar identificador público opaco;
- listar salas próprias e salas das quais a conta é membro;
- arquivar e excluir logicamente;
- impedir transferência de propriedade nesta versão;
- permitir que o membro saia quando quiser;
- permitir que o proprietário remova membros;
- preservar os módulos pessoais quando a sala deixar de existir.

### Convite e aprovação

- proprietário gera convite aleatório utilizável como código e link;
- persistir apenas o resumo criptográfico do código, nunca o segredo em texto aberto;
- permitir revogação e expiração;
- conta convidada solicita entrada;
- impedir solicitação do proprietário, duplicidade pendente e nova solicitação de membro ativo;
- proprietário aprova ou rejeita;
- aprovação cria ou reativa a associação de membro;
- respostas não podem enumerar contas nem revelar a existência de recursos alheios.

### Módulo-pai e instância

- proprietário cria até cinco módulos-pai por sala;
- membro ativo pode participar de nenhum, um ou vários módulos da mesma sala;
- ao aderir, escolhe:
  - criar um módulo pessoal vazio com o nome e a descrição do módulo-pai; ou
  - vincular um módulo pessoal configurado, ativo e próprio;
- uma instância pessoal só pode possuir um vínculo ativo com o mesmo módulo-pai;
- um membro só pode possuir uma instância ativa por módulo-pai;
- vínculo não copia nem move histórico, materiais ou sessões: o histórico já existente passa a compor o dashboard autorizado por permanecer na mesma instância;
- desvincular preserva integralmente a instância pessoal.

### Consentimentos

Cada vínculo ativo mantém três permissões:

- `compartilharDashboard`: necessária para alimentar o dashboard do módulo-pai; desligá-la encerra o vínculo ativo;
- `permitirComparacao`: opcional, desativada por padrão e revogável pelo membro;
- `permitirIa`: opcional, desativada por padrão e revogável pelo membro.

O proprietário não pode conceder consentimento em nome do membro. Remoção, saída, arquivamento ou exclusão invalidam os acessos dependentes.

### Comentários

- somente o proprietário publica;
- escopos válidos: `SALA`, `MODULO` e `MEMBRO`;
- comentário de sala é visível a todos os membros ativos;
- comentário de módulo é visível apenas ao proprietário e aos membros com vínculo ativo naquele módulo-pai;
- comentário individual é visível apenas ao proprietário e ao destinatário ativo;
- texto entre 1 e 2.000 caracteres;
- comentários permanecem auditáveis, sem edição nesta primeira versão.

### Auditoria

Registrar sem conteúdo excessivo:

- criação, arquivamento e exclusão lógica de sala;
- geração e revogação de convite;
- solicitação, aprovação e rejeição de entrada;
- saída e remoção de membro;
- criação de módulo-pai;
- criação, vínculo e desvínculo de instância;
- alteração de consentimentos;
- publicação de comentário, registrando apenas escopo e identificadores técnicos.

## Modelo de dados proposto

- `Sala`: proprietário, nome, descrição, identificador, situação e datas.
- `MembroSala`: sala, usuário, papel, situação e datas de entrada/saída/remoção.
- `ConviteSala`: sala, hash do código, expiração, revogação e criador.
- `SolicitacaoEntradaSala`: convite, sala, solicitante, situação e decisão.
- `ModuloSala`: sala, título, descrição, posição e situação.
- `VinculoModuloSala`: módulo-pai, membro, módulo pessoal, estado e consentimentos.
- `ComentarioSala`: autor proprietário, escopo, módulo ou destinatário opcionais e conteúdo.
- `EventoAuditoria`: reutilizado para registrar ações sensíveis.

## Serviços e autorização

Criar `src/servidor/salas.ts` como fronteira única das regras. Todas as operações devem:

- validar entrada com Zod;
- exigir conta autenticada nas ações;
- conferir propriedade, associação ativa e escopo no servidor;
- retornar DTOs mínimos, sem entidades Prisma indiscriminadas;
- usar transação nas mudanças que afetam mais de uma tabela;
- responder como indisponível para recurso inexistente ou alheio;
- nunca consultar dados internos do módulo pessoal para o proprietário.

## Interface funcional da Fase 12

A rota `/salas` entregará a fundação, ainda sem os dashboards analíticos da Fase 13:

- criação e listagem de salas;
- detalhe da sala para proprietário ou membro;
- criação dos módulos-pai pelo proprietário;
- geração, exibição única e revogação de convite;
- formulário para usar código de convite;
- fila de solicitações para aprovação ou rejeição;
- entrada em módulo-pai criando ou vinculando uma instância;
- controles de consentimento e desvínculo;
- comentários conforme o escopo;
- saída, remoção, arquivamento e exclusão lógica;
- estados vazio, sucesso, erro e ações indisponíveis;
- navegação por teclado e reflow em 360 px.

Os dashboards geral da sala, agregado por módulo e individual autorizado serão implementados na Fase 13 sobre os vínculos e consentimentos desta fase.

## Critérios de aceite

1. Conta A cria sala, módulo-pai e convite.
2. Conta B usa código ou link, mas não entra antes da aprovação.
3. Conta A aprova B; conta C não acessa a sala.
4. B cria instância vazia ou vincula módulo próprio preexistente.
5. A não consegue ler materiais, sessões nem descrições internas de B.
6. B ativa e revoga separadamente comparação e IA.
7. A não altera os consentimentos de B.
8. B desvincula e continua dona de seu módulo, sem novo compartilhamento.
9. B sai ou é removida sem perder módulos pessoais.
10. Excluir a sala não apaga módulos pessoais vinculados.
11. Comentários respeitam sala, módulo e destinatário.
12. Convite expirado ou revogado não cria solicitação.
13. Uma sala não aceita mais de cinco módulos-pai.
14. Toda ação horizontal retorna indisponibilidade sem vazar dados.
15. Migração funciona no banco existente e em banco vazio; `foreign_key_check` não encontra violações.
16. Lint, tipos, testes, build, scanner de segredos e verificadores passam.

## Fora do escopo desta fase

- dashboards e gráficos das salas;
- comparação visual entre membros;
- envio de dados coletivos à IA;
- chat ou comentários de membros;
- compartilhamento de materiais ou sessões;
- cópia automática de materiais do módulo-pai;
- transferência de propriedade;
- ranking, pontuação ou competição;
- notificações externas por e-mail ou push;
- uso de dados reais.

## Ordem de implementação

1. registrar requisito, decisão e risco;
2. criar schema e migração aditiva;
3. gerar cliente Prisma;
4. implementar serviço e auditoria;
5. implementar ações e páginas funcionais;
6. adicionar navegação;
7. criar testes de regra, autorização e preservação de dados;
8. atualizar contratos, modelo de dados, matriz e acompanhamento;
9. validar banco existente e banco reiniciado;
10. executar validação completa e religar o servidor.
