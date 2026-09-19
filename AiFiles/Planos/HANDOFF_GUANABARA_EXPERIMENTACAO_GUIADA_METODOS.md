# Handoff Guanabara — Experimentação guiada de métodos

## Identificação

| Campo | Valor |
|---|---|
| Estado | Pronto para execução pelo Guanabara |
| Origem | Revisão da Fase 11 solicitada pelo autor em 2026-09-15 |
| Escopo | RLB-005 a RLB-007 e RLB-NF-003 |
| Dependências | Catálogo controlado de métodos, sessões pessoais, Gemini opcional e propriedade direta da conta |
| Responsável pelo backend | Guanabara |
| Integração posterior | Araki |
| Limite | Dados exclusivamente sintéticos; recomendações opcionais, sem causalidade, diagnóstico ou estilo fixo de aprendizagem |

## Objetivo

Substituir o fluxo centrado em desafios escritos pelo usuário por uma jornada centrada no método de estudo:

1. a pessoa escolhe um método;
2. consulta explicação, funcionamento e exemplo no modal do Front End;
3. recebe pelo menos três orientações de experimentação produzidas pela camada de IA, com contingência local;
4. pode selecionar uma dessas orientações ou ignorar todas;
5. inicia a experimentação do método vinculando um ou mais módulos próprios;
6. enquanto a experimentação estiver ativa, o método é exposto ao Front End com o estado `EXPERIMENTANDO`;
7. sessões compatíveis podem ser vinculadas à experimentação ativa.

A orientação recomendada funciona somente como complemento descritivo. Ela não é requisito para iniciar sessões, não altera avaliações, não cria obrigação e não representa prescrição de aprendizagem.

## Mudança de semântica aprovada

O elemento principal deixa de ser “desafio” e passa a ser **experimentação de método**.

- o usuário não escreve nem cria desafios;
- recomendações da IA são orientações opcionais;
- o comando principal é “Testar este método”;
- uma experimentação pode abranger um ou mais módulos;
- aceitar recomendação é opcional e independente do início da experimentação;
- a listagem de “desafios criados” deixa de fazer parte da experiência ativa;
- um método com experimentação ativa recebe a tag textual `Experimentando`;
- comparações continuam observacionais e contextualizadas por módulo e método.

Exemplo aprovado de orientação: ao experimentar flashcards ou recuperação ativa, a recomendação pode sugerir uma breve revisão antes da aula. Isso descreve uma possibilidade de uso; não define tarefa obrigatória nem prova que a prática produzirá melhora.

## Estado atual que precisa ser substituído

Atualmente:

- `DesafioExperimentacao` exige um único `moduloId`, um `metodo` e uma `meta` escrita pela pessoa;
- `criarDesafioPessoal` cria esse registro diretamente;
- `SessaoEstudo.desafioId` vincula a sessão a um desafio;
- `listarDesafiosAtivosDoModuloPessoal` fornece desafios ao cronômetro;
- `/api/desafios` recebe módulo, método e meta do cliente;
- a comparação analítica usa `desafioId` como grupo;
- os endpoints de interpretação existentes não geram recomendações estruturadas por método.

Não adaptar apenas os nomes da interface sobre esse contrato. O backend precisa representar a nova semântica de forma explícita.

## Requisitos funcionais do backend

### RF-01 — Experimentação pessoal de método

Criar uma entidade canônica de experimentação com, no mínimo:

- identificador opaco;
- `usuarioId` obtido exclusivamente da sessão autenticada;
- método do catálogo vigente;
- situação `ATIVA` ou `ENCERRADA`;
- datas UTC de início e encerramento;
- orientação recomendada opcional;
- associação com um ou mais módulos próprios;
- sessões vinculadas.

Deve existir no máximo uma experimentação ativa para a mesma conta e método. O backend deve garantir essa invariável de maneira transacional e resistente a requisições simultâneas.

Nome de domínio sugerido: `ExperimentacaoMetodo`. Guanabara pode ajustar o nome se mantiver português, semântica explícita e consistência com o restante do projeto.

