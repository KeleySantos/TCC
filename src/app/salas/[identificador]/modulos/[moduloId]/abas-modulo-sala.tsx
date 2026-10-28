"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import estilos from "./page.module.css";

type MembroModuloSala = {
  id: string;
  nome: string;
  resumo: string;
  estado: "vinculado" | "aguardando_vinculo";
  conteudo?: ReactNode;
};

const ABAS = ["dashboard", "membros"] as const;

export function AbasModuloSala({ abaInicial = "dashboard", cabecalhoMembros, dashboard, membros }: { abaInicial?: typeof ABAS[number]; cabecalhoMembros?: ReactNode; dashboard: ReactNode; membros: MembroModuloSala[] }) {
  const [abaAtiva, definirAbaAtiva] = useState(abaInicial);
  const [membroAtivo, definirMembroAtivo] = useState(membros[0]?.id ?? "");
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);
  const selecionado = membros.find((membro) => membro.id === membroAtivo) ?? membros[0];

  function navegar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(evento.key)) return;
    evento.preventDefault();
    const proximo = evento.key === "Home" ? 0 : evento.key === "End" ? ABAS.length - 1 : evento.key === "ArrowRight" ? (indice + 1) % ABAS.length : (indice - 1 + ABAS.length) % ABAS.length;
    definirAbaAtiva(ABAS[proximo]);
    botoes.current[proximo]?.focus();
  }

  return <section aria-label="Áreas do módulo da sala" className={estilos.areaAbas}>
    <div aria-label="Navegação interna do módulo da sala" className={estilos.listaAbas} role="tablist">
      {ABAS.map((aba, indice) => <button
        aria-controls={`painel-modulo-sala-${aba}`}
        aria-selected={abaAtiva === aba}
        className={estilos.botaoAba}
        id={`aba-modulo-sala-${aba}`}
        key={aba}
        onClick={() => definirAbaAtiva(aba)}
        onKeyDown={(evento) => navegar(evento, indice)}
        ref={(elemento) => { botoes.current[indice] = elemento; }}
        role="tab"
        tabIndex={abaAtiva === aba ? 0 : -1}
        type="button"
      >{aba === "dashboard" ? "Dashboard" : "Membros"}</button>)}
    </div>

    <div aria-labelledby="aba-modulo-sala-dashboard" hidden={abaAtiva !== "dashboard"} id="painel-modulo-sala-dashboard" role="tabpanel" tabIndex={0}>{dashboard}</div>
    <div aria-labelledby="aba-modulo-sala-membros" hidden={abaAtiva !== "membros"} id="painel-modulo-sala-membros" role="tabpanel" tabIndex={0}>
      {cabecalhoMembros && <div className={estilos.cabecalhoMembros}>{cabecalhoMembros}</div>}
      {membros.length ? <div className={estilos.gradeMembros}>
        <nav aria-label="Participantes do módulo" className={estilos.listaMembros}>{membros.map((membro) => <button aria-pressed={selecionado?.id === membro.id} key={membro.id} onClick={() => definirMembroAtivo(membro.id)} type="button"><strong>{membro.nome}</strong><span>{membro.resumo}</span></button>)}</nav>
        <section aria-live="polite" className={estilos.dashboardMembro}>{selecionado?.estado === "aguardando_vinculo"
          ? <><p className={estilos.estadoAguardando}>{selecionado.nome} ainda precisa criar ou vincular uma instância pessoal para alimentar o dashboard.</p>{selecionado.conteudo}</>
          : selecionado?.conteudo}</section>
      </div> : <p className={estilos.estadoVazio}>Nenhum participante vinculado a este módulo.</p>}
    </div>
  </section>;
}
