# Ordem de implementação — módulos orientados a sessões

## Estado

- **Situação:** Fases 0 a 9 concluídas; Fase 10 aguardando execução
- **Origem:** revisão solicitada pelo autor em 2026-09-19
- **Agente de execução:** Guanabara
- **Pré-requisito:** concluir as decisões de `DECISOES_FUNCIONAIS_MODULOS_SESSOES.md`

## Objetivo

Substituir a jornada baseada em tópicos por uma jornada em que a sessão de estudo é a principal unidade do módulo:

```text
Módulo → Sessões de estudo → Métricas → Interpretação da IA
```

Cada sessão deve registrar início, fim, descrição do conteúdo estudado, um ou mais métodos e um ou mais formatos. A duração deve ser calculada automaticamente pelo servidor.

Esta mudança não é apenas visual. O modelo atual ainda exige tópico e material para criar uma sessão, aceita somente um método e associa avaliações e materiais a tópicos. A nova jornada não terá avaliações objetivas. A execução deve migrar essas dependências sem apagar o histórico sintético existente antes das conferências finais.

## Fase 0 — Fechar decisões funcionais

**Estado:** concluída e aprovada pelo autor em 2026-09-19.

Definir antes do código:

- forma de registro: manual, cronômetro ou ambos;
- permanência das escalas de dificuldade e compreensão percebidas;
- nova propriedade dos materiais e eventual vínculo com sessões;
- retirada das avaliações objetivas e de suas métricas;
- regras de edição e arquivamento de sessões concluídas;
- tratamento de sobreposição, datas futuras e fuso horário;
- uso ou não da descrição livre pela IA;
- IA limitada à interpretação de métricas, descrições e contexto, sem geração de avaliações.

**Saída:** contrato funcional aprovado, sem ambiguidades que alterem banco, métricas, privacidade ou comportamento.

## Fase 1 — Criar o novo modelo de sessão

**Estado:** concluída e validada localmente em 2026-09-19.

- tornar `SessaoEstudo` independente de tópico e material obrigatórios;
- incluir descrição própria;
- preservar início, fim e duração calculada;
- permitir vários métodos por sessão;
- permitir vários formatos por sessão;
- criar relações normalizadas para métodos e formatos;
- preparar migração aditiva e estratégia de compatibilidade dos registros existentes.

**Saída:** banco capaz de representar a nova sessão sem perder dados anteriores. A migração `20260919120000_sessoes_centradas_no_modulo` preservou 19 sessões, tornou tópico e recurso legados opcionais e retropreencheu descrição, métodos, formatos e materiais vinculados.

## Fase 2 — Implementar o CRUD completo de sessões

**Estado:** concluída e validada localmente em 2026-09-19.

- registrar sessão concluída manualmente, se aprovado;
- iniciar e encerrar sessão, se o cronômetro permanecer;
- editar sessão conforme a política aprovada;
- arquivar sem apagar histórico;
- listar sessões do módulo;
- obter detalhes de uma sessão;
- validar propriedade, datas, descrição, métodos e formatos no servidor;
- recalcular duração no servidor sempre que necessário.

**Saída:** serviços e APIs funcionais e protegidos sem dependência de tópico. O verificador dedicado cobre registro manual, planejamento, cronômetro, conclusão, edição com recálculo, relações múltiplas, sobreposição, arquivamento, listagem, detalhes e isolamento entre duas contas.

## Fase 3 — Reconstruir a página do módulo em torno das sessões

**Estado:** concluída e validada localmente em 2026-09-19.

- apresentar ação principal para registrar ou iniciar sessão;
- implementar formulário com período, descrição, métodos e formatos;
- mostrar duração calculada;
- apresentar histórico cronológico;
- permitir as ações aprovadas de edição e arquivamento;
- representar vazio, processamento, erro, sucesso e eventual sessão ativa;
- preservar responsividade, teclado, foco e clareza da interface simplificada.

**Saída:** primeira entrega utilizável da nova jornada. A página do módulo oferece registro manual, planejamento futuro, cronômetro persistente, conclusão com percepções, histórico cronológico, edição integral, arquivamento reversível e estado vazio orientado. A inspeção autenticada comprovou criação, cálculo de duração, relações múltiplas, arquivamento/restauração e ausência de rolagem horizontal em 360 px.

## Fase 4 — Migrar materiais para o módulo

**Estado:** concluída e validada localmente em 2026-09-19.

- remover a dependência obrigatória entre material e tópico;
- ligar materiais diretamente ao módulo, caso permaneçam no produto;
- permitir vínculo opcional entre sessão e materiais, se aprovado;
- manter formatos declarados na sessão, sem inferi-los exclusivamente do material;
- adaptar biblioteca, upload, download, edição, arquivamento e autorização.

**Saída:** materiais utilizáveis sem recriar o conceito de tópico. A migração `20260919180000_materiais_do_modulo` liga cada material ao módulo e mantém `topicoId` apenas como referência histórica opcional. Biblioteca, texto, link, upload, download, edição, arquivamento, autorização e vínculo opcional com sessões usam o módulo; os formatos continuam declarados independentemente na sessão.

## Fase 5 — Refazer o motor de métricas

**Estado:** concluída e validada localmente em 2026-09-19.

- retirar métricas dependentes de tópico;
- calcular tempo estudado, quantidade de sessões, duração média e frequência;
- agregar por método e formato;
- calcular evolução do tempo, frequência, métodos, formatos, dificuldade e compreensão percebidas;
- retirar taxa de acerto, evolução de avaliações, percepção versus nota e Bloom baseado em respostas;
- aplicar amostra mínima e limitações explícitas;
- manter algoritmos determinísticos, puros e versionados.

