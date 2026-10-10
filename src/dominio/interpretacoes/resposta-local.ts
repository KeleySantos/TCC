import { montarInterpretacao, type DtoInterpretacao, type InsightAprendizagem, type MotivoContingencia, type TentativaProvedor } from "./esquema";

function insightSemDados(): InsightAprendizagem {
  return {
    tipo: "OBSERVACAO", titulo: "Ainda estamos formando uma base",
    observacao: "Ainda não há sessões concluídas suficientes para observar um padrão. Quando novos registros aparecerem, esta análise poderá comparar contextos sem preencher as lacunas com suposições.",
    resumoEvidencias: null, perguntaReflexiva: null,
    experimentoSugerido: "Registre uma próxima sessão com método, duração e compreensão percebida.", confianca: "BAIXA",
  };
}

function insightsDeAprendizagem(dto: DtoInterpretacao) {
  const insights: InsightAprendizagem[] = [];
  const conceitos = dto.aprendizagemModulo?.conceitos ?? [];
  const calibracao = conceitos.find((item) => item.relacaoPercepcaoEvidencia === "POSSIVEL_SUPERESTIMACAO" && item.compreensaoMedia !== null && item.desempenhoMedio !== null);
  if (calibracao) {
    const compreensaoMedia = calibracao.compreensaoMedia!;
    const desempenhoMedio = calibracao.desempenhoMedio!;
    insights.push({
    tipo: "CALIBRACAO", titulo: "Percepção e evidência contam histórias diferentes",
    observacao: `Em ${calibracao.conceito}, apareceu uma diferença entre a compreensão percebida e as evidências posteriores. Isso pode indicar que a familiaridade com o conteúdo ainda não estava igualmente disponível na hora de usá-lo sozinho.`,
    resumoEvidencias: `${calibracao.sessoes} sessão(ões), compreensão percebida média ${compreensaoMedia.toFixed(1)}/5 e ${calibracao.evidencias} evidência(s) com média ${desempenhoMedio.toFixed(0)}%.`,
    perguntaReflexiva: "O resultado combinou com a sensação que você teve durante o estudo?",
    experimentoSugerido: "Antes de consultar o material, tente recuperar ou aplicar o conteúdo e compare novamente.",
    confianca: calibracao.evidencias >= 5 ? "FORTE" : calibracao.evidencias >= 3 ? "MODERADA" : "BAIXA",
    });
  }

  const contextoFrequenteComResultadoBaixo = dto.aprendizagemModulo?.associacoes.find((item) => item.sessoes >= 3 && item.amostraSuficiente && item.desempenhoMedioPosterior !== null && item.desempenhoMedioPosterior < 60);
  if (contextoFrequenteComResultadoBaixo) insights.push({
    tipo: "ESTRATEGIA", titulo: "Um contexto frequente merece atenção",
    observacao: `${contextoFrequenteComResultadoBaixo.contexto} apareceu com frequência nas sessões analisadas e ficou associado a resultados posteriores mais baixos nesta amostra. Isso não permite atribuir o resultado à estratégia, mas sugere uma comparação cuidadosa com outra forma de estudo em conteúdos parecidos.`,
    resumoEvidencias: `${contextoFrequenteComResultadoBaixo.sessoes} sessão(ões) e ${contextoFrequenteComResultadoBaixo.evidenciasPosteriores} evidência(s) posterior(es), com média ${contextoFrequenteComResultadoBaixo.desempenhoMedioPosterior!.toFixed(0)}%.`,
    perguntaReflexiva: "O conteúdo estava mais difícil ou você percebeu alguma diferença na forma de estudar?",
    experimentoSugerido: "Compare uma próxima sessão com outra estratégia, mantendo conteúdo e duração tão próximos quanto possível.",
    confianca: contextoFrequenteComResultadoBaixo.evidenciasPosteriores >= 5 ? "FORTE" : "MODERADA",
  });

  const evolucao = dto.evolucaoAprendizagem ?? [];
  if (evolucao.length >= 3 && (evolucao.at(-1) ?? 0) > evolucao[0]) insights.push({
    tipo: "PROGRESSO", titulo: "Uma mudança começou a aparecer",
    observacao: "Os resultados foram melhorando ao longo das observações recentes. Como a mudança aparece em mais de um registro, vale olhar o que se manteve ou mudou nesse período, sem atribuir o avanço a um único fator.",
    resumoEvidencias: `Sequência observada: ${evolucao.map((valor) => `${valor.toFixed(0)}%`).join(" → ")}.`,
    perguntaReflexiva: "O que mudou nas sessões desse período?",
    experimentoSugerido: null, confianca: evolucao.length >= 5 ? "FORTE" : "MODERADA",
  });

  const bloom = dto.bloom;
  if (bloom?.compreender !== undefined && bloom.analisar !== undefined && bloom.compreender - bloom.analisar >= 20) insights.push({
    tipo: "DIFICULDADE", titulo: "A diferença aparece nas tarefas mais complexas",
    observacao: "A compreensão aparece mais alta do que a análise. A teoria pode estar relativamente disponível, enquanto comparar situações, justificar decisões ou identificar erros ainda pede mais experimentação.",
    resumoEvidencias: `Compreender: ${bloom.compreender.toFixed(0)}%; analisar: ${bloom.analisar.toFixed(0)}%.`,
    perguntaReflexiva: null,
    experimentoSugerido: "Experimente uma atividade curta de comparação, justificativa ou identificação de erros.",
    confianca: "MODERADA",
  });
  return insights;
}

