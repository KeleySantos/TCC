import { createHmac, timingSafeEqual } from "node:crypto";

export const DURACAO_SESSAO_SEGUNDOS = 7 * 24 * 60 * 60;

function assinar(conteudo: string, chave: Buffer) {
  return createHmac("sha256", chave).update(`learning-lab:sessao:v1:${conteudo}`).digest();
}

export function criarTokenSessao(usuarioId: string, chave: Buffer, agora = new Date()) {
  const conteudo = Buffer.from(JSON.stringify({ usuarioId, expiraEm: agora.getTime() + DURACAO_SESSAO_SEGUNDOS * 1_000 })).toString("base64url");
  return `${conteudo}.${assinar(conteudo, chave).toString("base64url")}`;
}

export function validarTokenSessao(token: string, chave: Buffer, agora = new Date()): string | null {
  try {
    const [conteudo, assinatura, extra] = token.split(".");
    if (!conteudo || !assinatura || extra || token.length > 2_000) return null;
    const recebida = Buffer.from(assinatura, "base64url");
    const esperada = assinar(conteudo, chave);
    if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null;
    const dados: unknown = JSON.parse(Buffer.from(conteudo, "base64url").toString("utf8"));
    if (!dados || typeof dados !== "object" || !("usuarioId" in dados) || !("expiraEm" in dados)) return null;
    if (typeof dados.usuarioId !== "string" || !dados.usuarioId || typeof dados.expiraEm !== "number" || dados.expiraEm <= agora.getTime()) return null;
    return dados.usuarioId;
  } catch {
    return null;
  }
}
