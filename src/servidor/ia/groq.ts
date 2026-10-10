import { criarProvedorOpenAiCompativel } from "./openai-compativel";
import { MODELO_GROQ_PADRAO } from "./catalogo-provedores";

export function criarProvedorGroq(apiKey: string, modelo = MODELO_GROQ_PADRAO, tempoLimiteMs = 12_000) {
  return criarProvedorOpenAiCompativel({
    apiKey,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelo,
    tempoLimiteMs,
    modoEstruturado: "JSON_SCHEMA",
    camposExtras: { reasoning_effort: "low" },
  });
}
