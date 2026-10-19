import type { ProvedorIa } from "@/gerado/prisma/enums";

export type ProvedorIaAtivo = Extract<ProvedorIa, "GROQ">;
export type DefinicaoProvedorIa = { provedor: ProvedorIaAtivo; nome: string; modelo: string; prioridade: number; descricao: string };

export const MODELO_GROQ_PADRAO = "openai/gpt-oss-20b";

function modeloAmbiente(nome: string, padrao: string) {
  const valor = process.env[nome]?.trim();
  return valor && /^[a-zA-Z0-9/._-]+$/.test(valor) ? valor : padrao;
}

export function montarCatalogoProvedores(): readonly DefinicaoProvedorIa[] {
  return [{
    provedor: "GROQ",
    nome: "Groq",
    modelo: modeloAmbiente("GROQ_MODEL", MODELO_GROQ_PADRAO),
    prioridade: 1,
    descricao: "Provedor externo de insights com saída estruturada.",
  }];
}

export const PROVEDORES_IA = montarCatalogoProvedores();

export function obterDefinicaoProvedor(provedor: ProvedorIaAtivo) {
  return PROVEDORES_IA.find((item) => item.provedor === provedor)!;
}

export function contextoCredencial(usuarioId: string, provedor: ProvedorIaAtivo) {
  return `learning-lab:credencial-ia:v1:${usuarioId}:${provedor}`;
}
