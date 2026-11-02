# Desenho — refinamento de sessões e materiais do módulo

## Objetivo

Simplificar a subaba de sessões e materiais para priorizar leitura rápida, com sessões expansíveis, materiais visualmente planos e o contexto do módulo sempre visível no cabeçalho.

## Sessões

- Remover o rótulo “ROTINA DE ESTUDO”.
- Exibir cada sessão como uma linha, sem borda, fundo ou cantos de card.
- Separar sessões consecutivas somente por uma linha horizontal fina.
- Tornar a área principal da linha acionável por mouse e teclado; ao expandir, revelar métodos, formatos, materiais e percepções.
- Ocultar esses contextos no estado recolhido, mantendo-os disponíveis durante a edição.
- Remover a data isolada da coluna esquerda. A linha mantém duração, status, modo de registro e descrição; o intervalo temporal permanece apenas no conteúdo expandido.
- Colocar Editar e Arquivar/Restaurar em um menu de três pontos no canto superior direito da linha.
- O menu deve fechar após selecionar uma ação e não deve alternar acidentalmente a expansão da sessão.

## Materiais

- O painel “Materiais” usa o mesmo fundo escuro do botão “Registrar sessão”, com títulos, textos e ícones claros.
- O botão de adicionar material fica branco, com ícone escuro.
- Os arquivos são empilhados sem cards, divisores, bordas ou fundos individuais, no padrão visual solicitado do NotebookLM.
- O estado expandido de um arquivo também não cria um card; apenas revela seu conteúdo abaixo do item.
- A rolagem vertical usa trilho transparente e indicador fino e discreto.

## Cabeçalho e compartilhamento

- Mostrar a descrição do módulo imediatamente abaixo do nome quando o editor não estiver aberto.
- Quando existir ao menos uma pessoa com acesso ativo, o botão de compartilhamento fica escuro e mostra “Compartilhado”.
- Sem acessos ativos, o botão permanece compacto com o nome acessível “Compartilhar”.
- O estado inicial é entregue pelo servidor para evitar que o botão só seja atualizado depois da abertura do diálogo.

## Acessibilidade e responsividade

- Expansão, menu de ações e compartilhamento mantêm nomes acessíveis, foco visível e operação por teclado.
- Em telas estreitas, as linhas podem reorganizar seu conteúdo sem reintroduzir cartões.
- Alterações são limitadas à apresentação e interação; regras de registro, edição, arquivamento e compartilhamento permanecem inalteradas.
