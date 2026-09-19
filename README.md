# Learning Lab

Aplicação local para demonstração acadêmica de Learning Analytics. Cada conta pessoal organiza módulos, tópicos e materiais, registra sessões de estudo, conclui avaliações e consulta indicadores explicáveis.

> O banco contém apenas dados sintéticos. Indicadores e interpretações descrevem registros observados; não comprovam causalidade, não definem estilos de aprendizagem e não constituem diagnóstico.

## Recursos das Entregas A e B

- Conta pessoal autenticada, sem papéis de produto.
- CRUD de módulos, tópicos e materiais textuais ou com link HTTP(S).
- Sessões com método, duração calculada no servidor e autoavaliação de dificuldade e compreensão.
- Quiz corrigido no servidor, com tentativas sequenciais, acertos e nota de 0 a 100.
- Catálogo controlado de métodos, desafios pessoais canceláveis e vínculo explícito entre desafio e sessão.
- Comparação observacional de desafio no mesmo módulo e método, com amostra e limitação explícitas.
- Análise de taxa por nível de Bloom a partir de respostas classificadas, acompanhada de gráfico e tabela.
- Métricas locais e versionadas por módulo/tópico: acerto, tempo, evolução, método, formato e percepção versus resultado.
- Painéis com gráficos e tabelas equivalentes, incluindo limites de amostra e exposição mista.
- Interpretação opcional por Gemini de um resumo agregado; sem chave ou em falha externa, resposta local de contingência.

## Pré-requisitos

- Node.js portátil `22.23.2` usado neste ambiente (Node 24 recompila o driver SQLite nativo de modo incompatível).
- npm compatível com esse Node.

## Instalação e execução

No PowerShell, dentro do projeto:

```powershell
Copy-Item .env.example .env
$pastaNodePortatil = Join-Path $env:TEMP 'codex-node-v22.23.2\node-v22.23.2-win-x64'
$env:PATH = "$pastaNodePortatil;$env:PATH"
& (Join-Path $pastaNodePortatil 'npm.cmd') ci
& (Join-Path $pastaNodePortatil 'npm.cmd') run banco:reiniciar
& (Join-Path $pastaNodePortatil 'npm.cmd') run desenvolver
```

Abra [http://localhost:3000/entrar](http://localhost:3000/entrar).

## Contas de demonstração

| Conta | Usuário | Senha sintética |
|---|---|---|
| Ana, Bruno, Carla, Diego ou Elisa | `ana.souza`, `bruno.lima`, `carla.rocha`, `diego.alves`, `elisa.martins` | `Laboratorio@2026` |

As contas funcionam somente no banco local sintético e não devem ser reutilizadas fora da demonstração.

## Interpretação por Gemini

Por padrão, `GEMINI_API_KEY` fica vazia e o botão de interpretação devolve uma resposta local baseada nas mesmas métricas. Para habilitar Gemini, configure em `.env` — nunca versionar a chave:

```dotenv
GEMINI_API_KEY="sua-chave"
GEMINI_MODEL="gemini-2.5-flash"
```

O provedor recebe somente um DTO agregado, sem nome, identificador interno, respostas do quiz ou observações livres. Há tempo limite de sete segundos e máximo de cinco solicitações por conta a cada hora; qualquer indisponibilidade retorna a contingência local.

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run desenvolver` | Inicia o servidor local. |
| `npm run compilar` | Gera a compilação de produção. |
| `npm run verificar-estilo` / `npm run verificar-tipos` | Executa lint e tipos. |
| `npm run testar` | Executa testes unitários, inclusive analytics e IA. |
| `npm run testar:servicos` | Confere CRUD e isolamento dos módulos. |
| `npm run testar:sessoes` | Confere duração, contexto e histórico de sessão. |
| `npm run testar:avaliacoes` | Confere notas, sequência e isolamento de avaliações. |
| `npm run testar:metricas` | Confere os perfis sintéticos A–E. |
| `npm run testar:desafios` | Confere validação, propriedade, vínculo de sessão e cancelamento de desafios. |
| `npm run testar:integracao` | Confere APIs com o servidor local em execução. |
| `npm run banco:reiniciar` | Recria o banco sintético aplicando todas as migrações. |
| `npm run banco:verificar-cenario` | Confere as contagens e expectativas do cenário. |
| `npm run validar` | Executa lint, tipos, testes unitários e build. |

## Limitações

- Não há dados reais, usuários de produção ou avaliação com participantes.
- Sessões inválidas permanecem no histórico, mas não entram nas métricas oficiais.
- Exposição a mais de um material antes de uma tentativa não é atribuída a um único formato ou método.
- Recorrência exige dados de dois ou mais módulos e nunca vira um rótulo permanente.
- Gemini interpreta os indicadores; não calcula métricas, não corrige respostas, não altera banco e não decide permissões.

## Estrutura

- `src/dominio/`: regras puras de analytics, recomendações e interpretação.
- `src/servidor/`: autenticação, serviços, métricas e adaptadores externos.
- `src/app/`: páginas, ações e APIs do Next.js.
- `prisma/`: schema, migrações e cenário sintético.
- `scripts/`: reinicialização e verificações locais.
- `AiFiles/`: decisões, plano, contexto e rastreabilidade.
