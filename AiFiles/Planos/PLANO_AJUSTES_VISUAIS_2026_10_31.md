# Plano de implementação — ajustes visuais coordenados de 31/10/2026

## Objetivo

Aplicar os treze comentários do autor sem criar uma linguagem paralela: o Dashboard será a referência tipográfica para títulos e subtítulos; a cor da navegação será usada em controles escuros; e os componentes preservarão semântica, foco e responsividade.

## Abordagem escolhida

Foram consideradas alterações isoladas por tela e a criação de um componente compartilhado de cabeçalho. A execução adotará ajustes locais coordenados: é a opção de menor risco para o estado atual, evita uma refatoração ampla em arquivos já modificados e ainda fixa os mesmos valores visuais do Dashboard nas páginas solicitadas.

## Tarefas

1. **Linha do tempo**
   - Escrever teste para data `dd/mm/aaaa` e selo escuro com texto branco.
   - Implementar formatação UTC e cores com tokens da navegação.
   - Executar o teste focado.

2. **Dashboard e filtro**
   - Escrever testes para `DASHBOARD`, saudação ampliada, botão `Filtrar` e painel responsivo sem sobreposição.
   - Ajustar texto e CSS do cabeçalho e do filtro reutilizado.
   - Executar testes do Dashboard e filtro.

3. **Biblioteca de Módulos**
   - Escrever teste para o botão textual `Adicionar módulo` no cabeçalho acima da divisória, subtítulo no padrão do Dashboard e indicador de compartilhamento no topo direito.
   - Reorganizar marcação e CSS sem alterar a ação do formulário nem os links dos cards.
   - Executar o teste da página.

4. **Métodos e Salas**
   - Escrever testes para subtítulos no padrão do Dashboard e títulos dos métodos maiores e em negrito.
   - Ajustar somente CSS Modules das duas páginas.
   - Executar os testes focados.

5. **Navegação lateral**
   - Escrever teste de estilo para fundo branco e ícone preto no botão de marca recolhido.
   - Ajustar estados padrão, hover e foco sem alterar a troca para a seta.
   - Executar teste do sistema visual.

6. **Fechamento**
   - Atualizar matriz e acompanhamento.
   - Inspecionar Dashboard, Módulos, Métodos, Salas e linha do tempo no navegador.
   - Executar `npm.cmd run validar`, `git diff --check` e confirmar HTTP 200 local.
