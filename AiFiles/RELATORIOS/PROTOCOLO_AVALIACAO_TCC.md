# Reprodução da avaliação sintética do TCC

Data: 2026-10-10. Somente dados sintéticos. Não altera o PDF, seed de desenvolvimento ou banco configurado em `.env`.

## Execução determinística

Na raiz do projeto, após `npm install` e `npm run banco:gerar`:

```powershell
npm run testar
npm run testar:tcc
```

O script cria um diretório novo `tcc-avaliacao-*` no temporário do sistema, define DATABASE_URL exclusivamente para esse processo, aplica as migrações versionadas e cria 5 usuários × 3 módulos × 10 sessões = 150 sessões. Arquivamento preserva 15 sessões nas métricas. Cada módulo também tem dez atividades de desempenho separadas das sessões: 150 evidências válidas, sem inferir que qualquer sessão real equivale a avaliação. Na fixture os vínculos são definidos explicitamente. Questões convencionais e pontuações agregadas não são inventadas.

Após verificar o volume-base, adiciona dois controles de sessão (curta e não concluída) e uma evidência de extração que passa de válida a incompleta. Totais físicos finais: 5 usuários, 15 módulos, 152 sessões (150 válidas) e 151 evidências (150 válidas). O banco temporário permanece disponível para inspeção; uma nova execução cria outro banco. Não execute seed pessoal para reproduzir esta avaliação.

O arquivo `RESULTADOS_AVALIACAO_TCC.json` é substituído pelo relatório da nova execução. Contém contagens, gabaritos esperados, resultados observados, tendências, n e aprovação, além dos prompts, DTOs e 15 respostas. IDs físicos podem variar; entradas temporais, métricas e decisões por regra permanecem iguais (desempates por ID são estáveis dentro de cada catálogo).

## Cenários e gabaritos independentes

| Cenário | Dados por módulo | Gabarito do conceito alvo (módulos 0/1/2) | Verificações |
|---|---|---|---|
| S1 — Formato e método | Cinco atividades de 80% ligadas a Feynman/texto; cinco de 40% ligadas a Pomodoro/vídeo | Médias 60/60/60; tendência de atenção; contextos 80% e 40%, n=5 cada | Vínculo explícito prevalece; não declara superioridade causal |
| S2 — Contexto do módulo | Dez atividades iguais a 80%, 40% e 60%, conforme módulo | 80/40/60; estável em cada módulo | Mesmo conceito em módulos distintos; outra conta não acessa |
| S3 — Evolução | 10→100, 100→10, dez valores de 50 | 55/55/50; positiva/atenção/estável | Cronologia e diferença entre extremos |
| S4 — Poucos dados | Conceito alvo recebe 0/1/2 atividades de 50; demais pertencem ao conceito controle | n=0/1/2; média ausente/50/50; tendência insuficiente | Sem materiais, nenhuma recomendação material; não mistura conceitos |
| S5 — Calibração | Percepções 5/1/3 e dificuldade 1/5/3; dez atividades 20/90/50 | Superestimação/subestimação/atenção | Índices: compreensão 73,333…/30/50; dificuldade 26,666…/70/50 |

Gabaritos são constantes em `testes/fixtures/cenarios-tcc.ts`, definidos sem invocar os algoritmos sob teste. O script compara os 15 módulos. Testes unitários complementam limites de 30/90 dias, n=0..3, duplicidade, conceitos em vários materiais, materiais em vários conceitos, métodos sobrepostos e ordenação. Testes de UI verificam texto, n, fontes e recomendação independente da IA. Teste da API cobre autenticação e invalidação do cache; integração real de propriedade é feita pelo script isolado.

## Interpretação: 5 cenários × 3 execuções

O comando padrão usa `fixture-sem-rede` e um provedor simulado: verifica contrato de transporte, schema e contingência; não mede variabilidade ou qualidade do modelo externo. Cada cenário usa o primeiro módulo e repete a interpretação três vezes. C1–C5 ficam nulos no JSON para preenchimento manual; nenhuma nota qualitativa é atribuída automaticamente.

| Critério | Aprovar quando |
|---|---|
| C1 — Fidelidade (obrigatório) | Números, amostra, contexto e seleção concordam com o DTO; não inventa fatos |
| C2 — Padrões e limites | Reconhece os sinais disponíveis e insuficiência; não extrapola n pequeno |
| C3 — Coerência | Reflexão e sugestão respeitam os indicadores e a recomendação oficial |
| C4 — Linguagem (obrigatório) | Não afirma causalidade, diagnóstico, estilo fixo ou domínio comprovado |
| C5 — Clareza | Texto compreensível, contextualizado e com orientação prática |

Resposta satisfatória: pelo menos 4/5 critérios, incluindo C1 e C4. Critério global proposto: pelo menos 14/15 satisfatórias. A proposta deve ser formalizada no TCC; ainda não há resultado real para esse limiar.

## Experimento real opcional

Requer autorização explícita para consumo, configuração e acesso ao provedor. Não foi executado nesta entrega. Defina `TCC_IA_PROVEDOR` (`GROQ`, `GEMINI` ou `QWEN`), `TCC_IA_MODELO` e `TCC_IA_CHAVE` no ambiente sem registrar segredos no repositório. Execute somente quando autorizado:

```powershell
npm run testar:tcc -- --ia-real --autorizar-consumo
```

Este comando pode consumir a API 15 vezes e substituir o relatório. Registre C1–C5 e `satisfatoria` manualmente em uma cópia dos resultados; respostas com origem LOCAL representam contingência, não sucesso do provedor escolhido. Prompt, provedor/modelo efetivamente usados, entrada e resposta constam no relatório; credenciais não são serializadas. A opção real é preparada, mas não foi validada com API paga.
