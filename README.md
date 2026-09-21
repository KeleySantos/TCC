# Learning Lab

Aplicação local para demonstração acadêmica de um laboratório pessoal de aprendizagem. Cada conta organiza módulos e materiais, registra sessões, observa métricas descritivas e pode receber interpretações com IA.

> O cenário contém somente dados sintéticos. Indicadores e interpretações descrevem registros observados; não atribuem nota, não comprovam aprendizagem ou causalidade e não definem estilos fixos.

## Recursos atuais

- módulos pessoais com materiais de texto, link ou arquivo;
- sessões manuais, planejadas ou por cronômetro, com vários métodos e formatos;
- métricas versionadas de tempo, frequência, percepções, métodos e formatos;
- desafios pessoais com comparação observacional;
- fila opcional de IA Groq → Gemini → Qwen, com credenciais próprias cifradas e contingência local;
- salas que agregam dashboards pessoais autorizados sem compartilhar materiais ou sessões;
- análise automática de PDF, TXT, DOCX, CSV, XLSX e imagens;
- conceitos persistidos e comparados às descrições das sessões, sem inferir domínio;
- substituição e exclusão permanente de arquivos com limpeza física controlada.

Áudio e vídeo podem ser armazenados e baixados, mas ainda não são transcritos ou analisados.

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

## Contas de demonstração

| Conta | Usuário | Senha sintética |
|---|---|---|
| Ana, Bruno, Carla, Diego ou Elisa | `ana.souza`, `bruno.lima`, `carla.rocha`, `diego.alves`, `elisa.martins` | `Laboratorio@2026` |

## IA e privacidade

As chaves são configuradas em `/configuracoes/ia`, cifradas no servidor e nunca devolvidas à interface. `.env`, banco, arquivos locais e segredos ficam fora do Git.

Após um upload compatível, o arquivo é salvo antes da análise. O texto é extraído localmente, limitado a 60.000 caracteres e descartado após o processamento. Somente o resultado compacto — resumo, conceitos e sugestões — permanece no banco. Sem chave ou diante de indisponibilidade externa, a contingência local mantém o dashboard funcional.

O processamento externo é limitado a dez materiais por conta a cada hora. Conteúdo maior é truncado com indicação na interface. Áudio, vídeo e formatos legados não analisáveis permanecem disponíveis sem entrar nessa fila.

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
| `npm run validar` | Executa scanner de segredos, lint, tipos, testes e build. |

## Estrutura

- `src/dominio/`: métricas e regras puras;
- `src/servidor/`: autorização, extração, serviços e adaptadores externos;
- `src/app/`: páginas, ações e APIs do Next.js;
- `prisma/`: schema, migrações e cenário sintético;
- `scripts/`: verificações locais;
- `AiFiles/`: planejamento, decisões e rastreabilidade.
