import { afterEach, describe, expect, it, vi } from "vitest";
import { analisarTextoMaterial } from "./analise-materiais";

vi.mock("./configuracoes", () => ({
  listarCredenciaisAtivas: vi.fn().mockResolvedValue([]),
  registrarEstadoConfiguracaoIa: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => vi.unstubAllGlobals());

describe("análise externa de materiais", () => {
  it("ignora credenciais legadas e usa a contingência local sem chamar outra API", async () => {
    const buscar = vi.fn();
    vi.stubGlobal("fetch", buscar);

    const resultado = await analisarTextoMaterial("conta-com-configuracao-legada", "Algoritmos organizam dados e operações.", false, {
      credenciais: [{ provedor: "PROVEDOR_REMOVIDO", modelo: "modelo-legado", chave: "chave-legada-ficticia" }] as never,
    });

    expect(buscar).not.toHaveBeenCalled();
    expect(resultado).toMatchObject({ origem: "LOCAL", modelo: null });
  });
});
