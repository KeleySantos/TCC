import sharp from "sharp";

export const LIMITE_FOTO_PERFIL = 2 * 1024 * 1024;

export async function prepararFotoPerfil(arquivo: File) {
  if (!arquivo.size || arquivo.size > LIMITE_FOTO_PERFIL || !["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) throw new Error("FOTO_INVALIDA");
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const imagem = sharp(bytes, { limitInputPixels: 16_000_000, failOn: "error" });
  const metadados = await imagem.metadata();
  const formatos: Record<string, string> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
  if (metadados.format !== formatos[arquivo.type] || !metadados.width || !metadados.height) throw new Error("FOTO_INVALIDA");
  // A recodificação valida a imagem e remove metadados; SVG e animações não entram.
  return imagem.rotate().resize(256, 256, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
}
