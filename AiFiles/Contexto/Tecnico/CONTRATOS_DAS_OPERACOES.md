# Contratos das operações das Entregas A e B

> Contratos-alvo aprovados em 2026-09-12. Os contratos por papel do MVP anterior serão substituídos nas Fases 2 e 3; não representam a autorização do produto após a transição.

## `entrarComCredenciais`

Entrada de formulário: `nomeUsuario` e `senha`.

Pré-condições: credenciais sintéticas válidas. O servidor normaliza o nome de usuário, verifica a senha contra o hash armazenado e grava apenas o identificador da conta no cookie HTTP-only.

Saída de sucesso: redirecionamento para `/dashboard` da conta pessoal autenticada. A rota anterior `/painel` redireciona sem manter uma segunda implementação.

Falha: redirecionamento para `/entrar?erro=credenciais`, sem revelar qual campo falhou.

## `atualizarPerfilPessoal`

Entrada de formulário: `nome`, e-mail sintético opcional e, em formulário separado, senha atual e nova senha opcional.

Pré-condição: conta autenticada. A operação valida os campos, exige a senha atual para alterar a senha, impede e-mail duplicado e atualiza somente a própria conta. O nome de usuário não é alterado neste protótipo.

## Operações de módulo, tópico e material

Entrada de formulário: módulo recebe título e descrição; tópico recebe o módulo próprio, título e descrição; material recebe tópico próprio, título, descrição, formato, minutos estimados de 1 a 600, texto e/ou link HTTP(S).

`criarRascunhoModulo()` não recebe campos da interface: com a conta da sessão, cria um `ModuloAprendizagem` com `titulo` e `descricao` vazios, `rascunho: true` e identificador opaco `rascunho-{UUID}`. A ação revalida `/modulos` e redireciona para `/modulos/{identificador-temporario}`. O identificador não contém dado pessoal e permite vários rascunhos da mesma conta.

Pré-condição: conta autenticada. O servidor deriva identificadores a partir do título e impede duplicidade no escopo da conta, módulo ou tópico. Todo identificador enviado para editar ou arquivar é consultado junto com a propriedade da conta antes de qualquer escrita.

Na primeira atualização válida de um rascunho, o servidor valida os mesmos título e descrição, gera o identificador definitivo, grava os campos e `rascunho: false` na mesma atualização e redireciona para `/modulos/{identificador-definitivo}?sucesso=modulo`. Dados inválidos ou identificador duplicado preservam o rascunho e retornam para sua URL temporária com erro; recurso inexistente ou de outra conta não é exposto nem alterado. Módulos configurados continuam usando a atualização direta já existente.

A biblioteca `/modulos` lista os rascunhos próprios não arquivados para continuação; Dashboard, métricas oficiais por módulo e gerais, e o DTO de interpretação da IA filtram `rascunho: false`. Tópicos, materiais e operações dependentes exigem módulo configurado.

Regra de arquivamento: módulo usa `arquivado`; tópico e material usam `ativo = false`. O arquivamento não exclui conteúdo nem registros referenciados.

`criarRascunhoTopico(formulario)` recebe apenas o identificador do módulo apresentado na página, exige a conta da sessão e cria `Topico` vazio com identificador `rascunho-{UUID}`. O módulo precisa ser próprio, configurado e não arquivado. A ação redireciona para `/modulos/{identificador-modulo}?topico=rascunho-{UUID}`; atualização válida do tópico mantém as regras de nome e descrição, troca o identificador e define `rascunho: false`. Falhas preservam o rascunho. Tópicos em rascunho não aceitam material, sessão ou avaliação e não entram em indicadores.

## `POST /api/materiais/upload`

Entrada multipart: `topicoId`, título, descrição, minutos estimados e um único campo `arquivo`. A rota exige sessão e propriedade do tópico configurado. Aceita somente PNG/JPEG/WebP/GIF; PDF/TXT/DOC/DOCX/ODT; CSV/XLS/XLSX/ODS; MP3/WAV/OGG/M4A; e MP4/WebM/MOV. São validados nome, extensão, MIME, tamanho e assinatura. Os limites são 10 MiB para imagens, 25 MiB para documentos e planilhas, 50 MiB para áudio e 100 MiB para vídeo.

Saída: `201` com metadados seguros do material. Falhas: `400 DADOS_INVALIDOS|ARQUIVO_INVALIDO`, `401` sem sessão, `404 NAO_ENCONTRADO` sem propriedade, `409 IDENTIFICADOR_DUPLICADO`, `413 ARQUIVO_INVALIDO` para corpo declarado acima de 101 MiB e `500 FALHA_ARMAZENAMENTO`. O arquivo recebe chave opaca, fica fora de `public/` e é removido se a persistência dos metadados falhar.

A edição comum de material de arquivo altera somente título, descrição e minutos estimados; não converte arquivo para texto ou link. A substituição do binário exigirá uma operação própria, evitando conteúdo físico órfão.

## `GET /api/materiais/{id}/arquivo`

