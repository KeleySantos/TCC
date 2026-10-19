# Compartilhamento de dashboards de módulos

Data: 18/10/2026.

## Funcionalidade entregue

O proprietário pode compartilhar o dashboard de um módulo configurado e ativo com até **três convidados**. O módulo continua pertencendo à conta original, sem duplicação de materiais, sessões ou indicadores.

### Como utilizar

1. Abra um módulo próprio e clique em **Compartilhar**, no cabeçalho.
2. No modal, gere o código e clique em **Copiar código**. O modal mostra o contador e os nomes dos convidados ativos.
3. Na outra conta, abra **Salas → Compartilhado comigo**, informe o código e clique em **Acessar por código**.
4. Abra o card recebido. Ele identifica o módulo e o proprietário; o dashboard permite consultar indicadores e filtros, sem editar dados ou abrir materiais privados.
5. O botão de IA utiliza o mesmo componente e modal lateral do Dashboard principal. Os dados são do módulo compartilhado, enquanto autorização e cota pertencem ao solicitante.
6. Para revogar, abra novamente o modal do proprietário e use **Remover acesso**, com confirmação. **Encerrar compartilhamento** revoga todos os convidados e invalida o código. Reiniciar gera outro código, sem restaurar os acessos antigos.

As abas **Salas** e **Compartilhado comigo** seguem a apresentação das abas vigentes de Módulo, incluindo tokens de cor, borda inferior ativa, espaçamentos, tipografia e navegação por teclado. O conteúdo original de Salas permanece na primeira aba.

## Permissões e dados

- O proprietário não ocupa vaga e não aceita o próprio código.
- A adesão repetida informa que o acesso já existe e não consome outra vaga.
- Códigos de módulo e de Sala não se misturam.
- A quarta pessoa é impedida no servidor. Transações, vagas de 1 a 3 e índice único protegem também contra concorrência.
- O convidado recebe somente dados dos painéis. Descrições privadas de sessões, arquivos, materiais e controles operacionais não são enviados no dashboard compartilhado.
- As rotas pessoais continuam verificando propriedade: o novo vínculo não autoriza editar sessões ou outros registros do proprietário.
- Novas consultas e gerações de IA verificam o acesso. Operações demoradas verificam novamente antes de devolver o resultado; uma nova concessão não valida uma resposta iniciada no vínculo anterior.
- A interface reconsulta permissões ao retornar foco/visibilidade e ao solicitar dados. Ao detectar a perda de acesso, remove o dashboard e suas respostas. Não há polling contínuo ou WebSocket; dados anteriormente recebidos pelo navegador não podem ser retroativamente retirados de cópias externas.
- A lista de módulos próprios mostra o indicador de compartilhamento quando há convidados ativos e é atualizada ao retomar a página. A lista recebida também é reconsultada ao retomar.
- Remover uma pessoa não altera o código ativo: ela poderá aceitar novamente esse código enquanto houver vaga. Para invalidar o convite distribuído, utilize **Encerrar compartilhamento** e gere um novo.
- Módulos arquivados ou em rascunho não concedem acesso compartilhado. Exclusões físicas removem os vínculos por cascade.

## Persistência e migração

Migração: `prisma/migrations/20261018210000_compartilhamento_modulos/migration.sql`.

| Estrutura | Finalidade |
|---|---|
| `CompartilhamentoModulo` | Um registro por módulo, hash do código ativo e sua cópia cifrada para consulta exclusiva do proprietário. |
| `AcessoModuloCompartilhado` | Associação única módulo/convidado, datas e vaga ativa de 1 a 3; vaga nula representa acesso revogado. |

A cópia recuperável do código usa a infraestrutura AES-GCM existente, com contexto criptográfico exclusivo do módulo. Não há código em texto simples armazenado no banco ou exposto à listagem de convidados.

A migração foi aplicada sem reset ou seed, após backup em `.dados/backups/antes-compartilhamento-modulos-20261018-1955.db`. A comparação antes/depois confirmou os mesmos registros e conteúdos nas tabelas de usuários, módulos, sessões, materiais, salas e configurações de IA. O banco apresentou zero violações de chave estrangeira.

## Arquivos principais

