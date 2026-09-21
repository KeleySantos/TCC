# Fase 13 — Dashboards das salas

## Estado

- **Situação:** concluída em 2026-09-20
- **Origem:** decisões explícitas do autor em 2026-09-20
- **Dependência:** Fase 12 concluída
- **Agente:** Guanabara

## Objetivo

Transformar a sala em um agregador seguro de dashboards. O proprietário consulta a sala inteira, cada módulo-pai e cada instância ativa, sem receber materiais, sessões ou descrições internas. Membros continuam vendo somente a própria instância.

## Níveis de dashboard

1. **Sala:** consolida evidências dos módulos-pai da sala.
2. **Módulo-pai:** consolida instâncias vinculadas ao módulo.
3. **Membro:** mostra ao proprietário as métricas oficiais da instância enquanto o compartilhamento estiver ativo.

## Regras de privacidade

- somente o proprietário acessa dashboards coletivos e individuais;
- membro não acessa métricas de outro membro;
- terceiro recebe indisponibilidade, sem enumeração;
- agregados coletivos exigem pelo menos três contribuidores com sessão válida;
- abaixo de três, mostrar apenas insuficiência, nunca valores parciais;
- comparações nominais incluem somente membros com `permitirComparacao = true`;
- a interface permite ao proprietário mostrar ou ocultar a comparação;
- nenhuma comparação cria ranking, vencedor, nota ou conclusão causal;
- IA individual exige `permitirIa = true` no momento da solicitação;
- IA recebe métricas do dashboard, nome do membro e contexto do módulo, mas não recebe materiais, textos ou descrições de sessões;
- revogação encerra imediatamente dashboard individual, comparação e IA.

## Histórico após desligamento

Antes de desvincular, sair ou ser removido, o servidor copia somente os campos analíticos das sessões válidas para evidências históricas pseudonimizadas:

- data de encerramento;
- duração;
- dificuldade e compreensão percebidas;
- métodos e formatos.

Não copiar usuário, módulo pessoal, descrição, material ou conteúdo. As evidências permanecem apenas no agregado e nunca recriam o dashboard individual. Ao reativar o mesmo vínculo, somente sessões posteriores à reativação entram ao vivo, evitando duplicidade.

## Métricas

Reutilizar `metricas-sessoes-v1`:

- tempo total;
- quantidade e duração média das sessões;
- dias e sequência de estudo;
- dificuldade e compreensão percebidas;
- métodos e formatos;
- evolução semanal.

Múltiplos métodos e formatos permanecem contextos não exclusivos. Sessões planejadas, ativas e invalidadas ficam fora; sessões arquivadas continuam incluídas.

## Interface

Na página da sala, para o proprietário:

- visão geral no topo;
- seletor de módulo-pai;
- agregado do módulo selecionado;
- lista de dashboards individuais ativos;
- seleção de um membro para abrir o dashboard individual;
- comparação optativa entre membros consentidos;
- interpretação por IA somente nos cards de membros consentidos;
- avisos de amostra, consentimento e ausência.

Para o membro, preservar a gestão da própria instância e consentimentos, sem mostrar agregados ou nomes de outros membros.

## Critérios de aceite

1. proprietário vê os três níveis quando autorizado;
2. membro e terceiro não acessam dashboards alheios;
3. agregado com dois contribuidores não mostra números;
4. agregado com três contribuidores usa apenas sessões válidas;
5. comparação inclui somente consentidos e pode ser ocultada;
6. comparação não ordena nem classifica pessoas;
7. IA recusa vínculo sem consentimento;
8. IA usa chaves do proprietário e DTO sem descrições/materiais;
9. desligamento cria evidência histórica sem identificador pessoal;
10. instância pessoal continua intacta após desligamento;
11. reativação não duplica histórico;
12. gráficos possuem texto/tabela equivalente e funcionam em 360 px;
13. migração, reset, seed, testes, lint, tipos e build passam.

## Fora do escopo

- ranking, gamificação ou pontuação;
- chat e comentários de membros;
- acesso do proprietário a materiais ou sessões;
- edição da instância pelo proprietário;
- transferência de propriedade;
- notificações externas;
- análise de arquivos.

## Resultado entregue

- dashboards geral da sala, agregado por módulo-pai e individual ativo na página da sala;
- proteção de amostra mínima de três contribuidores nos agregados;
- comparação nominal optativa apenas entre membros consentidos, sem ranking;
- interpretação por IA condicionada a consentimento próprio e alimentada somente por métricas;
- evidências históricas pseudonimizadas após desligamento, sem descrições, materiais ou identificador pessoal;
- reativação sem duplicar dados que já passaram ao histórico;
- testes de autorização, privacidade, revogação, amostra, histórico e IA;
- validação autenticada das visões de proprietário e membro, inclusive em viewport de 360 px.
