// Gabaritos aritméticos definidos sem chamar os algoritmos sob teste.
export const referenciaTcc = new Date("2026-10-10T12:00:00Z");
export const cenariosTcc = [
  { id: "S1", nome: "Formato e método", medias: [60, 60, 60], tendencias: ["PONTO_DE_ATENCAO", "PONTO_DE_ATENCAO", "PONTO_DE_ATENCAO"] },
  { id: "S2", nome: "Contexto de módulo", medias: [80, 40, 60], tendencias: ["ESTAVEL", "ESTAVEL", "ESTAVEL"] },
  { id: "S3", nome: "Evolução", medias: [55, 55, 50], tendencias: ["EVOLUCAO_POSITIVA", "PONTO_DE_ATENCAO", "ESTAVEL"] },
  { id: "S4", nome: "Dados insuficientes", medias: [null, 50, 50], tendencias: ["DADOS_INSUFICIENTES", "DADOS_INSUFICIENTES", "DADOS_INSUFICIENTES"] },
  { id: "S5", nome: "Percepção × evidência", medias: [20, 90, 50], tendencias: ["ESTAVEL", "ESTAVEL", "ESTAVEL"] },
] as const;

export function percentualCenario(cenario: number, modulo: number, sessao: number) {
  if (cenario === 0) return sessao < 5 ? 80 : 40;
  if (cenario === 1) return [80, 40, 60][modulo];
  if (cenario === 2) return modulo === 0 ? (sessao + 1) * 10 : modulo === 1 ? 100 - sessao * 10 : 50;
  if (cenario === 3) return 50;
  return [20, 90, 50][modulo];
}
