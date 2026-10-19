# Desenho técnico — Compartilhamento de dashboards de módulos

Data: 18/10/2026.

Situação: desenho e plano aprovados pelo usuário; implementação concluída em 18/10/2026. Evidências no [relatório de implementação](../RELATORIOS/IMPLEMENTACAO_COMPARTILHAMENTO_MODULOS.md).

## Objetivo e referência

Permitir ao proprietário compartilhar o dashboard de um módulo com até três outros usuários simultaneamente, por código, sem transferir propriedade, duplicar dados ou permitir edição. A referência funcional é `ESPECIFICACAO_COMPARTILHAMENTO_MODULOS_CODEX.md`, fornecida pelo usuário.

Complemento explícito do usuário: as abas de Salas devem ter a mesma aparência das abas existentes na tela de Módulo.

## Solução escolhida

Criar vínculos próprios de compartilhamento de módulos, separados das entidades de Salas, preservando o monólito modular Next.js, os serviços de servidor e o SQLite/Prisma existentes.

Alternativas descartadas:

- Reaproveitar vínculos de Salas como autorização dos convidados: mistura contextos e altera regras existentes sem necessidade.
- Duplicar o módulo para cada convidado: contraria a propriedade única e deixa de apresentar os dados atuais do proprietário.

## Persistência e ciclo de vida

- Um compartilhamento pertence a um único módulo; mantém código ativo e identificação do proprietário pelo próprio módulo.
- Os vínculos identificam módulo e convidado, com estado ativo/revogado. A combinação módulo/convidado é única; aceitar novamente um convite válido pode reativar um vínculo revogado, sujeito ao limite.
- O proprietário não ocupa vaga e não pode aderir ao próprio código.
- O máximo de três acessos ativos é validado dentro de operação transacional compatível com o SQLite. A verificação e a inclusão/reativação não podem ser operações independentes sujeitas à concorrência. A solução deve demonstrar esse comportamento por teste com tentativas simultâneas.
- A geração e normalização usam os padrões criptográficos existentes de Salas, com identificação de tipo inequívoca para módulos. Um código de módulo nunca pode ser interpretado como convite de sala, ou vice-versa.
- Gerar código é ação do proprietário; apenas abrir a listagem não cria vínculos.
- Remover um convidado revoga somente aquele vínculo. Se o proprietário mantiver o código ativo, ele continua permitindo adesões sujeitas às regras e às vagas; para invalidá-lo, utiliza Encerrar compartilhamento.
- Encerrar compartilhamento revoga todos os acessos e invalida o código. Reiniciar gera um código novo, sem reativar convidados automaticamente.
- Módulos arquivados ou em rascunho não concedem dashboard compartilhado. A exclusão física de módulos ou usuários remove os vínculos correspondentes por integridade referencial.

## Autorizações e dados expostos

Todas as operações identificam o solicitante pela sessão autenticada, nunca por um proprietário informado livremente pelo cliente.

O proprietário pode gerar/consultar o código, listar convidados e revogar acessos. O convidado ativo pode consultar somente o dashboard daquele módulo e solicitar sua interpretação. Consultas de métricas e geração de IA verificam autorização explicitamente no servidor; conhecer uma URL não concede acesso.

As rotas de edição pessoais continuam restritas ao proprietário. Não ampliar a autorização dos serviços pessoais para permitir operações em nome de outro usuário.

O dashboard compartilhado utiliza dados atuais do módulo original e devolve somente os dados necessários aos gráficos e indicadores. Não inclui gerenciamento de sessões, materiais, arquivos, configurações ou descrições privadas de sessões. Os nomes do módulo e do proprietário ficam visíveis.

Revogação impede novas consultas e gerações, inclusive em uma aba já aberta. A interface trata a perda de acesso, remove resultados anteriores ao detectar a revogação e apresenta mensagem adequada. Dados já recebidos pelo navegador antes da revogação não podem ser retroativamente apagados de cópias externas.

## Interface do proprietário

- Ação Compartilhar no cabeçalho do módulo, abrindo modal com nome, código, copiar, contador de vagas, nomes dos convidados e remoção individual.
- Remover acesso e Encerrar compartilhamento exigem confirmação.
- Indicador discreto no card próprio somente quando existir convidado ativo, com contagem até três; atualizar as consultas e a interface após operações de compartilhamento.
- Preservar todas as ações atuais dos cards e do módulo.

