# Handoff para Guanabara — infraestrutura da página interna do módulo

## Identificação

- **Estado:** CONCLUÍDO E VALIDADO LOCALMENTE EM 2026-09-13.
- **Origem:** solicitações do autor em 2026-09-13 para reformular a experiência dentro de um módulo pessoal.
- **Responsável por esta etapa:** agente Guanabara.
- **Dependência posterior:** agente Araki conectará os contratos e executará toda a reorganização visual da página.
- **Escopo desta etapa:** domínio, banco, migrações, armazenamento de arquivos, serviços, ações e rotas de servidor, métricas, interpretação por módulo, autorização, testes e documentação técnica.
- **Requisitos relacionados:** RLP-003, RLP-004, RLP-008, RLP-009, RLP-011, RLP-NF-004 e RLP-NF-005.

## Objetivo

Preparar os contratos necessários para que a página `/modulos/{identificador}` possa oferecer:

1. criação de tópico pelo botão “+”, com rascunho e primeira configuração semelhantes ao fluxo já aprovado para módulos;
2. edição de nome e descrição de módulos e tópicos por comandos discretos;
3. uma biblioteca lateral que reúna os materiais de todos os tópicos do módulo;
4. inclusão de texto, link e upload real de imagens, documentos, planilhas, arquivos tabulares, áudio e vídeo;
5. indicadores “Tempo estudado” e “Dificuldade atual estimada”;
6. evolução da taxa média de acerto dos tópicos por período;
7. interpretação opcional da IA restrita ao módulo aberto.

O Front End não deve criar rascunhos fictícios, ler arquivos diretamente do banco, calcular métricas oficiais, classificar dificuldade nem filtrar uma interpretação global para aparentar que ela pertence ao módulo.

## Estado atual confirmado

- `atualizarModuloPessoal` e a ação `atualizarModulo` já permitem editar título e descrição do módulo.
- `criarTopicoPessoal` exige título e descrição antes de criar; não existe tópico em rascunho.
- `atualizarTopicoPessoal` já permite editar nome e descrição de um tópico existente.
- todo `RecursoConteudo` pertence obrigatoriamente a um tópico;
- material aceita somente `conteudoTexto` e/ou URL HTTP(S);
- não existem metadados, armazenamento, upload ou entrega autenticada de arquivos binários;
- `FormatoConteudo` não representa integralmente as categorias solicitadas;
- `tempoEstudo.minutosTotais` e `quantidadeSessoesValidas` já são calculados oficialmente por módulo;
- a evolução atual contém tentativas individuais e notas normalizadas, não uma média temporal das taxas dos tópicos;
- a dificuldade percebida registrada em sessão não é a “Dificuldade atual estimada” solicitada;
- `/api/interpretacoes` e `gerarInterpretacaoPessoal` analisam a conta inteira, não um módulo específico;
- a interpretação atual é transitória e não possui histórico persistente.

## Decisões funcionais deste handoff

### Materiais continuam pertencendo a tópicos

A nova biblioteca lateral será uma agregação visual dos materiais dos tópicos do módulo. O modelo deve preservar a relação obrigatória:

```text
Módulo → Tópico → Material
```

Ao inserir um material pela biblioteca do módulo, a pessoa deverá selecionar o tópico de destino. Não criar material solto diretamente no módulo nesta etapa.

### Duas taxas distintas permanecem explícitas

A taxa geral ponderada já usada no Dashboard não deve ser alterada. Ela continua sendo:

```text
soma de respostas corretas / soma do total de questões
```

O gráfico interno do módulo receberá uma métrica nova e independente, denominada `mediaTaxasAcertoTopicos`. Em cada período:

1. calcular, para cada tópico com evidência, `respostasCorretas / totalQuestoes` naquele período;
2. não atribuir zero a tópico sem tentativa válida no período;
3. calcular a média aritmética das taxas dos tópicos com evidência;
4. devolver amostra e totais que permitam explicar o resultado.

Essa distinção deve aparecer no protocolo de medição, nos tipos e nos testes. Não reutilizar o nome genérico `taxaAcerto` para as duas fórmulas.

### Dificuldade não usa a escala percebida da sessão

