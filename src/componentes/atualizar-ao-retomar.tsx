"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Reconsulta dados do servidor ao retornar à página, sem polling ou canal adicional. */
export function AtualizarAoRetomar() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
    const atualizar = () => { if (document.visibilityState !== "hidden") router.refresh(); };
    window.addEventListener("focus", atualizar); document.addEventListener("visibilitychange", atualizar);
    return () => { window.removeEventListener("focus", atualizar); document.removeEventListener("visibilitychange", atualizar); };
  }, [router]);
  return null;
}
