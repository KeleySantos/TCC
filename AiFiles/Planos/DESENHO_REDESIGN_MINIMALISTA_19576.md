# Desenho do redesign minimalista inspirado na referência 19576

## Estado

- **Origem:** solicitação do usuário em 2026-10-03 após aprovação da série `AiFiles/Prototipos/RedesignReferencia19576Minimalista/`.
- **Responsável:** Araki.
- **Estado:** aguardando revisão do usuário antes do plano de implementação.
- **Natureza:** alteração exclusivamente de Front End. Não altera domínio, persistência, autorização, rotas, métricas, textos obrigatórios nem funcionalidades.

## Objetivo

Aplicar ao site existente a linguagem visual dos protótipos minimalistas aprovados: navegação lateral carvão, superfícies predominantemente brancas, fundo cinza muito claro, azul suave como destaque, tipografia de alto contraste, maior espaço de respiro e menos competição visual entre blocos.

O redesign deve manter todas as ações, estados, informações analíticas, gráficos, alternativas tabulares, avisos e limitações atualmente presentes. A redução de poluição será obtida por hierarquia, agrupamento, espaçamento e revelação progressiva — nunca pela remoção de uma função ou de conteúdo necessário.

## Referências visuais aprovadas

A fonte visual principal é a pasta `AiFiles/Prototipos/RedesignReferencia19576Minimalista/`, composta por 13 telas: entrada, Dashboard, módulos, as três sub-abas do módulo, salas, sala como membro, administração da sala, desafios, histórico, configurações de IA e perfil.

Os protótipos definem direção de composição, densidade, cor e hierarquia. O código existente continua sendo a fonte de verdade funcional.

## Auditoria resumida do Front End

### Fundações e casca

- `src/app/globais.css`: tokens globais, padrões genéricos de cartão, formulário, tabela, aviso, foco e responsividade.
- `src/app/layout.tsx`: layout raiz, metadados e atalho para o conteúdo principal.
- `src/componentes/estrutura-autenticada.tsx`: navegação autenticada, estado recolhido, links, conta e saída.
- `src/componentes/estrutura-autenticada.module.css`: largura e aparência da barra, navegação móvel e estados interativos.

### Páginas e componentes visuais

- estilos próprios de entrada, Dashboard, módulos, módulo interno, salas, desafios e configurações de IA;
- páginas globais de histórico e perfil;
- gráficos, cartões de insights, mapa de conceitos, interpretação automática, sub-abas, filtro temporal, sessões, materiais e linha do tempo.

### Inconsistências observadas

- o sistema atual mistura azul e roxo como cores principais;
- a barra lateral possui gradiente, frases e detalhes com maior peso visual que o conteúdo;
- raios, sombras, bordas e densidade variam entre páginas;
- páginas globais e telas recentes usam sistemas locais diferentes;
- gráficos e painéis competem visualmente por usarem elevação e destaque equivalentes.

## Abordagens avaliadas

### 1. Fundações compartilhadas e adaptação incremental — escolhida

Consolidar tokens semânticos em `globais.css`, reformular a casca autenticada e adaptar os módulos CSS existentes por grupos de telas. Preserva a arquitetura atual, reduz duplicação e permite verificar cada consumidor das fundações.

### 2. Sobrescrita visual página por página

Alterar somente os módulos CSS locais. Seria mais rápida inicialmente, mas manteria valores duplicados e aumentaria o risco de divergência.

### 3. Novo kit completo de componentes

Substituir cartões, cabeçalhos, botões e formulários por uma nova biblioteca interna. Produziria máxima uniformidade, porém ampliaria desnecessariamente o escopo e o risco funcional.

## Sistema visual

### Cor

- fundo cinza azulado muito claro;
- superfície branca;
- navegação carvão quase preto, sem gradiente dominante;
- texto principal grafite profundo e texto secundário cinza azulado;
- ação e seleção em azul médio, com azul muito claro para superfícies selecionadas;
- borda cinza frio discreto;
- estados de sucesso, alerta e erro preservam semântica própria e não dependem apenas de cor.

O roxo atual deixa de ser cor estrutural principal. Só permanece quando representar uma série ou estado que precise de distinção própria.

### Tipografia e espaçamento

- manter fontes locais do sistema, sem dependência ou fonte remota;
- títulos fortes, textos de apoio menores e linhas mais curtas;
- escala de espaçamento baseada em 4, 8, 12, 16, 24, 32 e 48 px;
- separar áreas principalmente por espaço, evitando caixas aninhadas;
- cartões com borda fina, sombra muito suave e raio consistente;
- indicadores compactos, gráficos dominantes e conteúdo secundário subordinado.

### Interação

- azul para ação primária e seleção;
- botões secundários claros com borda discreta;
- foco visível de alto contraste;
- hover sem deslocamentos excessivos;
- movimento reduzido quando `prefers-reduced-motion` estiver ativo.

## Casca autenticada

