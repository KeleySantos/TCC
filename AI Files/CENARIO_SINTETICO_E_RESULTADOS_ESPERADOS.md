# Cenário sintético e resultados esperados

## Dados de demonstração

- 1 administrador: Administrador da Demonstração.
- 1 professor: Prof. Rafael Mendes.
- 6 alunos sintéticos.
- 1 turma: Fundamentos de Programação, período 2026.2.
- 3 tópicos: Condicionais, Loops e Funções.
- 3 recursos ativos de Loops: PDF, vídeo e exercício prático.
- 1 quiz objetivo de Loops com 5 questões.

## Padrões intencionais

| Aluno | Padrão em Loops | Uso na demonstração |
|---|---|---|
| Ana | Nota 46 após PDF; 78, 82 e 76 após exercício prático. | Associação contextual para exercício prático. |
| Bruno | 70, 74 e 72 após vídeo; 68 após PDF. | Evidência recorrente para vídeo. |
| Carla | Uma observação após PDF. | Estado de evidência insuficiente. |
| Diego | 48, 51 e 47 em formatos distintos. | Resultado baixo e contraditório; não rotular estudante. |
| Elisa | Notas altas em vários formatos. | Evitar falsa personalização quando desempenho é alto em alternativas distintas. |
| Felipe | Notas moderadas em prática e vídeo. | Comparação contextual sem conclusão definitiva. |

## Verificações automatizadas obrigatórias

Após recriar a base, executar:

```powershell
npm run banco:reiniciar
npm run banco:verificar-cenario
```

O verificador confere estrutura, quantidades, faixa das notas, exclusão da sessão inválida de Carla e os padrões analíticos de Ana e Carla.

## Verificações manuais complementares

1. Ana: exercício prático deve ter média aproximada de 78,7% e três evidências, desde que cada sessão tenha apenas uma tentativa elegível na janela.
2. Carla: deve receber recomendação exploratória por possuir menos de duas evidências válidas.
3. Sessão inválida de Carla, com um minuto, não pode compor evidência.
4. Nota de qualquer tentativa deve permanecer entre 0 e 100.
5. Professor deve ver tamanho de amostra ao lado dos indicadores por tópico.

## Observação metodológica

Esses padrões foram criados manualmente para testar a aplicação. Eles não representam estudantes reais, não devem aparecer no TCC como resultado de pesquisa empírica e não comprovam que um formato cause melhor aprendizagem.
