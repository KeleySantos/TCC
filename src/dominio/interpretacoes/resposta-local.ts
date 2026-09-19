import { montarInterpretacao, type DtoInterpretacao, type MotivoContingencia } from "./esquema";

export function gerarRespostaLocal(dto: DtoInterpretacao, motivo: Exclude<MotivoContingencia, null>) {
  const primeiroModulo = dto.modulos[0];
  const padrao = dto.quantidadeTentativas === 0
    ? "Ainda não há avaliações concluídas para descrever um padrão de resultado."
    : `Há ${dto.quantidadeTentativas} tentativa(s) concluída(s) em ${dto.quantidadeModulos} módulo(s), com ${dto.minutosValidos} minuto(s) de estudo válido registrado(s).`;
  const detalheModulo = primeiroModulo?.mediaNotas === null || !primeiroModulo
    ? "A amostra atual ainda não permite comparar resultados por módulo."
    : `${primeiroModulo.referencia} reúne ${primeiroModulo.quantidadeTentativas} tentativa(s) e média observada de ${Math.round(primeiroModulo.mediaNotas)}%.`;
  const recorrencia = dto.recorrencias.length
    ? `${dto.recorrencias.length} contexto(s) aparecem em dois ou mais módulos, sempre com a amostra indicada no painel.`
    : "Não há base em dois módulos para tratar um contexto como recorrente.";
  return montarInterpretacao({
    padroesObservados: [padrao, detalheModulo, recorrencia],
    feedbacks: ["Use os indicadores do módulo para observar a evolução no mesmo assunto antes de comparar contextos diferentes."],
    conselhos: ["Registre uma nova sessão válida, conclua uma avaliação comparável e revise a amostra atualizada."],
    perguntasReflexao: ["Qual ação de estudo você quer testar no próximo registro, mantendo o mesmo tópico para facilitar a comparação?"],
  }, "LOCAL", dto, motivo);
}
