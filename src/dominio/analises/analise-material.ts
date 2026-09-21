import { z } from "zod";

const textoCurto = z.string().trim().min(2).max(360);

export const esquemaResultadoAnaliseMaterial = z.object({
  resumo: z.string().trim().min(10).max(1_200),
  conceitos: z.array(z.string().trim().min(2).max(100)).min(1).max(15),
  pontosRevisao: z.array(textoCurto).min(1).max(5),
  metodosSugeridos: z.array(textoCurto).min(1).max(5),
  proximasSessoes: z.array(textoCurto).min(1).max(5),
  perguntasReflexao: z.array(textoCurto).min(1).max(5),
});

export type ResultadoAnaliseMaterial = z.infer<typeof esquemaResultadoAnaliseMaterial>;

const palavrasIgnoradas = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos", "e", "em", "entre", "era", "essa", "esse", "esta", "este", "foi", "mais", "mas", "na", "nas", "no", "nos", "o", "os", "ou", "para", "pela", "pelas", "pelo", "pelos", "por", "que", "se", "sem", "ser", "sua", "suas", "seu", "seus", "sao", "tambem", "tem", "uma", "um", "uns", "das", "dos", "the", "and", "for", "from", "this", "that", "with",
]);

export function normalizarConceito(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function gerarAnaliseMaterialLocal(texto: string): ResultadoAnaliseMaterial {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const frequencias = new Map<string, number>();
  for (const palavraOriginal of limpo.match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,}/gu) ?? []) {
    const palavra = normalizarConceito(palavraOriginal);
    if (palavra.length < 4 || palavrasIgnoradas.has(palavra) || /^\d+$/.test(palavra)) continue;
    frequencias.set(palavra, (frequencias.get(palavra) ?? 0) + 1);
  }
  const conceitos = [...frequencias.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .slice(0, 10)
    .map(([conceito]) => conceito);
  const conceitosValidos = conceitos.length ? conceitos : ["conteúdo do material"];
  const destaque = conceitosValidos.slice(0, 3).join(", ");
  return {
    resumo: limpo.length > 700 ? `${limpo.slice(0, 697)}...` : limpo,
    conceitos: conceitosValidos,
    pontosRevisao: [`Revise as relações entre os conceitos destacados: ${destaque}.`],
    metodosSugeridos: ["Use recuperação ativa para explicar os conceitos sem consultar o material.", "Registre uma sessão curta de revisão e descreva os conceitos praticados."],
    proximasSessoes: [`Planeje uma sessão para relacionar ${destaque}.`],
    perguntasReflexao: ["Quais relações entre os conceitos do material você consegue explicar com suas próprias palavras?"],
  };
}

export function compararConceitosComSessoes(conceitos: string[], sessoes: Array<{ id: string; descricao: string }>) {
  return conceitos.map((conceito) => {
    const normalizado = normalizarConceito(conceito);
    const encontrados = sessoes.filter((sessao) => ` ${normalizarConceito(sessao.descricao)} `.includes(` ${normalizado} `));
    return { conceito, quantidadeSessoes: encontrados.length, sessoes: encontrados.map((sessao) => sessao.id) };
  });
}
