import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FormatoConteudo, OrigemMaterial } from "@/gerado/prisma/enums";
import { prisma } from "@/biblioteca/prisma";
import { criarChaveArmazenamentoArquivo, gravarArquivoMaterial, lerArquivoMaterial, removerArquivoMaterial, validarArquivoMaterial } from "./arquivos-materiais";

export type CodigoErroModulo = "DADOS_INVALIDOS" | "NAO_ENCONTRADO" | "IDENTIFICADOR_DUPLICADO" | "ARQUIVO_INVALIDO" | "FALHA_ARMAZENAMENTO";

export type ModuloListadoPessoal = {
  id: string;
  identificador: string;
  titulo: string;
  descricao: string;
  rascunho: boolean;
  _count: { topicos: number };
};

export type TopicoListadoPessoal = {
  id: string;
  moduloId: string;
  identificador: string;
  nome: string;
  descricao: string;
  rascunho: boolean;
};

export class ErroModulo extends Error {
  constructor(public readonly codigo: CodigoErroModulo) {
    super(codigo);
  }
}

const campoTitulo = z.string().trim().min(3).max(120);
const campoDescricao = z.string().trim().min(3).max(500);
const esquemaModulo = z.object({ titulo: campoTitulo, descricao: campoDescricao });
const esquemaTopico = z.object({ moduloId: z.string().min(1), titulo: campoTitulo, descricao: campoDescricao });
const esquemaReferencia = z.object({ id: z.string().min(1) });
const esquemaMaterial = z.object({
  topicoId: z.string().min(1),
  titulo: campoTitulo,
  descricao: campoDescricao,
  formato: z.nativeEnum(FormatoConteudo),
  minutosEstimados: z.coerce.number().int().min(1).max(600),
  conteudoTexto: z.string().trim().max(8_000),
  url: z.string().trim().max(2_048),
}).superRefine((dados, contexto) => {
  if (Number(Boolean(dados.conteudoTexto)) + Number(Boolean(dados.url)) !== 1) contexto.addIssue({ code: "custom", message: "Informe exatamente um texto ou link." });
  if (!dados.url) return;
  try {
    const url = new URL(dados.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocolo inválido");
  } catch {
    contexto.addIssue({ code: "custom", path: ["url"], message: "Informe URL HTTP ou HTTPS válida." });
  }
});
const esquemaMaterialArquivo = z.object({
  topicoId: z.string().min(1),
  titulo: campoTitulo,
  descricao: campoDescricao,
  minutosEstimados: z.coerce.number().int().min(1).max(600),
});

function dadosValidos<T>(resultado: z.ZodSafeParseResult<T>) {
  if (!resultado.success) throw new ErroModulo("DADOS_INVALIDOS");
  return resultado.data;
}

function criarIdentificador(titulo: string) {
  const identificador = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!identificador) throw new ErroModulo("DADOS_INVALIDOS");
  return identificador.slice(0, 80);
}

function normalizarConteudo(conteudoTexto: string, url: string) {
  return conteudoTexto
    ? { conteudoTexto, url: null, origem: OrigemMaterial.TEXTO }
    : { conteudoTexto: null, url: new URL(url).toString(), origem: OrigemMaterial.LINK };
}

async function exigirModulo(usuarioId: string, id: string) {
  const modulo = await prisma.moduloAprendizagem.findFirst({ where: { id, usuarioId } });
  if (!modulo) throw new ErroModulo("NAO_ENCONTRADO");
  return modulo;
}

async function exigirTopico(usuarioId: string, id: string, exigirConfigurado = false) {
  const topico = await prisma.topico.findFirst({ where: { id, ativo: true, ...(exigirConfigurado ? { rascunho: false } : {}), modulo: { usuarioId, arquivado: false, rascunho: false } } });
  if (!topico) throw new ErroModulo("NAO_ENCONTRADO");
  return topico;
}

async function exigirMaterial(usuarioId: string, id: string) {
  const material = await prisma.recursoConteudo.findFirst({ where: { id, ativo: true, topico: { ativo: true, rascunho: false, modulo: { usuarioId, arquivado: false, rascunho: false } } } });
  if (!material) throw new ErroModulo("NAO_ENCONTRADO");
  return material;
}

export async function listarModulosPessoais(usuarioId: string, opcoes: { incluirRascunhos?: boolean } = {}): Promise<ModuloListadoPessoal[]> {
  return prisma.moduloAprendizagem.findMany({
    where: { usuarioId, arquivado: false, ...(opcoes.incluirRascunhos ? {} : { rascunho: false }) },
    select: {
      id: true,
      identificador: true,
      titulo: true,
      descricao: true,
      rascunho: true,
      _count: { select: { topicos: { where: { ativo: true, rascunho: false } } } },
    },
    orderBy: [{ rascunho: "desc" }, { atualizadoEm: "desc" }],
  });
}

