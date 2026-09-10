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
| D-013 | Arquitetura dos recursos de IA | Centralizar em `AiFiles/`, com índice curto, instruções, contexto temático, memória, agentes e relatórios; manter `AGENTS.md` raiz apenas como adaptador | Solicitação explícita do autor e pesquisa de práticas atuais; reduz contexto carregado por padrão, duplicação e dependência de uma única ferramenta | DECIDIDA | 2026-09-09 |
| D-014 | Modelo de conta do Laboratório Pessoal de Aprendizagem | Pendente: área pessoal universal com professor/administrador como capacidades adicionais, ou substituição integral dos papéis atuais | O roadmap externo afirma que não há papéis fixos, mas escopo científico, autorização, seed e jornadas vigentes dependem deles | PENDENTE | 2026-09-09 |
| D-015 | Uso de Gemini no MVP | Pendente: camada interpretativa opcional sobre métricas determinísticas, com validação e fallback, ou manutenção exclusiva do recomendador local | O roadmap inclui Gemini, enquanto D-009 e o escopo congelado adiam LLM e exigem recomendação determinística | PENDENTE | 2026-09-09 |
| D-016 | Vínculo entre sessão e avaliação | Pendente: referência explícita opcional preservando a janela de sete dias, ou alteração do protocolo de atribuição | O roadmap liga avaliação à sessão; o método vigente infere o vínculo e exclui exposição mista | PENDENTE DE VALIDAÇÃO METODOLÓGICA | 2026-09-09 |

## Regra de alteração

Uma decisão só pode mudar com registro do impacto em requisitos, dados, testes e documentação.