## Abas de Salas

As abas serão Salas e Compartilhado comigo. A primeira preserva o conteúdo e os fluxos atuais. A segunda apresenta entrada por código, mensagens, estado vazio e cards com nome do módulo e Compartilhado por: nome do proprietário.

Referência direta de implementação: `src/app/modulos/[identificador]/subabas-modulo.tsx` e estilos vigentes em `page.module.css` da mesma pasta.

Reproduzir a navegação horizontal com linha inferior, espaçamento de 20 px, botão transparente, destaque inferior com `var(--cor-acao)`, texto ativo com `var(--cor-texto)` e inativo com `var(--cor-texto-secundario)`. Preservar foco visível, responsividade, semântica `tablist`/`tab`/`tabpanel` e navegação por setas, Home e End. Não adotar abas em formato de pílulas ou um desenho visual diferente.

Reaproveitar o padrão existente sem acoplar Salas ao filtro de período específico do componente de módulo. O compartilhamento de estilos/comportamento deve ser pequeno e justificado, sem refatoração ampla das telas existentes.

## Dashboard e IA compartilhados

Reutilizar `ConteudoDashboardModulo` e seus painéis para métricas, resultados contextuais e conceitos. Apresentar filtro de período quando compatível com o dashboard original, sem as abas privadas de linha do tempo, sessões e materiais.

Para IA, a referência obrigatória é o uso de `InterpretacaoAutomatica` em `src/app/dashboard/page.tsx`, com `compacto` e `modalLateral`. Reutilizar o componente e seu modal lateral, cores, carregamento, apresentação das respostas e contingências; acrescentar apenas o contexto/endpoint compartilhado necessário. Não atualizar a experiência de IA das demais áreas neste escopo.

A geração utiliza métricas do proprietário, mas a identidade do solicitante continua sendo a do convidado para autorização e cota. O DTO compartilhado não inclui descrições privadas de sessões nem arquivos. A credencial global e o provedor Groq permanecem inalterados. As respostas não alteram registros de estudo e não criam um histórico persistido adicional.

Verificar o acesso antes de processar e novamente antes de devolver o resultado de operações demoradas, impedindo entrega de novas respostas após revogação detectada. Não fazer chamadas reais pagas para validar a implementação: usar provedores simulados nos testes.

## Erros e limites

Mensagens específicas para código inválido/inativo, capacidade completa, acesso já existente, tentativa de usar o próprio código e acesso revogado. Falhas da IA preservam os mecanismos atuais de contingência e identificação da origem da resposta.

Não adicionar dependências, alterar fórmulas de métricas, critérios C1–C5, dados experimentais ou funções de Salas sem relação com a entrega.

## Critérios de aceitação e validação

1. Proprietário gera e copia código; três convidados entram e o quarto é bloqueado, inclusive sob concorrência.
2. Aceitação duplicada não ocupa vaga; proprietário não adere ao próprio módulo; códigos dos dois contextos não se misturam.
3. Remoção libera vaga e bloqueia leitura e IA do convidado removido. Encerramento invalida o código e todos os acessos; reinício gera outro código.
4. Listagens e cards identificam módulo e proprietário corretamente, com estado vazio e indicador de convidados ativos nos módulos próprios.
5. As abas de Salas correspondem visualmente às de Módulo e funcionam por teclado.
6. O convidado vê as métricas corretas e usa o mesmo padrão de modal de IA do Dashboard principal, sem receber dados privados ou controles de edição.
7. Manipulação de URL, identificador ou chamada direta não permite edição nem leitura de outro módulo. Revogação durante solicitação de IA impede entrega após verificação final.
8. Exclusão e arquivamento respeitam o ciclo de vida definido. Salas e módulos pessoais continuam funcionando.
9. Executar os testes unitários/integrados pertinentes, lint, verificação de tipos e build disponíveis; registrar resultados e limitações reais, sem resetar banco ou consumir API.

## Próxima etapa

Após a revisão deste desenho escrito, produzir o plano de implementação com arquivos, interfaces, migração, testes e verificações. A execução deverá preservar as alterações preexistentes no repositório e atualizar a matriz de requisitos e o acompanhamento do projeto.
