# Desenho da reorganização do módulo em sub-abas

> Atualização 2026-10-10: protocolo e execução atuais estão em PLANO_AJUSTES_TCC_2026_10_10.md e no relatório de ajustes. Confirmação manual foi removida definitivamente; os passos históricos abaixo não autorizam restaurá-la.
> Estado: aprovado pelo autor em 2026-09-27 e implementado
> Origem: solicitação anexada em 2026-09-27 e refinamento confirmado na conversa
> Agente executor previsto: Guanabara

## 1. Objetivo

Reorganizar a página interna de um módulo para separar análise, trajetória e operação, reduzindo redundâncias e preservando o cabeçalho e o contexto do módulo durante toda a interação.

A página continuará sendo uma única tela. Logo abaixo do cabeçalho serão apresentadas três sub-abas internas:

1. **Dashboard**;
2. **Linha do tempo**;
3. **Sessões e Materiais**.

A troca de sub-aba não navegará para outra página e não remontará o cabeçalho do módulo.

## 2. Estrutura da página

### 2.1 Cabeçalho persistente

O cabeçalho atual permanecerá acima das sub-abas e continuará oferecendo:

- retorno à lista de módulos;
- título e descrição;
- edição do módulo;
- arquivamento;
- mensagens gerais de sucesso e erro.

### 2.2 Navegação interna

Um componente cliente controlará a sub-aba ativa. Ele usará semântica acessível de abas, foco por teclado, indicação visual da seleção e painéis identificados por `aria-controls` e `aria-labelledby`.

Os conteúdos serão fornecidos ao componente como áreas compostas pela página de servidor. Assim, consultas, autorização e ações existentes continuam no servidor, enquanto apenas a visibilidade das áreas é controlada no navegador.

## 3. Conteúdo das sub-abas

### 3.1 Dashboard

Responderá à pergunta: **“Como estou aprendendo este conteúdo?”**

Conterá:

- visão geral do módulo;
- dificuldade × compreensão;
- evolução temporal;
- regularidade;
- Métodos × Resultados;
- Formatos × Resultados;
- Conceitos com maior dificuldade;
- Conceitos com maior compreensão;
- interpretação opcional da IA.

Serão removidas como visualizações independentes:

- Percepção × Evidência;
- Evolução por conceito;
- Padrões observados;
- Métodos × Evidências posteriores;
- Formatos × Evidências posteriores.

Os cálculos úteis dessas visualizações permanecerão no domínio quando forem necessários às análises consolidadas.

### 3.2 Linha do tempo

Responderá à pergunta: **“Como minha trajetória de aprendizagem aconteceu?”**

Conterá eventos cronológicos do módulo:

- sessões válidas;
- avaliações e exercícios;
- anotações;
- materiais de referência;
- evidências visuais;
- demais eventos já representáveis pelo modelo.

Os eventos serão ordenados do mais recente para o mais antigo, com data, tipo, título, resumo e conceitos relacionados quando disponíveis.

### 3.3 Sessões e Materiais

Responderá à pergunta: **“Quais registros e recursos compõem meu estudo?”**

Conterá:

- criação, edição, conclusão e arquivamento de sessões;
- histórico operacional das sessões;
- biblioteca de materiais;
- arquivos, links, textos e uploads;
- ações de análise e substituição de arquivos;
- edição e arquivamento de materiais;
- registro automático de evidências válidas.

As funcionalidades atuais serão preservadas.

## 4. Métodos × Resultados e Formatos × Resultados

Será criada uma estrutura analítica compartilhada para os dois contextos. Cada item retornará:

- chave e rótulo do método ou formato;
- quantidade de sessões válidas;
- quantidade de sessões com compreensão registrada;
- compreensão percebida média;
- quantidade de evidências posteriores distintas;
- desempenho médio nessas evidências;
- indicação de suficiência da amostra.

Uma sessão com múltiplos métodos ou formatos contribuirá para todos os contextos registrados. Isso será apresentado como contexto não exclusivo.

### 4.1 Relação com evidências posteriores

Somente evidências válidas, não futuras e com desempenho registrado serão utilizadas.

A relação seguirá esta ordem:

1. usar vínculo explícito com a sessão, quando disponível;
2. na ausência dele, exigir o mesmo módulo, pelo menos um conceito em comum e data posterior à sessão em até 30 dias;
3. nunca associar uma evidência somente porque ocorreu depois da sessão;
4. contar cada evidência uma única vez por método ou formato.

A amostra será considerada suficiente a partir de duas evidências posteriores distintas. Com uma evidência, o resultado será exibido como amostra insuficiente. Sem evidência, será exibido o estado correspondente.

## 5. Rankings de conceitos

Os dois rankings considerarão observações ocorridas nos 90 dias anteriores à data de referência. Serão exibidos no máximo cinco conceitos elegíveis.

### 5.1 Normalização

As escalas percebidas de 1 a 5 serão convertidas para 0 a 100:

```text
valor normalizado = ((média - 1) / 4) × 100
```

O desempenho registrado já utiliza a escala de 0 a 100.

### 5.2 Conceitos com maior dificuldade

O índice interno de dificuldade será a média aritmética dos sinais disponíveis:

```text
dificuldade percebida normalizada
100 - compreensão percebida normalizada
100 - desempenho registrado
```

O índice será usado somente para ordenação. A interface mostrará os valores que explicam a posição, a base utilizada e a situação das evidências.

### 5.3 Conceitos com maior compreensão

O índice interno de compreensão será a média aritmética dos sinais disponíveis:

```text
compreensão percebida normalizada
100 - dificuldade percebida normalizada
desempenho registrado
```

Empates serão resolvidos pela observação mais recente, depois pela maior quantidade de observações e, por fim, pelo nome do conceito.

### 5.4 Elegibilidade e insuficiência

Um conceito precisará de pelo menos duas observações exploratórias no período, somando sessões com percepção e evidências válidas com desempenho.

- Conceitos com percepção suficiente e menos de duas evidências poderão aparecer com a mensagem **“Evidências ainda insuficientes”**.
- Conceitos sem a base mínima não serão classificados.
- Se menos de cinco forem elegíveis, apenas os disponíveis serão exibidos.
- Se nenhum for elegível, será apresentado estado vazio explicativo.

## 6. Reutilização técnica

Serão reutilizados:

- `sessaoValida` e as métricas de sessões;
- agrupamentos atuais por método e formato;
- catálogo e resolvedor de conceitos;
- relação por conceito e janela temporal já usada nas evidências posteriores;
- linha do tempo produzida pelo serviço de aprendizagem;
- componentes de sessões, materiais, interpretação da IA e registro automático de evidências;
- estilos e hierarquia visual existentes.

As novas regras analíticas permanecerão em funções puras no domínio. A página apenas comporá DTOs e componentes.

## 7. Responsividade e acessibilidade

- A barra de sub-abas poderá rolar horizontalmente em telas estreitas sem provocar rolagem na página inteira.
- Os painéis utilizarão semântica de abas e poderão ser operados por teclado.
- Tabelas manterão alternativas textuais e rolagem contida.
- Rankings e estados vazios serão legíveis sem depender apenas de cor.

## 8. Critérios de aceite

1. O cabeçalho permanece visível e independente da sub-aba ativa.
2. A troca entre sub-abas ocorre na mesma página.
3. Cada funcionalidade aparece em apenas uma sub-aba.
4. Métodos e formatos exibem conjuntamente percepção e evidências posteriores.
5. Evidência posterior exige vínculo explícito ou conceito comum dentro da janela temporal.
6. Rankings exibem no máximo cinco conceitos e explicam seus sinais.
7. Dados insuficientes não geram classificação artificial.
8. As ações atuais de sessões, materiais e evidências continuam funcionais.
9. A página não apresenta rolagem horizontal indevida em viewport móvel.
10. Testes, lint, tipos, build e validação funcional passam antes da conclusão.

## 9. Fora do escopo

- alterar o modelo causal das análises;
- criar novas fontes de evidência externas;
- redesenhar o sistema visual da aplicação;
- modificar páginas fora do módulo, salvo ajustes estritamente necessários em contratos compartilhados;
- preencher lacunas com dados simulados apresentados como reais.
