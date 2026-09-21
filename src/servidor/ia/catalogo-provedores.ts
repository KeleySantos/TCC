import type { ProvedorIa } from "@/gerado/prisma/enums";

export type DefinicaoProvedorIa = {
  provedor: ProvedorIa;
  nome: string;
  modelo: string;
  prioridade: number;
  descricao: string;
};

export const PROVEDORES_IA: readonly DefinicaoProvedorIa[] = [
  { provedor: "GROQ", nome: "Groq", modelo: "openai/gpt-oss-20b", prioridade: 1, descricao: "Primeira tentativa da fila." },
  { provedor: "GEMINI", nome: "Gemini", modelo: "gemini-3.8-flash", prioridade: 2, descricao: "Segundo provedor; usa Gemini 3.8 Flash com contingência no 3.7 Flash." },
  { provedor: "QWEN", nome: "Qwen", modelo: "qwen3.7-flash-2026-07-15", prioridade: 3, descricao: "Terceiro provedor antes da contingência local." },
] as const;

export function obterDefinicaoProvedor(provedor: ProvedorIa) {
  return PROVEDORES_IA.find((item) => item.provedor === provedor)!;
}

export function contextoCredencial(usuarioId: string, provedor: ProvedorIa) {
  return `learning-lab:credencial-ia:v1:${usuarioId}:${provedor}`;
}