“Dificuldade atual estimada” será derivada exclusivamente da série `mediaTaxasAcertoTopicos`. `dificuldadePercebida`, informada ao encerrar uma sessão, continua sendo uma medida separada e não participa dessa classificação.

## Contrato 1 — tópicos em rascunho

### Modelo

Adicionar a `Topico`:

```prisma
rascunho Boolean @default(false)
```

Manter `nome` e `descricao` como strings não anuláveis. Enquanto `rascunho: true`, ambas podem ficar vazias. Todos os tópicos existentes devem permanecer com `rascunho: false` após uma migração aditiva.

O identificador temporário deve usar fonte aleatória adequada e o formato:

```text
rascunho-<uuid>
```

### Serviço

Criar contrato equivalente a:

```ts
export async function criarRascunhoTopicoPessoal(
  usuarioId: string,
  moduloId: string,
): Promise<{
  id: string;
  moduloId: string;
  identificador: string;
  rascunho: true;
}>;
```

Regras:

- o módulo deve estar configurado, ativo e pertencer à conta;
- a operação não recebe nome, descrição ou `usuarioId` do formulário;
- cria somente o tópico vazio, sem material ou avaliação;
- permite mais de um rascunho no mesmo módulo;
- outra conta não pode ler, finalizar ou arquivar o rascunho;
- tópico em rascunho não entra em métricas, interpretação ou contagens de tópicos configurados;
- tópico arquivado não reaparece na biblioteca.

### Primeira configuração

Estender a atualização existente sem enfraquecer as validações:

- nome entre 3 e 120 caracteres após `trim`;
- descrição entre 3 e 500 caracteres após `trim`;
- identificador definitivo derivado do nome;
- duplicidade verificada dentro do módulo;
- atualização válida grava nome, descrição, identificador definitivo e `rascunho: false` atomicamente;
- erro mantém o rascunho e o identificador temporário;
- tópico configurado continua atualizável pelo mesmo serviço.

### Ação para o botão “+”

Criar ação de servidor equivalente a:

```ts
export async function criarRascunhoTopico(formulario: FormData) {
  // exige a conta da sessão
  // valida a propriedade do módulo
  // cria o rascunho
  // revalida a página do módulo
  // redireciona para o estado de primeira configuração
}
```

O redirecionamento esperado pode usar a própria página do módulo com identificador de estado explícito, por exemplo:

```text
/modulos/{identificadorModulo}?topico=rascunho-<uuid>
```

Guanabara pode propor contrato de rota equivalente, mas deve informar ao Araki o formato definitivo. Não criar uma rota visual completa nesta etapa.

## Contrato 2 — upload e armazenamento de materiais

### Categorias aceitas

Usar lista positiva e documentada. O conjunto mínimo esperado é:

- imagens: PNG, JPEG, WebP e GIF;
- documentos: PDF, TXT, DOC, DOCX e ODT;
- planilhas e dados tabulares: CSV, XLS, XLSX e ODS;
- áudio: MP3, WAV, OGG e M4A;
- vídeo: MP4, WebM e MOV;
- links externos: somente HTTP ou HTTPS;
- texto digitado diretamente, preservando o comportamento atual.

“Etc.” não autoriza aceitar extensões ou MIME arbitrários. Formatos executáveis, arquivos com macro, HTML ativo e compactados genéricos devem ser rejeitados nesta etapa, salvo requisito posterior explícito.

### Modelo de dados

Estender `RecursoConteudo` ou criar uma entidade de arquivo relacionada. O contrato persistido precisa representar, quando aplicável:

```ts
type ArquivoMaterial = {
  nomeOriginal: string;
  tipoMime: string;
  tamanhoBytes: number;
  chaveArmazenamento: string;
  extensaoNormalizada: string;
};
```

Requisitos:

- não usar o nome original como caminho físico;
- gerar chave opaca no servidor;
- registrar tamanho e MIME validados;
- permitir distinguir texto, link e arquivo sem inferência frágil na interface;
- manter propriedade por tópico e módulo;
- preservar arquivamento lógico e referências de sessões;
- adicionar migração, índices e relacionamentos necessários;
- definir limites explícitos de tamanho por categoria e documentá-los para o Front End;
- atualizar `FormatoConteudo` ou introduzir uma classificação própria sem quebrar as métricas atuais por formato.

