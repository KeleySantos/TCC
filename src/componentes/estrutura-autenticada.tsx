"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings2,
  UsersRound,
} from "lucide-react";
import { sairDaConta } from "@/app/acoes-sessao";
import { PerfilUsuario } from "./perfil-usuario";
import estilos from "./estrutura-autenticada.module.css";

const CHAVE_PREFERENCIA = "learning-lab:barra-lateral-recolhida";
const EVENTO_PREFERENCIA = "learning-lab:preferencia-barra-lateral";

const ITENS_NAVEGACAO = [
  { href: "/dashboard", rotulo: "Dashboard", Icone: LayoutDashboard },
  { href: "/modulos", rotulo: "Módulos", Icone: BookOpenText },
  { href: "/desafios", rotulo: "Métodos", Icone: FlaskConical },
  { href: "/salas", rotulo: "Salas", Icone: UsersRound },
  { href: "/configuracoes/ia", rotulo: "Configurações IA", Icone: Settings2 },
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
  return window.localStorage.getItem(CHAVE_PREFERENCIA) !== "nao";
}

function obterPreferenciaNoServidor() {
  return true;
}

function itemEstaAtivo(caminhoAtual: string, href: string) {
  return href === "/modulos" || href === "/salas" ? caminhoAtual.startsWith(href) : caminhoAtual === href;
}

export function EstruturaAutenticada({
  children,
  usuarioNome,
  administradorIa = false,
  usuarioFotoVersao,
}: {
  children: ReactNode;
  usuarioNome: string;
  administradorIa?: boolean;
  usuarioFotoVersao?: string | null;
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
          {barraRecolhida ? <button
              aria-controls="menu-principal-autenticado"
              aria-expanded="false"
              className={`${estilos.botaoAlternar} ${estilos.botaoMarcaRecolhida}`}
              onClick={alternarBarra}
              title="Expandir barra lateral"
              type="button"
            >
              <span className={estilos.simboloMarca}><FlaskConical aria-hidden="true" /></span>
              <span className={estilos.iconeExpandirMarca}><ChevronRight aria-hidden="true" /></span>
              <span className={estilos.textoAcessivel}>Expandir barra lateral</span>
            </button> : <>
              <Link className={estilos.marcaProduto} href="/dashboard" aria-label="Ir ao Dashboard">
                <span className={estilos.simboloMarca}><FlaskConical aria-hidden="true" /></span>
                <span className={estilos.identidadeMarca}><strong>Learning Lab</strong><small>Laboratório Pessoal de Aprendizagem</small></span>
              </Link>
              <button
                aria-controls="menu-principal-autenticado"
                aria-expanded="true"
                className={estilos.botaoAlternar}
                onClick={alternarBarra}
                title="Recolher barra lateral"
                type="button"
              >
                <ChevronLeft aria-hidden="true" />
                <span className={estilos.textoAcessivel}>Recolher barra lateral</span>
              </button>
            </>}
        </div>

        <nav className={estilos.menuPrincipal} id="menu-principal-autenticado">
          {ITENS_NAVEGACAO.filter((item) => item.href !== "/configuracoes/ia" || administradorIa).map(({ href, rotulo, Icone }) => {
            const ativo = itemEstaAtivo(caminhoAtual, href);
            return (
              <Link aria-current={ativo ? "page" : undefined} className={ativo ? estilos.itemAtivo : undefined} href={href} key={href} title={barraRecolhida ? rotulo : undefined}>
                <Icone aria-hidden="true" />
                <span className={estilos.rotuloItem}>{rotulo}</span>
              </Link>
            );
          })}
        </nav>

        <div className={estilos.rodapeBarra}>
          <form action={sairDaConta} className={estilos.formularioSair}>
            <button type="submit" title={barraRecolhida ? "Sair da conta" : undefined}>
              <LogOut aria-hidden="true" />
              <span className={estilos.rotuloItem}>Sair</span>
            </button>
          </form>
          <PerfilUsuario classeAvatar={estilos.avatar} classeNome={estilos.nomeConta} className={estilos.botaoPerfil} fotoVersao={usuarioFotoVersao} nome={usuarioNome} />
        </div>
      </aside>
      <div className={estilos.conteudo}>{children}</div>
    </div>
  );
}