export async function obterModuloPessoal(usuarioId: string, identificador: string) {
  return prisma.moduloAprendizagem.findFirst({
    where: { usuarioId, identificador, arquivado: false },
    include: {
      topicos: {
        where: { ativo: true },
        orderBy: [{ rascunho: "desc" }, { nome: "asc" }],
        include: {
          recursos: {
            where: { ativo: true },
            orderBy: { titulo: "asc" },
            include: { arquivo: { select: { nomeOriginal: true, tipoMime: true, tamanhoBytes: true, extensaoNormalizada: true } } },
          },
          avaliacoes: { where: { ativa: true }, include: { questoes: { orderBy: { posicao: "asc" } } }, orderBy: { titulo: "asc" } },
        },
      },
    },
  });
}

export async function criarModuloPessoal(usuarioId: string, entrada: unknown) {
  const dados = dadosValidos(esquemaModulo.safeParse(entrada));
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.moduloAprendizagem.findFirst({ where: { usuarioId, identificador } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.moduloAprendizagem.create({ data: { usuarioId, identificador, titulo: dados.titulo, descricao: dados.descricao } });
}

export async function criarRascunhoModuloPessoal(usuarioId: string) {
  return prisma.moduloAprendizagem.create({
    data: {
      usuarioId,
      identificador: `rascunho-${randomUUID()}`,
      titulo: "",
      descricao: "",
      rascunho: true,
    },
    select: { id: true, identificador: true, rascunho: true },
  });
}

export async function atualizarModuloPessoal(usuarioId: string, id: string, entrada: unknown) {
  const atual = await exigirModulo(usuarioId, id);
  const dados = dadosValidos(esquemaModulo.safeParse(entrada));
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.moduloAprendizagem.findFirst({ where: { usuarioId, identificador, id: { not: atual.id } } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.moduloAprendizagem.update({ where: { id: atual.id }, data: { identificador, titulo: dados.titulo, descricao: dados.descricao, rascunho: false } });
}

export async function arquivarModuloPessoal(usuarioId: string, entrada: unknown) {
  const { id } = dadosValidos(esquemaReferencia.safeParse(entrada));
  const modulo = await exigirModulo(usuarioId, id);
  await prisma.moduloAprendizagem.update({ where: { id: modulo.id }, data: { arquivado: true } });
}

export async function criarTopicoPessoal(usuarioId: string, entrada: unknown) {
  const dados = dadosValidos(esquemaTopico.safeParse(entrada));
  const modulo = await exigirModulo(usuarioId, dados.moduloId);
  if (modulo.arquivado || modulo.rascunho) throw new ErroModulo("NAO_ENCONTRADO");
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.topico.findFirst({ where: { moduloId: modulo.id, identificador } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.topico.create({ data: { moduloId: modulo.id, identificador, nome: dados.titulo, descricao: dados.descricao } });
}

export async function criarRascunhoTopicoPessoal(usuarioId: string, moduloId: string): Promise<{ id: string; moduloId: string; identificador: string; identificadorModulo: string; rascunho: true }> {
  const modulo = await exigirModulo(usuarioId, moduloId);
  if (modulo.arquivado || modulo.rascunho) throw new ErroModulo("NAO_ENCONTRADO");
  const topico = await prisma.topico.create({
    data: { moduloId: modulo.id, identificador: `rascunho-${randomUUID()}`, nome: "", descricao: "", rascunho: true },
    select: { id: true, moduloId: true, identificador: true, rascunho: true },
  });
  return { ...topico, identificadorModulo: modulo.identificador, rascunho: true };
}

export async function atualizarTopicoPessoal(usuarioId: string, id: string, entrada: unknown) {
  const atual = await exigirTopico(usuarioId, id);
  const dados = dadosValidos(esquemaModulo.safeParse(entrada));
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.topico.findFirst({ where: { moduloId: atual.moduloId, identificador, id: { not: atual.id } } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.topico.update({ where: { id: atual.id }, data: { identificador, nome: dados.titulo, descricao: dados.descricao, rascunho: false } });
}

export async function arquivarTopicoPessoal(usuarioId: string, entrada: unknown) {
  const { id } = dadosValidos(esquemaReferencia.safeParse(entrada));
  const topico = await exigirTopico(usuarioId, id);
  await prisma.topico.update({ where: { id: topico.id }, data: { ativo: false } });
}

export async function criarMaterialPessoal(usuarioId: string, entrada: unknown) {
  const dados = dadosValidos(esquemaMaterial.safeParse(entrada));
  const topico = await exigirTopico(usuarioId, dados.topicoId, true);
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.recursoConteudo.findFirst({ where: { topicoId: topico.id, identificador } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.recursoConteudo.create({ data: { topicoId: topico.id, identificador, titulo: dados.titulo, descricao: dados.descricao, formato: dados.formato, minutosEstimados: dados.minutosEstimados, ...normalizarConteudo(dados.conteudoTexto, dados.url) } });
}

export async function criarMaterialComArquivoPessoal(usuarioId: string, entrada: unknown, arquivo: File) {
  const dados = dadosValidos(esquemaMaterialArquivo.safeParse(entrada));
  const topico = await exigirTopico(usuarioId, dados.topicoId, true);
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.recursoConteudo.findFirst({ where: { topicoId: topico.id, identificador } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");

  let arquivoValidado;
  try {
    arquivoValidado = await validarArquivoMaterial(arquivo);
  } catch {
    throw new ErroModulo("ARQUIVO_INVALIDO");
  }
  const chaveArmazenamento = criarChaveArmazenamentoArquivo();
  try {
    await gravarArquivoMaterial(chaveArmazenamento, arquivoValidado.bytes);
  } catch {
    throw new ErroModulo("FALHA_ARMAZENAMENTO");
  }
  try {
    return await prisma.$transaction((transacao) => transacao.recursoConteudo.create({
      data: {
        topicoId: topico.id,
        identificador,
        titulo: dados.titulo,
        descricao: dados.descricao,
        formato: arquivoValidado.formato,
        minutosEstimados: dados.minutosEstimados,
        origem: OrigemMaterial.ARQUIVO,
        arquivo: {
          create: {
            nomeOriginal: arquivoValidado.nomeOriginal,
            tipoMime: arquivoValidado.tipoMime,
            tamanhoBytes: arquivoValidado.tamanhoBytes,
            chaveArmazenamento,
            extensaoNormalizada: arquivoValidado.extensaoNormalizada,
          },
        },
      },
    }));
  } catch (erro) {
    await removerArquivoMaterial(chaveArmazenamento).catch(() => undefined);
    if (erro && typeof erro === "object" && "code" in erro && erro.code === "P2002") throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
    throw new ErroModulo("FALHA_ARMAZENAMENTO");
  }
}

export async function atualizarMaterialPessoal(usuarioId: string, id: string, entrada: unknown) {
  const atual = await exigirMaterial(usuarioId, id);
  const objetoEntrada = entrada && typeof entrada === "object" ? entrada as Record<string, unknown> : {};
  const semOrigemNova = !objetoEntrada.conteudoTexto && !objetoEntrada.url;
  if (atual.origem === OrigemMaterial.ARQUIVO) {
    if (!semOrigemNova) throw new ErroModulo("DADOS_INVALIDOS");
    const dadosArquivo = dadosValidos(esquemaMaterialArquivo.safeParse({ ...objetoEntrada, topicoId: atual.topicoId }));
    const identificadorArquivo = criarIdentificador(dadosArquivo.titulo);
    const existenteArquivo = await prisma.recursoConteudo.findFirst({ where: { topicoId: atual.topicoId, identificador: identificadorArquivo, id: { not: atual.id } } });
    if (existenteArquivo) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
    return prisma.recursoConteudo.update({ where: { id: atual.id }, data: { identificador: identificadorArquivo, titulo: dadosArquivo.titulo, descricao: dadosArquivo.descricao, minutosEstimados: dadosArquivo.minutosEstimados } });
  }
  const dados = dadosValidos(esquemaMaterial.safeParse({ ...objetoEntrada, topicoId: atual.topicoId }));
  const identificador = criarIdentificador(dados.titulo);
  const existente = await prisma.recursoConteudo.findFirst({ where: { topicoId: atual.topicoId, identificador, id: { not: atual.id } } });
  if (existente) throw new ErroModulo("IDENTIFICADOR_DUPLICADO");
  return prisma.recursoConteudo.update({ where: { id: atual.id }, data: { identificador, titulo: dados.titulo, descricao: dados.descricao, formato: dados.formato, minutosEstimados: dados.minutosEstimados, ...normalizarConteudo(dados.conteudoTexto, dados.url) } });
}

export async function arquivarMaterialPessoal(usuarioId: string, entrada: unknown) {
  const { id } = dadosValidos(esquemaReferencia.safeParse(entrada));
  const material = await exigirMaterial(usuarioId, id);
  await prisma.recursoConteudo.update({ where: { id: material.id }, data: { ativo: false } });
}

export async function obterArquivoMaterialPessoal(usuarioId: string, recursoId: string) {
  const recurso = await prisma.recursoConteudo.findFirst({
    where: { id: recursoId, ativo: true, origem: OrigemMaterial.ARQUIVO, topico: { ativo: true, rascunho: false, modulo: { usuarioId, arquivado: false, rascunho: false } } },
    select: { arquivo: { select: { nomeOriginal: true, tipoMime: true, chaveArmazenamento: true, tamanhoBytes: true } } },
  });
  if (!recurso?.arquivo) return null;
  try {
    const conteudo = await lerArquivoMaterial(recurso.arquivo.chaveArmazenamento);
    return conteudo ? { ...recurso.arquivo, conteudo } : null;
  } catch {
    return null;
  }
}
