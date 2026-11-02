# Desenho — refinamento visual de bibliotecas e Salas

## Estado

APROVADO pela sequência de comentários visuais do autor em 2026-10-31.

## Escopo de Araki

- reutilizar no menu de Sala a composição compacta do menu de Módulo;
- aproximar o módulo interno das proporções dos cards de Sala e estreitar a coluna de participantes;
- manter as ações da biblioteca de Salas visualmente acima do divisor, com respiro equivalente ao Dashboard;
- usar a navegação escura como superfície dos ícones de Métodos e Módulos;
- aplicar a cor da navegação ao modal de Método, preservando contraste, hierarquia e rolagem discreta;
- reduzir pela metade o vazio superior do Dashboard e uniformizar a tipografia da tabela de consistência;
- fazer o botão “Adicionar módulo” da biblioteca reutilizar as medidas do controle existente dentro da Sala.

## Decisões de interface

- **Reutilizar:** tokens `--cor-navegacao`, `--cor-superficie`, `--cor-borda` e o padrão de controle com 42 px.
- **Adaptar:** menu de Sala mantém suas ações de servidor, mas adota densidade, tipografia, fundo e estados do menu de Módulo.
- **Promover:** nenhum componente novo; as diferenças permanecem em CSS Modules porque os controles conservam semânticas e contratos distintos.
- **Responsividade:** a lista interna passa a duas colunas no desktop e uma em telas estreitas; a lateral volta a ocupar toda a largura abaixo de 980 px.

## Fora do escopo de Araki

O modal de gerenciamento de instância compartilhada, a edição de nome/descrição, a interrupção do compartilhamento e a inclusão automática dessas instâncias em `/modulos` exigem contrato, autorização e persistência de servidor. Esse item deve ser executado pelo Guanabara antes de Araki aplicar a interface final do fluxo.