| Área | Arquivos criados ou alterados |
|---|---|
| Banco | `prisma/schema.prisma` e a nova migração. |
| Serviços | `src/servidor/compartilhamento-modulos.ts`, `dashboard-compartilhado.ts`, `api-compartilhamentos.ts` e ajuste de contagem em `modulos.ts`. |
| IA | Novo `src/servidor/ia/interpretacao-compartilhada.ts` e executor de DTO autorizado em `interpretacoes.ts`, reutilizando a integração atual. |
| APIs do proprietário | `/api/modulos/[identificador]/compartilhamento` e `/api/modulos/[identificador]/compartilhamento/[convidadoId]`. |
| APIs do convidado | `/api/compartilhamentos/modulos`, `/api/compartilhamentos/modulos/[moduloId]` e `/api/compartilhamentos/modulos/[moduloId]/interpretacoes`. |
| Modal e cards próprios | `src/componentes/compartilhamento-modulo.tsx` e CSS; `atualizar-ao-retomar.tsx`; páginas de listagem e detalhe de módulos e estilo do indicador. |
| Salas | `src/app/salas/page.tsx`, `abas-salas.tsx` e CSS, `modulos-compartilhados.tsx` e formulário em `page.module.css`. |
| Dashboard recebido | `src/app/salas/compartilhados/[moduloId]/page.tsx`, `dashboard-compartilhado.tsx` e CSS. |
| Modal de IA | `src/componentes/interpretacao-automatica.tsx`, com contexto compartilhado e tratamento de acesso perdido, mantendo os demais fluxos. |
| Verificação | Nove novos arquivos `.test.ts`, `testes/utilitarios/banco-compartilhamento.ts`, `scripts/verificar-compartilhamento-modulos.ts` e comando em `package.json`. |
| Rastreabilidade | Matriz RCM-001 a RCM-004, acompanhamento, decisão arquitetural, desenho e plano aprovados. |

## Testes e verificações

- **225 testes aprovados em 64 arquivos**: `npm run testar -- --maxWorkers=2`.
- **15 testes de serviço/API/IA aprovados**: `npm run testar:compartilhamento-modulos`. Utilizam SQLite temporário e não modificam os dados da demonstração.
- **Lint sem erros ou avisos**, **verificação de tipos** e **scanner de segredos** aprovados.
- **Build de produção aprovado**: `npm run compilar`, incluindo geração do Prisma, TypeScript e todas as novas rotas.
- Os testes cobrem capacidade e concorrência, duplicatas, códigos cruzados, proprietário, revogação, reativação, encerramento, integridade, período, consultas privadas, edição negada, DTO mínimo e cota do solicitante.
- A revogação durante IA é verificada com execução controlada, inclusive remoção e reativação no mesmo milissegundo. Nenhum provedor real é chamado.
- Componentes verificados com Testing Library: confirmação/cancelamento, falha de clipboard, teclado das abas, formulário/cards, endpoint compartilhado e tratamento de respostas atrasadas/perda de acesso.
- No navegador: abertura do modal, geração/cópia/encerramento, abas, adesão por código, card com proprietário e dashboard de leitura, seguido de acesso negado e remoção do card ao eliminar a fixture.
- A aparência das abas foi comparada por estilos computados com a tela de Módulo: cor, borda inferior, padding, peso e tamanho da fonte coincidiram.

Uma execução inicial irrestrita da suíte apresentou três falhas de inicialização de workers por erros `UNKNOWN` de leitura de arquivos do Windows. A suíte foi repetida com dois workers e passou integralmente. Nenhuma configuração de dependências foi alterada para contornar esse problema.

## Limites da validação e decisões

- Não foi executada uma geração real da Groq: integração e contingência foram exercitadas com mocks/ausência controlada de credencial. Portanto, a entrega não consumiu créditos nem validou disponibilidade externa do modelo.
- O corpus e os critérios C1–C5 do TCC não foram alterados.
- A revisão final foi feita pelo próprio executor, respeitando a escolha de trabalhar sem subagentes; não houve revisão independente nem publicação/merge.
- O script dedicado reutiliza os testes isolados em vez de duplicar suas regras. Ele também dispõe de `--preparar-interface` e `--limpar-interface` para uma fixture explicitamente identificada, sem login válido e fora do corpus do TCC. A fixture usada nesta execução foi removida; nenhum convidado de teste ficou ativo.

## Roteiro curto de validação manual

1. Compartilhe um módulo e aceite em três contas diferentes. Uma quarta deve receber mensagem de capacidade completa.
2. Repita a adesão com uma conta já aceita e confira que o contador não aumenta.
3. Remova um convidado e tente acessar sua URL novamente. Acesso e novas interpretações devem ser negados; outra conta pode ocupar a vaga.
4. Encerre o compartilhamento e tente usar o código antigo. Depois gere outro código e confira que os antigos convidados não voltam automaticamente.
5. Compare as abas de Salas com as de Módulo e navegue com setas, Home e End.
6. Confira os gráficos do convidado e a ausência de controles de edição. A geração real de IA é opcional e, se acionada com credencial ativa, pode consumir a cota da Groq.

## Registro final

Build final concluído com código de saída 0. Servidor de desenvolvimento reiniciado em `http://localhost:3000` para carregar o cliente Prisma atualizado. Alterações permanecem na pasta e branch existentes, sem commit, merge ou publicação; mudanças anteriores do usuário foram preservadas.
