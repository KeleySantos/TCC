"use client";

import { useFormStatus } from "react-dom";

export function BotaoSubmissao({ children, processando }: { children: React.ReactNode; processando: string }) {
  const { pending } = useFormStatus();
  return (
    <button aria-disabled={pending} className="botao-submissao-entrada" disabled={pending} type="submit">
      {pending ? processando : children}
    </button>
  );
}
