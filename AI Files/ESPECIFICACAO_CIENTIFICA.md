# Especificação científica inicial

## Delimitação

Este TCC propõe uma plataforma web de Learning Analytics voltada a apoiar a autorregulação do estudante. A plataforma registra evidências de estudo e desempenho por tópico e formato de conteúdo para apresentar descrições contextualizadas e recomendações exploratórias.

O artefato não diagnostica capacidade, não classifica estudantes por estilos de aprendizagem e não estabelece causalidade entre um formato de estudo e uma nota.

## Problema de pesquisa

Estudantes costumam acessar diversos recursos educacionais, mas têm pouca evidência organizada sobre quais estratégias e formatos foram associados a seus resultados em tópicos específicos. Professores, por sua vez, normalmente acessam notas e entregas, mas têm pouca visibilidade sobre o processo de estudo que antecede esses resultados.

## Objetivo geral

Projetar e avaliar tecnicamente uma plataforma de Learning Analytics que transforme registros de estudo e desempenho em indicadores compreensíveis e recomendações educacionais explicáveis, com foco na reflexão do aluno e apoio complementar à intervenção docente.

## Objetivos específicos

1. Registrar sessões de estudo, recursos utilizados e tentativas de avaliação por tópico.
2. Definir regras reproduzíveis para relacionar sessões válidas e avaliações posteriores.
3. Calcular indicadores por aluno, tópico e formato de conteúdo, sempre acompanhados de quantidade de evidências e limitações.
4. Oferecer recomendações determinísticas e explicáveis para exploração de materiais.
5. Disponibilizar painéis distintos para aluno e professor, preservando permissões e evitando rankings.
6. Avaliar a corretude técnica, a compreensão da interface e a utilidade percebida do artefato conforme protocolo aprovado.

## Perguntas de pesquisa

- P1. Como registros de sessões de estudo e avaliações podem ser organizados para descrever evidências por aluno, tópico e formato de conteúdo?
- P2. Como comunicar essas evidências sem transformar associações observadas em classificações fixas ou conclusões causais?
- P3. A interface permite que aluno e professor identifiquem dados insuficientes, desempenho recente e próximos passos de forma compreensível?

## Unidade de análise

`aluno + tópico + formato de conteúdo + janela temporal`

O recurso específico é preservado para rastreabilidade. Uma evidência simples exige uma única sessão válida do mesmo tópico antes da avaliação, dentro da janela definida. Exposições a múltiplos recursos antes da mesma avaliação são marcadas como mistas e não entram na comparação simples de formatos.

## Hipóteses de trabalho do artefato

- H1 técnica: é possível calcular e reproduzir indicadores a partir dos dados sintéticos definidos.
- H2 de compreensão: usuários conseguem distinguir uma recomendação baseada em evidência insuficiente de uma recomendação baseada em histórico observável.

Essas hipóteses não afirmam eficácia pedagógica geral. Qualquer inferência com participantes reais depende do método, da amostra e das aprovações institucionais.

## Escopo da versão atual

- Dados exclusivamente sintéticos.
- Domínio demonstrativo: fundamentos de programação, com ênfase em loops.
- Papéis: aluno e professor.
- Aplicação web local com SQLite.
- Recomendador determinístico por regras, com versão registrada.

## Limitações declaradas

- O tempo registrado não prova atenção, compreensão ou qualidade do estudo.
- Nota posterior não isola o efeito de um único recurso.
- O cenário sintético demonstra funcionamento técnico; não é evidência empírica sobre aprendizagem.
- Quizzes precisam ser comparáveis antes de sustentar comparação entre formatos.
- O MVP não substitui LMS, sistemas institucionais ou acompanhamento pedagógico humano.
