# Ajustes implementados no núcleo do TCC

Data: 2026-10-10. Agente: Guanabara. Escopo: [plano revisado](../Planos/PLANO_AJUSTES_TCC_2026_10_10.md).

## 1. Execução por lote

| Lote | Prioridade | Resultado |
|---|---|---|
| 0 — Baseline | P0 | Branch `codex/modulo-aprendizagem-por-fases`, HEAD `e90b00f106765d28f69ae5450094aa3a1170e5a8`. Única alteração preexistente: `.codex-remote-attachments/` não versionada, preservada. 37 arquivos/129 testes passaram. Inventário: Prisma/SQLite, serviços de módulos/materiais/aprendizagem, domínio, painéis e IA existentes. Nenhum PDF versionado encontrado; requisitos do plano são a referência operacional. |
| 1 — Evidências | P0 | Serviços, actions, painel e CSS de confirmação removidos. Validade objetiva substitui estados de confirmação em domínio/consultas/IA. Registro automático por upsert; dados incompletos excluídos; campos legados preservados sem uso funcional. |
| 2 — Integridade | P1 | Função única de normalização; três evidências para tendência e suficiência; três percepções para destaque. Média simples preservada. Índices exploratórios com fórmulas, contagens por fonte e janela. Vínculo explícito agora impede atribuição automática a outra sessão. |
| 3 — Recomendação | P0/P2 | Motor puro, critérios de elegibilidade/desempate, deduplicação de material entre conceitos, painel simples e DTO opcional para IA. Sem chave/API, seleção continua disponível. Prompt preserva decisão oficial; filtros/schema/fallback existentes mantidos. |
| 4 — Avaliação | P1 | Banco temporário independente, cinco cenários, 15 módulos comparados a constantes independentes, 150 sessões e 150 atividades de desempenho. 15 interpretações mock registradas; protocolo real opcional e rubrica manual preparados. |
| 5 — Entrega | P1 | Rótulos/fontes/limites revisados; invalidação após análise; documentação canônica atualizada; revisão independente e validações registradas abaixo. |

Execução na branch atual, sem commits, push, seed pessoal ou migração destrutiva. Os passos incrementais e decisões desta execução são registrados neste relatório e em D-051.

## 2. Arquivos e função das alterações

| Arquivos | Função |
|---|---|
| `src/dominio/analises/aprendizagem-modulo.ts` | Validade, deduplicação, normalização exportada, amostra mínima, precedência de vínculo e n por fonte dos índices |
| `src/dominio/analises/recomendacoes-materiais.ts` (novo) | Seleção determinística e DTO rastreável |
| `src/servidor/aprendizagem-modulo.ts` | Registro automático, extração conservadora, consulta autorizada, catálogo e recomendação; remove serviços de confirmar/rejeitar |
| `src/servidor/analises-materiais.ts`, `src/servidor/modulos.ts` | Retiram transições e escritas de confirmação; substituição invalida percentual antigo; mudança de função deixa registro fora das análises sem apagar histórico |
| `src/app/api/materiais/[id]/analise/route.ts` | Invalida Dashboard e módulos após processamento |
| `src/app/modulos/[identificador]/page.tsx`, `painel-recomendacoes-materiais.tsx` (novo) | Exibem decisão calculada com regra, n, justificativa e limites, independentemente da IA |
| `painel-conceitos-destaque.tsx`, `painel-metricas-sessoes.tsx`, `painel-resultados-contextuais.tsx`, `src/componentes/graficos-dashboard.tsx`, `src/app/dashboard/page.tsx` | Normalização uniforme, fontes dos índices, nomes reais e linguagem observacional |
| `src/dominio/analises/dashboard-observacional.ts` | Texto de limitação usa evidências válidas; consumidores reutilizam novo limiar compartilhado |
| `src/dominio/interpretacoes/esquema.ts`, `resposta-local.ts`, `src/servidor/ia/interpretacoes.ts`, `contrato-provedores.ts` | Nomenclatura válida, contexto de recomendação, filtro factual básico de elegibilidade dos eventos e orientação para preservar seleção; baixa amostra sem promessa de resultado |
| `painel-confirmacao-evidencias.tsx`, `painel-confirmacao-evidencias.test.ts`, `acoes-aprendizagem.ts` (removidos), `page.module.css` | Removem exclusivamente o fluxo morto e seus estilos |
| `prisma/schema.prisma` | Apenas comentários dos campos legados; sem mudança física ou migração; inclui metadado antigo de confirmação da data, sem consumidor |
| `prisma/cenario-diego.ts`, `scripts/verificar-cenario-diego.ts` | Seed/verificador deixam de instruir confirmação; cenário existente com poucas observações não promete tendência |
| `scripts/avaliar-tcc.ts`, `testes/fixtures/cenarios-tcc.ts`, `package.json` | Avaliação reproduzível e comando `testar:tcc`, sem banco pessoal |
| Testes de aprendizagem/domínio/dashboard/IA/painéis e novos `ajustes-tcc.test.ts`, `recomendacoes-materiais.test.ts`, `painel-recomendacoes-materiais.test.ts`, `route.test.ts` | Regressões das fórmulas, limites, material compartilhado, interface, contexto, autenticação e cache |
| `AiFiles/Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`, `Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`, `MODELO_DE_DADOS.md` | Fontes canônicas atualizadas |
| `AiFiles/Planos/PLANO_AJUSTES_TCC_2026_10_10.md`, planos históricos de sub-abas/espelhamento/execução | Escopo autorizado preservado e instruções antigas de confirmação substituídas |
| `AiFiles/Memoria/ACOMPANHAMENTO.md`, `MATRIZ_REQUISITOS_TESTES.md`, `DECISOES_DO_PROJETO.md`, `REGISTRO_DE_RISCOS.md`, `INDICE.md` | Rastreabilidade, precedência D-051 e riscos reais |
| Este relatório, `PROTOCOLO_AVALIACAO_TCC.md`, `RESULTADOS_AVALIACAO_TCC.json` | Entrega, reprodução, gabaritos, prompts/DTOs e resultados sintéticos |

