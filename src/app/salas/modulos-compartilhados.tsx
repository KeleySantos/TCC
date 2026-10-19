"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpenText, Share2 } from "lucide-react";
import type { listarModulosCompartilhados } from "@/servidor/compartilhamento-modulos";
import estilos from "./page.module.css";
type ModuloRecebido = Awaited<ReturnType<typeof listarModulosCompartilhados>>[number];
const mensagens: Record<string, string> = {
  CODIGO_INVALIDO: "O código do módulo é inválido ou está inativo.",
  MODULO_PROPRIO: "Esse módulo já pertence a você.",
  CAPACIDADE_COMPLETA: "O módulo já está compartilhado com 3 pessoas.",
  TENTE_NOVAMENTE: "Outra adesão está em andamento. Tente novamente.",
};

export function ModulosCompartilhados({ iniciais }: { iniciais: ModuloRecebido[] }) {
  const [modulos, definirModulos] = useState(iniciais);
  const [codigo, definirCodigo] = useState("");
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState("");
  const [aviso, definirAviso] = useState("");
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
  async function aderir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); definirOcupado(true); definirErro(""); definirAviso("");
    try {
      const resposta = await fetch("/api/compartilhamentos/modulos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo }) });
      const dados = await resposta.json();
      if (!resposta.ok) { definirErro(mensagens[dados.erro] ?? "Não foi possível acessar o módulo. Tente novamente."); return; }
      await atualizar(); definirCodigo("");
      definirAviso(dados.jaPossuiAcesso ? "Você já possui acesso a esse dashboard." : "Dashboard adicionado aos seus compartilhamentos.");
    } catch { definirErro("Não foi possível acessar o módulo. Verifique sua conexão e tente novamente."); }
    finally { definirOcupado(false); }
  }
  return <section aria-labelledby="titulo-compartilhados">
    <div className={estilos.cabecalhoBibliotecaSalas}><div><p className={estilos.sobretitulo}>DASHBOARDS COMPARTILHADOS</p><h2 id="titulo-compartilhados">Compartilhado comigo</h2></div></div>
    <form className={estilos.formularioCodigoModulo} onSubmit={aderir}><label>Código do módulo<input autoCapitalize="characters" disabled={ocupado} maxLength={80} name="codigoModulo" onChange={(evento) => definirCodigo(evento.target.value)} required value={codigo} /></label><button className="botao" disabled={ocupado} type="submit">{ocupado ? "Acessando..." : "Acessar por código"}</button></form>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}{aviso && <p className="mensagem-sucesso" role="status">{aviso}</p>}
    <div className={estilos.gradeSalas}>{modulos.map((modulo) => <Link className={estilos.cartaoSalaBiblioteca} href={`/salas/compartilhados/${encodeURIComponent(modulo.moduloId)}`} key={modulo.moduloId} prefetch={false}><span className={estilos.iconeCartaoSala}><BookOpenText aria-hidden="true" /></span><span className={estilos.conteudoCartaoSala}><strong>{modulo.titulo}</strong><small>Compartilhado por: {modulo.proprietarioNome}</small><span className={estilos.papelCartaoSala}>Dashboard · Somente leitura</span></span></Link>)}</div>
    {!modulos.length && <div className={estilos.estadoVazio}><Share2 aria-hidden="true" /><h3>Nenhum módulo compartilhado com você</h3><p>Insira o código fornecido pelo proprietário para acompanhar um dashboard.</p></div>}
  </section>;
}
