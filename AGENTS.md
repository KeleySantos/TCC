# Diretrizes obrigatórias do projeto

## Fonte de verdade

1. O contexto funcional e tecnológico está no arquivo de planejamento em `AI Files/`.
2. Todo agente deve ler `AI Files/PLANEJAMENTO_TECNICO.md`, `AI Files/ACOMPANHAMENTO.md`, `AI Files/DECISOES_PENDENTES.md`, `AI Files/REGISTRO_DE_RISCOS.md` e `AI Files/MATRIZ_REQUISITOS_TESTES.md` antes de iniciar uma alteração.
3. Se estas diretrizes entrarem em conflito com instruções explícitas e posteriores do usuário, seguir o usuário e atualizar os arquivos de rastreabilidade.

## Organização de arquivos

- Todo documento de planejamento, acompanhamento, análise, decisão, risco, relatório temporário, instrução para IA, inventário e rascunho usado pela IA deve ficar em `AI Files/` ou em subpastas dela.
- Não criar pasta `docs/` nem colocar documentação usada pela IA fora de `AI Files/`.
- `AGENTS.md` permanece na raiz exclusivamente para que agentes descubram estas diretrizes; ele é o único arquivo de orientação de agentes permitido fora de `AI Files/`.
- Código-fonte, configurações, testes, migrações, assets e README de uso do produto devem ficar nas estruturas usuais do projeto.

## Idioma do projeto

- Todo artefato próprio do projeto deve ser escrito em português do Brasil: modelos, tabelas, colunas, enums, rotas, páginas, componentes, módulos, funções, variáveis de domínio, scripts, testes, mensagens e interface.
- Nomes técnicos impostos por bibliotecas, protocolos ou ferramentas externas podem permanecer no idioma de origem, por exemplo `Next.js`, `PrismaClient`, `package.json`, `node_modules` e opções oficiais de configuração.
- Não introduzir novos nomes de domínio em inglês. Se houver nomenclatura existente em inglês, refatorá-la para português antes de expandir a funcionalidade relacionada.

## Escopo e metodologia

- O projeto é uma plataforma educacional de Learning Analytics, focada no aluno e com apoio complementar ao professor.
- Não classificar alunos por estilos fixos de aprendizagem.
- Não afirmar causalidade a partir de dados observacionais. Toda conclusão precisa indicar contexto, período, quantidade de evidências e limitação.
- Dados insuficientes devem gerar linguagem explícita de incerteza e recomendação de exploração, nunca personalização definitiva.
- Esta versão usa somente dados sintéticos. Não inserir, coletar ou publicar dados de pessoas reais sem autorização institucional, base legal e protocolo aprovado.

## Execução técnica

- Stack: TypeScript, Next.js, React, Tailwind CSS, Recharts, Prisma e SQLite, salvo mudança decidida e registrada.
- Usar TypeScript estrito; não introduzir `any` sem justificativa registrada.
- Componentes não acessam Prisma diretamente. Regras de negócio e analytics ficam em módulos testáveis fora da interface.
- Validar todas as entradas no servidor e conferir autorização no servidor, independentemente da interface.
- Persistir datas em UTC e apresentar no fuso apropriado.
- Manter o banco e o cenário sintético reproduzíveis por migrações e seed.
- Não implementar funcionalidade que não possua requisito e critério de aceite na matriz.

## Qualidade e acompanhamento

- Antes de editar, inspecionar o estado do repositório e preservar alterações existentes do usuário.
- Após cada alteração relevante, atualizar `AI Files/ACOMPANHAMENTO.md` com arquivos, validações, resultados e pendências.
- Atualizar a matriz de requisitos/testes quando uma funcionalidade for implementada ou validada.
- Criar uma decisão pendente para qualquer ambiguidade que altere escopo, dados, método, privacidade ou comportamento.
- Antes de declarar algo concluído, executar lint, typecheck, testes aplicáveis e build quando configurados.
- Não remover ou sobrescrever dados, migrações ou arquivos do usuário sem autorização explícita.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
