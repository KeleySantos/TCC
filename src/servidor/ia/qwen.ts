import { criarProvedorOpenAiCompativel } from "./openai-compativel";

export function criarProvedorQwen(apiKey: string, modelo = "qwen3.7-flash-2026-07-15", tempoLimiteMs = 8_000) {
  return criarProvedorOpenAiCompativel({
    apiKey,
    endpoint: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelo,
    tempoLimiteMs,
    modoEstruturado: "JSON_OBJECT",
    camposExtras: { enable_thinking: false },
  });
}
