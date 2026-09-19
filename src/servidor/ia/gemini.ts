import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { ErroProvedorInterpretacao, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

const schemaResposta = {
  type: "object",
  properties: {
    padroesObservados: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    feedbacks: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    conselhos: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    perguntasReflexao: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
  },
  required: ["padroesObservados", "feedbacks", "conselhos", "perguntasReflexao"],
  additionalProperties: false,
} as const;

function criarInstrucao(dto: DtoInterpretacao) {
  return `Você interpreta indicadores de Learning Analytics para reflexão. Não calcule, não corrija, não altere dados e não invente valores. Descreva somente padrões observados no resumo. Nunca afirme causalidade, estilo de aprendizagem, diagnóstico, garantia, "melhor formato" ou prova. Responda em português do Brasil e somente com o JSON solicitado.\n\nResumo agregado e não identificável:\n${JSON.stringify(dto)}`;
}

function extrairTexto(resposta: unknown) {
  if (!resposta || typeof resposta !== "object") return null;
  const candidatos = (resposta as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidatos)) return null;
  const partes = (candidatos[0] as { content?: { parts?: Array<{ text?: unknown }> } } | undefined)?.content?.parts;
  const texto = partes?.map((parte) => typeof parte.text === "string" ? parte.text : "").join("");
  return texto || null;
}

export function criarProvedorGemini(apiKey: string, modelo = process.env.GEMINI_MODEL ?? "gemini-2.5-flash", tempoLimiteMs = 7_000): ProvedorInterpretacoes {
  const modeloSeguro = /^[a-zA-Z0-9._-]+$/.test(modelo) ? modelo : "gemini-2.5-flash";
  return {
    async interpretar(dto) {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), tempoLimiteMs);
      try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modeloSeguro}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: criarInstrucao(dto) }] }],
            generationConfig: { responseFormat: { text: { mimeType: "application/json", schema: schemaResposta } } },
          }),
          signal: controlador.signal,
        });
        if (resposta.status === 429) throw new ErroProvedorInterpretacao("COTA");
        if (!resposta.ok) throw new ErroProvedorInterpretacao("FALHA_EXTERNA");
        const texto = extrairTexto(await resposta.json());
        if (!texto) throw new ErroProvedorInterpretacao("FALHA_EXTERNA");
        try {
          return JSON.parse(texto) as unknown;
        } catch {
          return null;
        }
      } catch (erro) {
        if (erro instanceof ErroProvedorInterpretacao) throw erro;
        if (erro instanceof Error && erro.name === "AbortError") throw new ErroProvedorInterpretacao("TEMPO_ESGOTADO");
        throw new ErroProvedorInterpretacao("FALHA_EXTERNA");
      } finally {
        clearTimeout(temporizador);
      }
    },
  };
}
