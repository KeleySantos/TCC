"use server";

import { redirect } from "next/navigation";

export async function atualizarCuradoria() {
  redirect("/dashboard");
}