Os nomes sem diretório na linha dos painéis pertencem a `src/app/modulos/[identificador]/`. A relação exata de mudanças pode ser conferida com `git diff --stat` e `git status --short`; arquivos novos não aparecem no diff até serem adicionados ao índice.

## 3. Métricas e definições finais

| Métrica | Fórmula/fontes/denominador | Filtros e janela | Amostra e uso |
|---|---|---|---|
| Tempo e duração média | Soma dos minutos; soma/n de sessões | Concluída, duração inteira ≥5 min; arquivadas incluídas; período escolhido | Descritiva, n de sessões; UI/IA; motor de sessões preservado |
| Compreensão/dificuldade percebida | Média dos autorrelatos preenchidos por fonte | Sessões válidas no contexto | Não é desempenho objetivo; ausência nula; UI exibe 1–5 |
| Percepção normalizada | ((v−1)/4)×100; 1→0,2→25,3→50,4→75,5→100 | Mesma função em índices, calibração e gráficos | Não é percentual de acertos; sem arredondamento interno; UI aproxima em 0/1 casa |
| Desempenho médio por conceito | Soma dos percentuais válidos / n de IDs distintos do conceito | Percentual finito 0..100, data válida/não futura; fonte ativa/avaliação ou evidência sem material; período escolhido | Média descritiva, não taxa agregada. n visível; domínio/UI/IA |
| Tendência de desempenho | Última − primeira evidência: ≥+10 positiva, ≤−10 atenção, restante estável | Mesmo módulo/conceito/recorte, ordem cronológica | n≥3 evidências distintas; n<3 insuficiente; descrição entre extremos |
| Percepção × evidência | Percepção normalizada ≥70 versus desempenho ≥70 | Mesmo conceito/contexto | n≥3 evidências; não prova calibração psicológica ou domínio |
| Índice exploratório de compreensão | Média dos sinais disponíveis: compreensão normalizada, 100−dificuldade normalizada, desempenho | Janela inclusiva de 90 dias, também limitada pelo filtro | Duas observações exploratórias; cada fonte tem peso igual; n por fonte; não é aprendizagem comprovada |
| Índice exploratório de dificuldade | Média dos inversos: dificuldade normalizada, 100−compreensão normalizada, 100−desempenho | Mesma janela; máximo cinco conceitos; empates por data/n/nome | Quando sem desempenho, baseado em percepções; UI mostra índice 0–100 |
| Contextos método/formato | n de sessões, médias de percepção e de evidências distintas por grupo | Vínculo explícito prioritário ou conceito comum+posterior em até30 dias; mesmo módulo | n≥3 para suficiência de evidências e destaque de compreensão; grupos sobrepostos não exclusivos |
| Duração associada a melhores resultados | Média de duração de sessões com compreensão≥4/5 e desempenho posterior médio≥70% | Sessões/evidências elegíveis do contexto | Descritiva, n visível; sem inferência causal |
| Evolução semanal | Médias separadas de autorrelatos e percentuais por semana UTC | Um registro por ID/data; ausências nulas | n visível; regra descritiva de autorrelato semanal com mínimo2 preservada; não é tendência de superioridade |
| Consistência entre módulos | Módulos com compreensão≥4 e desempenho≥70 / módulos analisáveis | Cada módulo requer três compreensões e três evidências | Rótulo poucos dados com <2 módulos ou <4 evidências; não é perfil global ou eficácia |

