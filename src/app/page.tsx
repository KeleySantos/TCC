import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { obterRotaInicial } from "@/servidor/autenticacao";

export default async function Inicio() {
  const usuario = await obterUsuarioAtual();
  redirect(!usuario ? "/entrar" : obterRotaInicial());
}
