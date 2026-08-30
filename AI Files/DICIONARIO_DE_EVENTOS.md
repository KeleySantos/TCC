# Dicionário de eventos

| Evento | Emissor | Quando ocorre | Campos mínimos | Finalidade | Retenção no MVP |
|---|---|---|---|---|---|
| `sessao_iniciada` | Aluno | Início explícito do estudo | alunoId, tópicoId, recursoId, iniciadaEm | Criar sessão de estudo | Banco sintético local |
| `sessao_encerrada` | Aluno | Encerramento explícito | sessãoId, encerradaEm, duração, situação | Validar tempo de estudo | Banco sintético local |
| `tentativa_concluida` | Aluno | Envio do quiz | alunoId, avaliaçãoId, tópicoId, nota, acertos, total | Medir desempenho | Banco sintético local |
| `resposta_registrada` | Servidor | Correção do quiz | tentativaId, questãoId, resposta, correta, pontos | Rastrear cálculo | Banco sintético local |
| `curadoria_atualizada` | Professor | Aprovação/rejeição de recurso | professorId, recursoId, situação | Curadoria e auditoria | Banco sintético local |

Eventos futuros, ainda não implementados:

- `sessao_pausada`;
- `sessao_retornada`;
- `recomendacao_exibida`;
- `recomendacao_aceita`;
- `recomendacao_descartada`;
- `feedback_recomendacao_enviado`.

Nenhum evento deve registrar senha, token, conteúdo de outras abas, webcam, áudio, localização ou dado não necessário à finalidade documentada.
