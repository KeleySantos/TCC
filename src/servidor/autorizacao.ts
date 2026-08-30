import { PapelUsuario } from "@/gerado/prisma/enums";

export type UsuarioAtual = {
  id: string;
  nome: string;
  nomeUsuario: string;
  papel: PapelUsuario;
  perfilAlunoId: string | null;
  perfilProfessorId: string | null;
};

export type ResultadoAutorizacaoAlunoApi =
  | { permitido: true; usuario: UsuarioAtual & { perfilAlunoId: string } }
  | { permitido: false; status: 401 | 403; erro: string };

export function autorizarAlunoNaApi(usuario: UsuarioAtual | null): ResultadoAutorizacaoAlunoApi {
  if (!usuario) return { permitido: false, status: 401, erro: "Sessão de demonstração ausente ou expirada." };
  if (usuario.papel !== PapelUsuario.ALUNO || !usuario.perfilAlunoId) return { permitido: false, status: 403, erro: "Esta operação é permitida somente para alunos." };
  return { permitido: true, usuario: { ...usuario, perfilAlunoId: usuario.perfilAlunoId } };
}
