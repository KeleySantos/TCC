# Decisões do projeto

| ID | Decisão | Escolha de execução | Justificativa | Estado | Data |
|---|---|---|---|---|---|
| D-001 | Domínio da demonstração | Fundamentos de programação: condicionais, loops e funções | Conteúdo objetivo, com exercícios e formatos comparáveis | DECIDIDA | 2026-08-30 |
| D-002 | Público inicial | Estudantes adultos/universitários | Mantém a demonstração acadêmica sem tratar dados de menores | DECIDIDA | 2026-08-30 |
| D-003 | Dados | Exclusivamente sintéticos | Permite desenvolvimento e demonstração sem coleta de participantes | DECIDIDA | 2026-08-30 |
| D-004 | Autenticação | Usuário e senha locais, com senha armazenada como hash | Solicitação posterior do autor; preserva contas sintéticas e permite identificar o papel apenas após autenticação | DECIDIDA | 2026-08-30 |
| D-005 | Persistência | SQLite com Prisma | Stack definida no contexto do TCC | DECIDIDA | 2026-08-30 |
| D-006 | Avaliação | Quizzes objetivos com nota 0–100 | Viabiliza cálculo e comparação reproduzíveis no MVP | DECIDIDA | 2026-08-30 |
| D-007 | Janela sessão–avaliação | Avaliação concluída até 7 dias depois de uma sessão válida, no mesmo tópico | Regra simples e explícita para a demonstração; não representa inferência causal | DECIDIDA | 2026-08-30 |
| D-008 | Exposição mista | Registrar, mas excluir da comparação simples de formatos | Evita atribuição indevida de resultado a um único recurso | DECIDIDA | 2026-08-30 |
| D-009 | Recomendador | Regras determinísticas, explicáveis e versionadas | Transparência e auditabilidade adequadas ao TCC | DECIDIDA | 2026-08-30 |
| D-010 | Dados reais e avaliação com usuários | Não executar nesta versão | Depende de protocolo e aprovações institucionais | BLOQUEADA EXTERNAMENTE | 2026-08-30 |
| D-011 | Idioma de todo artefato próprio | Português do Brasil | Diretriz explícita do autor; inclui domínio, banco, rotas, páginas, código e interface | DECIDIDA | 2026-08-30 |
| D-012 | Administração de professores | Administrador local pode cadastrar contas de professor sintéticas | Solicitação explícita do autor; a operação exige papel de administrador, valida dados e registra auditoria | DECIDIDA | 2026-08-30 |

## Regra de alteração

Uma decisão só pode mudar com registro do impacto em requisitos, dados, testes e documentação.
