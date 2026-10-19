"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ConteudoDashboardModulo } from "@/app/modulos/[identificador]/conteudo-dashboard-modulo";
import { FiltroPeriodoModulo, type PeriodoFiltroExibicao } from "@/app/modulos/[identificador]/filtro-periodo-modulo";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import type { DashboardModuloCompartilhado } from "@/servidor/dashboard-compartilhado";
import estilos from "@/app/modulos/[identificador]/page.module.css";
import estilosCompartilhados from "./page.module.css";

export function DashboardCompartilhado({ inicial, periodo }: { inicial: DashboardModuloCompartilhado; periodo: PeriodoFiltroExibicao }) {
  const [dados, definirDados] = useState<DashboardModuloCompartilhado | null>(inicial);
  const [erro, definirErro] = useState("");
  const sequencia = useRef(0);
  const acessoPerdido = useRef(false);
  const moduloId = inicial.modulo.id;
  const perderAcesso = useCallback(() => { acessoPerdido.current = true; sequencia.current++; definirDados(null); definirErro(""); }, []);
  useEffect(() => {
    let desmontado = false;
    async function atualizar() {
      if (acessoPerdido.current || document.visibilityState === "hidden") return;
      const pedido = ++sequencia.current;
      const consulta = periodo.ativo ? `?${new URLSearchParams({ inicio: periodo.inicio, fim: periodo.fim })}` : "";
      try {
        const resposta = await fetch(`/api/compartilhamentos/modulos/${encodeURIComponent(moduloId)}${consulta}`, { cache: "no-store" });
        if (desmontado || pedido !== sequencia.current) return;
        if ([401, 403, 404].includes(resposta.status)) { perderAcesso(); return; }
        if (!resposta.ok) throw new Error("Falha ao consultar dashboard");
        const retorno = await resposta.json();
        if (!desmontado && pedido === sequencia.current && !acessoPerdido.current) { definirDados(retorno.dashboard); definirErro(""); }
      } catch { if (!desmontado && pedido === sequencia.current && !acessoPerdido.current) definirErro("Não foi possível atualizar o dashboard. Verifique sua conexão e tente novamente."); }
    }
    const retomar = () => { void atualizar(); };
    window.addEventListener("focus", retomar); document.addEventListener("visibilitychange", retomar);
    return () => { desmontado = true; window.removeEventListener("focus", retomar); document.removeEventListener("visibilitychange", retomar); };
  }, [moduloId, periodo.ativo, periodo.inicio, periodo.fim, perderAcesso]);

  if (!dados) return <section className={estilosCompartilhados.aviso}><h1>Acesso indisponível</h1><p role="alert">Seu acesso a este dashboard não está mais disponível.</p><Link href="/salas?aba=compartilhado-comigo">Voltar a Compartilhado comigo</Link></section>;
  return <>
    <header className={estilos.cabecalhoModulo}>
      <Link className={estilos.voltarModulo} href="/salas?aba=compartilhado-comigo"><ArrowLeft aria-hidden="true" />Compartilhado comigo</Link>
      <div className={estilos.identidadeModulo}><div className={estilos.tituloEditavel}><div><p className={estilos.sobretituloPagina}>MÓDULO COMPARTILHADO</p><h1>{dados.modulo.titulo}</h1><p>Compartilhado por: {dados.modulo.proprietarioNome} · Somente leitura</p></div></div></div>
    </header>
    <div className={estilosCompartilhados.acoes}>
      <FiltroPeriodoModulo periodo={periodo} />
      <InterpretacaoAutomatica aoPerderAcesso={perderAcesso} compacto fim={periodo.ativo ? periodo.fim : undefined} inicio={periodo.ativo ? periodo.inicio : undefined} modalLateral moduloCompartilhadoId={moduloId} />
    </div>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <ConteudoDashboardModulo aprendizagem={dados.aprendizagem} metricas={dados.metricas} tituloModulo={dados.modulo.titulo} visualEnxuto />
  </>;
}