### Armazenamento

Criar uma abstração de armazenamento que permita implementação local no protótipo e substituição futura. Arquivos não devem ficar diretamente acessíveis em `public/`, pois isso ignoraria autorização.

O download ou a visualização deve passar por uma rota autenticada que:

- exige sessão válida;
- resolve o material junto com tópico, módulo e conta proprietária;
- impede travessia de diretório;
- devolve `Content-Type` e `Content-Disposition` seguros;
- não revela caminho físico;
- retorna ausência controlada para material de outra conta;
- não executa conteúdo enviado pela pessoa usuária.

### Upload

Criar ação ou rota multipart que receba:

```ts
{
  topicoId: string;
  titulo: string;
  descricao: string;
  minutosEstimados: number;
  arquivo?: File;
  url?: string;
  conteudoTexto?: string;
}
```

Aplicar no servidor:

- autenticação e propriedade;
- limite de corpo e arquivo;
- validação combinada de extensão, MIME declarado e assinatura quando viável;
- nome, descrição e minutos dentro dos limites atuais;
- exatamente uma origem principal entre arquivo, URL e texto, salvo decisão técnica documentada;
- prevenção de duplicidade no tópico;
- limpeza do arquivo físico se a transação de metadados falhar;
- mensagens de erro estáveis que o Araki possa mapear.

Não enviar conteúdo dos arquivos à Gemini nesta entrega.

## Contrato 3 — evolução da taxa média dos tópicos

### Periodicidade

Implementar inicialmente períodos semanais, ordenados cronologicamente. A semana deve possuir fronteiras determinísticas e documentadas; datas continuam persistidas em UTC e o rótulo exibido será responsabilidade do Front End.

Uma função pura sugerida:

```ts
calcularEvolucaoTaxaMediaTopicos(
  moduloId: string,
  tentativas: TentativaParaMetricas[],
): EvolucaoTaxaMediaTopicos
```

Contrato esperado:

```ts
export type PontoEvolucaoTaxaMediaTopicos = {
  periodoInicio: Date;
  periodoFim: Date;
  mediaTaxasAcertoTopicos: number | null;
  quantidadeTopicosComEvidencia: number;
  quantidadeTentativas: number;
  respostasCorretas: number;
  totalQuestoes: number;
  topicos: Array<{
    topicoId: string;
    taxaAcerto: number;
    quantidadeTentativas: number;
    respostasCorretas: number;
    totalQuestoes: number;
  }>;
};

export type EvolucaoTaxaMediaTopicos = {
  periodicidade: "SEMANAL";
  pontos: PontoEvolucaoTaxaMediaTopicos[];
  quantidadePeriodosComEvidencia: number;
  versaoAlgoritmo: string;
};
```

Usar internamente a escala de `0` a `1` para taxas, mantendo o padrão atual, e documentar o contrato. O Front End será responsável apenas por formatar como porcentagem.

### Regras

- considerar somente tentativas concluídas e válidas do módulo;
- agrupar primeiro por período e tópico;
- taxa do tópico no período = soma de acertos / soma de questões daquele tópico no período;
- média do módulo no período = média aritmética das taxas dos tópicos com evidência;
- tópico sem evidência não entra no denominador e não recebe zero;
- tentativa com nota zero e questões válidas é evidência real e deve entrar;
- período sem evidência não deve fabricar ponto zero;
- preservar contagens para explicabilidade e alternativa tabular;
- não alterar `taxaAcertoGeral` nem a taxa ponderada do Dashboard;
- atualizar a versão do algoritmo se a convenção vigente exigir versionamento por mudança de saída.

## Contrato 4 — dificuldade atual estimada

Criar uma classificação derivada exclusivamente de `evolucaoTaxaMediaTopicos`.

### Taxa de referência

1. selecionar os três períodos cronologicamente mais recentes com evidência;
2. calcular a média aritmética de `mediaTaxasAcertoTopicos` desses períodos;
3. se houver somente um ou dois períodos, calcular com os disponíveis e marcar `amostraReduzida: true`;
4. sem período com evidência, retornar ausência, não dificuldade intermediária.

### Classificação

