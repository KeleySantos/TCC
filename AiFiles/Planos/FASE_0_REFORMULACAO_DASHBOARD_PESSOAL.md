# Reformulação do Dashboard pessoal — Fase 0

## Estado e origem

- **Situação:** contrato e DTO das fases 0–1, interface observacional das fases 2–3 e integração da Fase 4 implementados em 2026-09-21. Validações registradas em `../Memoria/ACOMPANHAMENTO.md`.
- **Origem:** pedido do autor para analisar `prompt_codex_reformulacao_dashboard_principal.md` e iniciar com os dados que o sistema registra atualmente.
- **Escopo:** somente `/dashboard` e as consultas, funções puras, componentes e testes estritamente necessários para essa página. O fluxo de registro de sessões, a página de módulos e `/desafios` permanecem como fontes existentes.
- **Decisões vigentes:** D-027, D-029, D-030, D-033 e D-034 em `../Memoria/DECISOES_DO_PROJETO.md`.

## Objetivo verificável

O Dashboard deve apoiar a leitura do histórico pessoal de estudo sem apresentar tempo e volume como conclusão sobre aprendizagem. Toda análise exibida deve informar o que foi observado, a amostra, o período e a limitação. Dados ausentes geram orientação de registro ou experimentação, nunca resultado presumido.

## Inventário confirmado

| Fonte | Dados utilizáveis | Limite |
|---|---|---|
| `obterPainelPessoal` e `metricas-sessoes-v1` | Sessões válidas, duração, frequência, evolução semanal, métodos, formatos, dificuldade e compreensão percebidas | Não contêm nota, acerto ou desempenho objetivo |
| `SessaoEstudo` | Descrição, início/fim, módulo, métodos e formatos múltiplos, percepções de 1 a 5 | Método e formato são contextos simultâneos, não tratamentos isolados |
| `AnaliseMaterial` e `compararConceitosComSessoes` | Conceitos extraídos de materiais e menções em descrições de sessões | Menção não demonstra domínio, dificuldade ou relação pedagógica |
| `/desafios` | Criação e acompanhamento de desafios pessoais por módulo e método | Comparações atuais usam duração e percepções, não aprendizagem objetiva |
| `InterpretacaoAutomatica` | Interpretação opcional de métricas oficiais após ação da conta | Não calcula novas métricas nem supre dados ausentes |

## Contrato das análises desta reformulação

1. **População:** somente módulos próprios, configurados e não arquivados. Contar apenas sessões `CONCLUIDA` com fim e duração oficial de pelo menos cinco minutos. Sessões arquivadas continuam no histórico analítico; planejadas, ativas e invalidadas ficam fora. Preservar o isolamento por `usuarioId` no servidor.
2. **Período:** análises chamadas de “recentes” usam uma janela de 90 dias até a data da consulta, em UTC, e exibem suas datas. Análises de todo o histórico devem ser rotuladas como tal. A implementação deve manter a mesma janela nos numeradores e denominadores de cada comparação.
3. **Uso de método:** contar sessões distintas que registraram cada método. Frequência relativa = sessões válidas com o método ÷ sessões válidas no mesmo período. Como uma sessão aceita vários métodos, a soma dos percentuais pode superar 100%. Não ordenar métodos como “mais eficazes”.
4. **Percepção:** dificuldade e compreensão são autorrelatos de 1 a 5; apresentar média somente com pelo menos duas sessões com a escala correspondente, conforme `metricas-sessoes-v1`. Série temporal não recebe linha de “desempenho” sem um resultado objetivo.
5. **Força descritiva da amostra:** reutilizar `classificarAmostraSessoes`: zero = ausente; uma = insuficiente; duas a quatro = inicial; cinco ou mais = recorrente. Esse rótulo expressa apenas quantidade de registros. Não usar “alta confiança”, “comprovado” ou “significância estatística”. Exibir também contagem e período; recorrência não controla comparabilidade nem consistência.
6. **Conceitos:** usar apenas análises concluídas de arquivos próprios ativos, que são a fonte atualmente analisada, e conceitos normalizados. Contar separadamente materiais relacionados e sessões válidas cujas descrições mencionam o termo, sem duplicar a sessão. Um detalhe pode mostrar material, módulo, quantidade de menções e métodos das sessões relacionadas; deve rotular a associação textual como observacional. Sem aresta pedagógica ou estado de domínio inferido.
7. **Descobertas e experimento:** regras determinísticas podem descrever frequência, variedade de métodos, mudança de percepção e distribuição de duração com amostra e período. A sugestão de próximo método é convite para explorar um método pouco registrado, nunca indicação de superioridade. O CTA usa `/desafios` ou outra rota real já existente, sem simular início de experimento.
8. **Base das análises:** mostrar número de sessões válidas, módulos com sessões, métodos registrados e período. Avaliações analisadas não são exibidas como fonte ativa. Métricas tradicionais ficam em região secundária.
9. **Ausência e acessibilidade:** ausência não vira zero de desempenho. Cada gráfico precisa de descrição e alternativa textual ou tabular; estados vazios indicam o registro necessário. Layout deve funcionar por teclado e em 360 px sem rolagem horizontal da página.

## Itens do documento de origem fora do contrato atual

| Item solicitado | Situação nesta reformulação |
|---|---|
| Melhor estratégia por resultado, matriz estratégia × resultado, ranking de eficácia | Adiados: falta resultado objetivo associado às sessões e regra de comparabilidade |
| Calibração percepção × desempenho e evolução das duas medidas | Adiados: há percepção, mas não medida objetiva pareada |
| Esforço × resultado | Adiado: há duração, mas não resultado objetivo |
| Ponto de atenção por erro, acerto ou Bloom | Adiado: avaliações, respostas e Bloom foram removidos na Fase 9 |
| Estado de domínio por conceito e relações pedagógicas entre conceitos | Adiados: os dados registram extrações e menções, não domínio nem relações validadas |

Esses itens não podem ser reintroduzidos como gráficos de duração ou percepção renomeados. Uma futura fonte de resultado objetivo exige decisão própria, requisito, protocolo de vínculo e comparabilidade, eventual migração e fluxo de registro fora do Dashboard. A Fase 0 não aprova nem implementa essa expansão.

## Sequência de implementação autorizada pelo contrato

1. **Fase 1 — DTO e funções puras (concluída):** `dashboard-observacional-v1` compõe dados autorizados de sessões e conceitos, período coerente, amostra e estados de ausência. Consulta restrita à conta e testes puros/de integração cobrem limites, propriedade e métodos múltiplos. A página ainda não consome o DTO.
2. **Fase 2 — Núcleo observacional (implementada):** cards descritivos, atenção baseada em dificuldade *percebida*, convite para experimentar outro método, descobertas determinísticas e base das análises; volume e tempo ficam em seção secundária.
3. **Fase 3 — Visualizações (implementada):** comparação de uso de métodos, evolução das percepções, cobertura de experimentação e mapa de conceitos por presença/menção, com detalhes e alternativas tabulares. Recharts e padrões visuais existentes foram reutilizados.
4. **Fase 4 — Integração e validação (implementada):** estados vazios, linguagem, responsividade, teclado, isolamento entre contas, cenário sintético e validação completa. Evidências e limites constam do acompanhamento e da matriz.

## Critério de saída da Fase 0

- inventário do schema, consultas e métricas atuais conferido;
- fórmulas, população, período, amostra e linguagem definidos para o escopo disponível;
- itens sem fonte de dados explicitamente adiados;
- matriz de requisitos, protocolo vigente, decisão e risco alinhados;
- nenhum código, banco, dado ou página do produto alterado nesta fase.
