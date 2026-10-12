import { createHash } from "node:crypto";
import { compararConceitosComSessoes, lerListaJson } from "@/dominio/analises/analise-material";
import { prisma } from "@/biblioteca/prisma";
import { EXTENSOES_ANALISAVEIS, extrairTextoMaterial } from "./extracao-materiais";
import { analisarTextoMaterial } from "./ia/analise-materiais";
import { criarChaveArmazenamentoArquivo, gravarArquivoMaterial, lerArquivoMaterial, prepararRemocaoArquivoMaterial, removerArquivoMaterial, validarArquivoMaterial } from "./arquivos-materiais";
import { ErroModulo } from "./modulos";
import { registrarEvidenciaDoMaterial, sincronizarConceitosMaterial } from "./aprendizagem-modulo";

const VERSAO_ANALISE = "analise-material-v1";

export function extensaoAnalisavel(extensao: string) {
  return EXTENSOES_ANALISAVEIS.has(extensao.toLowerCase());
}

export function dadosIniciaisAnalise(extensao: string) {
  return { situacao: extensaoAnalisavel(extensao) ? "PENDENTE" as const : "NAO_SUPORTADA" as const };
}

export async function processarAnaliseMaterial(usuarioId: string, recursoId: string, opcoes: { credenciais?: [] } = {}) {
  const material = await prisma.recursoConteudo.findFirst({
    where: { id: recursoId, ativo: true, origem: "ARQUIVO", modulo: { usuarioId, arquivado: false, rascunho: false } },
    select: { id: true, funcao: true, arquivo: true, analise: true },
  });
  if (!material?.arquivo) throw new ErroModulo("NAO_ENCONTRADO");
  if (!extensaoAnalisavel(material.arquivo.extensaoNormalizada)) {
    await prisma.analiseMaterial.upsert({ where: { recursoId }, create: { recursoId, situacao: "NAO_SUPORTADA" }, update: { situacao: "NAO_SUPORTADA", codigoFalha: null } });
    return { situacao: "NAO_SUPORTADA" as const };
  }
  await prisma.analiseMaterial.upsert({
    where: { recursoId },
    create: { recursoId, situacao: "PROCESSANDO", tentativas: 1 },
    update: { situacao: "PROCESSANDO", tentativas: { increment: 1 }, codigoFalha: null },
  });
  try {
    const bytes = await lerArquivoMaterial(material.arquivo.chaveArmazenamento);
    if (!bytes) throw new Error("ARQUIVO_AUSENTE");
    const extracao = await extrairTextoMaterial(material.arquivo.extensaoNormalizada, bytes);
    if (!extracao) throw new Error("FORMATO_NAO_SUPORTADO");
    const resultado = await analisarTextoMaterial(usuarioId, extracao.texto, extracao.conteudoTruncado, opcoes);
    const hashConteudo = createHash("sha256").update(bytes).digest("hex");
    const trechosConceitos = resultado.conceitos.map((conceito) => {
      const indice = extracao.texto.toLocaleLowerCase("pt-BR").indexOf(conceito.toLocaleLowerCase("pt-BR"));
      return { conceito, trecho: indice < 0 ? "" : extracao.texto.slice(Math.max(0, indice - 120), indice + conceito.length + 220).trim() };
    });
    const afirmacoes = material.funcao === "ANOTACAO" ? extracao.texto.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter((item) => item.length >= 20).slice(0, 12) : [];
    const interpretacaoVisual = material.funcao === "EVIDENCIA_VISUAL" ? resultado.pontosRevisao : [];
    const analise = await prisma.analiseMaterial.update({
      where: { recursoId },
      data: {
        situacao: "CONCLUIDA",
        versao: VERSAO_ANALISE,
        resumo: resultado.resumo,
        conceitosJson: JSON.stringify(resultado.conceitos),
        pontosRevisaoJson: JSON.stringify(resultado.pontosRevisao),
        metodosSugeridosJson: JSON.stringify(resultado.metodosSugeridos),
        proximasSessoesJson: JSON.stringify(resultado.proximasSessoes),
        perguntasReflexaoJson: JSON.stringify(resultado.perguntasReflexao),
        trechosConceitosJson: JSON.stringify(trechosConceitos),
        afirmacoesJson: JSON.stringify(afirmacoes),
        interpretacaoVisualJson: JSON.stringify(interpretacaoVisual),
        origem: resultado.origem,
        modelo: resultado.modelo,
        caracteresExtraidos: extracao.caracteresExtraidos,
        conteudoTruncado: extracao.conteudoTruncado,
        codigoFalha: null,
        hashConteudo,
        analisadaEm: new Date(),
      },
    });
    await sincronizarConceitosMaterial(usuarioId, recursoId, resultado.conceitos);
    await registrarEvidenciaDoMaterial(usuarioId, recursoId, extracao.texto, resultado.conceitos);
    return analise;
  } catch (erro) {
    const codigo = erro instanceof Error && /^[A-Z0-9_]+$/.test(erro.message) ? erro.message.slice(0, 60) : "FALHA_PROCESSAMENTO";
    await prisma.analiseMaterial.update({ where: { recursoId }, data: { situacao: "FALHA", codigoFalha: codigo } });
    return { situacao: "FALHA" as const, codigoFalha: codigo };
  }
}