| Taxa de referência | Estado |
|---|---|
| menor que 60% | `ALTA` |
| de 60% até menos de 80% | `INTERMEDIARIA` |
| igual ou maior que 80% | `BAIXA` |
| sem evidência | `null` |

Contrato esperado:

```ts
export type DificuldadeAtualEstimada = {
  status: "ALTA" | "INTERMEDIARIA" | "BAIXA" | null;
  taxaReferencia: number | null;
  quantidadePeriodos: number;
  amostraReduzida: boolean;
  periodoInicio: Date | null;
  periodoFim: Date | null;
  versaoAlgoritmo: string;
};
```

Requisitos:

- taxa em escala `0` a `1`;
- limites exatos testados em 0%, 59,99%, 60%, 79,99%, 80% e 100%;
- função pura, determinística e fora de React;
- não usar tendência isolada, dificuldade percebida ou resposta da IA;
- o DTO deve conter evidência suficiente para a interface explicar a classificação;
- a nomenclatura oficial deve manter “estimada”, evitando apresentar o estado como diagnóstico.

## Contrato 5 — interpretação da IA por módulo

### Serviço

Criar contrato equivalente a:

```ts
export async function gerarInterpretacaoModuloPessoal(
  usuarioId: string,
  identificadorModulo: string,
): Promise<InterpretacaoGerada>;
```

O serviço deve:

- localizar somente módulo configurado, ativo e pertencente à conta;
- montar o DTO no servidor a partir das métricas oficiais daquele módulo;
- incluir período, quantidade de tentativas, minutos válidos, tópicos com evidência, evolução e dificuldade estimada;
- usar referências opacas como “Tópico 1”, sem enviar nome do módulo, nomes de tópicos ou nomes de arquivos;
- nunca enviar conteúdo de material, URL, observação livre, resposta, gabarito ou identificador persistido;
- preservar validação de schema, política de linguagem, cota, timeout e fallback local;
- impedir que Gemini calcule ou substitua métricas;
- manter interpretação separada da evidência oficial.

### Rota

Criar rota autenticada equivalente a:

```text
POST /api/modulos/{identificadorModulo}/interpretacoes
```

Respostas esperadas:

- `200` com a estrutura já compatível com `InterpretacaoGerada`;
- `401` sem sessão;
- `404` para módulo inexistente, arquivado, em rascunho ou pertencente a outra conta;
- contingência local em falha externa, sem impedir a abertura da página.

Se a estrutura de saída global atual puder ser preservada, preferir reutilizá-la para que Araki adapte apenas o endpoint e o contexto. A interpretação continuará transitória nesta etapa. Não persistir histórico sem nova solicitação.

## Integração no DTO do módulo

`obterMetricasModuloPessoal` deve passar a fornecer, além dos campos existentes:

```ts
{
  evolucaoTaxaMediaTopicos: EvolucaoTaxaMediaTopicos;
  dificuldadeAtualEstimada: DificuldadeAtualEstimada;
}
```

`obterModuloPessoal` deve expor de forma tipada:

- tópicos configurados ativos;
- tópicos em rascunho próprios quando necessários para retomada;
- materiais ativos e seus metadados seguros;
- URL interna ou identificador necessário para abrir o material autenticado;
- nenhum caminho físico de armazenamento.

Evitar consultas por material executadas dentro de loops na página. Entregar a biblioteca completa do módulo em consulta ou DTO coerente.

## Arquivos prováveis

### Alteração obrigatória

- `prisma/schema.prisma`
- nova migração aditiva para tópico em rascunho e metadados de arquivo
- `src/servidor/modulos.ts`
- `src/app/modulos/acoes.ts`
- `src/dominio/analises/metricas-modulo.ts`
- `src/dominio/analises/metricas-modulo.test.ts`
- `src/servidor/metricas.ts`
- `src/servidor/ia/interpretacoes.ts`
- nova rota de interpretação por módulo
- serviço e rota/ação de armazenamento e entrega autenticada de arquivos

### Atualização documental obrigatória após implementação

- `AiFiles/Contexto/Tecnico/MODELO_DE_DADOS.md`
- `AiFiles/Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`
- `AiFiles/Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`
- `AiFiles/Memoria/MATRIZ_REQUISITOS_TESTES.md`
- `AiFiles/Memoria/ACOMPANHAMENTO.md`
- `AiFiles/Memoria/REGISTRO_DE_RISCOS.md`, se armazenamento local ou limites introduzirem risco duradouro

