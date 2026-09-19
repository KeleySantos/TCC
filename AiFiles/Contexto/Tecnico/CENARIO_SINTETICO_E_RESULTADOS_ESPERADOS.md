# Cenário sintético e resultados esperados

## Dados de demonstração

- 5 contas pessoais sintéticas: Ana, Bruno, Carla, Diego e Elisa.
- Cada conta possui o módulo JavaScript, com os tópicos Condicionais, Loops e Funções; Ana também possui Lógica/Proposições como segundo módulo completo para demonstrar recorrência contextual.
- Cada tópico Loops possui três materiais ativos: texto de guia visual, vídeo guiado e exercício prático.
- Cada conta possui um quiz objetivo de Loops com 5 questões classificadas nos níveis iniciais de Bloom.
- Ana possui um desafio Feynman ativo com duas sessões vinculadas e duas sessões externas comparáveis no mesmo módulo e método. Bruno possui um desafio Pomodoro cancelado para demonstrar preservação do histórico.
- O conjunto usa os seis métodos controlados da Entrega B e contém 87 respostas classificadas por Bloom.

## Padrões intencionais

| Conta | Padrão em Loops | Uso na demonstração |
|---|---|---|
| Ana | Nota 46 após PDF; 78, 82 e 76 após exercício prático. | Associação contextual para exercício prático. |
| Bruno | 70, 74 e 72 após vídeo; 68 após PDF. | Evidência recorrente para vídeo. |
| Carla | Uma observação após PDF. | Estado de evidência insuficiente. |
| Diego | 48, 51 e 47 em formatos distintos. | Resultado baixo e contraditório; não rotular estudante. |
| Elisa | Notas altas em vários formatos. | Evitar falsa personalização quando desempenho é alto em alternativas distintas. |

## Verificações automatizadas obrigatórias

Após recriar a base, executar:

```powershell
npm run banco:reiniciar
npm run banco:verificar-cenario
npm run testar:metricas
npm run testar:desafios
```

Os verificadores conferem estrutura, quantidades, faixa das notas, exclusão da sessão inválida de Carla, os padrões analíticos de Ana a Elisa, os seis métodos, os desafios, a comparação contextual e as respostas classificadas por Bloom.

## Verificações manuais complementares

1. Ana: exercício prático deve ter média aproximada de 78,7% e três evidências, desde que cada sessão tenha apenas uma tentativa elegível na janela.
2. Carla: deve receber recomendação exploratória por possuir menos de duas evidências válidas.
3. Sessão inválida de Carla, com um minuto, não pode compor evidência.
4. Nota de qualquer tentativa deve permanecer entre 0 e 100.
5. Cada tentativa deve ter `numeroTentativa` positivo e nota entre 0 e 100.
6. O desafio Feynman de Ana deve ter duas evidências vinculadas e duas externas comparáveis; a comparação é contextual e não demonstra efeito do método.
7. Um nível de Bloom com menos de duas respostas deve mostrar taxa indisponível; uma taxa de 0% só é exibida quando houver duas ou mais respostas classificadas.

## Observação metodológica

Esses padrões foram criados manualmente para testar a aplicação. Eles não representam pessoas reais, não devem aparecer no TCC como resultado de pesquisa empírica e não comprovam que um formato cause melhor aprendizagem.