function insightDeEstrategia(dto: DtoInterpretacao): InsightAprendizagem | null {
  const metodos = dto.modulos.flatMap((modulo) => modulo.metodos).filter((item) => item.compreensaoMedia !== null).sort((a, b) => b.quantidadeSessoes - a.quantidadeSessoes || a.contexto.localeCompare(b.contexto, "pt-BR"));
  const metodo = metodos[0];
  if (!metodo) return null;
  const poucosDados = metodo.quantidadeCompreensoes < 3;
  return {
    tipo: "ESTRATEGIA", titulo: poucosDados ? "Uma hipótese inicial para testar" : "Um contexto que vale continuar observando",
    observacao: poucosDados
      ? `Os resultados de ${metodo.contexto} parecem promissores, mas a amostra ainda é pequena. Por enquanto, isso funciona melhor como hipótese para novas sessões do que como um padrão estabelecido.`
      : `${metodo.contexto} aparece com frequência nos registros e está associado a uma compreensão percebida média de ${metodo.compreensaoMedia!.toFixed(1)}/5. Vale observar se essa relação se repete em conteúdos de dificuldade parecida.`,
    resumoEvidencias: `${metodo.quantidadeCompreensoes} compreensão(ões) registrada(s) em ${metodo.quantidadeSessoes} sessão(ões).`,
    perguntaReflexiva: "Você percebeu essa diferença também?",
    experimentoSugerido: "Teste novamente em um conteúdo comparável e registre como foi recuperar o conteúdo sem consultar o material.",
    confianca: poucosDados ? "BAIXA" : metodo.quantidadeCompreensoes >= 5 ? "FORTE" : "MODERADA",
  };
}

function insightGeral(dto: DtoInterpretacao): InsightAprendizagem {
  const primeiroModulo = dto.modulos[0];
  return {
    tipo: "OBSERVACAO", titulo: "Sua base de observação foi atualizada",
    observacao: `Há ${dto.quantidadeSessoesValidas} sessão(ões) válida(s) no período. Os registros já permitem olhar recorrências de estudo, mas continuam descrevendo associações e percepções, sem mostrar que um método causou o resultado.`,
    resumoEvidencias: primeiroModulo ? `${primeiroModulo.referencia} reúne ${primeiroModulo.quantidadeSessoesValidas} sessão(ões) em ${primeiroModulo.diasComEstudo} dia(s).` : null,
    perguntaReflexiva: "O que você percebeu nas sessões mais recentes?",
    experimentoSugerido: "Continue registrando método, compreensão e dificuldade para comparar experiências parecidas.",
    confianca: dto.quantidadeSessoesValidas >= 5 ? "MODERADA" : "BAIXA",
  };
}

export function gerarRespostaLocal(dto: DtoInterpretacao, motivo: Exclude<MotivoContingencia, null>, tentativas: TentativaProvedor[] = []) {
  const insights = dto.quantidadeSessoesValidas === 0
    ? [insightSemDados()]
    : [...insightsDeAprendizagem(dto), insightDeEstrategia(dto)].filter((item): item is InsightAprendizagem => Boolean(item)).slice(0, 3);
  if (!insights.length) insights.push(insightGeral(dto));
  return montarInterpretacao({ insights }, "LOCAL", dto, { motivo, tentativas });
}
