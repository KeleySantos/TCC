import { describe, expect, it } from "vitest";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { autorizarAlunoNaApi, type UsuarioAtual } from "./autorizacao";

const aluno: UsuarioAtual = {
  id: "usuario-aluno",
  nome: "Ana Souza",
  nomeUsuario: "ana.souza",
  papel: PapelUsuario.ALUNO,
  perfilAlunoId: "perfil-aluno",
  perfilProfessorId: null,
};

describe("autorização das APIs do aluno", () => {
  it("rejeita uma requisição sem sessão com 401", () => {
    expect(autorizarAlunoNaApi(null)).toMatchObject({ permitido: false, status: 401 });
  });

  it("rejeita professor em operação exclusiva de aluno com 403", () => {
    expect(autorizarAlunoNaApi({ ...aluno, papel: PapelUsuario.PROFESSOR, perfilAlunoId: null, perfilProfessorId: "perfil-professor" })).toMatchObject({ permitido: false, status: 403 });
  });

  it("mantém o identificador de perfil do aluno autorizado", () => {
    const resultado = autorizarAlunoNaApi(aluno);
    expect(resultado.permitido).toBe(true);
    if (resultado.permitido) expect(resultado.usuario.perfilAlunoId).toBe("perfil-aluno");
  });
});
