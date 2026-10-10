# Execução do módulo de aprendizagem por fases

**Origem:** `especificacao_detalhada_modulo_tcc.md` e `plano_implementacao_por_fases_modulo_tcc.md`, fornecidos pelo autor em 2026-09-27.

**Estado:** concluído em 2026-09-27.

## Auditoria da Fase 0

| Área | Implementação atual | Ponto de extensão |
|---|---|---|
| Módulo | `ModuloAprendizagem`, serviços em `src/servidor/modulos.ts` e página em `src/app/modulos/[identificador]` | concentrar conceitos, evidências e trajetória no módulo pessoal |
| Sessões | `SessaoEstudo`, relações de métodos, formatos e materiais | preservar `sessaoValida` como critério único de análise |
| Percepções | inteiros opcionais em `SessaoEstudo`, validados no CRUD | escala discreta de 1 a 5 já concluída; médias continuam decimais |
| Métricas | `metricas-sessoes-v1`, função pura e painel do módulo | evoluir formatos, regularidade, série temporal e dificuldade × compreensão |
| Materiais | `RecursoConteudo`, `ArquivoMaterial` e `AnaliseMaterial` | adicionar função do material, data do evento e resultados estruturados |
| Análise | extração segura e resumo/conceitos em JSON | materializar conceitos e produzir rascunhos de evidência que exigem confirmação |
| Conceitos | listas textuais em `AnaliseMaterial` | criar identidade por módulo, aliases e relações com material, sessão e questão |
| Evidências | inexistentes desde a remoção do modelo antigo | criar evidência datada, questões, conceitos e estado de confirmação |
| IA | análise de material e interpretação opcional do módulo | alimentar interpretação com padrões estruturados e eventos confirmados |

## Ordem de execução

1. Concluir o Dashboard do módulo com os dados atuais: métodos e formatos × compreensão, regularidade, evolução temporal e dificuldade × compreensão.
2. Criar conceitos persistentes e classificação funcional dos materiais.
3. Criar evidências, questões e confirmação do usuário.
4. Unificar sessões, materiais e evidências em uma linha do tempo.
5. Calcular percepção × evidência, evolução por conceito e associações posteriores de métodos/formatos.
6. Produzir padrões determinísticos, integrar a interpretação da IA e finalizar estados de confiança, transparência e UX.

## Decisões de execução

- Dados históricos são preservados; materiais existentes recebem a função `REFERENCIA` por padrão.
- Evidências extraídas começam pendentes e somente registros confirmados alimentam análises quantitativas.
- Conceitos são únicos por módulo por uma chave normalizada; aliases ficam explícitos e não criam conceitos paralelos.
- Relações automáticas usam conceito e tempo como associação observacional, sem atribuição causal.
- A primeira versão usa regras determinísticas simples e explicáveis; taxonomias e visualizações sofisticadas ficam fora desta execução.

## Resultado por fase

- Fases 0–2: auditoria, escala discreta, sessão elegível única e dashboard reformulado.
- Fases 3–5: conceitos persistentes, funções de material, evidências, questões e confirmação humana.
- Fases 6–10: linha do tempo, percepção × evidência, evolução, associações posteriores e padrões determinísticos.
- Fase 11: interpretação da IA alimentada por resumo estruturado da trajetória confirmada.
- Fase 12: amostras mínimas, transparência, estados vazios, acessibilidade e responsividade validadas.
