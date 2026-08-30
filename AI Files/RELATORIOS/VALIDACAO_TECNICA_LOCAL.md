# Relatório de validação técnica local

## Escopo

Validação executada sobre a versão local do MVP com banco SQLite exclusivamente sintético. Este relatório registra evidências técnicas; não é uma avaliação com participantes e não sustenta conclusão pedagógica.

## Evidências executadas

| Verificação | Comando ou procedimento | Resultado |
|---|---|---|
| Recriação do cenário | `npm run banco:reiniciar` | Migração inicial aplicada e seed concluído. |
| Consistência do cenário | `npm run banco:verificar-cenario` | Estrutura, contagens, notas e padrões analíticos de Ana e Carla confirmados. |
| Qualidade estática e compilação | `npm run validar` | Lint, TypeScript, 10 testes unitários e build de produção aprovados. |
| Autorização integrada | `npm run testar:integracao` com servidor local ativo | Confirmados 401 sem sessão, 403 para professor e 404 para tentativa de Bruno encerrar sessão de Ana. A sessão temporária foi removida. |
| Servidor local | Requisição a `http://localhost:3000/entrar` | HTTP 200 após reinício do servidor. |
| Dependências de produção | `npm audit --omit=dev --audit-level=high` | Nenhuma vulnerabilidade conhecida foi retornada no momento da consulta. |

## Scripts de verificação disponíveis

- `npm run banco:verificar-cenario`: executa verificações independentes do seed.
- `npm run testar:integracao`: exige o servidor local ativo e confere os principais limites de autorização das APIs do aluno.
- `npm run validar`: executa a validação geral sem alterar o banco.

As verificações de senha confirmam hash, rejeição de senha incorreta e normalização do nome de usuário. O cenário também confere as credenciais fictícias de administrador, professor e aluno.

## Limites ainda abertos

- Auditoria manual completa por teclado e leitor de tela nos fluxos de aluno e professor.
- Cobertura de integração específica para vínculo de professor a turmas adicionais.
- Jornadas E2E completas com navegador automatizado.
- Avaliação com participantes, que permanece bloqueada por protocolo e aprovação institucional.

## Conclusão técnica local

O MVP é reproduzível com o cenário sintético, compila e possui verificações de domínio, autorização e dados de demonstração. As limitações acima devem permanecer explícitas no TCC e não podem ser tratadas como concluídas sem evidência adicional.
