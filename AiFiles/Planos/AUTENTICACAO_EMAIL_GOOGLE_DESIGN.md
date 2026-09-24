# Especificação — autenticação por e-mail e Google

**Estado:** aguardando revisão do usuário  
**Data:** 2026-09-23  
**Origem:** solicitação para remover o campo de usuário e adicionar cadastro/login com Google

## 1. Objetivo

Permitir que a plataforma autentique contas locais por e-mail e senha ou por uma conta Google, usando `nome` como único nome de exibição. O campo `nomeUsuario` deixará de fazer parte do fluxo do produto e será removido do modelo vigente após uma migração compatível com o banco sintético existente.

## 2. Critérios de aceite

1. O cadastro local exige nome, e-mail, senha e confirmação de senha.
2. O login local exige e-mail e senha.
3. A tela de entrada não apresenta campos, rótulos ou mensagens de usuário/nome de usuário.
4. O botão “Continuar com Google” inicia o fluxo OAuth somente quando as credenciais de ambiente estiverem configuradas; sem configuração, apresenta uma mensagem orientativa sem erro de servidor exposto.
5. O primeiro login Google cria uma conta pessoal vazia com o nome e o e-mail fornecidos pelo provedor.
6. Um e-mail Google verificado que corresponda a uma conta local existente associa a identidade Google à conta existente sem substituir o nome definido nela.
7. O nome da conta autenticada continua aparecendo no Dashboard, barra lateral, perfil e demais áreas que já exibem a identidade da pessoa.
8. O banco não possui mais a coluna `nomeUsuario` no modelo vigente; `email` é obrigatório e único, `senhaHash` pode ser nulo para contas criadas somente pelo Google e a identidade Google é única quando presente.
9. Contas sintéticas existentes continuam acessíveis por seus e-mails atuais. Registros legados sem e-mail recebem um e-mail sintético determinístico derivado do usuário antigo durante a migração, sem inserir dados reais.
10. Sair da conta invalida a sessão local e a sessão OAuth unificada.
11. Páginas e APIs protegidas continuam obtendo a conta pelo servidor e mantendo o isolamento de dados entre contas.

## 3. Abordagem escolhida

Usar Auth.js como camada de provedores e sessão, com o provedor de credenciais para o login local e o provedor Google para OAuth. A sessão será baseada em JWT assinado e protegido por cookie HTTP-only; a autorização da aplicação continuará consultando o registro `Usuario` no servidor.

Essa escolha evita implementar manualmente `state`, `nonce`, troca de código e validação de tokens, preserva um único fluxo de logout e permite manter a autorização existente baseada em `usuarioId`. Não será criado um conjunto paralelo de tabelas de sessão do Auth.js nesta etapa: o callback de autenticação fará a persistência da identidade Google no registro da conta local.

## 4. Modelo de dados e migração

O modelo `Usuario` passará a conter:

- `id`, `nome`, `email`, datas e relações atuais;
- `senhaHash String?`, permitindo conta exclusivamente Google;
- `googleSub String? @unique`, armazenando somente o identificador estável da conta Google.

`nomeUsuario` será retirado do schema e das consultas da aplicação. A migração SQL reconstruirá a tabela `Usuario` de maneira aditiva, preservando ids, relações, datas, hashes e e-mails. Antes da remoção da coluna:

- e-mails já preenchidos serão normalizados para minúsculas;
- registros sem e-mail receberão `<nomeUsuario-normalizado>@exemplo.test`;
- a unicidade será conferida antes da criação do índice obrigatório de e-mail;
- `googleSub` será criado nulo para contas existentes.

Seed, verificadores, testes e consultas de salas deixarão de localizar ou exibir contas por usuário; utilizarão e-mail para fixtures e `nome` para apresentação.

## 5. Fluxos de autenticação

### Conta local

O formulário valida nome, e-mail e senhas no servidor. O e-mail é normalizado, a senha é armazenada com o hash `scrypt` existente e a conta é autenticada pela ação de credenciais. Restrição única de e-mail retorna mensagem específica sem revelar dados de outra conta.

### Google

O botão inicia `signIn("google")`. No callback do provedor, o servidor exige e-mail e identificador estável do Google. Se `googleSub` já existir, a conta é recuperada. Caso contrário, um e-mail Google verificado existente associa a identidade à conta; sem correspondência, uma conta nova é criada com o nome do perfil Google e `senhaHash` nulo. O nome local não será sobrescrito em logins posteriores.

### Sessão e autorização

`obterUsuarioAtual` passará a ler a sessão Auth.js no servidor e consultar somente os campos necessários do `Usuario`. `UsuarioAtual` deixará de expor `nomeUsuario`. Ações protegidas, APIs, perfil e estrutura autenticada manterão a mesma fronteira de autorização. O logout usará o encerramento da sessão Auth.js.

## 6. Interface

Na entrada:

- cadastro: Nome, E-mail, Senha e Confirmar senha;
- login: E-mail e Senha;
- ambos os modos: botão “Continuar com Google” e mensagem de ambiente local;
- erros separados para dados inválidos, e-mail já utilizado, senhas diferentes e Google não configurado.

No perfil, o Nome continuará editável. O E-mail será exibido como identidade da conta e não será editável nesta etapa, pois a troca exige verificação e relink de provedor. Textos, badges e listas de membros usarão o Nome, sem `@nomeUsuario`.

## 7. Configuração externa

O `.env.example` documentará somente nomes de variáveis, nunca valores:

```text
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

Para desenvolvimento local, a URI de callback será `http://localhost:3000/api/auth/callback/google`. Sem essas variáveis, o login local continuará disponível e o botão Google retornará uma mensagem controlada. As credenciais não serão gravadas no banco, código, logs ou documentação versionada.

## 8. Testes e validação

- atualizar testes de cadastro para nome/e-mail/senha e duplicidade de e-mail;
- testar normalização e validação de e-mail e rejeição de senha ausente;
- testar criação, associação e recuperação de conta Google com callbacks isolados;
- testar que contas Google não exigem senha local e que contas locais continuam validando `scrypt`;
- testar autorização das APIs com `UsuarioAtual` sem `nomeUsuario`;
- executar migração em banco sintético existente e vazio, conferir `foreign_key_check` e contagens;
- executar lint, tipos, testes aplicáveis e build;
- validar manualmente a tela de entrada e o fluxo Google com credenciais OAuth fornecidas fora do repositório.

## 9. Riscos e limites

- O Google não funcionará de ponta a ponta até que um Client ID, Client Secret, tela de consentimento e URI de callback sejam configurados no Google Cloud.
- A versão permanece local e sintética; não haverá recuperação de senha, verificação de e-mail local, troca de e-mail ou múltiplos provedores nesta etapa.
- O vínculo automático por e-mail será aceito somente para e-mail Google verificado; identificadores Google e segredos não serão tratados como dados exibíveis.
- Migrações históricas não serão reescritas; a remoção ocorrerá em uma nova migração compatível com o controle local do projeto.

## 10. Arquivos previstos

- `prisma/schema.prisma` e nova migração de autenticação;
- `src/servidor/autenticacao.ts`, `autorizacao.ts`, `contas.ts` e módulo de configuração Auth.js;
- ações e interface de `src/app/entrar/`;
- `src/app/acoes-sessao.ts` e perfil;
- consultas de salas, seed, scripts e testes que ainda usam `nomeUsuario`;
- `.env.example`, matriz de requisitos, decisões, riscos e acompanhamento.
