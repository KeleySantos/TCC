import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import sharp from "sharp";
import { criarMaterialComArquivoPessoal, criarModuloPessoal, ErroModulo } from "../src/servidor/modulos";
import { excluirMaterialPermanentemente, obterPainelConceitosModulo, processarAnaliseMaterial, substituirArquivoMaterial } from "../src/servidor/analises-materiais";
import { lerArquivoMaterial, removerArquivoMaterial } from "../src/servidor/arquivos-materiais";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de análise de materiais falhou: ${mensagem}`);
}

function arquivo(nome: string, mime: string, conteudo: string | Uint8Array) {
  return new File([conteudo], nome, { type: mime });
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const modulo = await criarModuloPessoal(ana.id, { titulo: `Análise automática ${Date.now()}`, descricao: "Módulo sintético temporário para análise de materiais." });
  let chaveAtual: string | null = null;
  try {
    const material = await criarMaterialComArquivoPessoal(ana.id, { moduloId: modulo.id, titulo: "Algoritmos", descricao: "Material sintético de algoritmos.", minutosEstimados: 10 }, arquivo("algoritmos.txt", "text/plain", "Algoritmos organizam dados. Algoritmos de ordenação comparam dados, estruturas e resultados."));
    afirmar(material.analise?.situacao === "PENDENTE", "TXT deve iniciar pendente.");
    await processarAnaliseMaterial(bruno.id, material.id, { credenciais: [] }).then(() => { throw new Error("outra conta processou o material"); }).catch((erro: unknown) => afirmar(erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO", "outra conta deve receber indisponibilidade."));
    const concluida = await processarAnaliseMaterial(ana.id, material.id, { credenciais: [] });
    afirmar(concluida.situacao === "CONCLUIDA" && concluida.origem === "LOCAL", "contingência local deve concluir sem chave.");
    const persistida = await prisma.analiseMaterial.findUniqueOrThrow({ where: { recursoId: material.id } });
    afirmar(JSON.parse(persistida.conceitosJson).includes("algoritmos"), "conceitos precisam ser persistidos.");
    afirmar(!("textoExtraido" in persistida), "texto integral não pode ser persistido.");

    await prisma.sessaoEstudo.create({ data: { usuarioId: ana.id, moduloId: modulo.id, descricao: "Pratiquei algoritmos de ordenação.", modoRegistro: "MANUAL", iniciadaEm: new Date("2026-01-01T10:00:00Z"), encerradaEm: new Date("2026-01-01T10:20:00Z"), duracaoMinutos: 20, situacao: "CONCLUIDA", dificuldadePercebida: 3, compreensaoPercebida: 4 } });
    const painel = await obterPainelConceitosModulo(ana.id, modulo.id);
    afirmar(painel.comparacao.some((item) => item.conceito === "algoritmos" && item.quantidadeSessoes === 1), "descrição da sessão deve ser comparada aos conceitos.");

    const antes = await prisma.arquivoMaterial.findUniqueOrThrow({ where: { recursoId: material.id } });
    const substituicao = await substituirArquivoMaterial(ana.id, material.id, arquivo("estruturas.csv", "text/csv", "conceito,descricao\nestruturas,estruturas de dados\nestruturas,organização"));
    afirmar(substituicao.analisar, "CSV substituto deve iniciar nova análise.");
    afirmar(await lerArquivoMaterial(antes.chaveArmazenamento) === null, "arquivo anterior deve ser removido fisicamente.");
    const novaAnalise = await prisma.analiseMaterial.findUniqueOrThrow({ where: { recursoId: material.id } });
    afirmar(novaAnalise.situacao === "PENDENTE" && novaAnalise.resumo === null, "substituição deve invalidar resultado anterior.");
    await processarAnaliseMaterial(ana.id, material.id, { credenciais: [] });
    chaveAtual = (await prisma.arquivoMaterial.findUniqueOrThrow({ where: { recursoId: material.id } })).chaveArmazenamento;
    await excluirMaterialPermanentemente(ana.id, material.id);
    afirmar(await prisma.recursoConteudo.findUnique({ where: { id: material.id } }) === null, "exclusão deve remover material e análise em cascata.");
    afirmar(await lerArquivoMaterial(chaveAtual) === null, "exclusão deve remover o arquivo físico.");
    chaveAtual = null;

    const audio = await criarMaterialComArquivoPessoal(ana.id, { moduloId: modulo.id, titulo: "Áudio", descricao: "Material não analisado nesta fase.", minutosEstimados: 10 }, arquivo("audio.mp3", "audio/mpeg", new Uint8Array([0x49, 0x44, 0x33, 0x04])));
    chaveAtual = (await prisma.arquivoMaterial.findUniqueOrThrow({ where: { recursoId: audio.id } })).chaveArmazenamento;
    afirmar(audio.analise?.situacao === "NAO_SUPORTADA", "áudio não deve entrar na análise desta fase.");
    await excluirMaterialPermanentemente(ana.id, audio.id);
    chaveAtual = null;

    const imagemBytes = await sharp(Buffer.from('<svg width="900" height="220"><rect width="100%" height="100%" fill="white"/><text x="35" y="130" font-size="64" fill="black">Algoritmos e estruturas de dados</text></svg>')).png().toBuffer();
    const imagem = await criarMaterialComArquivoPessoal(ana.id, { moduloId: modulo.id, titulo: "Imagem com texto", descricao: "Imagem sintética para validar OCR local.", minutosEstimados: 10 }, arquivo("conceitos.png", "image/png", imagemBytes));
    chaveAtual = (await prisma.arquivoMaterial.findUniqueOrThrow({ where: { recursoId: imagem.id } })).chaveArmazenamento;
    const analiseImagem = await processarAnaliseMaterial(ana.id, imagem.id, { credenciais: [] });
    afirmar(analiseImagem.situacao === "CONCLUIDA", "imagem legível deve ser processada por OCR local.");
    await excluirMaterialPermanentemente(ana.id, imagem.id);
    chaveAtual = null;
    console.log("Análises de materiais verificadas: fila local, conceitos, comparação, autorização, substituição e exclusão.");
  } finally {
    if (chaveAtual) await removerArquivoMaterial(chaveAtual).catch(() => undefined);
    await prisma.sessaoEstudo.deleteMany({ where: { moduloId: modulo.id } });
    await prisma.recursoConteudo.deleteMany({ where: { moduloId: modulo.id } });
    await prisma.moduloAprendizagem.deleteMany({ where: { id: modulo.id } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