Nenhuma normalização de percepção usa mais `valor * 20`. As duas observações do índice exploratório e as duas percepções do gráfico descritivo não são apresentadas como três evidências objetivas ou uma tendência.

## 4. Motor de recomendação

| Regra | Entrada e saída | Critérios/desempates |
|---|---|---|
| RM-01 | Conceito com sinal de atenção e referência elegível → MATERIAL | Baixo desempenho <70 tem prioridade; depois compreensão<3 ou dificuldade≥3. Ordem: classe, menor desempenho, ID do conceito. Material por ID estável; não repete material em conceitos distintos; máximo3 resultados |
| RM-02 | Sinal de atenção sem referência elegível restante → SEM_MATERIAL | Nunca inventa material; propõe revisão/coleta de evidência |
| RM-03 | Ausência de sinais/início a frio → EXPLORACAO | Sem material/conceito específico; não cria preferência de formato |

Elegibilidade: material disponível, proprietário e módulo iguais, vínculo com conceito; servidor fornece apenas referências ativas. DTO contém tipo, módulo/conceito/material, título, regra, indicadores utilizados, n de evidências, justificativa, limitações e nível (LIMITADA n<3; DESCRITIVA n≥3). Sem controle de dificuldade, nenhuma amostra produz afirmação de superioridade de formato/método. Duplicidade de material compartilhado foi encontrada na revisão independente, reproduzida por teste falho e corrigida.

## 5. Fluxo de evidência e atualização

Upload/extração existente → autorização de proprietário/material → conceitos e extração de percentual explicitamente rotulado → upsert único por recurso → consulta autorizada com validade → cálculo por domínio → UI, recomendação e DTO da IA. Questões incompletas não são convertidas em acertos/pontos. Uma questão identificada como incorreta não é tratada como correta.

Evidências sem desempenho, fora de0..100, sem data válida ou futuras não alteram médias. Campos de confirmação não são selecionados nem filtrados pelos serviços. Histórico válido antes pendente/confirmado/rejeitado segue a mesma regra. IDs deduplicam evidências e vínculos. Arquivo substituído limpa o percentual anterior; material inativo ou reclassificado sai da consulta, preservando histórico físico. Criação automática grava origem EXTRACAO_MATERIAL; fixtures usam FIXTURE_TCC. Não há declaração de aprovação pelo estudante.

A API de análise chama `revalidatePath` para Dashboard e páginas de módulo; clientes existentes chamam `router.refresh()`. Consultas leem os registros atuais; teste da API verifica invalidação e integração isolada verifica alteração imediata de n/média. Nenhuma fila de confirmação, action, serviço ou painel é restaurado. Os campos e enum antigos do schema, migrações históricas e fixtures de compatibilidade permanecem documentados como armazenamento, sem fluxo funcional.

## 6. Validação

Baseline: 37 arquivos e129 testes aprovados. Os novos testes de validade/normalização/amostra, precedência de vínculo, material compartilhado e invalidação foram observados falhar antes das respectivas correções. Testes antigos com expectativas de confirmação ou n=2 foram adaptados ao comportamento solicitado. Revisão independente leu o diff e executou31 testes focados; encontrou duplicidade de material, corrigida com regressão.

Resultados finais confirmados com código de saída zero:

| Verificação | Resultado |
|---|---|
| `npm run validar` | Scanner de credenciais em376 arquivos, lint, tipos,147 testes em40 arquivos e build de produção aprovados |
| `npm run testar:tcc` |15 comparações de módulos aprovadas; base150 sessões/150 evidências válidas;15 interpretações simuladas registradas |
| TypeScript do avaliador e fixtures | Sem erros na configuração específica de avaliação |
| `git diff --check` | Sem erros de whitespace |
| Revisão independente |31 testes focados inicialmente;11 testes na revisão da correção de material duplicado, sem outro defeito demonstrado |

Logs completos ficam em `AiFiles/Temporario/AjustesTcc/`.

## 7. Cenários sintéticos

O comando `npm run testar:tcc` gera banco novo em diretório temporário; não usa DATABASE_URL pessoal nem seed existente. Base:5 usuários,15 módulos,150 sessões válidas (incluindo15 arquivadas),150 atividades de desempenho distintas,150 evidências válidas. Controles adicionais:2 sessões inválidas e1 evidência que termina incompleta. Total físico final:152 sessões/151 evidências; métricas mantêm150 válidas de cada tipo.