### RF-02 — Vínculo com múltiplos módulos

Uma experimentação ativa deve ser associada a uma lista sem duplicatas contendo pelo menos um módulo.

Para cada módulo, o servidor deve validar:

- pertencimento à conta autenticada;
- estado ativo;
- ausência de rascunho;
- identificador existente;
- ausência de duplicidade na mesma experimentação.

O cliente nunca informa `usuarioId`, propriedade, situação ou permissão como verdade.

### RF-03 — Recomendações estruturadas por método

Criar uma operação que devolva no mínimo três recomendações para um método válido do catálogo da Entrega B.

Cada recomendação deve conter:

```ts
type RecomendacaoExperimentacaoMetodo = {
  id: string;
  metodo: MetodoEstudoPessoal;
  titulo: string;
  orientacao: string;
  exemplo: string;
  origem: "GEMINI" | "LOCAL";
  geradaEm: string;
};
```

Restrições:

- retornar pelo menos três itens distintos;
- título curto e acionável;
- orientação entre limites definidos e validados no servidor;
- exemplo concreto, mas não prescritivo;
- não prometer melhora, desempenho ou retenção;
- não afirmar que a pessoa “aprende melhor” de determinada forma;
- não usar nome da pessoa, nome de módulo, conteúdo de arquivo, observação livre, resposta, gabarito ou outro dado identificável;
- validar a saída da IA por schema antes de devolvê-la;
- fornecer três recomendações locais válidas quando chave, cota, tempo limite, rede ou schema falharem;
- identificar claramente `origem` e limitação.

### RF-04 — Seleção opcional de orientação

Iniciar uma experimentação não exige recomendação.

Quando `recomendacaoId` for informado, o servidor deve confirmar que a recomendação:

- pertence à conta autenticada;
- foi gerada para o mesmo método;
- possui conteúdo validado;
- não foi alterada pelo cliente.

O texto vindo do navegador não pode ser marcado como orientação da IA sem verificação. Preferir persistir recomendações estruturadas com ID opaco e associar somente o ID selecionado. Recomendações não selecionadas não alteram métricas nem estado da experimentação.

### RF-05 — Início da experimentação

Criar serviço equivalente a:

```ts
iniciarExperimentacaoMetodoPessoal(
  usuarioId: string,
  entrada: {
    metodo: unknown;
    moduloIds: unknown;
    recomendacaoId?: unknown;
  },
): Promise<EstadoExperimentacaoMetodo>;
```

Comportamento:

- exige método disponível para novo registro;
- exige entre 1 e um limite documentado de módulos distintos;
- valida todos os módulos antes de persistir qualquer vínculo;
- recomendação é opcional;
- cria tudo em transação;
- rejeita nova experimentação quando o mesmo método já estiver ativo;
- não cria sessão automaticamente;
- não calcula comparação no React nem aceita média enviada pelo cliente.

### RF-06 — Encerramento

Criar operação para encerrar somente experimentação ativa da própria conta.

O encerramento:

- grava data UTC;
- preserva módulos, orientação e sessões já vinculadas;
- impede novos vínculos de sessão;
- não apaga histórico;
- remove o estado `EXPERIMENTANDO` do DTO vigente.

### RF-07 — Estado seguro para o Front End

Fornecer um DTO que permita renderizar os cards de método e a tag sem dedução no navegador:

```ts
type EstadoMetodoParaInterface = {
  metodo: MetodoEstudoPessoal;
  situacao: "DISPONIVEL" | "EXPERIMENTANDO";
  experimentacaoId: string | null;
  iniciadaEm: string | null;
  modulos: Array<{
    id: string;
    titulo: string;
    identificador: string;
  }>;
  orientacaoSelecionada: null | {
    id: string;
    titulo: string;
    orientacao: string;
    exemplo: string;
    origem: "GEMINI" | "LOCAL";
  };
};
```

O DTO deve incluir todos os seis métodos, inclusive os que não estão em experimentação.

### RF-08 — Vínculo da sessão

Substituir o vínculo ativo por uma referência opcional à experimentação de método.

