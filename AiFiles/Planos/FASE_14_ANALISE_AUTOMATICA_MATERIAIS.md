# Fase 14 — Análise automática de materiais

## Estado

- **Situação:** concluída em 2026-09-21
- **Decisões aprovadas:** 2026-09-20
- **Dependências:** Fases 4, 7 e 13 concluídas

## Objetivo

Analisar automaticamente materiais compatíveis após o upload, persistir conceitos e resultados compactos e comparar esses conceitos com as descrições das sessões para alimentar um painel observacional. O material deve permanecer utilizável mesmo quando a análise falhar ou nenhum provedor estiver disponível.

## Formatos desta fase

- PDF;
- TXT;
- DOCX;
- CSV;
- XLSX;
- PNG, JPEG, WebP e GIF por OCR.

Áudio, vídeo, DOC, XLS, ODT e ODS continuam armazenáveis, mas não são analisados nesta fase.

## Fluxo

1. validar e persistir o arquivo antes da análise;
2. criar análise pendente vinculada ao material;
3. extrair texto localmente, com limites;
4. solicitar análise pela fila Groq → Gemini → Qwen;
5. usar contingência local quando não houver chave ou todos falharem;
6. persistir resumo, conceitos e recomendações compactas;
7. descartar o texto integral extraído;
8. comparar conceitos normalizados com descrições de sessões válidas;
9. exibir situação, resultado e cobertura observacional no módulo.

## Regras

- a análise é automática, mas não bloqueia nem desfaz o upload;
- falha mantém o estado pendente ou falho e permite nova tentativa;
- conteúdo extraído é não confiável e não pode alterar instruções do sistema;
- resultados não representam domínio, nota ou aprendizagem comprovada;
- conceitos precisam ser persistidos para comparações futuras;
- substituição do arquivo preserva o material, remove o binário anterior, invalida a análise e inicia nova análise;
- exclusão permanente remove material, arquivo físico, análise e relações;
- arquivamento continua reversível e não remove o binário;
- arquivos antigos compatíveis entram em processamento retroativo;
- nenhuma credencial ou conteúdo integral extraído é registrado em log.

## Critérios de aceite

1. upload compatível cria análise sem depender do sucesso da IA;
2. extração local respeita limite e informa truncamento;
3. conceitos e resumo persistem, mas o texto integral não;
4. ausência de chave gera resultado local utilizável;
5. descrições de sessões alimentam somente comparação observacional;
6. outro usuário não consulta, reprocessa, substitui ou exclui o material;
7. substituição remove o arquivo antigo e invalida o resultado anterior;
8. exclusão permanente não deixa arquivo físico ou registro órfão;
9. áudio e vídeo não iniciam análise;
10. migração, reset, seed, testes, lint, tipos e build passam;
11. interface funciona por teclado e em 360 px;
12. servidor é reiniciado ao final.
