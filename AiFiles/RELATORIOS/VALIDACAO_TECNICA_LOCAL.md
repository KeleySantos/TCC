# Relatório de validação técnica local — Entrega A

## Escopo

Validação realizada em 2026-09-12 sobre banco SQLite exclusivamente sintético. Ela comprova comportamento técnico local; não é uma avaliação com participantes nem sustenta conclusão pedagógica ou causal.

## Evidências executadas

| Verificação | Comando ou procedimento | Resultado |
|---|---|---|
| Banco reproduzível | `npm run banco:reiniciar` | Cinco migrações aplicadas e cenário sintético recriado. |
| Cenário A–E | `npm run banco:verificar-cenario` e `npm run testar:metricas` | Seis módulos, 16 tópicos, 16 materiais, 18 sessões válidas, uma inválida e 18 tentativas; perfis A–E, recorrência em dois módulos para Ana e ausência de generalização para Bruno confirmadas. |
| Serviços | `testar:servicos`, `testar:sessoes` e `testar:avaliacoes` | CRUD e isolamento; duração/escalas; notas 0%, parcial, 100%, total zero e numeração sequencial aprovados. |
| IA opcional | Testes unitários do adaptador e `testar:integracao` | Sucesso simulado, schema inválido, texto proibido, timeout, 401/429/500, cota e ausência de chave retornam resposta local quando aplicável. |
| Autorização HTTP | `npm run testar:integracao` com servidor local ativo | 401 sem sessão e 404 em acesso horizontal para material, sessão e avaliação; conta própria corrige tentativa e recebe interpretação local sem chave. |
| Painéis e histórico | Renderização HTTP autenticada | Indicadores, gráficos/tabelas, recorrência contextual, contingência de interpretação e linha do tempo de sessão/avaliação presentes. |
| Responsividade e teclado | Navegador local em 360 × 800 | Documento de 345 px, sem rolagem horizontal; primeiro Tab focou “Pular para o conteúdo principal”. |
| Qualidade | `npm run validar` e compilação final | Lint, TypeScript, 18 testes unitários e build de produção aprovados. |
| Privacidade e rastreabilidade | Inspeção do DTO, `git check-ignore .env` e `git diff --check` | DTO não referencia nome, senha, observação livre, gabarito ou respostas; `.env` permanece ignorado; diff sem erro de whitespace. |

## Limitações abertas

- Dados reais, integração de produção e avaliação com participantes permanecem bloqueados por protocolo e aprovação institucional.
- A auditoria com leitor de tela e a jornada integral autenticada por teclado ainda precisam de tecnologia assistiva e operador humano.
- Fases 11 a 14 (métodos/desafios/Bloom analítico, compartilhamento, salas e uploads) são Entregas B–D e ficaram fora do corte da banca.

## Conclusão técnica local

A Entrega A é reproduzível com cenário sintético e continua funcional sem Gemini configurada. Métricas oficiais permanecem determinísticas e locais; Gemini, quando disponível, apenas interpreta um resumo agregado e validado.
