"use client";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { calcularIndiceSubaba } from "@/app/modulos/[identificador]/subabas-modulo";
import estilos from "./abas-salas.module.css";
const ABAS = [{ id: "salas", nome: "Salas" }, { id: "compartilhado-comigo", nome: "Compartilhado comigo" }] as const;

export function AbasSalas({ salas, compartilhados, abaInicial = "salas" }: { salas: ReactNode; compartilhados: ReactNode; abaInicial?: string }) {
  const [ativa, definirAtiva] = useState(abaInicial === "compartilhado-comigo" ? 1 : 0);
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);
  function selecionar(indice: number) {
    definirAtiva(indice);
    const url = new URL(window.location.href); url.searchParams.set("aba", ABAS[indice].id);
    window.history.replaceState(null, "", url);
  }
  function navegar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight" && evento.key !== "Home" && evento.key !== "End") return;
    evento.preventDefault();
    const proximo = calcularIndiceSubaba(indice, evento.key, ABAS.length);
    selecionar(proximo); botoes.current[proximo]?.focus();
  }
  return <section className={estilos.area} aria-label="Áreas de compartilhamento">
    <div aria-label="Navegação de Salas" className={estilos.lista} role="tablist">{ABAS.map((aba, indice) => <button aria-controls={`painel-salas-${aba.id}`} aria-selected={ativa === indice} className={estilos.botao} id={`aba-salas-${aba.id}`} key={aba.id} onClick={() => selecionar(indice)} onKeyDown={(evento) => navegar(evento, indice)} ref={(elemento) => { botoes.current[indice] = elemento; }} role="tab" tabIndex={ativa === indice ? 0 : -1} type="button">{aba.nome}</button>)}</div>
    {ABAS.map((aba, indice) => <div aria-labelledby={`aba-salas-${aba.id}`} className={estilos.painel} hidden={ativa !== indice} id={`painel-salas-${aba.id}`} key={aba.id} role="tabpanel" tabIndex={0}>{indice === 0 ? salas : compartilhados}</div>)}
  </section>;
}
