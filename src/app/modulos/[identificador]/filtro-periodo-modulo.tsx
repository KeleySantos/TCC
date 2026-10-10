"use client";

import { CalendarRange, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import estilos from "./page.module.css";

export type PeriodoFiltroExibicao = { inicio: string; fim: string; hoje: string; ativo: boolean; erro: string | null };

export function FiltroPeriodoModulo({ aba, hrefLimpar = "?", periodo }: { aba?: string; hrefLimpar?: string; periodo: PeriodoFiltroExibicao }) {
  const [aberto, definirAberto] = useState(Boolean(periodo.erro));
  return <div className={estilos.areaFiltroPeriodo}>
    <button aria-controls="painel-filtro-periodo" aria-expanded={aberto} className={estilos.botaoFiltroPeriodo} onClick={() => definirAberto((atual) => !atual)} type="button"><CalendarRange aria-hidden="true" />Filtro<ChevronDown aria-hidden="true" /></button>
    {periodo.ativo && <span className={estilos.resumoFiltroPeriodo}>Período filtrado: {periodo.inicio} a {periodo.fim}</span>}
    <div className={estilos.painelFiltroPeriodo} hidden={!aberto} id="painel-filtro-periodo">
      <form method="get">
        {aba && <input name="aba" type="hidden" value={aba} />}
        <div><label htmlFor="inicio-filtro-modulo">Data de início</label><input defaultValue={periodo.inicio} id="inicio-filtro-modulo" max={periodo.hoje} name="inicio" required type="date" /></div>
        <div><label htmlFor="fim-filtro-modulo">Data de fim</label><input defaultValue={periodo.fim} id="fim-filtro-modulo" max={periodo.hoje} name="fim" required type="date" /></div>
        <button className={estilos.concluirFiltroPeriodo} type="submit">Concluir filtro</button>
      </form>
      {periodo.ativo && <a className={estilos.limparFiltroPeriodo} href={hrefLimpar === "?" && aba ? `?aba=${encodeURIComponent(aba)}` : hrefLimpar}><X aria-hidden="true" />Limpar filtro</a>}
      {periodo.erro && <p className="mensagem-erro" role="alert">{periodo.erro}</p>}
    </div>
  </div>;
}
