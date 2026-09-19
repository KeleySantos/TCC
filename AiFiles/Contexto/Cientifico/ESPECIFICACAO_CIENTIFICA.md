# Especificação científica — Laboratório Pessoal de Aprendizagem

> Atualizada em 2026-09-15 para as Entregas A e B. Esta versão substitui a delimitação anterior de painéis e papéis distintos por uma única conta pessoal sintética.

## Delimitação

Este TCC propõe um laboratório pessoal web de Learning Analytics voltado a apoiar a autorregulação da pessoa usuária. A plataforma registra evidências sintéticas de estudo e desempenho por módulo, tópico, método e formato de conteúdo para apresentar descrições contextualizadas, desafios pessoais de experimentação, recomendações exploratórias e interpretações assistidas.

O artefato não diagnostica capacidade, não classifica estudantes por estilos de aprendizagem e não estabelece causalidade entre um formato de estudo e uma nota.

## Problema de pesquisa

Pessoas que estudam com recursos diversos têm pouca evidência organizada sobre quais estratégias e formatos foram associados a seus resultados em módulos e tópicos específicos.

## Objetivo geral

Projetar e avaliar tecnicamente um laboratório pessoal de Learning Analytics que transforme registros de estudo e desempenho em indicadores compreensíveis, recomendações educacionais explicáveis e interpretações controladas, com foco na reflexão da pessoa usuária.

## Objetivos específicos

1. Registrar módulos, tópicos, materiais, sessões de estudo e tentativas de avaliação da própria conta.
2. Definir regras reproduzíveis para relacionar sessões válidas e avaliações posteriores.
3. Calcular indicadores por conta, módulo, tópico, método e formato de conteúdo, sempre acompanhados de quantidade de evidências e limitações.
4. Oferecer recomendações determinísticas e explicáveis para exploração de materiais.
5. Interpretar os indicadores oficiais com Gemini somente a partir de resumo sintético agregado, com validação e resposta local de contingência.
6. Disponibilizar dashboards pessoal e por módulo, preservando a propriedade direta dos dados e evitando rankings.
7. Permitir desafios pessoais de experimentação e análise por níveis de Bloom, preservando amostra, contexto e a ausência de causalidade.
8. Avaliar a corretude técnica e a compreensão da interface no cenário sintético; qualquer avaliação com participantes permanece bloqueada até protocolo aprovado.

## Perguntas de pesquisa

- P1. Como registros de sessões de estudo e avaliações podem ser organizados para descrever evidências por conta pessoal, módulo, tópico e formato de conteúdo?
- P2. Como comunicar essas evidências sem transformar associações observadas em classificações fixas ou conclusões causais?
- P3. A interface permite que a pessoa usuária identifique dados insuficientes, desempenho recente e próximos passos de forma compreensível?

## Unidade de análise

`conta pessoal + módulo + tópico + formato de conteúdo + método + janela temporal`

O recurso específico é preservado para rastreabilidade. Uma evidência simples exige uma única sessão válida da mesma conta e tópico antes da avaliação, dentro da janela definida. Exposições a múltiplos recursos antes da mesma avaliação são marcadas como mistas e não entram na comparação simples de formatos. Um desafio pode vincular a sessão de estudo, mas não cria vínculo direto entre sessão e tentativa. Comparações de desafio só contrastam grupos do mesmo módulo e método com evidências únicas, duas ou mais evidências por grupo e linguagem observacional.

## Hipóteses de trabalho do artefato

- H1 técnica: é possível calcular e reproduzir indicadores a partir dos dados sintéticos definidos.
- H2 de compreensão: usuários conseguem distinguir uma recomendação baseada em evidência insuficiente de uma recomendação baseada em histórico observável.

Essas hipóteses não afirmam eficácia pedagógica geral. Qualquer inferência com participantes reais depende do método, da amostra e das aprovações institucionais.

## Escopo da versão atual

- Dados exclusivamente sintéticos.
- Domínio demonstrativo: fundamentos de programação, com ênfase em loops.
- Uma única conta pessoal, sem papéis.
- Aplicação web local com SQLite.
- Métricas e recomendador oficial determinísticos e versionados; Gemini interpreta somente o resumo agregado e validado dessas saídas.
- Catálogo controlado de métodos, desafios pessoais de experimentação e análise de respostas classificadas por nível de Bloom.

## Limitações declaradas

- O tempo registrado não prova atenção, compreensão ou qualidade do estudo.
- Nota posterior não isola o efeito de um único recurso.
- O cenário sintético demonstra funcionamento técnico; não é evidência empírica sobre aprendizagem.
- Quizzes precisam ser comparáveis antes de sustentar comparação entre formatos.
- O MVP não substitui LMS, sistemas institucionais ou acompanhamento pedagógico humano.
- A interpretação gerada por Gemini pode falhar, estar indisponível ou ser descartada na validação; ela não é métrica oficial nem prova de aprendizagem.
