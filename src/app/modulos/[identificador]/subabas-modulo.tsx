"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { FiltroPeriodoModulo, type PeriodoFiltroExibicao } from "./filtro-periodo-modulo";
import estilos from "./page.module.css";

const SUBABAS = [
  { id: "dashboard", rotulo: "Dashboard" },
  { id: "linha-do-tempo", rotulo: "Linha do tempo" },
  { id: "sessoes-materiais", rotulo: "Sessões e Materiais" },
] as const;

type TeclaNavegacao = "ArrowLeft" | "ArrowRight" | "Home" | "End";

export function calcularIndiceSubaba(atual: number, tecla: TeclaNavegacao, quantidade: number) {
  if (tecla === "Home") return 0;
  if (tecla === "End") return quantidade - 1;
  if (tecla === "ArrowRight") return (atual + 1) % quantidade;
  return (atual - 1 + quantidade) % quantidade;
}

export function SubabasModulo({ abaInicial = "dashboard", acoesDashboard, dashboard, linhaDoTempo, periodo, sessoesMateriais }: { abaInicial?: typeof SUBABAS[number]["id"]; acoesDashboard?: ReactNode; dashboard: ReactNode; linhaDoTempo: ReactNode; periodo: PeriodoFiltroExibicao; sessoesMateriais: ReactNode }) {
  const indiceInicial = Math.max(0, SUBABAS.findIndex((subaba) => subaba.id === abaInicial));
  const [ativa, setAtiva] = useState(indiceInicial);
  const botoes = useRef<Array<HTMLButtonElement | null>>([]);
  const conteudos = [dashboard, linhaDoTempo, sessoesMateriais];

  function navegar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(evento.key)) return;
    evento.preventDefault();
    const proximo = calcularIndiceSubaba(indice, evento.key as TeclaNavegacao, SUBABAS.length);
    setAtiva(proximo);
    botoes.current[proximo]?.focus();
  }

  function selecionar(indice: number) {
    setAtiva(indice);
    const url = new URL(window.location.href);
    url.searchParams.set("aba", SUBABAS[indice].id);
    window.history.replaceState(null, "", url);
  }

  return <section className={estilos.areaSubabas} aria-label="Áreas do módulo">
    <div className={estilos.barraAbasModulo}>
      <div aria-label="Navegação interna do módulo" className={estilos.listaSubabas} role="tablist">
      {SUBABAS.map((subaba, indice) => <button
        aria-controls={`painel-subaba-${subaba.id}`}
        aria-selected={ativa === indice}
        className={estilos.botaoSubaba}
        id={`subaba-${subaba.id}`}
        key={subaba.id}
        onClick={() => selecionar(indice)}
        onKeyDown={(evento) => navegar(evento, indice)}
        ref={(elemento) => { botoes.current[indice] = elemento; }}
        role="tab"
        tabIndex={ativa === indice ? 0 : -1}
        type="button"
      >{subaba.rotulo}</button>)}
      </div>
      <div aria-label="Ações do módulo" className={estilos.acoesAbasModulo} role="group">
        <FiltroPeriodoModulo aba={SUBABAS[ativa].id} periodo={periodo} />
        {ativa === 0 && acoesDashboard}
      </div>
    </div>
    {SUBABAS.map((subaba, indice) => <div
      aria-labelledby={`subaba-${subaba.id}`}
      className={estilos.painelSubaba}
      hidden={ativa !== indice}
      id={`painel-subaba-${subaba.id}`}
      key={subaba.id}
      role="tabpanel"
      tabIndex={0}
    >{conteudos[indice]}</div>)}
  </section>;
}
