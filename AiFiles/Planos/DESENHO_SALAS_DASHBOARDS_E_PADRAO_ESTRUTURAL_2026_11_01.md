# Desenho — salas, dashboards e padrão estrutural

Data: 2026-11-01

## Objetivo

Atender aos comentários visuais e funcionais das telas Dashboard, Módulos, Métodos,
Salas, detalhe de Sala e módulo compartilhado, corrigindo também a origem da
inconsistência dos cabeçalhos e da baixa legibilidade das bordas estruturais.

## Diagnóstico confirmado

Os títulos não estão desalinhados por uma única margem:

- Dashboard, Módulos e Salas usam o mesmo `padding-top` no desktop, mas o Dashboard
  possui a saudação antes do `h1`; por isso o título começa mais abaixo.
- Métodos ainda usa um `padding-top` fixo próprio.
- No mobile, as quatro telas possuem recuos independentes e diferentes.

As bordas também misturam duas responsabilidades no token `--cor-borda`: estrutura
(cards e divisores) e controles (inputs, botões e modais). Escurecer esse token
globalmente alteraria elementos fora do pedido.

## Decisões de interface (Araki)

1. Criar um cabeçalho de página reutilizável com uma trilha superior reservada para
   saudação/eyebrow. Assim, a linha-base real do `h1` será idêntica em Dashboard,
   Módulos, Métodos e Salas no desktop e no mobile.
2. Criar os tokens `--cor-borda-estrutural: #d3d5d8` e
   `--espessura-borda-estrutural: 1.5px`. Aplicá-los somente a cards e divisores
   estruturais. Inputs, tabelas, foco e estados semânticos continuam com seus estilos.
3. Manter áreas deliberadamente planas sem card, especialmente a comparação da Sala.
4. Usar `--cor-navegacao` para o título Dashboard, card “Base das análises” e botão
   de interpretação; usar `--cor-dados-azul` para a saudação.
5. Adicionar “Módulos registrados” com o mesmo componente/tipografia de “Métodos
   disponíveis”.
6. Remover o ícone de pasta do cabeçalho Materiais.
7. Participantes do módulo da Sala ficam em painel escuro, com texto branco, hover
   elevado e seleção por contorno/acento acessível.
8. O dashboard individual reutiliza a composição visual do dashboard de Módulo,
   sem wrappers extras de borda/fundo.
9. A comparação fica sempre visível e integrada ao fundo. Será um gráfico de barras
   verticais agrupadas por usuário, com duas barras normalizadas na escala 0–100:
   compreensão percebida e desempenho das evidências válidas. A série temporal já
   calculada pelo servidor será agregada no período/filtro atual. A tabela acessível
   permanece abaixo do gráfico.

## Decisões funcionais (Guanabara)

1. Clicar numa instância vinculada abre modal e não navega. O modal oferece:
   - Editar nome e descrição da instância pessoal;
   - Parar compartilhamento, com confirmação.
2. A edição exige vínculo e participação ativos e só altera módulo pertencente ao
   usuário autenticado.
3. Parar compartilhamento reutiliza a regra existente de encerramento: preserva o
   módulo pessoal e evidências, desvincula a Sala e remove o estado compartilhado.
4. A listagem `/modulos` passa a distinguir compartilhamento direto de dashboard e
   vínculo ativo com Sala. A instância continua visível após o desligamento, mas sem
   ícone/status de compartilhada.
5. Remover participante da Sala é uma operação do proprietário em todos os módulos
   da Sala, numa transação. O proprietário não pode remover a si próprio. Todas as
   instâncias pessoais são preservadas.
6. A aba “Membros” passa a se chamar “Participantes”. A seleção inicial é nula e o
   painel direito mostra “Selecione um participante para visualizar o Dashboard”.
7. A linha de descrição “Turma …” sob o título do módulo da Sala será removida; o
   título permanece.
8. Nos cards compartilhados, o papel passa a exibir “Compartilhado por {nome}” e a
   linha duplicada é removida. Handles `@usuario` também são removidos das listas.

## Autorização e consistência

- Toda Server Action autentica o usuário, valida `FormData` e deriva propriedade,
  papéis e vínculos do banco.
- Participantes não removem terceiros nem editam instâncias alheias.
- Remoção da Sala encerra todas as participações ativas do alvo e revalida Sala,
  módulos da Sala, `/modulos` e módulos pessoais afetados.
- Históricos de usuários removidos permanecem anônimos e não voltam ao gráfico nominal.

## Verificação prevista

- Testes de serviço para editar/desvincular instância e remover participante da Sala.
- Testes de autorização e preservação dos módulos pessoais.
- Testes do modal sem navegação e do estado inicial sem participante selecionado.
- Testes da origem do ícone compartilhado em `/modulos`.
- Testes da série comparativa por usuário e ausência de removidos.
- Typecheck, lint/testes direcionados e inspeção visual desktop/mobile das páginas.
