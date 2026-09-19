import "dotenv/config";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { OrigemMaterial } from "../src/gerado/prisma/enums";
import { atualizarMaterialPessoal, criarMaterialComArquivoPessoal, criarModuloPessoal, criarTopicoPessoal, ErroModulo } from "../src/servidor/modulos";
import { removerArquivoMaterial } from "../src/servidor/arquivos-materiais";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });
const diretorioArquivos = resolve(process.cwd(), ".dados", "arquivos-materiais");

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de arquivos de materiais falhou: ${mensagem}`);
}

function arquivo(nome: string, tipoMime: string, bytes: number[] | string) {
  return new File([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], nome, { type: tipoMime });
}

async function quantidadeArquivosFisicos() {
  try {
    return (await readdir(diretorioArquivos)).length;
  } catch {
    return 0;
  }
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const sufixo = Date.now().toString(36);
  let moduloId: string | null = null;
  const chavesArmazenadas: string[] = [];
  try {
    const modulo = await criarModuloPessoal(ana.id, { titulo: `Arquivos de teste ${sufixo}`, descricao: "Módulo temporário para validar armazenamento autenticado." });
    moduloId = modulo.id;
    const topico = await criarTopicoPessoal(ana.id, { moduloId: modulo.id, titulo: "Arquivos válidos", descricao: "Tópico temporário para arquivos sintéticos." });
    const casos = [
      { titulo: "Imagem", arquivo: arquivo("imagem.png", "image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
      { titulo: "Documento", arquivo: arquivo("documento.pdf", "application/pdf", "%PDF-1.7\n") },
      { titulo: "Planilha", arquivo: arquivo("dados.csv", "text/csv", "coluna,valor\na,1\n") },
      { titulo: "Áudio", arquivo: arquivo("audio.mp3", "audio/mpeg", [0x49, 0x44, 0x33, 0x04]) },
      { titulo: "Vídeo", arquivo: arquivo("video.mp4", "video/mp4", [0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]) },
    ];
    for (const caso of casos) await criarMaterialComArquivoPessoal(ana.id, { topicoId: topico.id, titulo: caso.titulo, descricao: `Arquivo sintético válido de ${caso.titulo.toLowerCase()}.`, minutosEstimados: 10 }, caso.arquivo);
    const materiais = await prisma.recursoConteudo.findMany({ where: { topicoId: topico.id }, include: { arquivo: true }, orderBy: { titulo: "asc" } });
    afirmar(materiais.length === casos.length && materiais.every((material) => material.origem === OrigemMaterial.ARQUIVO && material.arquivo !== null), "cada categoria deve persistir metadados de arquivo e origem explícita.");
    chavesArmazenadas.push(...materiais.map((material) => material.arquivo!.chaveArmazenamento));
    await atualizarMaterialPessoal(ana.id, materiais[0].id, { titulo: materiais[0].titulo, descricao: materiais[0].descricao, formato: materiais[0].formato, minutosEstimados: 10, conteudoTexto: "Conversão indevida", url: "" })
      .then(() => { throw new Error("arquivo foi convertido sem operação explícita"); })
      .catch((erro: unknown) => afirmar(erro instanceof ErroModulo && erro.codigo === "DADOS_INVALIDOS", "edição comum não pode converter arquivo em texto ou link."));

    const fisicosAntesDaFalha = await quantidadeArquivosFisicos();
    for (const candidato of [
      arquivo("invasao.png", "image/png", [0x4d, 0x5a, 0x90]),
      arquivo("macro.docm", "application/vnd.ms-word", [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      arquivo("../travessia.pdf", "application/pdf", "%PDF-1.7\n"),
      arquivo("grande.png", "image/png", new Uint8Array(10 * 1024 * 1024 + 1)),
    ]) {
      await criarMaterialComArquivoPessoal(ana.id, { topicoId: topico.id, titulo: `Inválido ${Math.random()}`, descricao: "Arquivo que deve ser rejeitado pela validação de segurança.", minutosEstimados: 10 }, candidato)
        .then(() => { throw new Error("arquivo inválido foi aceito"); })
        .catch((erro: unknown) => afirmar(erro instanceof ErroModulo && erro.codigo === "ARQUIVO_INVALIDO", "extensão, MIME, assinatura, macro ou travessia devem ser rejeitados."));
    }
    await criarMaterialComArquivoPessoal(ana.id, { topicoId: topico.id, titulo: "Imagem", descricao: "Título duplicado que não deve gerar arquivo órfão.", minutosEstimados: 10 }, arquivo("outra.png", "image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      .then(() => { throw new Error("duplicidade foi aceita"); })
      .catch((erro: unknown) => afirmar(erro instanceof ErroModulo && erro.codigo === "IDENTIFICADOR_DUPLICADO", "duplicidade deve ser rejeitada antes de persistir arquivo."));
    afirmar(await quantidadeArquivosFisicos() === fisicosAntesDaFalha, "falhas de validação ou persistência antecipada não podem deixar arquivo físico órfão.");

    let bloqueouOutraConta = false;
    try {
      await criarMaterialComArquivoPessoal(bruno.id, { topicoId: topico.id, titulo: "Tentativa indevida", descricao: "Outra conta não pode anexar material no tópico alheio.", minutosEstimados: 10 }, arquivo("indevido.png", "image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    } catch (erro) {
      bloqueouOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouOutraConta, "outra conta não pode enviar arquivo para tópico alheio.");
    console.log("Arquivos de materiais verificados: categorias, assinatura, MIME, limites lógicos, propriedade e limpeza.");
  } finally {
    await Promise.all(chavesArmazenadas.map((chave) => removerArquivoMaterial(chave)));
    if (moduloId) {
      await prisma.recursoConteudo.deleteMany({ where: { topico: { moduloId } } });
      await prisma.topico.deleteMany({ where: { moduloId } });
      await prisma.moduloAprendizagem.deleteMany({ where: { id: moduloId } });
    }
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
