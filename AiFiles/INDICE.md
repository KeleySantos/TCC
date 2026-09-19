# Índice de contexto para agentes

Este é o mapa canônico dos recursos de IA. Comece aqui depois de selecionar um agente e carregue somente o conjunto mínimo indicado pela tarefa.

## Estrutura

```text
AiFiles/
├── INDICE.md
├── Instrucoes/
│   ├── DIRETRIZES_GLOBAIS.md
│   ├── CONVENCOES_TECNICAS.md
│   └── SISTEMA_MULTIAGENTES.md
├── Contexto/
│   ├── Produto/
│   │   ├── PLANEJAMENTO_TECNICO.md
│   │   └── REQUISITOS_E_ESCOPO_MVP.md
│   ├── Cientifico/
│   │   ├── CHECKLIST_ETICA_PRIVACIDADE.md
│   │   ├── ESPECIFICACAO_CIENTIFICA.md
│   │   ├── GLOSSARIO.md
│   │   ├── PLANO_DE_AVALIACAO_DO_ARTEFATO.md
│   │   ├── POLITICA_DE_LINGUAGEM.md
│   │   └── PROTOCOLO_DE_MEDICAO.md
│   └── Tecnico/
│       ├── ARQUITETURA.md
│       ├── CENARIO_SINTETICO_E_RESULTADOS_ESPERADOS.md
│       ├── CONTAS_FICTICIAS.md
│       ├── CONTRATOS_DAS_OPERACOES.md
│       ├── DICIONARIO_DE_EVENTOS.md
│       └── MODELO_DE_DADOS.md
├── Memoria/
│   ├── ACOMPANHAMENTO.md
│   ├── DECISOES_DO_PROJETO.md
│   ├── MATRIZ_REQUISITOS_TESTES.md
│   └── REGISTRO_DE_RISCOS.md
├── Agentes/
│   ├── CATALOGO.md
│   ├── MODELO_DE_AGENTE.md
│   ├── Araki/
│   │   └── AGENT.md
│   ├── Cebolinha/
│   │   └── AGENT.md
│   └── Guanabara/
│       └── AGENT.md
├── Planos/
│   ├── HANDOFF_GUANABARA_METRICAS_DASHBOARD.md
│   ├── HANDOFF_GUANABARA_METODOS_DESAFIOS_BLOOM.md
│   ├── HANDOFF_GUANABARA_EXPERIMENTACAO_GUIADA_METODOS.md
│   ├── HANDOFF_GUANABARA_PAGINA_INTERNA_MODULO.md
│   ├── HANDOFF_GUANABARA_RASCUNHO_MODULOS.md
│   └── PLANO_TRANSICAO_LABORATORIO_PESSOAL_APRENDIZAGEM.md
└── RELATORIOS/
    ├── PESQUISA_ARQUITETURA_CONTEXTO_IA.md
    └── VALIDACAO_TECNICA_LOCAL.md
```

## Roteamento por necessidade

