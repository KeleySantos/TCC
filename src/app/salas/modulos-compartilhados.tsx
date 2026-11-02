"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpenText, Share2 } from "lucide-react";
import { TextoCartaoModulo } from "@/componentes/texto-cartao-modulo";
import type { listarModulosCompartilhados } from "@/servidor/compartilhamento-modulos";
import estilos from "./page.module.css";
type ModuloRecebido = Awaited<ReturnType<typeof listarModulosCompartilhados>>[number];
export function ModulosCompartilhados({ iniciais }: { iniciais: ModuloRecebido[] }) {
  const [modulos, definirModulos] = useState(iniciais);
  const [erro, definirErro] = useState("");
  const sequencia = useRef(0);
  async function atualizar() {
    const pedido = ++sequencia.current;
    const resposta = await fetch("/api/compartilhamentos/modulos", { cache: "no-store" });
    if (!resposta.ok) {
      if (resposta.status === 401 && pedido === sequencia.current) definirModulos([]);
      throw new Error("Falha ao consultar módulos");
    }
    const dados = await resposta.json();
    if (pedido === sequencia.current) definirModulos(dados.modulos);
  }
  useEffect(() => {
    const controle = sequencia;
    const retomar = () => { if (document.visibilityState !== "hidden") void atualizar().catch(() => definirErro("Não foi possível atualizar seus acessos. Tente novamente.")); };
    window.addEventListener("focus", retomar); document.addEventListener("visibilitychange", retomar);
    return () => { controle.current++; window.removeEventListener("focus", retomar); document.removeEventListener("visibilitychange", retomar); };
  }, []);
  return <section aria-label="Compartilhado comigo">
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    <div className={estilos.gradeSalas}>{modulos.map((modulo) => <Link className={estilos.cartaoSalaBiblioteca} href={`/salas/compartilhados/${encodeURIComponent(modulo.moduloId)}`} key={modulo.moduloId} prefetch={false}><span className={estilos.iconeCartaoSala}><BookOpenText aria-hidden="true" /></span><span className={estilos.conteudoCartaoSala}><TextoCartaoModulo>{modulo.titulo}</TextoCartaoModulo><span className={estilos.papelCartaoSala}>Compartilhado por {modulo.proprietarioNome}</span></span></Link>)}</div>
    {!modulos.length && <div className={estilos.estadoVazio}><Share2 aria-hidden="true" /><h3>Nenhum módulo compartilhado com você</h3><p>Insira o código fornecido pelo proprietário para acompanhar um dashboard.</p></div>}
  </section>;
}
