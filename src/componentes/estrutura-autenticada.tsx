"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";
import { sairDaConta } from "@/app/acoes-sessao";
import estilos from "./estrutura-autenticada.module.css";

const CHAVE_PREFERENCIA = "learning-lab:barra-lateral-recolhida";
const EVENTO_PREFERENCIA = "learning-lab:preferencia-barra-lateral";

const ITENS_NAVEGACAO = [
  { href: "/dashboard", rotulo: "Dashboard", Icone: LayoutDashboard },
  { href: "/modulos", rotulo: "Módulos", Icone: BookOpenText },
  { href: "/desafios", rotulo: "Desafios", Icone: FlaskConical },
  { href: "/historico", rotulo: "Histórico", Icone: History },
  { href: "/perfil", rotulo: "Perfil", Icone: UserRound },
] as const;

function assinarPreferencia(notificar: () => void) {
  window.addEventListener("storage", notificar);
  window.addEventListener(EVENTO_PREFERENCIA, notificar);
  return () => {
    window.removeEventListener("storage", notificar);
    window.removeEventListener(EVENTO_PREFERENCIA, notificar);
  };
}

function obterPreferencia() {
  return window.localStorage.getItem(CHAVE_PREFERENCIA) === "sim";
}

function obterPreferenciaNoServidor() {
  return false;
}

function itemEstaAtivo(caminhoAtual: string, href: string) {
  return href === "/modulos" ? caminhoAtual.startsWith("/modulos") : caminhoAtual === href;
}

export function EstruturaAutenticada({
  children,
  usuarioNome,
}: {
  children: ReactNode;
  usuarioNome: string;
}) {
  const caminhoAtual = usePathname();
  const barraRecolhida = useSyncExternalStore(assinarPreferencia, obterPreferencia, obterPreferenciaNoServidor);

  function alternarBarra() {
    window.localStorage.setItem(CHAVE_PREFERENCIA, barraRecolhida ? "nao" : "sim");
    window.dispatchEvent(new Event(EVENTO_PREFERENCIA));
  }

  return (
    <div className={`${estilos.estrutura} ${barraRecolhida ? estilos.estruturaRecolhida : ""}`}>
      <aside className={estilos.barraLateral} aria-label="Navegação principal">
        <div className={estilos.cabecalhoBarra}>
          <Link className={estilos.marcaProduto} href="/dashboard" aria-label="Ir ao Dashboard">
            <span className={estilos.simboloMarca}><FlaskConical aria-hidden="true" /></span>
            <span className={estilos.identidadeMarca}><strong>Learning Lab</strong><small>Laboratório Pessoal de Aprendizagem</small></span>
          </Link>
          <button
            aria-controls="menu-principal-autenticado"
            aria-expanded={!barraRecolhida}
            className={estilos.botaoAlternar}
            onClick={alternarBarra}
            title={barraRecolhida ? "Expandir barra lateral" : "Recolher barra lateral"}
            type="button"
          >
            {barraRecolhida ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
            <span className={estilos.textoAcessivel}>{barraRecolhida ? "Expandir barra lateral" : "Recolher barra lateral"}</span>
          </button>
        </div>

        <nav className={estilos.menuPrincipal} id="menu-principal-autenticado">
          {ITENS_NAVEGACAO.map(({ href, rotulo, Icone }) => {
            const ativo = itemEstaAtivo(caminhoAtual, href);
            return (
              <Link aria-current={ativo ? "page" : undefined} className={ativo ? estilos.itemAtivo : undefined} href={href} key={href} title={barraRecolhida ? rotulo : undefined}>
                <Icone aria-hidden="true" />
                <span className={estilos.rotuloItem}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>

        <div className={estilos.fraseLateral}>
          <Sparkles aria-hidden="true" />
          <p>“Aprender bem hoje constrói caminhos melhores amanhã.”</p>
        </div>

        <div className={estilos.rodapeBarra}>
          <span className={estilos.avatar} aria-hidden="true">{usuarioNome.trim().slice(0, 1).toUpperCase()}</span>
          <span className={estilos.nomeConta}>{usuarioNome}</span>
          <form action={sairDaConta} className={estilos.formularioSair}>
            <button type="submit" title={barraRecolhida ? "Sair da conta" : undefined}>
              <LogOut aria-hidden="true" />
              <span className={estilos.rotuloItem}>Sair</span>
            </button>
          </form>
        </div>
      </aside>
      <div className={estilos.conteudo}>{children}</div>
    </div>
  );
}
