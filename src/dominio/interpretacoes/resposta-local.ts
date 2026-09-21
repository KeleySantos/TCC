import { montarInterpretacao, type DtoInterpretacao, type MotivoContingencia, type TentativaProvedor } from "./esquema";

export function gerarRespostaLocal(dto: DtoInterpretacao, motivo: Exclude<MotivoContingencia, null>, tentativas: TentativaProvedor[] = []) {
  const primeiroModulo = dto.modulos[0];
  const padrao = dto.quantidadeSessoesValidas === 0
    ? "Ainda não há sessões concluídas válidas para descrever um padrão de estudo."
    : `Há ${dto.quantidadeSessoesValidas} sessão(ões) válida(s) em ${dto.quantidadeModulos} módulo(s), somando ${dto.minutosValidos} minuto(s) de estudo.`;
  const detalheModulo = !primeiroModulo
    ? "A amostra atual ainda não permite apresentar detalhes por módulo."
    : `${primeiroModulo.referencia} reúne ${primeiroModulo.quantidadeSessoesValidas} sessão(ões) válida(s), distribuída(s) por ${primeiroModulo.diasComEstudo} dia(s) de estudo.`;
  const contexto = primeiroModulo?.metodos[0]
    ? `O contexto de método mais frequente no resumo é ${primeiroModulo.metodos[0].contexto}, com ${primeiroModulo.metodos[0].quantidadeSessoes} registro(s); isso é apenas uma descrição, não uma comparação de eficácia.`
    : "Ainda não há contexto de método suficiente para destacar recorrências.";
  return montarInterpretacao({
    padroesObservados: [padrao, detalheModulo, contexto],
    feedbacks: ["Observe o período, a quantidade de sessões e as percepções antes de interpretar qualquer mudança como tendência."],
    conselhos: ["Continue registrando sessões com descrições claras, métodos, formatos e percepções para ampliar a base observada."],
    perguntasReflexao: ["O que você percebeu nas sessões recentes e o que gostaria de experimentar no próximo registro?"],
  }, "LOCAL", dto, { motivo, tentativas });
}
