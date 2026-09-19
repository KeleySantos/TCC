"use server";

import { redirect } from "next/navigation";
import { encerrarSessaoDemonstracao } from "@/servidor/autenticacao";

export async function sairDaConta() {
  await encerrarSessaoDemonstracao();
  redirect("/entrar");
}