**Saída:** métricas oficiais coerentes com sessões. O motor puro e versionado `metricas-sessoes-v1` calcula tempo, quantidade, duração média, frequência, evolução semanal UTC, percepções, métodos e formatos sem receber tópicos, tentativas, notas ou respostas. Planejadas, ativas e invalidadas ficam fora; arquivadas continuam incluídas. Médias de percepção exigem duas observações e todo resultado expõe critérios, amostra e limitações. Os DTOs antigos permanecem apenas como ponte visual até as Fases 6 e 7.

## Fase 6 — Reorganizar o painel analítico

**Estado:** concluída e validada localmente em 2026-09-19.

- substituir a evolução por tópicos;
- apresentar indicadores e gráficos aprovados para sessões;
- informar período, amostra, ausência e evidência insuficiente;
- manter alternativas textuais ou tabulares para gráficos;
- atualizar imediatamente após novas sessões.

**Saída:** painel que responde ao uso real da nova jornada. A página do módulo consome diretamente `metricas-sessoes-v1` e apresenta tempo total, sessões válidas, duração média, frequência, evolução semanal, métodos, formatos e percepções. Período, versão, amostra, ausência, evidência insuficiente e limitações ficam visíveis; cada gráfico possui descrição acessível e tabela equivalente. O painel antigo de avaliações, tópicos, notas e Bloom foi removido desta página e as mutações de sessão atualizam a análise por `router.refresh()`.

## Fase 7 — Adaptar a IA

**Estado:** concluída e validada localmente em 2026-09-19.

- criar DTO baseado em sessões, descrições, métodos, formatos, duração e percepções;
- respeitar a decisão sobre descrição livre;
- manter a IA fora do cálculo de notas, métricas e autorização;
- preservar validação de saída, cota, timeout e resposta local;
- distinguir Gemini, contingência e evidência insuficiente na interface.

**Saída:** interpretação opcional coerente com o novo modelo. O DTO contém somente métricas oficiais e descrições das sessões válidas, com referências opacas e defesa contra instruções inseridas no texto livre. A fila fixa tenta Groq (`openai/gpt-oss-20b`), Gemini (`gemini-3.8-flash`, com retentativa e contingência interna no `gemini-3.7-flash`) e Qwen (`qwen3.7-flash-2026-07-15`), aplicando timeout, cooldown e validação única de schema antes da contingência local. `/configuracoes/ia` permite salvar, substituir, testar, ativar, desativar e remover credenciais próprias; o teste Gemini valida chave/modelo sem gerar conteúdo, os segredos usam AES-256-GCM, nunca retornam ao cliente e são verificados contra inclusão no Git.

## Fase 8 — Adaptar funcionalidades dependentes

**Estado:** concluída e validada localmente em 2026-09-20.

- histórico geral;
- desafios e experimentações;
- comparação por método;
- remover análises de avaliação e Bloom que dependam de questões;
- dashboard geral;
- seed sintético;
- scripts de verificação;
- contratos, matriz, decisões, riscos e acompanhamento.

**Saída:** demais jornadas deixam de depender de tópico. Histórico geral, dashboard e comparação de desafios agora usam sessões e `metricas-sessoes-v1`; notas, avaliações e Bloom saíram dessas interfaces. O seed recria cinco contas, seis módulos, 16 materiais diretos, 18 sessões válidas, uma inválida e dois desafios sem criar tópicos, avaliações, tentativas ou respostas. Verificadores cobrem contagens, propriedade, relações múltiplas, métricas e comparação observacional.

## Fase 9 — Remover definitivamente tópicos e avaliações objetivas

**Estado:** concluída e validada localmente em 2026-09-20.

- comprovar que sessões e materiais não dependem mais de tópico;
- comprovar que histórico, métricas, seed e interface não dependem mais de avaliações ou tentativas;
- conferir migração integral do cenário sintético;
- remover tópicos, avaliações, questões, tentativas, respostas e seus serviços, ações, componentes e métricas antigas;
- criar migração final de limpeza somente após as conferências;
- eliminar textos e rotas que apresentem tópico como unidade funcional.

**Saída:** conceito de tópico removido do produto e do domínio ativo. A migração `20260920140000_remocao_topicos_avaliacoes` preserva módulos, materiais, sessões e relações normalizadas, remove colunas legadas e exclui as tabelas `Topico`, `Avaliacao`, `Questao`, `TentativaAvaliacao`, `RespostaQuestao` e `Recomendacao`. Serviços, ações, rotas, componentes, métricas e testes antigos também foram eliminados.

## Fase 10 — Validar o fluxo ponta a ponta

O cenário mínimo deve comprovar:

1. criação de módulo;
2. registro de sessão com vários métodos e formatos;
3. cálculo correto da duração;
4. edição ou correção conforme a política aprovada;
5. uso de material, caso permaneça;
6. atualização das métricas de sessões;
7. geração de interpretação;
8. atualização do histórico;
9. isolamento entre duas contas;
10. operação por teclado e viewport móvel;
11. reset do banco, seed, verificadores, lint, tipos, testes e build.

## Marcos de entrega

- **Marco 1 — módulo utilizável:** Fases 0 a 3.
- **Marco 2 — acompanhamento real:** Fases 4 a 7.
- **Marco 3 — transição concluída:** Fases 8 a 10.

Nenhuma fase posterior deve remover estruturas antigas antes de os dados e consumidores correspondentes terem sido migrados e verificados.