No desktop, a barra lateral será estreita por padrão e seguirá a composição dos protótipos. Ícones permanecem acompanhados por nomes acessíveis; rótulos visíveis continuam disponíveis no estado expandido existente. A marca será simplificada sem copiar o símbolo da imagem de referência. Conta e saída permanecem, com menor peso visual.

Em larguras menores, todos os destinos e a ação de saída continuam acessíveis por teclado e leitor de tela, sem sobrepor o conteúdo.

## Aplicação por tela

### Entrada

Manter autenticação e mensagens. Adotar composição clara e centralizada, com formulário como ação principal e apresentação do produto subordinada.

### Dashboard

Preservar filtro, indicadores, gráficos, tabelas alternativas, mapa de conceitos, consistência e IA. Indicadores formam uma faixa compacta; a evolução recebe maior área; associações e IA ocupam coluna secundária quando houver largura.

### Módulos

Preservar criação, listagem, estados e acesso. Reduzir ornamentos dos cartões e destacar somente a ação principal e o estado de cada módulo.

### Página interna do módulo

Preservar cabeçalho, edição, ações, filtro e as três sub-abas. Cabeçalho e abas ficam mais leves. Indicadores antecedem o gráfico principal; resultados complementares e tabelas permanecem acessíveis. Linha do tempo, sessões e materiais mantêm todos os formulários e estados.

### Salas

Preservar entrada por código, criação, papéis, módulos, dashboards, convites e ações administrativas. A lista terá linhas discretas; dashboards internos reutilizam a mesma linguagem dos painéis pessoais.

### Desafios

Preservar catálogo, criação, comparação, cancelamento, estados e explicações científicas. A criação será o foco; catálogo e instruções terão menor peso sem ocultar requisitos.

### Histórico

Preservar todas as colunas e situações. No desktop, usar tabela clara e arejada; no móvel, manter apresentação responsiva sem perda de dados.

### Configurações de IA

Preservar fila, segurança, provedores, chaves, testes, ativação, remoção e contingência. Ações secundárias serão menos dominantes e o aviso de segurança continuará visível.

### Perfil

Preservar edição de dados, troca de senha, mensagens e aviso sintético. Dois formulários no desktop e uma coluna no móvel.

## Reutilizar, adaptar, promover e criar

- **Reutilizar:** rotas, componentes de domínio, gráficos, tabelas, formulários, sub-abas, filtro e estados atuais.
- **Adaptar:** `EstruturaAutenticada`, botões, cartões, campos, avisos, tabelas e módulos CSS.
- **Promover:** tokens repetidos de cor, raio, sombra, espaçamento, largura e foco para `globais.css`.
- **Criar:** apenas pequenos primitivos visuais quando repetição real for confirmada; nenhuma abstração nova só por diferença cosmética.

## Preservação funcional

O trabalho não pode:

- remover ou adicionar páginas, links, botões, formulários, campos, filtros, gráficos, séries, tabelas, estados ou mensagens;
- alterar consultas, ações de servidor, DTOs, regras analíticas ou autorização;
- mudar significado, cálculo ou período de métricas;
- ocultar amostra, insuficiência, erro, privacidade ou limites científicos;
- adicionar dependências, fontes externas, serviços ou assets licenciados.

Mudanças de ordem visual são permitidas somente quando a sequência de leitura e teclado permanecer coerente e o fluxo funcional for preservado.

## Responsividade e acessibilidade

- nenhum overflow horizontal do documento em 360 px;
- verificação adicional em 320 px;
- navegação, formulários, detalhes e sub-abas operáveis por teclado;
- foco visível e não encoberto;
- alvos adequados ao toque;
- contraste suficiente;
- gráficos acompanhados das alternativas existentes;
- estados não comunicados somente por cor;
- conteúdo longo, vazio, insuficiente, sucesso e erro sem quebra de layout.

## Estratégia de implementação

1. proteger por testes a presença da navegação, do conteúdo e dos estados essenciais;
2. consolidar tokens globais e padrões base;
3. reformular a casca autenticada;
4. adaptar entrada e páginas simples;
5. adaptar Dashboard, gráficos e componentes analíticos;
6. adaptar módulos e as três sub-abas;
7. adaptar salas e dashboards;
8. revisar desafios, histórico, IA e perfil;
9. inspecionar todas as rotas em desktop, largura intermediária, 360 px e 320 px;
10. executar scanner, lint, tipos, testes aplicáveis e build.

## Critérios de aceite

- as 13 superfícies dos protótipos possuem equivalente implementado;
- a linguagem visual é uniforme entre todas as rotas autenticadas e a entrada;
- todas as funções e informações existentes continuam disponíveis;
- não há nova funcionalidade de produto;
- barra lateral, cartões, formulários, gráficos e tabelas usam tokens compartilhados;
- não há overflow horizontal em 360 px;
- navegação por teclado e foco visível permanecem funcionais;
- lint, tipos, testes aplicáveis e build passam;
- capturas finais permitem comparar implementação e protótipos.
