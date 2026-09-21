# Contratos das operações das Entregas A e B

> Contratos-alvo aprovados em 2026-09-12. Os contratos por papel do MVP anterior serão substituídos nas Fases 2 e 3; não representam a autorização do produto após a transição.

## Operações de salas — Fase 12

`criarSala` exige nome, descrição e primeiro módulo-pai válidos. A conta autenticada se torna proprietária; a sala nasce ativa e com exatamente um módulo-pai.

`gerarConviteSala` exige propriedade da sala ativa, cria código aleatório com validade de sete dias e persiste somente SHA-256. O segredo é devolvido uma única vez para uso como código ou link. `solicitarEntradaSala` cria solicitação pendente; não cria associação. `decidirSolicitacaoSala` é exclusiva do proprietário e aprova ou rejeita sem expor a sala a terceiros.

`vincularInstanciaModuloSala` exige membro ativo e aceita exatamente uma alternativa: criar módulo pessoal vazio a partir do título/descrição do módulo-pai ou selecionar módulo próprio ativo e configurado. O vínculo não copia conteúdo. Uma pessoa possui no máximo uma instância ativa por módulo-pai.

`alterarConsentimentosVinculo` é exclusiva do titular do vínculo. Comparação e IA começam falsas. `desvincularInstanciaModuloSala`, saída, remoção ou exclusão lógica desligam dashboard, comparação e IA, preservando o módulo pessoal.

`publicarComentarioSala` é exclusiva do proprietário. Escopo `SALA` não recebe alvo; `MODULO` exige módulo-pai da sala; `MEMBRO` exige destinatário ativo. Membros leem somente comentários gerais, dos módulos em que possuem vínculo ativo e os destinados à própria conta.

Nenhuma operação de sala autoriza o proprietário a consultar material, sessão ou descrição interna da instância de um membro. Recursos inexistentes e alheios são tratados como indisponíveis.

## Dashboards das salas — Fase 13

`obterDashboardsSalaDoProprietario` é exclusiva do proprietário ativo. Ela calcula a visão geral, os agregados por módulo-pai e os dashboards individuais ativos a partir das métricas oficiais. Agregados com menos de três contribuidores com sessão válida devolvem apenas insuficiência de amostra.

A comparação nominal usa somente vínculos ativos com `permitirComparacao = true`, pode ser ocultada na interface e não ordena, classifica ou atribui desempenho. O consentimento não é inferido do compartilhamento comum.

`gerarInterpretacaoMembroSala` exige proprietário, vínculo ativo e `permitirIa = true` no momento da chamada. O DTO contém nome, contexto e métricas, com lista de descrições vazia; materiais e textos de sessão nunca atravessam essa fronteira.

Antes de desvincular, sair ou remover, o servidor preserva os campos analíticos das sessões válidas em `EvidenciaHistoricaModuloSala`. A evidência não contém usuário, módulo pessoal, descrição ou material e só participa de agregados. Uma reativação define nova janela de dados vivos para não duplicar o histórico.

## `entrarComCredenciais`

Entrada de formulário: `nomeUsuario` e `senha`.

Pré-condições: credenciais sintéticas válidas. O servidor normaliza o nome de usuário, verifica a senha contra o hash armazenado e grava apenas o identificador da conta no cookie HTTP-only.

Saída de sucesso: redirecionamento para `/dashboard` da conta pessoal autenticada. A rota anterior `/painel` redireciona sem manter uma segunda implementação.

Falha: redirecionamento para `/entrar?erro=credenciais`, sem revelar qual campo falhou.

## `atualizarPerfilPessoal`

Entrada de formulário: `nome`, e-mail sintético opcional e, em formulário separado, senha atual e nova senha opcional.

Pré-condição: conta autenticada. A operação valida os campos, exige a senha atual para alterar a senha, impede e-mail duplicado e atualiza somente a própria conta. O nome de usuário não é alterado neste protótipo.

