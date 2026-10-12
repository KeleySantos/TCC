import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const dependencias = vi.hoisted(() => ({ usuario: vi.fn(), processar: vi.fn(), revalidar: vi.fn() }));
vi.mock("@/servidor/autenticacao", () => ({ obterUsuarioAtual: dependencias.usuario }));
vi.mock("@/servidor/analises-materiais", () => ({ processarAnaliseMaterial: dependencias.processar }));
vi.mock("@/servidor/modulos", () => ({ ErroModulo: class extends Error { codigo = "NAO_ENCONTRADO"; } }));
vi.mock("next/cache", () => ({ revalidatePath: dependencias.revalidar }));

describe("registro de evidência pela análise do material", () => {
  beforeEach(() => vi.resetAllMocks());
  it("invalida módulo e Dashboard após processar e responde sem cache", async () => {
    dependencias.usuario.mockResolvedValue({ id: "u1", nome: "Sintético", nomeUsuario: "sintetico", email: null });
    dependencias.processar.mockResolvedValue({ situacao: "CONCLUIDA" });
    const resposta = await POST(new Request("http://localhost/api/materiais/m1/analise", { method: "POST" }), { params: Promise.resolve({ id: "m1" }) });
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("Cache-Control")).toBe("no-store");
    expect(dependencias.revalidar).toHaveBeenCalledWith("/dashboard");
    expect(dependencias.revalidar).toHaveBeenCalledWith("/modulos/[identificador]", "page");
  });
  it("recusa solicitação sem sessão", async () => {
    dependencias.usuario.mockResolvedValue(null);
    const resposta = await POST(new Request("http://localhost/api/materiais/m1/analise", { method: "POST" }), { params: Promise.resolve({ id: "m1" }) });
    expect(resposta.status).toBe(401);
    expect(dependencias.processar).not.toHaveBeenCalled();
    expect(dependencias.revalidar).not.toHaveBeenCalled();
  });
});
