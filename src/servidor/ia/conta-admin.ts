import { randomBytes } from "node:crypto";
import { prisma } from "@/biblioteca/prisma";
import { NOME_USUARIO_ADMIN, podeAdministrarIa } from "@/dominio/administracao-ia";
import { criarHashSenha } from "@/servidor/senhas";
import { contextoCredencial } from "./catalogo-provedores";
import { cifrarCredencial, decifrarCredencial, obterChaveMestraCredenciais } from "./cofre-credenciais";

/** Provisionamento local; não é exposto por rota nem por ação de cadastro. */
export async function provisionarAdministradorIa(senhaInicial?: string, cliente = prisma) {
  const existente = await cliente.usuario.findUnique({ where: { nomeUsuario: NOME_USUARIO_ADMIN } });
  if (existente) {
    if (!podeAdministrarIa(existente)) throw new Error("IDENTIFICADOR_ADMIN_OCUPADO_SEM_PERMISSAO");
    return { criada: false, nomeUsuario: existente.nomeUsuario, senhaInicial: null, chaveMigrada: false };
  }
  const senha = senhaInicial ?? randomBytes(18).toString("base64url");
  if (senha.length < 12 || senha.length > 128) throw new Error("SENHA_ADMIN_DEVE_TER_12_A_128_CARACTERES");
  const antiga = await cliente.configuracaoIa.findFirst({
    where: { provedor: "GROQ", ativa: true },
    orderBy: [{ ultimoTesteEm: "desc" }, { atualizadoEm: "desc" }],
  });
  const chaveMestra = antiga ? await obterChaveMestraCredenciais() : null;
  const chave = antiga && chaveMestra ? decifrarCredencial(antiga, contextoCredencial(antiga.usuarioId, "GROQ"), chaveMestra) : null;
  await cliente.$transaction(async (transacao) => {
    const admin = await transacao.usuario.create({ data: { nome: "ADMIN", nomeUsuario: NOME_USUARIO_ADMIN, senhaHash: criarHashSenha(senha), administradorIa: true } });
    if (antiga && chave && chaveMestra) {
      await transacao.configuracaoIa.create({ data: {
        usuarioId: admin.id, provedor: "GROQ", ...cifrarCredencial(chave, contextoCredencial(admin.id, "GROQ"), chaveMestra),
        ativa: antiga.ativa, estadoUltimoTeste: antiga.estadoUltimoTeste, ultimoTesteEm: antiga.ultimoTesteEm, bloqueadaAte: antiga.bloqueadaAte,
      } });
    }
  });
  return { criada: true, nomeUsuario: NOME_USUARIO_ADMIN, senhaInicial: senha, chaveMigrada: Boolean(chave) };
}
