# Desenho — refinamento de cabeçalhos e Salas

## Intenção

Aplicar a convenção visual `#Subtitulo` às descrições de Módulos, Métodos e Salas; reduzir a distância entre o título e o subtítulo do Dashboard; e reorganizar as ações de Salas para que fiquem nos mesmos eixos estruturais usados no restante do produto.

## Abordagem escolhida

Reutilizar o componente `Subtitulo`, ampliando-o para renderizar um parágrafo quando o conteúdo for descritivo. As ações gerais de Salas passam para a faixa das abas, acima do divisor; o formulário duplicado da aba compartilhada é removido. Na Sala interna, o menu de ações passa para a barra superior junto ao retorno, “Adicionar módulo” sobe para o cabeçalho principal e o painel de participantes preenche a altura útil da tela.

## Restrições

- preservar ações, formulários, permissões e rotas existentes;
- não duplicar os estilos de `Subtitulo` em CSS de página;
- manter navegação por teclado, nomes acessíveis e adaptação móvel;
- não alterar dados, persistência ou regras de negócio.

## Alternativas descartadas

- copiar apenas o CSS do subtítulo em cada página: criaria divergência futura da convenção `#Subtitulo`;
- manter dois pontos para entrada por código: contraria a remoção solicitada e duplica a mesma ação;
- posicionar controles com coordenadas absolutas: ficaria frágil em telas menores.
