# Handoff Guanabara — Métodos, desafios e Bloom da Entrega B

## Identificação

| Campo | Valor |
|---|---|
| Estado | Implementação funcional concluída e validada localmente em 2026-09-15 |
| Origem | Fase 11 do Plano de Transição, ampliada pelo autor em 2026-09-15 |
| Escopo | RLB-001 a RLB-004 e RLB-NF-001 a RLB-NF-002 |
| Limite | Dados exclusivamente sintéticos; comparação observacional, sem causalidade ou diagnóstico |

## Contratos entregues por Guanabara

1. Migração aditiva `20260915100000_desafios_experimentacao_bloom`: cria `DesafioExperimentacao` e acrescenta `SessaoEstudo.desafioId` anulável. Sessões existentes permanecem sem desafio.
2. O catálogo de novos registros contém `FEYNMAN`, `RECUPERACAO_ATIVA`, `REPETICAO_ESPACADA`, `POMODORO`, `INTERCALAMENTO` e `PRATICA_DISTRIBUIDA`. Valores históricos seguem legíveis apenas para preservar o cenário anterior.
3. `criarDesafioPessoal(usuarioId, { moduloId, metodo, meta })` exige módulo próprio, configurado e ativo; meta de 3 a 280 caracteres; cria estado `ATIVO`.
4. `cancelarDesafioPessoal(usuarioId, desafioId)` somente cancela desafio ativo da proprietária, grava UTC e preserva as sessões já vinculadas. `listarDesafiosAtivosDoModuloPessoal` é o DTO seguro para o cronômetro.
5. `POST /api/desafios` retorna `201`, `400`, `401` ou `404`. `POST /api/desafios/{id}/cancelar` retorna `200`, `401` ou `404`. Nenhuma rota aceita propriedade como verdade do cliente.
6. `POST /api/sessoes` aceita `desafioId` opcional. Quando presente, o servidor exige que desafio, recurso e método pertençam à mesma conta, módulo e método; desafio cancelado ou alheio não é localizado.
7. `calcularComparacaoDesafio` agrupa somente evidências de exposição única do mesmo módulo e método. O grupo externo aceita exclusivamente `desafioId: null`; cada média exige duas evidências. Antes disso, `diferencaMedias` é `null`.
8. `calcularAnaliseBloom` usa respostas concluídas de questões com `nivelBloom`. Cada nível só recebe taxa com duas respostas classificadas; zero por cento com duas ou mais respostas continua válido.
9. `obterComparacoesDesafiosPessoais` e `obterAnaliseBloomModuloPessoal` consultam somente a conta autenticada e retornam DTOs, sem Prisma em componentes.

## Integração funcional já realizada

- `/desafios` cria, lista, contextualiza e cancela desafios.
- O cronômetro da página do módulo oferece vínculo opcional com desafio ativo e sincroniza o método selecionado.
- A página interna do módulo apresenta gráfico e tabela de Bloom, mantendo os níveis insuficientes sem taxa.
- O histórico mostra a meta do desafio quando uma sessão foi vinculada.
- O cenário sintético contém os seis métodos, um desafio Feynman ativo com duas evidências vinculadas e duas externas comparáveis, um desafio Pomodoro cancelado e 87 respostas classificadas por Bloom.

## Saída esperada do Araki

Araki pode refinar a composição visual de `/desafios` e do painel Bloom sem alterar os contratos acima. Deve preservar a tabela equivalente ao gráfico, o texto de limitação, foco visível, teclado e reflow em tela estreita. Não deve recalcular médias, diferença, níveis ou taxas no React.

## Evidências concluídas

- Testes puros: `comparar-desafio.test.ts` e `analise-bloom.test.ts`; a suíte completa aprovou 35 testes.
- Serviço: `npm run testar:desafios`, `testar:sessoes`, `testar:servicos` e `testar:avaliacoes` aprovados.
- Integração HTTP: `npm run testar:integracao` aprovou criação, vínculo, cancelamento e acesso horizontal.
- Cenário: `npm run banco:reiniciar`, `banco:verificar-cenario` e `testar:metricas` aprovados.
- Qualidade: `npm run validar` aprovou lint, tipos, testes e build de produção do Next.js.

## Resultado da integração visual pelo Araki

- `/desafios` recebeu composição própria e coerente com Dashboard e Módulos: apresentação do fluxo, catálogo visual dos seis métodos, formulário de criação, lista de desafios e leitura responsável permanecem na mesma jornada.
- Cada desafio apresenta estado, módulo, método, meta, amostra, períodos e as duas médias oficiais em barras nativas de progresso. A diferença continua sendo exibida somente quando o DTO informa `comparavel`; nenhum valor é recalculado no React.
- A tabela equivalente foi preservada em detalhe expansível e contém os dois grupos, quantidades, médias e períodos. Estados insuficientes permanecem textuais, sem barra ou diferença inventada.
- O formulário mantém as ações entregues pelo Guanabara e agora apresenta estado de processamento. A sequência de teclado módulo → método → meta → criar foi verificada, com foco visível.
- O catálogo descreve os seis métodos de forma operacional e deixa explícito que a escolha não define estilo fixo de aprendizagem.
- Bloom foi promovido a painel próprio na página interna do módulo. Ele apresenta gráfico Recharts, total de respostas classificadas, quantidade de níveis com evidência, versão do algoritmo e tabela com amostra, taxa, evidência e período.
- O gráfico Bloom recebe somente taxas já calculadas pelo backend. Níveis sem duas respostas permanecem na tabela sem taxa; zero por cento com amostra suficiente continua sendo um valor válido no gráfico.
- Em navegador autenticado, `/desafios` e `/modulos/javascript` apresentaram documento de 305 px em viewport de 320 px, sem rolagem horizontal. As tabelas de comparação e Bloom foram abertas e verificadas.
- `npm.cmd run validar` aprovou lint, tipos, 35 testes e build de produção do Next.js. Nenhum contrato, serviço, migração, seed ou dado foi alterado pela integração visual.
