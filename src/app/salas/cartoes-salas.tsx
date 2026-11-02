import Link from "next/link";
import { BookOpenText, UsersRound } from "lucide-react";
import { TextoCartaoModulo } from "@/componentes/texto-cartao-modulo";
import { ModalInstanciaVinculada } from "./modal-instancia-vinculada";
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
        <TextoCartaoModulo>{sala.nome}</TextoCartaoModulo>
        <span className={estilos.papelCartaoSala}>{sala.papel === "PROPRIETARIO" ? "Você administra esta sala" : "Você é membro"}{sala.situacao === "ARQUIVADA" ? " · Arquivada" : ""}</span>
      </span>
    </Link>)}
  </div>;
}

type InstanciaVinculada = { vinculoId: string; titulo: string; descricao: string };

export function CartaoModuloSala({ href, titulo, resumo, instanciaVinculada }: { href: string; titulo: string; resumo: string; instanciaVinculada?: InstanciaVinculada }) {
  if (instanciaVinculada) return <ModalInstanciaVinculada {...instanciaVinculada} resumo={resumo} />;
  return <Link aria-label={`Abrir módulo ${titulo}`} className={estilos.cartaoModulo} href={href}>
    <span className={estilos.iconeModuloSala}><BookOpenText aria-hidden="true" /></span>
    <span className={estilos.conteudoCartaoSala}>
      <TextoCartaoModulo variante="claro">{titulo}</TextoCartaoModulo>
      <span className={`${estilos.papelCartaoSala} ${estilos.resumoModuloSala}`}>{resumo}</span>
    </span>
  </Link>;
}