Quando uma sessão informar `experimentacaoId`, o servidor deve exigir:

- experimentação ativa;
- mesma conta;
- método da sessão igual ao método experimentado;
- módulo do recurso incluído na experimentação;
- tópico e recurso válidos e próprios;
- ausência de confiança em módulo, método ou propriedade fornecidos isoladamente pelo cliente.

O cronômetro continuará podendo iniciar sessão sem experimentação.

### RF-09 — Analytics contextual

Adaptar a comparação para a nova entidade sem generalizar entre módulos.

Para uma experimentação ligada a vários módulos:

- construir grupos separadamente por módulo e método;
- incluir apenas evidências únicas e sessões válidas;
- grupo experimental: sessões vinculadas à experimentação;
- grupo externo: sessões do mesmo módulo e método sem qualquer experimentação;
- exigir duas evidências por grupo antes de calcular médias ou diferença;
- manter diferença `null` quando insuficiente;
- não produzir um único efeito agregado entre módulos diferentes;
- preservar versão explícita do algoritmo e testes determinísticos.

Mesmo que a interface inicial não liste comparações ou experimentações, o histórico e os contratos analíticos precisam permanecer coerentes.

## Persistência e migração

Criar uma nova migração aditiva. Não editar `20260915100000_desafios_experimentacao_bloom` nem qualquer migração já aplicada.

Estrutura sugerida:

- `ExperimentacaoMetodo`;
- `ExperimentacaoMetodoModulo` como associação entre experimentação e módulo;
- `RecomendacaoExperimentacaoMetodo` para recomendações validadas;
- `SessaoEstudo.experimentacaoMetodoId` anulável;
- índices de conta, método, situação, módulos e sessões;
- mecanismo de unicidade para uma única experimentação ativa por conta e método.

Compatibilidade obrigatória:

1. preservar `DesafioExperimentacao` e `SessaoEstudo.desafioId` como legado durante esta transição;
2. migrar cada desafio sintético existente para uma experimentação equivalente de um módulo;
3. copiar `meta` para orientação legada opcional, sem atribuir origem Gemini;
4. mapear sessões vinculadas para a nova referência;
5. converter `ATIVO` em `ATIVA` e `CANCELADO` em `ENCERRADA`, preservando datas;
6. impedir que novos fluxos gravem o modelo antigo;
7. manter leitura histórica enquanto houver consumidor legado;
8. verificar contagens, chaves estrangeiras e ausência de órfãos.

Guanabara pode propor uma estratégia de migração diferente, desde que seja aditiva, reproduzível, preserve registros e entregue a mesma semântica ao Araki.

## Contratos HTTP sugeridos

### Recomendações

`POST /api/metodos/{metodo}/recomendacoes`

Resposta `200`:

```ts
{
  metodo: MetodoEstudoPessoal;
  recomendacoes: RecomendacaoExperimentacaoMetodo[];
  limitacao: string;
}
```

Erros:

- `400 METODO_INVALIDO`;
- `401 NAO_AUTENTICADO`;
- `429 COTA` somente se a contingência local também estiver indisponível; normalmente a rota deve responder com origem `LOCAL`;
- `500 FALHA_RECOMENDACOES` somente quando nem a resposta local puder ser construída.

### Iniciar

`POST /api/experimentacoes-metodos`

Corpo:

```ts
{
  metodo: MetodoEstudoPessoal;
  moduloIds: string[];
  recomendacaoId?: string;
}
```

Respostas:

- `201` com `EstadoMetodoParaInterface`;
- `400 DADOS_INVALIDOS`;
- `401 NAO_AUTENTICADO`;
- `404 NAO_ENCONTRADO` sem revelar propriedade;
- `409 EXPERIMENTACAO_ATIVA`.

### Encerrar

`POST /api/experimentacoes-metodos/{id}/encerrar`

Respostas:

- `200` com estado encerrado;
- `401 NAO_AUTENTICADO`;
- `404 NAO_ENCONTRADO`.

### Estado dos métodos

