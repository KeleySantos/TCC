import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { FormatoConteudo } from "@/gerado/prisma/enums";

export type CategoriaArquivoMaterial = "IMAGEM" | "DOCUMENTO" | "PLANILHA" | "AUDIO" | "VIDEO";

export type ArquivoMaterialValidado = {
  bytes: Uint8Array;
  categoria: CategoriaArquivoMaterial;
  extensaoNormalizada: string;
  formato: FormatoConteudo;
  nomeOriginal: string;
  tamanhoBytes: number;
  tipoMime: string;
};

type RegraArquivo = {
  categoria: CategoriaArquivoMaterial;
  extensao: string;
  formato: FormatoConteudo;
  limiteBytes: number;
  mimes: readonly string[];
  assinaturaValida: (bytes: Uint8Array) => boolean;
};

const MIB = 1024 * 1024;
export const LIMITE_MAXIMO_CORPO_UPLOAD = 101 * MIB;
const cabecalho = (bytes: Uint8Array, valores: number[], inicio = 0) => valores.every((valor, indice) => bytes[inicio + indice] === valor);
const textoNoInicio = (bytes: Uint8Array, texto: string, inicio = 0) => cabecalho(bytes, [...Buffer.from(texto, "ascii")], inicio);
const eZip = (bytes: Uint8Array) => cabecalho(bytes, [0x50, 0x4b, 0x03, 0x04]);
const eIsoBaseMedia = (bytes: Uint8Array) => bytes.length >= 12 && textoNoInicio(bytes, "ftyp", 4);

function nomesDoDiretorioCentralZip(bytes: Uint8Array) {
  for (let indice = bytes.length - 22; indice >= Math.max(0, bytes.length - 65_557); indice -= 1) {
    if (!cabecalho(bytes, [0x50, 0x4b, 0x05, 0x06], indice)) continue;
    const tamanhoDiretorio = bytes[indice + 12] | (bytes[indice + 13] << 8) | (bytes[indice + 14] << 16) | (bytes[indice + 15] << 24);
    const deslocamento = bytes[indice + 16] | (bytes[indice + 17] << 8) | (bytes[indice + 18] << 16) | (bytes[indice + 19] << 24);
    if (deslocamento < 0 || tamanhoDiretorio < 0 || deslocamento + tamanhoDiretorio > bytes.length) return [];
    const nomes: string[] = [];
    let cursor = deslocamento;
    while (cursor + 46 <= deslocamento + tamanhoDiretorio && cabecalho(bytes, [0x50, 0x4b, 0x01, 0x02], cursor)) {
      const tamanhoNome = bytes[cursor + 28] | (bytes[cursor + 29] << 8);
      const tamanhoExtra = bytes[cursor + 30] | (bytes[cursor + 31] << 8);
      const tamanhoComentario = bytes[cursor + 32] | (bytes[cursor + 33] << 8);
      const inicioNome = cursor + 46;
      const fimNome = inicioNome + tamanhoNome;
      if (fimNome > bytes.length) return [];
      nomes.push(Buffer.from(bytes.subarray(inicioNome, fimNome)).toString("utf8"));
      cursor = fimNome + tamanhoExtra + tamanhoComentario;
    }
    return nomes;
  }
  return [];
}

function zipContem(bytes: Uint8Array, exigidos: (nomes: string[]) => boolean) {
  return eZip(bytes) && exigidos(nomesDoDiretorioCentralZip(bytes));
}

function odfTemMime(bytes: Uint8Array, mimeEsperado: string) {
  if (!eZip(bytes) || !textoNoInicio(bytes, "mimetype", 30)) return false;
  const tamanhoNome = bytes[26] | (bytes[27] << 8);
  const tamanhoExtra = bytes[28] | (bytes[29] << 8);
  const tamanhoCompactado = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
  const metodoCompactacao = bytes[8] | (bytes[9] << 8);
  const inicioConteudo = 30 + tamanhoNome + tamanhoExtra;
  return metodoCompactacao === 0 && tamanhoCompactado === mimeEsperado.length && Buffer.from(bytes.subarray(inicioConteudo, inicioConteudo + tamanhoCompactado)).toString("ascii") === mimeEsperado;
}

