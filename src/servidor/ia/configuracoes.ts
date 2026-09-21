import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import type { EstadoConfiguracaoIa, ProvedorIa } from "@/gerado/prisma/enums";
import { PROVEDORES_IA, contextoCredencial, obterDefinicaoProvedor } from "./catalogo-provedores";
import { cifrarCredencial, decifrarCredencial, obterChaveMestraCredenciais } from "./cofre-credenciais";

const esquemaChave = z.string().trim().min(10).max(500);

export type ConfiguracaoIaSegura = {
  provedor: ProvedorIa;
  nome: string;
  modelo: string;
  prioridade: number;
  descricao: string;
  configurada: boolean;
  ativa: boolean;
  estadoUltimoTeste: EstadoConfiguracaoIa | null;
  ultimoTesteEm: Date | null;
  bloqueadaAte: Date | null;
};

export async function listarConfiguracoesIaSeguras(usuarioId: string): Promise<ConfiguracaoIaSegura[]> {
  const registros = await prisma.configuracaoIa.findMany({
    where: { usuarioId },
    select: { provedor: true, ativa: true, estadoUltimoTeste: true, ultimoTesteEm: true, bloqueadaAte: true },
  });
  const porProvedor = new Map(registros.map((registro) => [registro.provedor, registro]));
  return PROVEDORES_IA.map((definicao) => {
    const registro = porProvedor.get(definicao.provedor);
    return {
      ...definicao,
      configurada: Boolean(registro),
      ativa: registro?.ativa ?? false,
      estadoUltimoTeste: registro?.estadoUltimoTeste ?? null,
      ultimoTesteEm: registro?.ultimoTesteEm ?? null,
      bloqueadaAte: registro?.bloqueadaAte ?? null,
    };
  });
}

export async function salvarConfiguracaoIa(usuarioId: string, provedor: ProvedorIa, chaveRecebida: string) {
  const chave = esquemaChave.parse(chaveRecebida);
  obterDefinicaoProvedor(provedor);
  const chaveMestra = await obterChaveMestraCredenciais();
  const segredo = cifrarCredencial(chave, contextoCredencial(usuarioId, provedor), chaveMestra);
  await prisma.configuracaoIa.upsert({
    where: { usuarioId_provedor: { usuarioId, provedor } },
    create: { usuarioId, provedor, ...segredo, ativa: true },
    update: { ...segredo, ativa: true, estadoUltimoTeste: "NAO_TESTADA", ultimoTesteEm: null, bloqueadaAte: null },
  });
}

export async function removerConfiguracaoIa(usuarioId: string, provedor: ProvedorIa) {
  await prisma.configuracaoIa.deleteMany({ where: { usuarioId, provedor } });
}

export async function definirConfiguracaoIaAtiva(usuarioId: string, provedor: ProvedorIa, ativa: boolean) {
  const resultado = await prisma.configuracaoIa.updateMany({ where: { usuarioId, provedor }, data: { ativa } });
  return resultado.count === 1;
}

export async function desativarTodasConfiguracoesIa(usuarioId: string) {
  await prisma.configuracaoIa.updateMany({ where: { usuarioId }, data: { ativa: false } });
}

export async function listarCredenciaisAtivas(usuarioId: string, agora = new Date()) {
  const registros = await prisma.configuracaoIa.findMany({
    where: { usuarioId, ativa: true, OR: [{ bloqueadaAte: null }, { bloqueadaAte: { lte: agora } }] },
    select: { provedor: true, chaveCifrada: true, vetorInicializacao: true, etiquetaAutenticacao: true },
  });
  const porProvedor = new Map(registros.map((registro) => [registro.provedor, registro]));
  const chaveMestra = registros.length ? await obterChaveMestraCredenciais() : null;
  return PROVEDORES_IA.flatMap((definicao) => {
    const registro = porProvedor.get(definicao.provedor);
    if (!registro || !chaveMestra) return [];
    return [{
      ...definicao,
      chave: decifrarCredencial(registro, contextoCredencial(usuarioId, registro.provedor), chaveMestra),
    }];
  });
}

export async function obterCredencialConfigurada(usuarioId: string, provedor: ProvedorIa) {
  const registro = await prisma.configuracaoIa.findUnique({
    where: { usuarioId_provedor: { usuarioId, provedor } },
    select: { chaveCifrada: true, vetorInicializacao: true, etiquetaAutenticacao: true },
  });
  if (!registro) return null;
  const chaveMestra = await obterChaveMestraCredenciais();
  return decifrarCredencial(registro, contextoCredencial(usuarioId, provedor), chaveMestra);
}

export async function registrarEstadoConfiguracaoIa(usuarioId: string, provedor: ProvedorIa, estado: EstadoConfiguracaoIa, bloqueadaAte: Date | null = null) {
  await prisma.configuracaoIa.updateMany({
    where: { usuarioId, provedor },
    data: { estadoUltimoTeste: estado, ultimoTesteEm: new Date(), bloqueadaAte },
  });
}
