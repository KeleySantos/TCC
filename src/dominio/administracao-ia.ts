export const NOME_USUARIO_ADMIN = "admin";

export function podeAdministrarIa(usuario: { nomeUsuario: string; administradorIa?: boolean } | null) {
  return usuario?.nomeUsuario === NOME_USUARIO_ADMIN && usuario.administradorIa === true;
}