S1 compara dois contextos explícitos80/40%; S2 isola resultados80/40/60 entre módulos; S3 verifica séries de melhora/piora/estabilidade; S4 mantém n=0/1/2 no conceito alvo e nenhum material; S5 verifica calibração e índices. Quinze médias/tendências conferem com constantes independentes. A matriz esperado→observado→aprovação e as15 entradas/prompts/respostas estão em `RESULTADOS_AVALIACAO_TCC.json`. A rubrica não foi preenchida: respostas são MOCK_SEM_REDE, sem evidência de qualidade real. Reprodução e experimento opcional: [protocolo](PROTOCOLO_AVALIACAO_TCC.md).

## 8. Decisões de escopo

| Funcionalidade | Evidência no código | Estado e decisão | Impacto no TCC / testes |
|---|---|---|---|
| Taxa agregada de acerto | QuestaoEvidencia tem ACERTO/PARCIAL/ERRO/NAO_INFORMADO e pontos opcionais; extração nem sempre tem denominadores/pontuação confiáveis | Não implementada ponta a ponta. Preservar média simples; não reconstruir taxa de dados incompletos | Substituir promessa por desempenho médio baseado em evidências. Testes validam média e ausências |
| Tentativas educacionais | AnaliseMaterial.tentativas incrementa processamento no serviço; InterpretacaoGerada.tentativas registra provedores | Não implementadas no domínio do estudante; não reutilizar contadores técnicos | Retirar métrica pedagógica de métodos/resultados; testes atuais permanecem técnicos |
| Bloom | DTO opcional e ramo de contingência local existem, mas sem origem persistente/classificação/cálculo/painel atuais | Não implementado operacionalmente; trabalho futuro | Retirar promessa operacional; testes de contrato com fixture não demonstram domínio implementado |
| Outros componentes | proximoExperimento/descobertas/mapas existentes | Não ativados apenas para preencher dashboard | Fora do núcleo; sem nova UI social ou refinamento visual |
| Verificação semântica numérica de IA | Schema Zod/filtro de linguagem/fallback existentes | Não ampliada; trabalho futuro explicitamente opcional | Descrever validação estrutural/linguística e avaliação manual |

## 9. Ajustes sugeridos no texto acadêmico

- Seção3.2: descrever Next.js/SQLite e interpretação opcional por provedores configuráveis. Ordem padrão do código: Groq (`openai/gpt-oss-20b`) → Gemini (`gemini-3.8-flash`, contingência `gemini-3.7-flash`) → Qwen legado → local. AI_PRIMARY_PROVIDER pode escolher Gemini primeiro; modelos podem ser sobrescritos pelo ambiente. Isso relata configuração do código, não verificação externa da disponibilidade comercial desses modelos.
- Seção3.3: trocar ciclo tópico/avaliação convencional/tentativa pelo módulo/sessão/conceito/percepção/evidência registrada. Explicar registro automático sem aprovação humana e a independência entre sessão e atividade de desempenho.
- Seção3.4: usar fórmulas da tabela, distinguir percepção normalizada, média de percentuais e índice exploratório; declarar n≥3 para tendências, janelas30/90 dias, deduplicação, limites observacionais e regras RM-01..03. Remover taxa de acerto/tentativas/Bloom como funcionalidades operacionais atuais.
- Capítulo4: relatar dataset base e controles separadamente; descrever gabaritos independentes e resultados determinísticos. Registrar15 respostas reais somente após experimento autorizado e rubrica C1..C5; ≥4/5 com C1+C4 obrigatórios e≥14/15 globais são critérios propostos, não resultados já atingidos.

Nenhum PDF foi modificado. Não se afirmou qual versão acadêmica menciona sete ou nove métricas: o PDF não estava disponível no repositório, e o plano foi usado como referência operacional.

## 10. Pendências e limites

1. Avaliação qualitativa das15 interpretações reais, com autorização/configuração e rubricagem manual; mocks não a substituem.
2. Atualização do texto acadêmico pelo autor após estabilizar estes resultados; nenhuma edição automática do PDF.
3. Remoção física futura dos campos legados mediante migração segura. Nesta entrega sua preservação impede perda histórica e não mantém funcionalidade de confirmação.
4. Extração rotulada não valida semanticamente o documento/OCR. Dados ambíguos podem ficar ausentes; coleta de pontos/questões confiáveis e verificador numérico completo são trabalhos futuros.
5. Não houve inspeção manual de navegador ou teste com leitor de tela nesta execução. A UI e contrato HTTP foram verificados automaticamente; integração com extratores/upload não foi reexecutada sobre banco pessoal.

## Atualização posterior de interface —2026-10-10

Por solicitação explícita do usuário, o card “Recomendações de estudo” foi removido do Dashboard do módulo. O motor determinístico e o DTO continuam disponíveis; as referências anteriores à exibição do painel descrevem a entrega inicial, superada por esta decisão de apresentação.