| Necessidade | Consulte primeiro | Complemente quando necessário |
|---|---|---|
| Selecionar, criar ou trocar agente | [`Agentes/CATALOGO.md`](Agentes/CATALOGO.md) | [`Instrucoes/SISTEMA_MULTIAGENTES.md`](Instrucoes/SISTEMA_MULTIAGENTES.md), [`Agentes/MODELO_DE_AGENTE.md`](Agentes/MODELO_DE_AGENTE.md) |
| Entender estado atual e pendências | [`Memoria/ACOMPANHAMENTO.md`](Memoria/ACOMPANHAMENTO.md) | [`Memoria/DECISOES_DO_PROJETO.md`](Memoria/DECISOES_DO_PROJETO.md), [`Memoria/REGISTRO_DE_RISCOS.md`](Memoria/REGISTRO_DE_RISCOS.md) |
| Planejar fase ou alterar escopo | [`Contexto/Produto/PLANEJAMENTO_TECNICO.md`](Contexto/Produto/PLANEJAMENTO_TECNICO.md) | [`Contexto/Produto/REQUISITOS_E_ESCOPO_MVP.md`](Contexto/Produto/REQUISITOS_E_ESCOPO_MVP.md), memória aplicável |
| Executar a transição para laboratório pessoal | [`Planos/PLANO_TRANSICAO_LABORATORIO_PESSOAL_APRENDIZAGEM.md`](Planos/PLANO_TRANSICAO_LABORATORIO_PESSOAL_APRENDIZAGEM.md) | planejamento, requisitos, decisões e protocolo canônicos |
| Implementar métricas gerais do Dashboard | [`Planos/HANDOFF_GUANABARA_METRICAS_DASHBOARD.md`](Planos/HANDOFF_GUANABARA_METRICAS_DASHBOARD.md) | [`Agentes/Guanabara/AGENT.md`](Agentes/Guanabara/AGENT.md), protocolo de medição, arquitetura e matriz |
| Implementar métodos, desafios e Bloom da Entrega B | [`Planos/HANDOFF_GUANABARA_METODOS_DESAFIOS_BLOOM.md`](Planos/HANDOFF_GUANABARA_METODOS_DESAFIOS_BLOOM.md) | [`Agentes/Guanabara/AGENT.md`](Agentes/Guanabara/AGENT.md), modelo de dados, contratos, protocolo e matriz |
| Revisar desafios para experimentação guiada de métodos | [`Planos/HANDOFF_GUANABARA_EXPERIMENTACAO_GUIADA_METODOS.md`](Planos/HANDOFF_GUANABARA_EXPERIMENTACAO_GUIADA_METODOS.md) | handoff original da Entrega B, modelo de dados, contratos, IA, protocolo e matriz |
| Implementar infraestrutura da página interna do módulo | [`Planos/HANDOFF_GUANABARA_PAGINA_INTERNA_MODULO.md`](Planos/HANDOFF_GUANABARA_PAGINA_INTERNA_MODULO.md) | [`Agentes/Guanabara/AGENT.md`](Agentes/Guanabara/AGENT.md), modelo de dados, contratos, protocolo de medição e matriz |
| Implementar criação de módulos em rascunho | [`Planos/HANDOFF_GUANABARA_RASCUNHO_MODULOS.md`](Planos/HANDOFF_GUANABARA_RASCUNHO_MODULOS.md) | [`Agentes/Guanabara/AGENT.md`](Agentes/Guanabara/AGENT.md), modelo de dados, contratos e matriz |
| Implementar ou validar requisito | [`Memoria/MATRIZ_REQUISITOS_TESTES.md`](Memoria/MATRIZ_REQUISITOS_TESTES.md) | requisito, arquitetura e contrato específicos |
| Alterar arquitetura ou camadas | [`Contexto/Tecnico/ARQUITETURA.md`](Contexto/Tecnico/ARQUITETURA.md) | [`Contexto/Tecnico/MODELO_DE_DADOS.md`](Contexto/Tecnico/MODELO_DE_DADOS.md), [`Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`](Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md) |
| Alterar banco, seed ou eventos | [`Contexto/Tecnico/MODELO_DE_DADOS.md`](Contexto/Tecnico/MODELO_DE_DADOS.md) | [`Contexto/Tecnico/DICIONARIO_DE_EVENTOS.md`](Contexto/Tecnico/DICIONARIO_DE_EVENTOS.md), [`Contexto/Tecnico/CENARIO_SINTETICO_E_RESULTADOS_ESPERADOS.md`](Contexto/Tecnico/CENARIO_SINTETICO_E_RESULTADOS_ESPERADOS.md) e decisões |
| Alterar autenticação ou contas de demonstração | [`Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md`](Contexto/Tecnico/CONTRATOS_DAS_OPERACOES.md) | [`Contexto/Tecnico/CONTAS_FICTICIAS.md`](Contexto/Tecnico/CONTAS_FICTICIAS.md), riscos e matriz |
| Alterar analytics ou recomendações | [`Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`](Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md) | [`Contexto/Cientifico/ESPECIFICACAO_CIENTIFICA.md`](Contexto/Cientifico/ESPECIFICACAO_CIENTIFICA.md), [`Contexto/Cientifico/POLITICA_DE_LINGUAGEM.md`](Contexto/Cientifico/POLITICA_DE_LINGUAGEM.md), [`Contexto/Cientifico/GLOSSARIO.md`](Contexto/Cientifico/GLOSSARIO.md) e testes |
| Avaliar ética, privacidade ou dados reais | [`Contexto/Cientifico/CHECKLIST_ETICA_PRIVACIDADE.md`](Contexto/Cientifico/CHECKLIST_ETICA_PRIVACIDADE.md) | especificação científica, riscos e decisões |
| Preparar avaliação do TCC | [`Contexto/Cientifico/PLANO_DE_AVALIACAO_DO_ARTEFATO.md`](Contexto/Cientifico/PLANO_DE_AVALIACAO_DO_ARTEFATO.md) | acompanhamento e relatório técnico |
| Consultar evidência de validação anterior | [`RELATORIOS/VALIDACAO_TECNICA_LOCAL.md`](RELATORIOS/VALIDACAO_TECNICA_LOCAL.md) | acompanhamento e matriz |

