# Contratos das operações do MVP

## `entrarComCredenciais`

Entrada de formulário: `nomeUsuario` e `senha`.

Pré-condições: credenciais sintéticas válidas. O servidor normaliza o nome de usuário, verifica a senha contra o hash armazenado e grava apenas o identificador da conta no cookie HTTP-only.

Saída de sucesso: redirecionamento para `/aluno`, `/professor` ou `/administrador`, conforme o papel persistido no servidor.

Falha: redirecionamento para `/entrar?erro=credenciais`, sem revelar qual campo falhou.

## `cadastrarProfessor`

Entrada de formulário: `nome`, `nomeUsuario` e `senha`.

Pré-condição: administrador autenticado. A operação valida os campos, impede nome de usuário duplicado, cria `Usuario` com papel de professor, cria `PerfilProfessor` e registra `EventoAuditoria`.

## `POST /api/sessoes`

Entrada:

```json
{ "recursoId": "identificador-do-recurso" }
```

Pré-condições: usuário autenticado como aluno; recurso existe e está ativo.

Saída de sucesso: `200 { "sessaoId": "..." }`.

Falhas: `400` para corpo inválido; `401` para sessão ausente ou expirada; `403` para papel incompatível; `404` para recurso inexistente.

## `POST /api/sessoes/{id}/concluir`

Pré-condições: sessão pertence ao aluno autenticado e está ativa. Sessão ausente ou expirada retorna `401`; papel incompatível retorna `403`; uma sessão de outro aluno não é localizada e retorna `404`.

Saída de sucesso:

```json
{ "situacao": "CONCLUIDA", "duracaoMinutos": 12 }
```

Regra: menos de cinco minutos retorna `INVALIDADA`.

## `POST /api/tentativas`

Entrada:

```json
{
  "avaliacaoId": "identificador-da-avaliacao",
  "respostas": { "id-da-questao": "opcao-escolhida" }
}
```

Pré-condições: aluno autenticado; avaliação ativa; respostas em formato válido. Sessão ausente ou expirada retorna `401`; papel incompatível retorna `403`.

Saída de sucesso:

```json
{ "tentativaId": "...", "notaNormalizada": 80, "respostasCorretas": 4, "totalQuestoes": 5 }
```

Regra: o gabarito nunca é enviado ao cliente antes da submissão; a nota é calculada no servidor.

## `atualizarCuradoria`

Entrada de formulário: `recursoId` e `situacao` igual a `APROVADO` ou `REJEITADO`.

Pré-condição: usuário autenticado como professor.

Efeito: cria ou atualiza `AprovacaoRecurso`, cria `EventoAuditoria` e atualiza a página do professor.

## Invariantes comuns

- Cliente não é fonte oficial de nota, duração ou permissão.
- Identificadores recebidos são validados antes de escrita.
- Aluno só manipula seus próprios registros por meio da sessão atual.
- Dados derivados não usam sessões inválidas nem exposição mista simples.
- Senhas nunca são persistidas em texto simples nem enviadas para a interface após o cadastro.

## Verificação de autorização local

Com o servidor de desenvolvimento em execução, utilizar `npm run testar:integracao`. O teste cria uma sessão temporária de Ana, confirma que Bruno não consegue encerrá-la e a remove ao finalizar. Ele também confirma as respostas `401` sem sessão e `403` para perfil de professor.
