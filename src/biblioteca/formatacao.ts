const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
});

export function formatarPorcentagem(valor: number | null | undefined) {
  return valor === null || valor === undefined || Number.isNaN(valor) ? "—" : `${Math.round(valor)}%`;
}

export function formatarData(valor: Date | null | undefined) {
  return valor ? formatadorData.format(valor) : "—";
}

export function formatarFormato(formato: string) {
  const rotulos: Record<string, string> = {
    VIDEO: "Vídeo",
    PDF: "PDF",
    TEXTO: "Texto",
    MAPA_MENTAL: "Mapa mental",
    PODCAST: "Podcast",
    QUIZ: "Quiz",
    EXERCICIO_PRATICO: "Exercício prático",
  };
  return rotulos[formato] ?? formato;
}