## Fontes canônicas

| Assunto | Fonte de verdade |
|---|---|
| Política de operação dos agentes | [`Instrucoes/DIRETRIZES_GLOBAIS.md`](Instrucoes/DIRETRIZES_GLOBAIS.md) |
| Identidade e memória de um agente | `Agentes/<Nome>/AGENT.md` e arquivos da mesma pasta |
| Escopo e roadmap | [`Contexto/Produto/PLANEJAMENTO_TECNICO.md`](Contexto/Produto/PLANEJAMENTO_TECNICO.md) |
| Requisitos congelados | [`Contexto/Produto/REQUISITOS_E_ESCOPO_MVP.md`](Contexto/Produto/REQUISITOS_E_ESCOPO_MVP.md) |
| Estado da execução | [`Memoria/ACOMPANHAMENTO.md`](Memoria/ACOMPANHAMENTO.md) |
| Decisões vigentes e pendentes | [`Memoria/DECISOES_DO_PROJETO.md`](Memoria/DECISOES_DO_PROJETO.md) |
| Riscos | [`Memoria/REGISTRO_DE_RISCOS.md`](Memoria/REGISTRO_DE_RISCOS.md) |
| Relação requisito–teste | [`Memoria/MATRIZ_REQUISITOS_TESTES.md`](Memoria/MATRIZ_REQUISITOS_TESTES.md) |
| Arquitetura implementada | [`Contexto/Tecnico/ARQUITETURA.md`](Contexto/Tecnico/ARQUITETURA.md) |
| Método analítico | [`Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md`](Contexto/Cientifico/PROTOCOLO_DE_MEDICAO.md) |

## Regras de manutenção

- `Instrucoes/` contém regras de comportamento estáveis; não guardar fatos transitórios ali.
- `Contexto/` contém conhecimento autoritativo do produto, separado em Produto, Científico e Técnico.
- `Memoria/` contém estado vivo, decisões, riscos e rastreabilidade; entradas devem ter evidência ou data quando relevante.
- `Agentes/` contém catálogo, modelo e uma pasta por agente. Informações exclusivas permanecem junto do agente.
- `RELATORIOS/` contém resultados fechados de pesquisa, auditoria ou validação; não é memória operacional diária.
- Prompts reutilizáveis devem ir para `AiFiles/Prompts/` quando o primeiro prompt real existir. Cada prompt deve declarar objetivo, entradas, saída e momento de uso.
- Planos de implementação específicos devem ir para `AiFiles/Planos/` quando o primeiro plano real existir; cada plano deve indicar estado, origem, escopo e evidências.
- Contexto temporário deve ir para `AiFiles/Temporario/` somente enquanto uma tarefa justificar sua existência; ao final, apagar o descartável ou promover o conteúdo duradouro à fonte canônica adequada.
- Antes de criar arquivo, confirme que o conteúdo não pertence a uma fonte existente. Prefira ampliar um documento coeso a gerar fragmentos pequenos.
- Ao mover ou renomear qualquer documento, atualize o índice e todas as referências no mesmo trabalho.

## O que não armazenar

- cadeia de pensamento ou raciocínio interno;
- transcrições integrais de sessões;
- segredos, tokens, credenciais ou dados de pessoas reais;
- cópias de código ou esquema que possam ser consultadas diretamente na fonte;
- notas sem utilidade futura ou sem responsável claro;
- versões contraditórias da mesma decisão.