## Operações de módulo e material

Entrada de formulário: módulo recebe título e descrição; material recebe o módulo próprio, título, descrição, formato, minutos estimados de 1 a 600, texto ou link HTTP(S). O material não exige tópico.

`criarRascunhoModulo()` não recebe campos da interface: com a conta da sessão, cria um `ModuloAprendizagem` com `titulo` e `descricao` vazios, `rascunho: true` e identificador opaco `rascunho-{UUID}`. A ação revalida `/modulos` e redireciona para `/modulos/{identificador-temporario}`. O identificador não contém dado pessoal e permite vários rascunhos da mesma conta.

Pré-condição: conta autenticada. O servidor deriva identificadores a partir do título e impede duplicidade no escopo da conta ou módulo. Todo identificador enviado para editar ou arquivar é consultado junto com a propriedade da conta antes de qualquer escrita.

Na primeira atualização válida de um rascunho, o servidor valida os mesmos título e descrição, gera o identificador definitivo, grava os campos e `rascunho: false` na mesma atualização e redireciona para `/modulos/{identificador-definitivo}?sucesso=modulo`. Dados inválidos ou identificador duplicado preservam o rascunho e retornam para sua URL temporária com erro; recurso inexistente ou de outra conta não é exposto nem alterado. Módulos configurados continuam usando a atualização direta já existente.

A biblioteca `/modulos` lista os rascunhos próprios não arquivados para continuação; Dashboard, métricas oficiais por módulo e gerais, e o DTO de interpretação da IA filtram `rascunho: false`. Materiais e sessões exigem módulo configurado.

Regra de arquivamento: módulo usa `arquivado`; material usa `ativo = false`. O arquivamento não exclui conteúdo nem registros referenciados.

## `POST /api/materiais/upload`

Entrada multipart: `moduloId`, título, descrição, minutos estimados e um único campo `arquivo`. A rota exige sessão e propriedade do módulo configurado. Aceita somente PNG/JPEG/WebP/GIF; PDF/TXT/DOC/DOCX/ODT; CSV/XLS/XLSX/ODS; MP3/WAV/OGG/M4A; e MP4/WebM/MOV. São validados nome, extensão, MIME, tamanho e assinatura. Os limites são 10 MiB para imagens, 25 MiB para documentos e planilhas, 50 MiB para áudio e 100 MiB para vídeo.

Saída: `201` com metadados seguros do material. Falhas: `400 DADOS_INVALIDOS|ARQUIVO_INVALIDO`, `401` sem sessão, `404 NAO_ENCONTRADO` sem propriedade, `409 IDENTIFICADOR_DUPLICADO`, `413 ARQUIVO_INVALIDO` para corpo declarado acima de 101 MiB e `500 FALHA_ARMAZENAMENTO`. O arquivo recebe chave opaca, fica fora de `public/` e é removido se a persistência dos metadados falhar.

A edição comum de material de arquivo altera somente título, descrição e minutos estimados; não converte arquivo para texto ou link.

## `GET /api/materiais/{id}/arquivo`