## Testes obrigatórios

### Tópicos em rascunho

- criar rascunho vazio em módulo próprio configurado;
- gerar identificadores distintos para dois rascunhos;
- bloquear criação em módulo arquivado, em rascunho ou de outra conta;
- finalizar com nome e descrição válidos;
- manter rascunho em entrada inválida ou duplicada;
- excluir rascunho de métricas e interpretação;
- manter CRUD dos tópicos configurados.

### Arquivos

- aceitar ao menos um arquivo válido de cada categoria suportada;
- rejeitar extensão, MIME, tamanho ou assinatura inválidos;
- rejeitar arquivo executável, macro e nome com tentativa de travessia;
- impedir upload em tópico de outra conta;
- impedir download por outra conta ou sem sessão;
- garantir que falha de persistência não deixe arquivo órfão;
- garantir que arquivamento não quebre sessões históricas;
- preservar criação de materiais por texto e link.

### Evolução

- calcular taxa de cada tópico antes da média do módulo;
- comprovar que tópico sem evidência não vira zero;
- comprovar que taxa real de 0% entra na média;
- validar dois tópicos com quantidades diferentes de questões e peso igual entre suas taxas;
- agrupar tentativas nas fronteiras semanais definidas;
- ordenar os períodos;
- retornar contagens e versão;
- preservar a taxa ponderada geral existente.

### Dificuldade estimada

- retornar `null` sem períodos;
- marcar amostra reduzida com um ou dois períodos;
- usar somente os três períodos mais recentes quando houver quatro ou mais;
- testar todos os limites da classificação;
- provar que `dificuldadePercebida` não altera o resultado;
- provar que falha ou resposta da IA não altera o resultado.

### Interpretação por módulo

- interpretar somente métricas do módulo solicitado;
- impedir acesso horizontal;
- retornar 401 sem sessão e 404 sem propriedade;
- excluir rascunhos e itens arquivados;
- não incluir nomes, conteúdo, URL, arquivo, observação ou respostas no DTO;
- manter fallback local, cota, timeout e validação de saída;
- garantir que interpretação global existente não sofra regressão.

## Critérios de aceite

- o botão “+” poderá criar tópico vazio próprio e fornecer estado navegável de primeira configuração;
- o tópico só se torna configurado após nome e descrição válidos;
- a biblioteca do módulo poderá listar materiais de todos os tópicos sem consulta insegura no cliente;
- texto, link e arquivos permitidos poderão ser cadastrados com propriedade validada;
- nenhum arquivo será publicamente acessível sem autorização;
- `tempoEstudo` continuará sendo métrica oficial já existente;
- a nova evolução mostrará a média das taxas dos tópicos por semana;
- a dificuldade estimada será calculada sobre os três períodos recentes e respeitará os limites aprovados;
- estados sem evidência permanecerão ausentes, nunca convertidos em zero ou “Intermediária”;
- a interpretação será restrita ao módulo e não receberá conteúdo pessoal ou material bruto;
- funções analíticas serão puras, versionadas e testadas;
- isolamento entre contas será verificado em todas as novas operações;
- nenhuma regra nova será calculada em componente React.

## Validação mínima

Executar e registrar:

```powershell
npm.cmd run banco:gerar
npm.cmd run banco:reiniciar
npm.cmd run banco:verificar-cenario
npm.cmd run testar:servicos
npm.cmd run testar:metricas
npm.cmd run testar:integracao
npm.cmd run validar
```

Adicionar testes específicos de upload e entrega autenticada caso os scripts atuais não cubram esses fluxos. O reset deve atingir somente o banco sintético local e precisa respeitar as regras de segurança do projeto.

## Fora do escopo do Guanabara neste handoff

- remover ou reorganizar cards na interface;
- desenhar os botões de lápis, “+” ou menu de arquivamento;
- definir a composição da coluna lateral interna;
- criar modal, painel, animação ou estado visual de edição;
- estilizar a biblioteca de materiais;
- construir o gráfico Recharts;
- definir cores dos níveis de dificuldade;
- adaptar responsividade, foco, atalhos de teclado ou hierarquia visual;
- persistir histórico de interpretações;
- enviar arquivos ou conteúdo bruto à Gemini.

