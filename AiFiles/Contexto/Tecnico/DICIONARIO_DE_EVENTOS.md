# Dicionário de eventos

| Evento | Emissor | Quando ocorre | Campos mínimos | Finalidade | Retenção no MVP |
|---|---|---|---|---|---|
| `sessao_iniciada` | Conta pessoal | Início explícito do estudo | usuarioId, tópicoId, recursoId, iniciadaEm | Criar sessão de estudo | Banco sintético local |
| `sessao_encerrada` | Conta pessoal | Encerramento explícito | sessaoId, encerradaEm, duração, situação | Validar tempo de estudo | Banco sintético local |
| `tentativa_concluida` | Conta pessoal | Envio do quiz | usuarioId, avaliacaoId, topicoId, numeroTentativa, nota, acertos, total | Medir desempenho | Banco sintético local |
| `resposta_registrada` | Servidor | Correção do quiz | tentativaId, questãoId, resposta, correta, pontos | Rastrear cálculo | Banco sintético local |
| `desafio_criado` | Conta pessoal | Criação explícita de desafio | usuarioId, moduloId, método, meta, criadoEm | Contextualizar sessões futuras | Banco sintético local |
| `desafio_cancelado` | Conta pessoal | Cancelamento explícito | desafioId, usuarioId, canceladoEm | Bloquear novos vínculos sem apagar histórico | Banco sintético local |

Eventos futuros, ainda não implementados:

- `sessao_pausada`;
- `sessao_retornada`;
- `recomendacao_exibida`;
- `recomendacao_aceita`;
- `recomendacao_descartada`;
- `feedback_recomendacao_enviado`.

Nenhum evento deve registrar senha, token, conteúdo de outras abas, webcam, áudio, localização ou dado não necessário à finalidade documentada.
