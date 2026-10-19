import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { LIMITE_FOTO_PERFIL, prepararFotoPerfil } from "./foto-perfil";

describe("foto de perfil", () => {
  it("recodifica uma imagem válida em avatar WebP de 256 pixels", async () => {
    const original = await sharp({ create: { width: 12, height: 20, channels: 3, background: "#4388cc" } }).png().toBuffer();
    const foto = await prepararFotoPerfil(new File([new Uint8Array(original)], "foto.png", { type: "image/png" }));
    const metadados = await sharp(foto).metadata();
    expect(metadados).toMatchObject({ format: "webp", width: 256, height: 256 });
    expect(metadados.exif).toBeUndefined();
  });

  it("recusa arquivo falso, SVG e foto acima do limite", async () => {
    await expect(prepararFotoPerfil(new File(["arquivo falso"], "foto.png", { type: "image/png" }))).rejects.toThrow();
    await expect(prepararFotoPerfil(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'], "foto.png", { type: "image/png" }))).rejects.toThrow();
    await expect(prepararFotoPerfil(new File([new Uint8Array(LIMITE_FOTO_PERFIL + 1)], "foto.jpg", { type: "image/jpeg" }))).rejects.toThrow("FOTO_INVALIDA");
  });

  it("recusa MIME incompatível com o formato real", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();
    await expect(prepararFotoPerfil(new File([new Uint8Array(png)], "foto.jpg", { type: "image/jpeg" }))).rejects.toThrow("FOTO_INVALIDA");
  });
});
