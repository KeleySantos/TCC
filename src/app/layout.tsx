import type { Metadata } from "next";
import "./globais.css";

export const metadata: Metadata = {
  title: "Learning Lab",
  description: "Plataforma educacional de Learning Analytics.",
};

export default function LayoutRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="pular-conteudo" href="#conteudo-principal">Pular para o conteúdo principal</a>{children}</body></html>;
}
