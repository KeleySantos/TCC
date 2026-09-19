export type UsuarioAtual = {
  id: string;
  nome: string;
  nomeUsuario: string;
  email: string | null;
};

export type ResultadoAutorizacaoApi =
  | { permitido: true; usuario: UsuarioAtual }
  | { permitido: false; status: 401; erro: string };

export function autorizarUsuarioNaApi(usuario: UsuarioAtual | null): ResultadoAutorizacaoApi {
  if (!usuario) return { permitido: false, status: 401, erro: "Sessão ausente ou expirada." };
  return { permitido: true, usuario };
}
