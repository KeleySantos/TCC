"use client";

import { useFormStatus } from "react-dom";

export function BotaoEnvio({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} type="submit">{pending ? "Processando…" : children}</button>;
}