Essas alterações pertencem à integração posterior do agente Araki, exceto persistência de interpretação, que exigirá um novo requisito de backend se vier a ser solicitada.

## Saída necessária para o Araki

Ao concluir, Guanabara deve acrescentar ao fim deste documento:

1. migrações criadas e efeito sobre registros existentes;
2. assinatura final das operações de rascunho de tópico;
3. URL ou estado de redirecionamento após o botão “+”;
4. formato TypeScript final de tópico configurado e em rascunho;
5. categorias, MIME, extensões e limites de upload efetivamente suportados;
6. assinatura da ação/rota de upload e códigos de erro;
7. contrato para abrir ou baixar arquivo autenticado;
8. DTO final de `evolucaoTaxaMediaTopicos`;
9. DTO final de `dificuldadeAtualEstimada`;
10. assinatura e endpoint da interpretação por módulo;
11. confirmação dos dados excluídos do DTO da IA;
12. testes e comandos executados, com resultados;
13. qualquer divergência justificada em relação a este handoff.

Araki deve iniciar a integração completa somente depois que os contratos de rascunho, upload, métricas e interpretação por módulo estiverem implementados e validados.

## Resultado da execução para Araki

1. Migração criada: `prisma/migrations/20260913150000_topico_rascunho_arquivos_materiais/migration.sql`. Adiciona `Topico.rascunho`, `RecursoConteudo.origem`, a tabela 1:1 `ArquivoMaterial` e índices. Tópicos existentes permanecem configurados; materiais existentes passam a `TEXTO` ou `LINK` conforme a URL já persistida.
2. Serviço de rascunho: `criarRascunhoTopicoPessoal(usuarioId: string, moduloId: string): Promise<{ id; moduloId; identificador; identificadorModulo; rascunho: true }>` em `src/servidor/modulos.ts`. Exige módulo próprio, ativo e configurado; cria `rascunho-{UUID}`, nome/descrição vazios e nenhum filho.
3. Ação do botão `+`: `criarRascunhoTopico(formulario: FormData)` em `src/app/modulos/acoes.ts`. Enviar `moduloId` e `identificadorModulo` apenas para contextualizar o comando; após a validação no servidor, redireciona para `/modulos/{identificadorModulo}?topico=rascunho-{UUID}`. Erro volta à URL informada com `?erro=dados|duplicado|indisponivel`.
4. Tópico detalhado é retornado por `obterModuloPessoal` com `id`, `moduloId`, `identificador`, `nome`, `descricao`, `ativo`, `rascunho`, materiais ativos e avaliações ativas. `TopicoListadoPessoal` exporta os campos seguros de listagem. Rascunho tem textos vazios; atualização válida troca identificador e grava `rascunho: false` na mesma operação. Materiais em rascunho são bloqueados.
5. Upload suportado por `POST /api/materiais/upload` multipart. O campo `arquivo` acompanha `topicoId`, `titulo`, `descricao` e `minutosEstimados`; respostas: `201`, `400 DADOS_INVALIDOS|ARQUIVO_INVALIDO`, `401`, `404 NAO_ENCONTRADO`, `409 IDENTIFICADOR_DUPLICADO`, `413 ARQUIVO_INVALIDO` para corpo declarado acima de 101 MiB ou `500 FALHA_ARMAZENAMENTO`.
6. Categorias e limites: PNG/JPEG/WebP/GIF (10 MiB); PDF/DOC/DOCX/ODT (25 MiB) e TXT (5 MiB); CSV/XLS/XLSX/ODS (25 MiB); MP3/WAV/OGG/M4A (50 MiB); MP4/WebM/MOV (100 MiB). Extensão, MIME e assinatura são validados; executáveis, macros, HTML ativo, ZIP genérico, nomes com travessia e tamanhos inválidos são rejeitados. Texto e link HTTP(S) existentes continuam disponíveis como origem exclusiva; a edição comum de um arquivo preserva seu binário e não o converte em outra origem.
7. Arquivo autenticado: `GET /api/materiais/{id}/arquivo`. A rota exige sessão e propriedade do recurso/tópico/módulo ativos; devolve `401` ou `404` sem revelar caminho, e no sucesso usa MIME validado, download seguro e `X-Content-Type-Options: nosniff`. A página recebe `material.id` e metadados seguros, nunca a chave física.
8. DTO `evolucaoTaxaMediaTopicos`: `{ periodicidade: "SEMANAL"; pontos: Array<{ periodoInicio; periodoFim; mediaTaxasAcertoTopicos; quantidadeTopicosComEvidencia; quantidadeTentativas; respostasCorretas; totalQuestoes; topicos: Array<{ topicoId; taxaAcerto; quantidadeTentativas; respostasCorretas; totalQuestoes }> }>; quantidadePeriodosComEvidencia; versaoAlgoritmo }`. Semanas iniciam segunda-feira 00:00 UTC; a taxa de cada tópico é calculada antes da média aritmética entre tópicos com evidência.
9. DTO `dificuldadeAtualEstimada`: `{ status: "ALTA" | "INTERMEDIARIA" | "BAIXA" | null; taxaReferencia; quantidadePeriodos; amostraReduzida; periodoInicio; periodoFim; versaoAlgoritmo }`. Usa até os três períodos recentes: `<0,60` alta, `0,60–<0,80` intermediária e `≥0,80` baixa; ausência retorna `null`.
10. Serviço e endpoint de IA: `gerarInterpretacaoModuloPessoal(usuarioId: string, identificadorModulo: string)` e `POST /api/modulos/{identificador}/interpretacoes`. Retornam a estrutura `InterpretacaoGerada` existente; `401` sem sessão e `404` para módulo sem propriedade, arquivado ou rascunho. A contingência local, cota, timeout e validação de schema foram preservados.
11. O DTO de IA por módulo contém somente referência opaca “Módulo 1”, contagens, período, médias semanais agregadas e dificuldade estimada. Não contém nome ou ID de módulo/tópico, nome/MIME/URL/conteúdo de arquivo, observação, resposta, gabarito, senha ou chave.
12. Validações aprovadas: `banco:gerar`, `banco:reiniciar`, `banco:verificar-cenario`, `testar:servicos`, `testar:metricas`, `testar:arquivos`, `testar:integracao`, lint, tipos, 29 testes e build. O reset atingiu somente `prisma/dev.db` e o armazenamento sintético padrão `.dados/arquivos-materiais`.
13. Não há divergência funcional. A página existente não foi reorganizada, pois biblioteca lateral, comandos visuais, gráfico e responsividade pertencem ao Araki. Guanabara forneceu somente o contrato de estado, rotas, DTOs e segurança necessários para essa integração.

