import { z } from "zod";
import { criarHashSenha, normalizarIdentificadorConta } from "./senhas";

export type CodigoErroCadastroConta = "DADOS_INVALIDOS" | "SENHAS_DIFERENTES" | "NOME_EXISTENTE";

export class ErroCadastroConta extends Error {
  constructor(public readonly codigo: CodigoErroCadastroConta) {
    super(codigo);
    this.name = "ErroCadastroConta";
  }
}

export type EntradaCadastroConta = {
  nome: unknown;
  senha: unknown;
  confirmarSenha: unknown;
};

type ContaCriada = { id: string; nome: string; nomeUsuario: string };
type ClienteCadastroConta = {
  usuario: {
    create(argumentos: { data: { nome: string; nomeUsuario: string; senhaHash: string } }): Promise<ContaCriada>;
  };
};

const esquemaCadastro = z.object({
  nome: z.string().trim().min(2).max(80),
  senha: z.string().min(8).max(128),
  confirmarSenha: z.string().min(8).max(128),
});

function eRestricaoUnica(erro: unknown) {
  return Boolean(erro && typeof erro === "object" && "code" in erro && erro.code === "P2002");
}

export async function cadastrarContaPessoal(entrada: EntradaCadastroConta, cliente?: ClienteCadastroConta) {
  const resultado = esquemaCadastro.safeParse(entrada);
  if (!resultado.success) throw new ErroCadastroConta("DADOS_INVALIDOS");
  if (resultado.data.senha !== resultado.data.confirmarSenha) throw new ErroCadastroConta("SENHAS_DIFERENTES");
  const nomeUsuario = normalizarIdentificadorConta(resultado.data.nome);
  if (nomeUsuario.length < 2) throw new ErroCadastroConta("DADOS_INVALIDOS");

  try {
    const banco = cliente ?? (await import("@/biblioteca/prisma")).prisma;
    const conta = await banco.usuario.create({ data: {
      nome: resultado.data.nome,
      nomeUsuario,
      senhaHash: criarHashSenha(resultado.data.senha),
    } });
    return { id: conta.id, nome: conta.nome, nomeUsuario: conta.nomeUsuario };
  } catch (erro) {
    if (eRestricaoUnica(erro)) throw new ErroCadastroConta("NOME_EXISTENTE");
    throw erro;
  }
}
