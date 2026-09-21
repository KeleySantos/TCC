"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function ProcessadorAnalisesPendentes({ ids }: { ids: string[] }) {
  const iniciou = useRef(false);
  const roteador = useRouter();
  useEffect(() => {
    if (iniciou.current || !ids.length) return;
    iniciou.current = true;
    void (async () => {
      for (const id of ids) await fetch(`/api/materiais/${encodeURIComponent(id)}/analise`, { method: "POST" }).catch(() => null);
      roteador.refresh();
    })();
  }, [ids, roteador]);
  return null;
}
