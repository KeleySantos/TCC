# Contas fictícias de demonstração

Todas as contas abaixo são fictícias e existem somente no banco local sintético. A senha compartilhada é um dado de demonstração e não deve ser reutilizada fora deste projeto.

| Nome exibido | Usuário | Senha sintética | Cenário do TCC |
|---|---|---|---|
| Ana Souza | `ana.souza` | `Laboratorio@2026` | S1 — Formato e método |
| Bruno Lima | `bruno.lima` | `Laboratorio@2026` | S2 — Contexto de módulo |
| Carla Rocha | `carla.rocha` | `Laboratorio@2026` | S3 — Evolução |
| Diego Alves | `diego.alves` | `Laboratorio@2026` | S4 — Dados insuficientes |
| Elisa Martins | `elisa.martins` | `Laboratorio@2026` | S5 — Percepção × evidência |
| ADMIN | `admin` | Exibida uma vez pelo provisionamento; não armazenar em documentação | Administração global da IA, fora dos cinco cenários |

Desde 2026-10-18, ADMIN é criada pelo seed ou por `npm run banco:configurar-admin`, sem papel docente nem acesso adicional aos dados pessoais das demais contas. O campo específico `administradorIa`, junto ao identificador reservado `admin`, permite somente a configuração global do Groq. A senha inicial é aleatória ou fornecida por `SENHA_ADMIN_INICIAL` no primeiro provisionamento e pode ser trocada em Perfil. Reexecutar o provisionamento não altera credenciais existentes. Diego possui o maior volume analítico para inspeção do Dashboard pessoal, do módulo JavaScript e do contexto enviado à interpretação opcional da IA.

Cada conta recebe ainda três módulos dedicados à avaliação, identificados por `avaliacao-tcc-s<n>-modulo-0`, `-1` e `-2`. Esse bloco totaliza 15 módulos, 150 sessões e 150 evidências e pode ser reaplicado por `npm run banco:aplicar-cenarios-tcc` sem remover os módulos demonstrativos das contas.

A tela `/entrar?modo=cadastro` permite criar outras contas pessoais locais. Elas começam sem módulos, materiais ou sessões e não fazem parte do `seed`; neste protótipo, devem receber somente dados fictícios. Desde 2026-10-18, o modal aberto pelo nome/avatar no rodapé permite editar nome exibido, login, senha e foto, além de excluir a própria conta com senha e confirmação. Alterar ou excluir uma conta de demonstração modifica o cenário local; verificadores do seed devem ser executados em base sintética controlada. ADMIN mantém login e exclusão protegidos para preservar o cofre global.
