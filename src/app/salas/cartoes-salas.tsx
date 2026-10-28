import Link from "next/link";
import { BookOpenText, UsersRound } from "lucide-react";
import estilos from "./page.module.css";

type SalaResumo = {
  id: string;
  identificador: string;
  nome: string;
  descricao?: string;
  papel: string;
  situacao: string;
  _count: { modulos: number; membros: number };
};

export function GradeSalas({ salas }: { salas: SalaResumo[] }) {
  return <div className={estilos.gradeSalas}>
    {salas.map((sala) => <Link aria-label={`Abrir sala ${sala.nome}`} className={estilos.cartaoSalaBiblioteca} href={`/salas/${sala.identificador}`} key={sala.id}>
      <span className={estilos.iconeCartaoSala}><UsersRound aria-hidden="true" /></span>
      <span className={estilos.conteudoCartaoSala}>
        <strong>{sala.nome}</strong>
        <span className={estilos.papelCartaoSala}>{sala.papel === "PROPRIETARIO" ? "Você administra esta sala" : "Você é membro"}{sala.situacao === "ARQUIVADA" ? " · Arquivada" : ""}</span>
      </span>
    </Link>)}
  </div>;
}

export function CartaoModuloSala({ href, titulo, descricao, resumo }: { href: string; titulo: string; descricao: string; resumo: string }) {
  return <Link aria-label={`Abrir módulo ${titulo}`} className={estilos.cartaoModulo} href={href}>
    <header>
      <span className={estilos.iconeModuloSala}><BookOpenText aria-hidden="true" /></span>
      <div className={estilos.tituloModuloSala}><h3>{titulo}</h3><p>{descricao}</p></div>
      <span className={estilos.resumoModuloSala}>{resumo}</span>
    </header>
  </Link>;
}