Consulta de servidor ou `GET /api/metodos/estado`, conforme a arquitetura vigente. Preferir serviço chamado diretamente pelo Server Component quando não houver necessidade de consumo externo.

## DTO mínimo para recomendações da IA

O provedor pode receber somente:

```ts
type DtoRecomendacoesMetodo = {
  versao: string;
  metodo: MetodoEstudoPessoal;
  quantidadeSessoesValidasComMetodo: number;
  quantidadeModulosComEvidencia: number;
  faixaDeAmostra: "SEM_EVIDENCIA" | "REDUZIDA" | "OBSERVADA";
};
```

Não enviar:

- nome ou ID da conta;
- títulos ou IDs de módulos e tópicos;
- conteúdo, nome ou MIME de arquivos;
- observações livres;
- respostas, alternativas ou gabaritos;
- senha, cookie, chave ou identificador interno;
- recomendação anterior escrita pela pessoa.

Recomendações podem ser gerais quando não houver evidência. A ausência de dados não pode ser convertida em personalização inventada.

## Schema de saída da IA

Validar algo equivalente a:

```ts
{
  recomendacoes: Array<{
    titulo: string;      // 3 a 80 caracteres
    orientacao: string;  // 20 a 320 caracteres
    exemplo: string;     // 20 a 320 caracteres
  }>                    // mínimo 3, máximo 5
}
```

Bloquear linguagem causal ou classificatória, incluindo afirmações equivalentes a:

- “este método melhorará seu desempenho”;
- “você aprende melhor assim”;
- “este é o método ideal para você”;
- “seu perfil é visual/auditivo/cinestésico”;
- “esta prática garante retenção”.

A limitação deve informar que as sugestões são possibilidades de experimentação e não garantem resultado.

## Resposta local obrigatória

Para cada um dos seis métodos, manter pelo menos três recomendações locais válidas, versionadas e testadas. Elas devem ser específicas o suficiente para orientar o uso, mas não depender de dados pessoais.

Exemplo para recuperação ativa:

1. revisar flashcards por alguns minutos antes de uma aula;
2. tentar responder perguntas sem consultar o material e depois conferir;
3. explicar os pontos principais de memória ao final de uma sessão.

Esses textos são exemplos de contrato, não cópia obrigatória. Guanabara deve aplicar os limites de linguagem e validação do domínio.

## Alterações esperadas no cronômetro e histórico

- substituir o seletor de desafio por contexto de experimentação ativa compatível;
- quando houver uma experimentação do método no módulo atual, permitir vínculo opcional;
- não exigir orientação para iniciar sessão;
- sincronizar o método somente a partir da experimentação validada;
- histórico deve apresentar método, módulos da experimentação e orientação opcional quando existir;
- registros legados continuam legíveis como “orientação legada” ou rótulo equivalente, sem aparecer como novo desafio criado pela pessoa.

## Testes obrigatórios

### Domínio

- exatamente três ou mais recomendações válidas;
- rejeição de lista curta, texto fora dos limites e linguagem proibida;
- fallback local para todos os seis métodos;
- ausência de evidência não produz personalização inventada;
- comparação separada por módulo em experimentação multimódulo;
- menos de duas evidências mantém médias e diferença nulas.

### Serviço

- iniciar sem recomendação;
- iniciar com recomendação própria do mesmo método;
- rejeitar recomendação alheia, alterada ou de outro método;
- vincular um, dois e vários módulos próprios;
- rejeitar lista vazia, duplicada, módulo alheio, arquivado ou rascunho;
- impedir duas experimentações ativas do mesmo método;
- encerrar preservando vínculos e sessões;
- recusar acesso horizontal.

### Sessão

- iniciar sem experimentação;
- iniciar com experimentação ativa e módulo compatível;
- rejeitar método diferente;
- rejeitar módulo não vinculado;
- rejeitar experimentação encerrada ou de outra conta;
- preservar duração e autoavaliação existentes.

### IA

- Gemini válido;
- ausência de chave;
- cota;
- timeout;
- `401`, `429` e `500` externos;
- JSON inválido;
- menos de três recomendações;
- linguagem proibida;
- contingência local completa.