const regras: RegraArquivo[] = [
  { categoria: "IMAGEM", extensao: "png", formato: FormatoConteudo.IMAGEM, limiteBytes: 10 * MIB, mimes: ["image/png"], assinaturaValida: (bytes) => cabecalho(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { categoria: "IMAGEM", extensao: "jpg", formato: FormatoConteudo.IMAGEM, limiteBytes: 10 * MIB, mimes: ["image/jpeg"], assinaturaValida: (bytes) => cabecalho(bytes, [0xff, 0xd8, 0xff]) },
  { categoria: "IMAGEM", extensao: "jpeg", formato: FormatoConteudo.IMAGEM, limiteBytes: 10 * MIB, mimes: ["image/jpeg"], assinaturaValida: (bytes) => cabecalho(bytes, [0xff, 0xd8, 0xff]) },
  { categoria: "IMAGEM", extensao: "webp", formato: FormatoConteudo.IMAGEM, limiteBytes: 10 * MIB, mimes: ["image/webp"], assinaturaValida: (bytes) => textoNoInicio(bytes, "RIFF") && textoNoInicio(bytes, "WEBP", 8) },
  { categoria: "IMAGEM", extensao: "gif", formato: FormatoConteudo.IMAGEM, limiteBytes: 10 * MIB, mimes: ["image/gif"], assinaturaValida: (bytes) => textoNoInicio(bytes, "GIF87a") || textoNoInicio(bytes, "GIF89a") },
  { categoria: "DOCUMENTO", extensao: "pdf", formato: FormatoConteudo.PDF, limiteBytes: 25 * MIB, mimes: ["application/pdf"], assinaturaValida: (bytes) => textoNoInicio(bytes, "%PDF-") },
  { categoria: "DOCUMENTO", extensao: "txt", formato: FormatoConteudo.TEXTO, limiteBytes: 5 * MIB, mimes: ["text/plain"], assinaturaValida: (bytes) => !bytes.includes(0) },
  { categoria: "DOCUMENTO", extensao: "doc", formato: FormatoConteudo.DOCUMENTO, limiteBytes: 25 * MIB, mimes: ["application/msword"], assinaturaValida: (bytes) => cabecalho(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
  { categoria: "DOCUMENTO", extensao: "docx", formato: FormatoConteudo.DOCUMENTO, limiteBytes: 25 * MIB, mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], assinaturaValida: (bytes) => zipContem(bytes, (nomes) => nomes.includes("[Content_Types].xml") && nomes.some((nome) => nome.startsWith("word/"))) },
  { categoria: "DOCUMENTO", extensao: "odt", formato: FormatoConteudo.DOCUMENTO, limiteBytes: 25 * MIB, mimes: ["application/vnd.oasis.opendocument.text"], assinaturaValida: (bytes) => odfTemMime(bytes, "application/vnd.oasis.opendocument.text") },
  { categoria: "PLANILHA", extensao: "csv", formato: FormatoConteudo.PLANILHA, limiteBytes: 25 * MIB, mimes: ["text/csv", "application/csv"], assinaturaValida: (bytes) => !bytes.includes(0) },
  { categoria: "PLANILHA", extensao: "xls", formato: FormatoConteudo.PLANILHA, limiteBytes: 25 * MIB, mimes: ["application/vnd.ms-excel"], assinaturaValida: (bytes) => cabecalho(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
  { categoria: "PLANILHA", extensao: "xlsx", formato: FormatoConteudo.PLANILHA, limiteBytes: 25 * MIB, mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], assinaturaValida: (bytes) => zipContem(bytes, (nomes) => nomes.includes("[Content_Types].xml") && nomes.some((nome) => nome.startsWith("xl/"))) },
  { categoria: "PLANILHA", extensao: "ods", formato: FormatoConteudo.PLANILHA, limiteBytes: 25 * MIB, mimes: ["application/vnd.oasis.opendocument.spreadsheet"], assinaturaValida: (bytes) => odfTemMime(bytes, "application/vnd.oasis.opendocument.spreadsheet") },
  { categoria: "AUDIO", extensao: "mp3", formato: FormatoConteudo.AUDIO, limiteBytes: 50 * MIB, mimes: ["audio/mpeg"], assinaturaValida: (bytes) => textoNoInicio(bytes, "ID3") || (bytes.length > 1 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) },
  { categoria: "AUDIO", extensao: "wav", formato: FormatoConteudo.AUDIO, limiteBytes: 50 * MIB, mimes: ["audio/wav", "audio/x-wav"], assinaturaValida: (bytes) => textoNoInicio(bytes, "RIFF") && textoNoInicio(bytes, "WAVE", 8) },
  { categoria: "AUDIO", extensao: "ogg", formato: FormatoConteudo.AUDIO, limiteBytes: 50 * MIB, mimes: ["audio/ogg"], assinaturaValida: (bytes) => textoNoInicio(bytes, "OggS") },
  { categoria: "AUDIO", extensao: "m4a", formato: FormatoConteudo.AUDIO, limiteBytes: 50 * MIB, mimes: ["audio/mp4", "audio/x-m4a"], assinaturaValida: (bytes) => eIsoBaseMedia(bytes) && (textoNoInicio(bytes, "M4A ", 8) || textoNoInicio(bytes, "isom", 8)) },
  { categoria: "VIDEO", extensao: "mp4", formato: FormatoConteudo.VIDEO, limiteBytes: 100 * MIB, mimes: ["video/mp4"], assinaturaValida: eIsoBaseMedia },
  { categoria: "VIDEO", extensao: "webm", formato: FormatoConteudo.VIDEO, limiteBytes: 100 * MIB, mimes: ["video/webm"], assinaturaValida: (bytes) => cabecalho(bytes, [0x1a, 0x45, 0xdf, 0xa3]) },
  { categoria: "VIDEO", extensao: "mov", formato: FormatoConteudo.VIDEO, limiteBytes: 100 * MIB, mimes: ["video/quicktime"], assinaturaValida: (bytes) => eIsoBaseMedia(bytes) && textoNoInicio(bytes, "qt  ", 8) },
];

export const LIMITES_ARQUIVOS_MATERIAIS = Object.freeze(
  regras.reduce<Record<string, number>>((limites, regra) => ({ ...limites, [regra.extensao]: regra.limiteBytes }), {}),
);

function diretorioArmazenamento() {
  const configurado = process.env.DIRETORIO_ARQUIVOS_MATERIAIS;
  return configurado
    ? resolve(/* turbopackIgnore: true */ configurado)
    : join(process.cwd(), ".dados", "arquivos-materiais");
}

function caminhoSeguro(chaveArmazenamento: string) {
  if (!/^[a-f0-9-]{36}$/.test(chaveArmazenamento)) throw new Error("Chave de armazenamento inválida.");
  const diretorio = diretorioArmazenamento();
  const caminho = resolve(diretorio, chaveArmazenamento);
  if (!caminho.startsWith(`${diretorio}\\`) && !caminho.startsWith(`${diretorio}/`)) throw new Error("Caminho de armazenamento inválido.");
  return caminho;
}

export async function validarArquivoMaterial(arquivo: File): Promise<ArquivoMaterialValidado> {
  if (!arquivo || !arquivo.name || /[\\/]|\.\.|[\u0000-\u001f]/.test(arquivo.name)) throw new Error("Nome de arquivo inválido.");
  const extensaoNormalizada = extname(arquivo.name).slice(1).toLowerCase();
  const regra = regras.find((item) => item.extensao === extensaoNormalizada);
  if (!regra || !regra.mimes.includes(arquivo.type)) throw new Error("Extensão ou MIME não permitido.");
  if (!Number.isSafeInteger(arquivo.size) || arquivo.size <= 0 || arquivo.size > regra.limiteBytes) throw new Error("Tamanho de arquivo inválido.");
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  if (bytes.byteLength !== arquivo.size || !regra.assinaturaValida(bytes)) throw new Error("Assinatura de arquivo inválida.");
  return { bytes, categoria: regra.categoria, extensaoNormalizada, formato: regra.formato, nomeOriginal: arquivo.name, tamanhoBytes: arquivo.size, tipoMime: arquivo.type };
}

export function criarChaveArmazenamentoArquivo() {
  return randomUUID();
}

export async function gravarArquivoMaterial(chaveArmazenamento: string, bytes: Uint8Array) {
  const diretorio = diretorioArmazenamento();
  await mkdir(diretorio, { recursive: true });
  await writeFile(caminhoSeguro(chaveArmazenamento), bytes, { flag: "wx" });
}

export async function lerArquivoMaterial(chaveArmazenamento: string) {
  try {
    return await readFile(/* turbopackIgnore: true */ caminhoSeguro(chaveArmazenamento));
  } catch (erro) {
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "ENOENT") return null;
    throw erro;
  }
}

export async function removerArquivoMaterial(chaveArmazenamento: string) {
  await rm(caminhoSeguro(chaveArmazenamento), { force: true });
}