export async function obterPainelConceitosModulo(usuarioId: string, moduloId: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({
    where: { id: moduloId, usuarioId, arquivado: false, rascunho: false },
    select: {
      materiais: { where: { ativo: true, origem: "ARQUIVO" }, select: { id: true, titulo: true, analise: true } },
      sessoesEstudo: { where: { situacao: "CONCLUIDA", duracaoMinutos: { gte: 5 } }, select: { id: true, descricao: true } },
    },
  });
  if (!modulo) throw new ErroModulo("NAO_ENCONTRADO");
  const materiais = modulo.materiais.map((material) => ({
    id: material.id,
    titulo: material.titulo,
    situacao: material.analise?.situacao ?? "NAO_SUPORTADA",
    resumo: material.analise?.resumo ?? null,
    conceitos: lerListaJson(material.analise?.conceitosJson),
    pontosRevisao: lerListaJson(material.analise?.pontosRevisaoJson),
    metodosSugeridos: lerListaJson(material.analise?.metodosSugeridosJson),
    proximasSessoes: lerListaJson(material.analise?.proximasSessoesJson),
    perguntasReflexao: lerListaJson(material.analise?.perguntasReflexaoJson),
    origem: material.analise?.origem ?? null,
    conteudoTruncado: material.analise?.conteudoTruncado ?? false,
  }));
  const conceitosUnicos = [...new Set(materiais.flatMap((material) => material.conceitos))];
  return { materiais, comparacao: compararConceitosComSessoes(conceitosUnicos, modulo.sessoesEstudo), quantidadeSessoesValidas: modulo.sessoesEstudo.length };
}

export async function substituirArquivoMaterial(usuarioId: string, recursoId: string, arquivo: File) {
  const atual = await prisma.recursoConteudo.findFirst({ where: { id: recursoId, ativo: true, origem: "ARQUIVO", modulo: { usuarioId, arquivado: false, rascunho: false } }, include: { arquivo: true } });
  if (!atual?.arquivo) throw new ErroModulo("NAO_ENCONTRADO");
  let validado;
  try { validado = await validarArquivoMaterial(arquivo); } catch { throw new ErroModulo("ARQUIVO_INVALIDO"); }
  const chaveNova = criarChaveArmazenamentoArquivo();
  const analisar = extensaoAnalisavel(validado.extensaoNormalizada);
  try { await gravarArquivoMaterial(chaveNova, validado.bytes); } catch { throw new ErroModulo("FALHA_ARMAZENAMENTO"); }
  const remocaoAnterior = await prepararRemocaoArquivoMaterial(atual.arquivo.chaveArmazenamento).catch(() => null);
  try {
    await prisma.$transaction([
      prisma.arquivoMaterial.update({ where: { recursoId }, data: { nomeOriginal: validado.nomeOriginal, tipoMime: validado.tipoMime, tamanhoBytes: validado.tamanhoBytes, chaveArmazenamento: chaveNova, extensaoNormalizada: validado.extensaoNormalizada } }),
      prisma.recursoConteudo.update({ where: { id: recursoId }, data: { formato: validado.formato } }),
      prisma.analiseMaterial.upsert({ where: { recursoId }, create: { recursoId, ...dadosIniciaisAnalise(validado.extensaoNormalizada) }, update: { ...dadosIniciaisAnalise(validado.extensaoNormalizada), resumo: null, conceitosJson: "[]", pontosRevisaoJson: "[]", metodosSugeridosJson: "[]", proximasSessoesJson: "[]", perguntasReflexaoJson: "[]", trechosConceitosJson: "[]", afirmacoesJson: "[]", interpretacaoVisualJson: "[]", origem: null, modelo: null, caracteresExtraidos: 0, conteudoTruncado: false, codigoFalha: null, hashConteudo: null, analisadaEm: null } }),
      prisma.evidenciaAprendizagem.updateMany({
        where: { recursoId },
        data: { desempenhoPercentual: null, resumo: "Arquivo substituído; desempenho indisponível até uma nova extração válida." },
      }),
    ]);
    await remocaoAnterior?.confirmar();
    return { recursoId, analisar };
  } catch {
    await removerArquivoMaterial(chaveNova).catch(() => undefined);
    await remocaoAnterior?.restaurar().catch(() => undefined);
    throw new ErroModulo("FALHA_ARMAZENAMENTO");
  }
}

export async function excluirMaterialPermanentemente(usuarioId: string, recursoId: string) {
  const material = await prisma.recursoConteudo.findFirst({ where: { id: recursoId, modulo: { usuarioId } }, select: { id: true, arquivo: { select: { chaveArmazenamento: true } } } });
  if (!material) throw new ErroModulo("NAO_ENCONTRADO");
  const remocao = material.arquivo ? await prepararRemocaoArquivoMaterial(material.arquivo.chaveArmazenamento).catch(() => null) : null;
  try {
    await prisma.$transaction([
      prisma.materialSessaoEstudo.deleteMany({ where: { recursoId: material.id } }),
      prisma.recursoConteudo.delete({ where: { id: material.id } }),
    ]);
    await remocao?.confirmar();
  } catch {
    await remocao?.restaurar().catch(() => undefined);
    throw new ErroModulo("FALHA_ARMAZENAMENTO");
  }
}