### Migração e cenário

- banco vazio;
- banco sintético vigente;
- migração dos desafios existentes sem perda;
- sessões antigas e novas legíveis;
- zero órfãos e `foreign_key_check` aprovado;
- seed com ao menos um método `EXPERIMENTANDO` em dois módulos, uma orientação selecionada e uma experimentação sem orientação.

### Integração HTTP

- autenticação;
- geração de recomendações;
- início com e sem orientação;
- conflito de experimentação ativa;
- múltiplos módulos;
- encerramento;
- propriedade entre duas contas;
- vínculo de sessão compatível e incompatível.

## Comandos mínimos de validação

Executar e registrar:

```powershell
npm.cmd run banco:gerar
npm.cmd run banco:reiniciar
npm.cmd run banco:verificar-cenario
npm.cmd run testar:desafios
npm.cmd run testar:sessoes
npm.cmd run testar:metricas
npm.cmd run testar:integracao
npm.cmd run validar
```

Criar ou atualizar scripts específicos quando os comandos atuais não cobrirem recomendações, experimentações multimódulo e migração legada.

## Critérios de aceite

- clicar em “Testar este método” poderá iniciar experimentação com um ou mais módulos;
- orientação recomendada será opcional;
- pelo menos três recomendações serão entregues mesmo sem provedor externo;
- o cliente não poderá falsificar origem, propriedade ou método de uma recomendação;
- apenas um estado ativo existirá por conta e método;
- o Front End receberá `EXPERIMENTANDO` diretamente do servidor;
- sessão sem experimentação continuará válida;
- sessão vinculada será validada por conta, método e módulo;
- comparação multimódulo permanecerá separada por módulo;
- desafio escrito pelo usuário deixará de ser criado pelo fluxo ativo;
- registros legados serão preservados;
- nenhuma recomendação afirmará causalidade ou estilo fixo;
- nenhum componente React acessará Prisma ou recalculará métricas.

## Fora do escopo do Guanabara

- desenhar ou implementar o modal dos métodos;
- escrever o conteúdo visual completo de explicação, passo a passo e exemplo estático de cada método;
- definir animação, layout, ícones, tipografia ou composição dos cards;
- remover visualmente o formulário “Criar desafio” e a lista “Desafios criados”;
- implementar o seletor visual de recomendações;
- implementar o seletor visual de múltiplos módulos;
- estilizar a tag `Experimentando`;
- reorganizar a rota `/desafios` ou renomeá-la sem nova decisão explícita;
- criar ranking, gamificação, obrigação, prazo ou recompensa;
- persistir conversa livre com a IA.

Esses itens pertencem à integração posterior do Araki, exceto mudanças de rota ou produto, que exigem nova decisão do autor.

## Saída necessária para o Araki

Ao concluir, Guanabara deve acrescentar ao fim deste documento:

1. migração criada e estratégia aplicada aos desafios legados;
2. modelos e enums finais;
3. invariável usada para uma experimentação ativa por conta e método;
4. tipo TypeScript final de `EstadoMetodoParaInterface`;
5. serviço para listar todos os métodos e seus estados;
6. endpoint, corpo e resposta para recomendações;
7. tipo final de recomendação;
8. confirmação de que sempre existem pelo menos três recomendações ou erro explícito;
9. endpoint e assinatura para iniciar experimentação;
10. endpoint e assinatura para encerrar experimentação;
11. comportamento quando o método já está `EXPERIMENTANDO`;
12. limite máximo de módulos por experimentação;
13. contrato final usado pelo cronômetro;
14. comportamento do histórico e dos registros legados;
15. DTO enviado à IA e campos explicitamente excluídos;
16. regras da contingência local;
17. DTO analítico por módulo;
18. testes e comandos executados;
19. qualquer divergência justificada em relação a este handoff.

Araki deve remover o fluxo visual antigo e integrar o novo modal somente depois que recomendações, experimentação multimódulo, estado `EXPERIMENTANDO` e vínculo de sessão estiverem implementados e validados.
