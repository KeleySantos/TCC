import { criarProvedorOpenAiCompativel } from "./openai-compativel";

export function criarProvedorGroq(apiKey: string, modelo = "openai/gpt-oss-20b", tempoLimiteMs = 8_000) {
  return criarProvedorOpenAiCompativel({
    apiKey,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelo,
    tempoLimiteMs,
    modoEstruturado: "JSON_SCHEMA",
  });
}
