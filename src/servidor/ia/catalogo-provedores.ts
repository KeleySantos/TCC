import type { ProvedorIa } from "@/gerado/prisma/enums";

export type DefinicaoProvedorIa = { provedor: ProvedorIa; nome: string; modelo: string; prioridade: number; descricao: string };

export const MODELO_GROQ_PADRAO = "openai/gpt-oss-20b";
export const MODELO_GEMINI_PADRAO = "gemini-3.8-flash";
export const MODELO_GEMINI_CONTINGENCIA = "gemini-3.7-flash";

function modeloAmbiente(nome: string, padrao: string) {
  const valor = process.env[nome]?.trim();
  return valor && /^[a-zA-Z0-9/._-]+$/.test(valor) ? valor : padrao;
}

export function obterProvedorPrincipal() {
  const configurado = process.env.AI_PRIMARY_PROVIDER?.trim().toUpperCase();
  return configurado === "GEMINI" || configurado === "GROQ" ? configurado : "GROQ";
}

export function montarCatalogoProvedores(): readonly DefinicaoProvedorIa[] {
  const principal = obterProvedorPrincipal();
  const secundarios = principal === "GROQ" ? ["GEMINI", "QWEN"] as const : ["GROQ", "QWEN"] as const;
  const ordem = [principal, ...secundarios] as ProvedorIa[];
  const definicoes: Record<ProvedorIa, Omit<DefinicaoProvedorIa, "prioridade">> = {
    GROQ: { provedor: "GROQ", nome: "Groq", modelo: modeloAmbiente("GROQ_MODEL", MODELO_GROQ_PADRAO), descricao: "Provider de insights com saída estruturada." },
    GEMINI: { provedor: "GEMINI", nome: "Gemini", modelo: modeloAmbiente("GEMINI_MODEL", MODELO_GEMINI_PADRAO), descricao: `Provider de insights com contingência em ${MODELO_GEMINI_CONTINGENCIA}.` },
    QWEN: { provedor: "QWEN", nome: "Qwen", modelo: modeloAmbiente("QWEN_MODEL", "qwen3.7-flash-2026-07-15"), descricao: "Provider legado preservado antes da contingência local." },
  };
  return ordem.map((provedor, indice) => ({ ...definicoes[provedor], prioridade: indice + 1 }));
}

export const PROVEDORES_IA = montarCatalogoProvedores();

export function obterDefinicaoProvedor(provedor: ProvedorIa) {
  return PROVEDORES_IA.find((item) => item.provedor === provedor)!;
}

export function contextoCredencial(usuarioId: string, provedor: ProvedorIa) {
  return `learning-lab:credencial-ia:v1:${usuarioId}:${provedor}`;
}
