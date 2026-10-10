import { describe, expect, it } from "vitest";
import { validarArquivoMaterial } from "./arquivos-materiais";

describe("arquivos aceitos como materiais", () => {
  it.each([
    ["audio.mp3", "audio/mpeg", new Uint8Array([0x49, 0x44, 0x33, 0x04])],
    ["video.mp4", "video/mp4", new Uint8Array([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])],
  ])("rejeita mídia de áudio ou vídeo: %s", async (nome, tipo, conteudo) => {
    await expect(validarArquivoMaterial(new File([conteudo], nome, { type: tipo }))).rejects.toThrow("Extensão ou MIME não permitido");
  });
});