Exige sessão e localiza arquivo ativo diretamente pelo módulo e pela conta proprietária. Retorna `401` sem sessão e `404` para arquivo inexistente, arquivado ou de outra conta. A resposta usa MIME validado, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` e não revela caminho físico.

## Análise e ciclo de vida dos arquivos — Fase 14

`POST /api/materiais/{id}/analise` exige propriedade e processa PDF, TXT, DOCX, CSV, XLSX ou imagem. O texto é extraído localmente, limitado a 60.000 caracteres, tratado como conteúdo não confiável e descartado. A fila Groq → Gemini → Qwen recebe o texto limitado; sem provedor disponível, a contingência local produz conceitos e sugestões. O resultado compacto é persistido em `AnaliseMaterial`.

`POST /api/materiais/{id}/arquivo/substituir` valida o novo binário, move o anterior para remoção reversível, atualiza arquivo e material em transação e invalida a análise anterior. Após a confirmação do banco, remove o binário antigo e a interface inicia nova análise quando o formato for compatível.

`DELETE /api/materiais/{id}` exige confirmação na interface e propriedade no servidor. Remove vínculos opcionais com sessões, material, metadados e análise em transação; o binário é movido antes e restaurado se o banco falhar. Outra conta recebe `404` sem enumeração.

O painel compara conceitos normalizados somente com descrições de sessões concluídas e válidas. A quantidade de menções é observacional e não significa domínio, nota ou aprendizagem comprovada.

## `POST /api/sessoes`

Cria uma sessão sem depender de tópico. O campo `tipo` define o fluxo.

Registro manual concluído ou planejado:

```json
{
  "tipo": "MANUAL",
  "moduloId": "identificador-do-modulo",
  "descricao": "Conteúdos estudados",
  "metodos": ["FEYNMAN", "RECUPERACAO_ATIVA"],
  "formatos": ["TEXTO", "PDF"],
  "materialIds": ["material-opcional"],
  "iniciadaEm": "2035-01-10T10:00:00.000Z",
  "encerradaEm": "2035-01-10T11:00:00.000Z",
  "dificuldadePercebida": 3,
  "compreensaoPercebida": 4
}
```

Cronômetro recebe os mesmos campos contextuais, usa `tipo: "CRONOMETRO"` e não recebe datas nem percepções no início. O servidor grava o instante inicial.

Descrição possui de 3 a 2.000 caracteres. Pelo menos um método vigente e um formato são obrigatórios; valores repetidos são normalizados. Zero ou vários materiais ativos podem ser vinculados, desde que pertençam ao mesmo módulo próprio. Quando `desafioId` for usado pela compatibilidade da Entrega B, seu método precisa estar entre os métodos da sessão.

Registro com início e fim no futuro nasce `PLANEJADA` sem exigir percepções. Registro encerrado no presente ou passado exige dificuldade e compreensão de 1 a 5 e nasce `CONCLUIDA` ou `INVALIDADA`. Intervalo parcialmente futuro, fim anterior ao início, módulo indisponível e contexto inválido são recusados. Toda duração é calculada no servidor em minutos inteiros.

Nenhuma conta pode manter intervalos sobrepostos, inclusive entre módulos e sessões arquivadas. Um cronômetro ativo também impede outro cronômetro da mesma conta. A conferência ocorre novamente na conclusão e edição.

Saída: `201 { "sessao": { ... } }`. Falhas: `400` para entrada inválida; `401` sem sessão; `404` para módulo, material ou desafio ausente/alheio; `409` para sobreposição ou estado incompatível. O corpo legado `{ recursoId, metodo, desafioId? }` permanece temporariamente aceito para consumidores ainda não migrados.

## Consulta, edição e arquivamento de sessões

- `GET /api/sessoes?moduloId={id}` lista sessões não arquivadas do módulo próprio em ordem cronológica decrescente; `incluirArquivadas=true` inclui todo o histórico.
- `GET /api/sessoes/{id}` retorna detalhes somente à conta proprietária.
- `PATCH /api/sessoes/{id}` edita descrição, período, métodos, formatos, materiais e percepções de sessão planejada, concluída ou invalidada. O servidor recalcula duração e situação, refaz relações normalizadas e bloqueia sobreposição.
- `POST /api/sessoes/{id}/arquivar` realiza arquivamento lógico. Sessão ativa não pode ser arquivada. O registro continua disponível para métricas posteriores conforme a decisão funcional.
- `POST /api/sessoes/{id}/desarquivar` restaura a exibição padrão.

Sessão futura editada continua `PLANEJADA` e não exige percepções. Sessão movida para o passado exige ambas as percepções. A edição não permite trocar o módulo nem romper o método de um desafio legado já vinculado.

## Métricas oficiais por sessões

`obterMetricasSessoesModuloPessoal(usuarioId, identificadorModulo)` e `obterMetricasSessoesPessoais(usuarioId)` usam exclusivamente sessões da conta e módulos próprios configurados. O motor `metricas-sessoes-v1` não recebe tópico, avaliação, tentativa, nota, resposta ou material.

Entram somente sessões `CONCLUIDA` com fim e duração oficial de ao menos cinco minutos. Sessões `PLANEJADA`, `ATIVA` e `INVALIDADA` ficam fora; o arquivamento da sessão não remove o tempo já estudado. O consolidado calcula quantidade, minutos totais, duração média, dias com estudo, maior sequência diária UTC, período, percepções, agregações por método e formato e evolução semanal UTC.

Métodos e formatos são contextos múltiplos não exclusivos: cada sessão conta uma vez em cada valor selecionado, portanto percentuais contextuais podem somar mais de 100%. Médias de dificuldade e compreensão só são publicadas com ao menos duas percepções. Todo DTO inclui versão, critérios, nível de amostra e limitações descritivas. A página do módulo consome esse contrato diretamente e oferece descrições acessíveis e tabelas equivalentes aos gráficos.

## Desafios de experimentação

`criarDesafioPessoal(usuarioId, { moduloId, metodo, meta })` valida módulo próprio, configurado e não arquivado; aceita somente Feynman, recuperação ativa, repetição espaçada, Pomodoro, intercalamento e prática distribuída. A meta possui de 3 a 280 caracteres. O resultado nasce `ATIVO` e pode ser listado somente pela proprietária.

`cancelarDesafioPessoal(usuarioId, desafioId)` altera apenas desafio ativo da proprietária para `CANCELADO`, grava a data UTC e não remove nem desvincula sessões preexistentes. Um cancelado não aceita vínculo novo.

`POST /api/desafios` recebe JSON com `moduloId`, `metodo` e `meta`; retorna `201 { desafio }`, `400` para entrada inválida, `401` sem sessão e `404` para módulo ausente ou alheio. `POST /api/desafios/{id}/cancelar` retorna `200 { desafio }`, `401` sem sessão e `404` para desafio ausente, cancelado ou alheio.

`obterComparacoesDesafiosPessoais(usuarioId)` devolve, por desafio, dois grupos do mesmo módulo e método: sessões válidas vinculadas ao desafio e sessões válidas sem desafio. Cada grupo informa quantidade, minutos, período, nível de amostra e médias de duração, dificuldade percebida e compreensão percebida somente a partir de duas sessões. As diferenças permanecem `null` até que ambos os grupos tenham duas sessões e nunca representam aprendizagem objetiva ou efeito causal.

Análises de nota, taxa de acerto e Bloom foram removidas na Fase 9.

## Histórico e dashboard gerais

`listarHistoricoPessoal(usuarioId)` lista somente sessões da conta em ordem cronológica decrescente, com módulo, desafio opcional, métodos, formatos e materiais vinculados. Não consulta tópico, avaliação ou tentativa.

`obterPainelPessoal(usuarioId)` combina módulos ativos e `metricas-sessoes-v1`. `/dashboard` apresenta módulos, sessões válidas, tempo total, método mais registrado, evolução semanal de minutos e minutos associados por método. Contextos múltiplos não são tratados como categorias exclusivas e nenhum indicador afirma aprendizagem objetiva.

## `POST /api/sessoes/{id}/concluir`

Entrada:

```json
{ "dificuldadePercebida": 3, "compreensaoPercebida": 4, "observacao": "texto opcional de até 500 caracteres" }
```

Pré-condições: sessão pertence à conta autenticada e está `ATIVA`, ou está `PLANEJADA` com horário final já transcorrido; as duas escalas são inteiras de 1 a 5. Outra conta não localiza o registro.

O retorno contém o DTO completo em `{ "sessao": { ... } }`.

Regra: cronômetro usa o relógio do servidor no encerramento; planejamento usa seu período armazenado. Menos de cinco minutos retorna `INVALIDADA`. O campo legado `observacao` permanece aceito temporariamente, mas a descrição própria é o contexto oficial da sessão.

## `POST /api/interpretacoes`

Entrada: não recebe métrica, identificador de outra conta, prompt livre ou chave. O servidor monta o DTO de sessões da conta autenticada, incluindo descrições registradas, métricas oficiais, contextos e referências opacas.

Pré-condição: conta autenticada com dados do próprio painel. A integração externa é opcional e não pode bloquear a abertura do painel. A cota local aceita até cinco solicitações por conta em uma hora.

Saída de sucesso: estrutura validada com padrões observados, feedbacks, conselhos, perguntas de reflexão, contexto, amostra, limitação, provedor/modelo e caminho seguro do fallback. A fila fixa é `GROQ → GEMINI → QWEN → LOCAL`. Limite, timeout, autenticação, indisponibilidade ou schema inválido avançam ao próximo provedor e geram cooldown; nenhuma resposta externa calcula ou altera métricas.

## `POST /api/modulos/{identificador}/interpretacoes`

Exige sessão e analisa somente módulo configurado, ativo e pertencente à conta. Retorna `200` com `InterpretacaoGerada`, `401` sem sessão e `404` para módulo ausente, arquivado, em rascunho ou de outra conta. O DTO usa “Módulo 1”, métricas de sessões, evolução semanal e descrições delimitadas como conteúdo não confiável; exclui nomes, identificadores, URLs, materiais, tópicos, avaliações, respostas e gabaritos. Respostas usam `Cache-Control: no-store`.

## Configurações de IA

`/configuracoes/ia` exige conta autenticada. Ações de salvar, substituir, testar, ativar, desativar e remover sempre obtêm `usuarioId` da sessão. A API Key entra somente no formulário de senha, é cifrada no servidor e nunca é retornada, nem parcialmente, ao navegador. O teste externo só ocorre após comando explícito; salvar não testa e não faz chamada de rede. No Gemini, o teste consulta os metadados do modelo sem solicitar geração, evitando consumo desnecessário e distinguindo credencial válida de congestionamento. As interpretações usam `gemini-3.8-flash`, repetem falhas transitórias e tentam `gemini-3.7-flash` antes de avançar para Qwen. Desativar todos mantém as chaves cifradas e força a interpretação local; remover apaga definitivamente o registro.

O cofre usa AES-256-GCM e contexto autenticado por conta/provedor. Em produção, `CHAVE_MESTRA_CREDENCIAIS_IA` deve conter 32 bytes em Base64; no desenvolvimento, uma chave aleatória é criada em `.dados/segredos`, diretório ignorado. O scanner `verificar:segredos` examina todos os arquivos versionáveis sem imprimir valores encontrados. Credenciais só deixam o servidor no cabeçalho HTTPS destinado ao provedor correspondente.

## Invariantes comuns

- Cliente não é fonte oficial de duração ou permissão.
- Identificadores recebidos são validados antes de escrita.
- Conta pessoal só manipula seus próprios registros por meio da sessão atual.
- Dados derivados não usam sessões inválidas.
- Senhas nunca são persistidas em texto simples nem enviadas para a interface após o cadastro.
- O vínculo de desafio pertence à sessão e não altera as métricas oficiais.
- Groq, Gemini e Qwen não calculam métricas, não alteram dados ou permissões e recebem somente o DTO de sessões após solicitação explícita.

## Verificação de autorização local

Com o servidor em execução, utilizar `npm run testar:api-sessoes` para o contrato de sessões. O teste confirma `401` sem sessão, `404` para módulo e sessão de outra conta, além de criação planejada, edição com recálculo, listagem, arquivamento e restauração. `npm run testar:integracao` verifica autenticação e propriedade de módulos, materiais, sessões, desafios e interpretações; todos os registros temporários são removidos ao finalizar.
