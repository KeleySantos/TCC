import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import type { EstadoConfiguracaoIa } from "@/gerado/prisma/enums";
import { PROVEDORES_IA, contextoCredencial, obterDefinicaoProvedor, type ProvedorIaAtivo } from "./catalogo-provedores";
import { cifrarCredencial, decifrarCredencial, obterChaveMestraCredenciais } from "./cofre-credenciais";
import { NOME_USUARIO_ADMIN, podeAdministrarIa } from "@/dominio/administracao-ia";

const esquemaChave = z.string().trim().min(10).max(500);

export async function exigirPermissaoConfiguracaoIa(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { nomeUsuario: true, administradorIa: true },
  });
  if (!podeAdministrarIa(usuario)) throw new Error("CONFIGURACAO_IA_RESTRITA_ADMIN");
}

const filtroConfiguracaoGlobal = { provedor: "GROQ" as const, usuario: { nomeUsuario: NOME_USUARIO_ADMIN, administradorIa: true } };

export type ConfiguracaoIaSegura = {
  provedor: ProvedorIaAtivo;
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
  await exigirPermissaoConfiguracaoIa(usuarioId);
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

export async function salvarConfiguracaoIa(usuarioId: string, provedor: ProvedorIaAtivo, chaveRecebida: string) {
  await exigirPermissaoConfiguracaoIa(usuarioId);
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

export async function removerConfiguracaoIa(usuarioId: string, provedor: ProvedorIaAtivo) {
  await exigirPermissaoConfiguracaoIa(usuarioId);
  await prisma.configuracaoIa.deleteMany({ where: { usuarioId, provedor } });
}

export async function definirConfiguracaoIaAtiva(usuarioId: string, provedor: ProvedorIaAtivo, ativa: boolean) {
  await exigirPermissaoConfiguracaoIa(usuarioId);
  const resultado = await prisma.configuracaoIa.updateMany({ where: { usuarioId, provedor }, data: { ativa } });
  return resultado.count === 1;
}

export async function desativarTodasConfiguracoesIa(usuarioId: string) {
  await exigirPermissaoConfiguracaoIa(usuarioId);
  await prisma.configuracaoIa.updateMany({ where: { usuarioId }, data: { ativa: false } });
}

export async function listarCredenciaisAtivas(agora = new Date()) {
  const registros = await prisma.configuracaoIa.findMany({
    where: { ...filtroConfiguracaoGlobal, ativa: true, OR: [{ bloqueadaAte: null }, { bloqueadaAte: { lte: agora } }] },
    select: { usuarioId: true, provedor: true, chaveCifrada: true, vetorInicializacao: true, etiquetaAutenticacao: true },
  });
  const porProvedor = new Map(registros.map((registro) => [registro.provedor, registro]));
  const chaveMestra = registros.length ? await obterChaveMestraCredenciais() : null;
  return PROVEDORES_IA.flatMap((definicao) => {
    const registro = porProvedor.get(definicao.provedor);
    if (registro && chaveMestra) return [{ ...definicao, chave: decifrarCredencial(registro, contextoCredencial(registro.usuarioId, definicao.provedor), chaveMestra) }];
    return [];
  });
}

export async function obterCredencialConfigurada(usuarioId: string, provedor: ProvedorIaAtivo) {
  await exigirPermissaoConfiguracaoIa(usuarioId);
  const registro = await prisma.configuracaoIa.findUnique({
    where: { usuarioId_provedor: { usuarioId, provedor } },
    select: { chaveCifrada: true, vetorInicializacao: true, etiquetaAutenticacao: true },
  });
  if (!registro) return null;
  const chaveMestra = await obterChaveMestraCredenciais();
  return decifrarCredencial(registro, contextoCredencial(usuarioId, provedor), chaveMestra);
}

export async function registrarEstadoConfiguracaoIa(usuarioId: string, provedor: ProvedorIaAtivo, estado: EstadoConfiguracaoIa, bloqueadaAte: Date | null = null) {
  // O solicitante identifica a execução; a disponibilidade pertence à chave global.
  if (!usuarioId) return;
  await prisma.configuracaoIa.updateMany({
    where: { ...filtroConfiguracaoGlobal, provedor },
    data: { estadoUltimoTeste: estado, ultimoTesteEm: new Date(), bloqueadaAte },
  });
}
