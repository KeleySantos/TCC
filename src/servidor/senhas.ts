import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const TAMANHO_CHAVE = 64;

export function normalizarNomeUsuario(nomeUsuario: string) {
  return nomeUsuario.trim().toLowerCase();
}

export function criarHashSenha(senha: string) {
  const sal = randomBytes(16).toString("hex");
  const derivada = scryptSync(senha, sal, TAMANHO_CHAVE).toString("hex");
  return `${sal}:${derivada}`;
}

export function verificarSenha(senha: string, senhaHash: string) {
  const [sal, hashArmazenado] = senhaHash.split(":");
  if (!sal || !hashArmazenado) return false;
  try {
    const derivada = scryptSync(senha, sal, TAMANHO_CHAVE);
    const armazenada = Buffer.from(hashArmazenado, "hex");
    return armazenada.length === derivada.length && timingSafeEqual(armazenada, derivada);
  } catch {
    return false;
  }
}
