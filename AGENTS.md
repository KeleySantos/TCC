# Entrada de compatibilidade para agentes

Este arquivo existe na raiz porque ferramentas de programação assistida descobrem `AGENTS.md` automaticamente. A fonte canônica de instruções, contexto e memória fica exclusivamente em `AiFiles/`.

Antes de qualquer trabalho relevante:

1. leia `AiFiles/Instrucoes/DIRETRIZES_GLOBAIS.md`;
2. cumpra o protocolo de seleção de agente descrito nesse arquivo;
3. use `AiFiles/INDICE.md` para carregar somente o contexto necessário à tarefa.

Não replique aqui regras mantidas em `AiFiles/`. Este arquivo deve permanecer apenas como ponto de entrada compatível com diferentes ferramentas.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