Exige sessão e localiza arquivo ativo junto ao tópico, módulo e conta proprietária. Retorna `401` sem sessão e `404` para arquivo inexistente, arquivado ou de outra conta. A resposta usa MIME validado, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` e não revela caminho físico.

## `POST /api/sessoes`

Entrada:

```json
{ "recursoId": "identificador-do-recurso", "metodo": "FEYNMAN", "desafioId": "opcional" }
```

Pré-condições: conta autenticada; recurso existe, está ativo e pertence a módulo da própria conta; método pertence ao conjunto controlado da interface. Quando `desafioId` é enviado, o desafio precisa estar ativo e pertencer à mesma conta, módulo e método. Desafio cancelado, inexistente ou alheio retorna `404`; combinação de método ou módulo divergente retorna `400`.

Saída de sucesso: `200 { "sessaoId": "..." }`.

Falhas: `400` para corpo inválido; `401` para sessão ausente ou expirada; `404` para recurso inexistente ou que não pertence à conta.

## Desafios de experimentação

`criarDesafioPessoal(usuarioId, { moduloId, metodo, meta })` valida módulo próprio, configurado e não arquivado; aceita somente Feynman, recuperação ativa, repetição espaçada, Pomodoro, intercalamento e prática distribuída. A meta possui de 3 a 280 caracteres. O resultado nasce `ATIVO` e pode ser listado somente pela proprietária.

`cancelarDesafioPessoal(usuarioId, desafioId)` altera apenas desafio ativo da proprietária para `CANCELADO`, grava a data UTC e não remove nem desvincula sessões preexistentes. Um cancelado não aceita vínculo novo.

`POST /api/desafios` recebe JSON com `moduloId`, `metodo` e `meta`; retorna `201 { desafio }`, `400` para entrada inválida, `401` sem sessão e `404` para módulo ausente ou alheio. `POST /api/desafios/{id}/cancelar` retorna `200 { desafio }`, `401` sem sessão e `404` para desafio ausente, cancelado ou alheio.

`obterComparacoesDesafiosPessoais(usuarioId)` devolve, por desafio, dois grupos do mesmo módulo e método: evidências únicas vinculadas ao desafio e evidências únicas sem desafio. Cada grupo informa amostra, nível, período e média somente a partir de duas evidências. `diferencaMedias` é `null` até que ambos os grupos tenham duas evidências; não representa efeito causal.

`obterAnaliseBloomModuloPessoal(usuarioId, identificadorModulo)` devolve respostas concluídas da própria conta agrupadas por `nivelBloom`. Um nível só expõe taxa quando tem pelo menos duas respostas classificadas; respostas sem classificação não entram e zero por cento permanece resultado válido quando a amostra é suficiente.

## `POST /api/sessoes/{id}/concluir`

Entrada:

```json
{ "dificuldadePercebida": 3, "compreensaoPercebida": 4, "observacao": "texto opcional de até 500 caracteres" }
```

Pré-condições: sessão pertence à conta autenticada e está ativa; as duas escalas são inteiras de 1 a 5. Sessão ausente ou expirada retorna `401`; uma sessão de outra conta não é localizada e retorna `404`.

Saída de sucesso:

```json
{ "situacao": "CONCLUIDA", "duracaoMinutos": 12 }
```

Regra: menos de cinco minutos retorna `INVALIDADA`; a duração oficial é sempre a diferença entre relógios do servidor. Observação livre nunca compõe métrica oficial nem é enviada à Gemini.

## `POST /api/tentativas`

Entrada:

```json
{
  "avaliacaoId": "identificador-da-avaliacao",
  "respostas": { "id-da-questao": "opcao-escolhida" }
}
```

Pré-condições: conta autenticada; avaliação ativa, ligada a tópico de módulo próprio; respostas em formato válido. Sessão ausente ou expirada retorna `401`; avaliação de outra conta retorna `404`.

Saída de sucesso:

```json
{ "tentativaId": "...", "numeroTentativa": 2, "notaNormalizada": 80, "respostasCorretas": 4, "totalQuestoes": 5 }
```

Regra: o gabarito nunca é enviado ao cliente antes da submissão; a nota e o número sequencial da tentativa são calculados no servidor. Não existe `sessaoId` nesta operação.

## `POST /api/interpretacoes`

Entrada: não recebe métrica, nota, identificador de outra conta, prompt livre ou chave do cliente. O servidor monta o DTO agregado da conta autenticada.

Pré-condição: conta autenticada com dados do próprio painel. A integração externa é opcional e não pode bloquear a abertura do painel. A cota local aceita até cinco solicitações por conta em uma hora.

Saída de sucesso: estrutura validada com padrões observados, feedbacks, conselhos, perguntas de reflexão, contexto, amostra e limitação. `origem` informa `GEMINI` ou `LOCAL`; falhas de configuração, tempo limite, cota, rede ou schema retornam a interpretação local de contingência.

## `POST /api/modulos/{identificador}/interpretacoes`

Exige sessão e analisa somente módulo configurado, ativo e pertencente à conta. Retorna `200` com `InterpretacaoGerada`, `401` sem sessão e `404` para módulo ausente, arquivado, em rascunho ou de outra conta. O DTO usa “Módulo 1”, contagens, período, evolução semanal e dificuldade estimada; exclui nomes, identificadores, URLs, metadados e conteúdo de materiais, observações, respostas e gabaritos.

## Invariantes comuns

- Cliente não é fonte oficial de nota, duração ou permissão.
- Identificadores recebidos são validados antes de escrita.
- Conta pessoal só manipula seus próprios registros por meio da sessão atual.
- Dados derivados não usam sessões inválidas nem exposição mista simples.
- Senhas nunca são persistidas em texto simples nem enviadas para a interface após o cadastro.
- Tentativas não recebem vínculo direto `sessaoId` na Entrega A.
- O vínculo de desafio pertence à sessão, não à tentativa; ele não altera a regra temporal de evidência sessão–tentativa.
- Gemini não calcula métricas, não altera dados, notas ou permissões e não recebe dados livres ou identificáveis.

## Verificação de autorização local

Com o servidor de desenvolvimento em execução, utilizar `npm run testar:integracao`. O teste cria sessão e tentativa temporárias de uma conta sintética, confirma que uma segunda conta não consegue encerrá-las ou submeter avaliação alheia, e remove os registros ao finalizar. Ele também confirma `401` sem sessão e `404` para recurso ou avaliação de outra conta.
