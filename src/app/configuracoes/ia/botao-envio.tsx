"use client";

import { useFormStatus } from "react-dom";

export function BotaoEnvio({ children, className, processando = "Processando..." }: { children: React.ReactNode; className?: string; processando?: string }) {
  const { pending } = useFormStatus();
  return <button aria-busy={pending} className={className} disabled={pending} type="submit">{pending ? processando : children}</button>;
}