## Resultado da integração do Front End pelo Araki

- A página interna configurada foi reorganizada em uma coluna contextual à esquerda, com biblioteca de materiais e interpretação da IA restrita ao módulo, e uma área principal para progresso e tópicos.
- Os cards destacados de editar módulo, arquivar módulo e novo tópico foram removidos. Edição usa comandos discretos de lápis; a criação de tópico usa um botão “+” que abre imediatamente o rascunho na própria página; arquivamento permanece disponível em menus secundários para não retirar funcionalidade.
- A biblioteca aceita texto, link e arquivo. O envio de arquivo consome `POST /api/materiais/upload`, enquanto abertura e download usam a rota autenticada entregue pelo backend.
- Os indicadores principais agora são taxa de acerto, tempo estudado e dificuldade atual estimada. A dificuldade exibe explicitamente Alta, Intermediária, Baixa ou ausência de evidência, sem recalcular a regra no React.
- O gráfico principal consome `evolucaoTaxaMediaTopicos`, apresenta a média semanal das taxas por tópico, tooltip, descrição acessível e tabela equivalente.
- A interpretação usa `POST /api/modulos/{identificador}/interpretacoes`; o Dashboard geral continua usando o endpoint pessoal anterior.
- A integração foi validada com lint, tipos, 29 testes e build de produção. Em navegador autenticado foram verificados edição e foco, criação de rascunho, upload real, interpretação por módulo e responsividade a 320 px sem rolagem horizontal da página.
- O tópico em rascunho, o material e o arquivo físico criados exclusivamente para a inspeção foram removidos após confirmação exata, sem alterar dados reais ou o cenário sintético permanente.
