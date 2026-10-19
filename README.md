# Learning Lab

Aplicação local para demonstração acadêmica de um laboratório pessoal de aprendizagem. Cada conta organiza módulos e materiais, registra sessões, observa métricas descritivas e pode receber interpretações com IA.

> O cenário contém somente dados sintéticos. Indicadores e interpretações descrevem registros observados; não atribuem nota, não comprovam aprendizagem ou causalidade e não definem estilos fixos.

## Recursos atuais

- módulos pessoais com materiais de texto, link ou arquivo;
- sessões manuais, planejadas ou por cronômetro, com vários métodos e formatos;
- métricas versionadas de tempo, frequência, percepções, métodos e formatos;
- desafios pessoais com comparação observacional;
- interpretação opcional por Groq, com contingência local;
- salas que agregam dashboards pessoais vinculados, com comparação e IA sempre ativas, sem compartilhar materiais ou sessões;
- análise automática de PDF, TXT, DOCX, CSV, XLSX e imagens;
- conceitos persistidos e comparados às descrições das sessões, sem inferir domínio;
- substituição e exclusão permanente de arquivos com limpeza física controlada.

A biblioteca aceita arquivos PDF, documentos de texto, planilhas e imagens. Áudio, vídeo, links e texto digitado diretamente não fazem parte do novo cadastro.

## Pré-requisitos e execução

- Node.js 22.23.2;
- npm compatível com essa versão.

```powershell
Copy-Item .env.example .env
npm ci
npm run banco:reiniciar
npm run desenvolver
```

Abra [http://localhost:3000/entrar](http://localhost:3000/entrar).

Na própria tela de entrada, use **Criar conta** para cadastrar uma conta pessoal vazia informando somente nome e senha. O nome identifica a conta e aparece na plataforma; a senha precisa ter ao menos oito caracteres e a entrada ocorre automaticamente após o cadastro. Use somente dados fictícios neste ambiente local.

## Contas de demonstração

| Conta | Usuário | Senha sintética |
|---|---|---|
| Ana, Bruno, Carla, Diego ou Elisa | `ana.souza`, `bruno.lima`, `carla.rocha`, `diego.alves`, `elisa.martins` | `Laboratorio@2026` |
| ADMIN (configuração global da IA) | `admin` | Gerada e exibida uma vez no provisionamento; alterável no modal do perfil. |

As configurações de perfil ficam no modal aberto ao clicar no nome ou avatar no rodapé da barra lateral, inclusive quando ela está recolhida. A antiga página `/perfil` não existe mais. O modal permite mudar o nome exibido, o nome de usuário usado no login, a senha e a foto (JPG, PNG ou WebP até 2 MB). A foto é validada, recodificada para WebP de 256 × 256 pixels e servida somente à própria conta autenticada.

A exclusão exige a senha atual e a confirmação `EXCLUIR`. Ela remove os dados pessoais e as Salas administradas pela conta, preserva os módulos pessoais de outros participantes e mantém somente o histórico analítico pseudonimizado nas demais Salas. Arquivos da conta são removidos com preparação reversível antes da transação. A conta ADMIN mantém seu identificador reservado e não pode ser excluída por esse fluxo para preservar a configuração global da IA; seu nome exibido, senha e foto podem ser alterados normalmente.

Em uma base existente, execute `npm run banco:migrar` e `npm run banco:configurar-admin`. O comando cria ADMIN sem apagar os demais dados e reaproveita a chave Groq anterior, cifrando-a para a conta administrativa. Se ADMIN já existir, não altera sua senha nem a chave. No primeiro provisionamento, `SENHA_ADMIN_INICIAL` pode definir a senha (12–128 caracteres); quando ausente, é gerada aleatoriamente. O seed também cria essa conta. O cadastro público não permite registrar `admin`.

## IA e privacidade

A chave global do Groq é configurada em `/configuracoes/ia` exclusivamente pela conta ADMIN. Usuários comuns não recebem esse menu e não podem abrir a página ou executar suas ações. Trocar, ativar, desativar ou remover a chave afeta as próximas solicitações de todos os usuários, incluindo dashboards, módulos, salas e materiais. A chave fica cifrada no servidor e nunca é devolvida à interface. Chaves pessoais antigas e `GROQ_API_KEY` não substituem a configuração global da aplicação; essa variável permanece apenas para scripts experimentais explícitos. `.env`, banco, arquivos locais e segredos ficam fora do Git.

As sessões usam cookies HTTP-only assinados com HMAC e validade de sete dias, verificados no servidor. Cookies antigos contendo somente o identificador da conta são recusados; entre novamente após essa atualização. Em produção, configure `CHAVE_MESTRA_CREDENCIAIS_IA` antes de iniciar o site: ela protege o cofre e, com contexto separado, a assinatura das sessões. No desenvolvimento, a chave privada local em `.dados/segredos/` atende às duas operações.

Após um upload compatível, o arquivo é salvo antes da análise. O texto é extraído localmente, limitado a 60.000 caracteres e descartado após o processamento. Somente o resultado compacto — resumo, conceitos e sugestões — permanece no banco. Sem chave ou diante de indisponibilidade externa, a contingência local mantém o dashboard funcional.

O processamento externo é limitado a dez materiais por conta a cada hora. Conteúdo maior é truncado com indicação na interface. Formatos legados não analisáveis permanecem disponíveis sem entrar nessa fila.

## Armazenamento de arquivos

- binários ficam em `.dados/arquivos-materiais`, fora de `public/` e do Git;
- upload valida nome, extensão, MIME, assinatura e tamanho;
- download exige autenticação e propriedade;
- substituição invalida a análise anterior e remove o binário substituído;
- exclusão permanente remove vínculos opcionais com sessões, metadados, análise e arquivo físico;
- arquivamento é reversível e preserva o binário.

## Comandos principais

| Comando | Finalidade |
|---|---|
| `npm run desenvolver` | Inicia o servidor local. |
| `npm run compilar` | Gera a compilação de produção. |
| `npm run testar` | Executa testes unitários. |
| `npm run testar:analises-materiais` | Valida análise, conceitos, autorização, substituição e exclusão. |
| `npm run testar:arquivos` | Valida categorias, assinaturas, limites e limpeza dos arquivos. |
| `npm run testar:integracao` | Valida as APIs com o servidor local ativo. |
| `npm run banco:reiniciar` | Recria o banco sintético aplicando todas as migrações. |
| `npm run banco:enriquecer-diego` | Atualiza somente o bloco analítico rico de Diego, preservando os demais dados. |
| `npm run banco:verificar-diego` | Confere sessões, métodos, formatos, percepções, arquivos, conceitos e contexto da IA de Diego. |
| `npm run testar:provedores-insights` | Testa conexão e saída estruturada do Groq configurado, sem imprimir a chave. |
| `npm run validar` | Executa scanner de segredos, lint, tipos, testes e build. |

## Estrutura

- `src/dominio/`: métricas e regras puras;
- `src/servidor/`: autorização, extração, serviços e adaptadores externos;
- `src/app/`: páginas, ações e APIs do Next.js;
- `prisma/`: schema, migrações e cenário sintético;
- `scripts/`: verificações locais;
- `AiFiles/`: planejamento, decisões e rastreabilidade.
