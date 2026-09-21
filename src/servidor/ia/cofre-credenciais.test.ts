import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cifrarCredencial, decifrarCredencial } from "./cofre-credenciais";

describe("cofre de credenciais de IA", () => {
  it("cifra com AES-256-GCM e só abre no mesmo contexto", () => {
    const chaveMestra = randomBytes(32);
    const segredoOriginal = "chave-ficticia-que-nao-deve-aparecer-em-texto-puro";
    const cifrado = cifrarCredencial(segredoOriginal, "conta-a:GROQ", chaveMestra);
    expect(JSON.stringify(cifrado)).not.toContain(segredoOriginal);
    expect(decifrarCredencial(cifrado, "conta-a:GROQ", chaveMestra)).toBe(segredoOriginal);
    expect(() => decifrarCredencial(cifrado, "conta-b:GROQ", chaveMestra)).toThrow();
  });

  it("detecta qualquer alteração no conteúdo autenticado", () => {
    const chaveMestra = randomBytes(32);
    const cifrado = cifrarCredencial("chave-ficticia", "conta:GEMINI", chaveMestra);
    const adulterado = { ...cifrado, chaveCifrada: Buffer.from("adulterado").toString("base64") };
    expect(() => decifrarCredencial(adulterado, "conta:GEMINI", chaveMestra)).toThrow();
  });
});
