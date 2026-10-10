"use client";

import { useState } from "react";
import Link from "next/link";
import { formatarData } from "@/biblioteca/formatacao";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import estilos from "./mapa-conceitos-dashboard.module.css";

export function MapaConceitosDashboard({ dados }: { dados: DashboardObservacional }) {
  const [chaveSelecionada, definirChaveSelecionada] = useState<string | null>(null);
  const selecionado = dados.conceitos.find((item) => item.chave === chaveSelecionada) ?? null;
  const nomeModulo = (id: string) => dados.modulos.find((modulo) => modulo.id === id)?.titulo ?? "Módulo indisponível";
  const metodosRelacionados = selecionado ? [...new Set(selecionado.sessoesMencionadas.flatMap((sessao) => sessao.metodos))] : [];

  return <section aria-labelledby="titulo-mapa-conceitos" className={estilos.secao}>
    <header className={estilos.cabecalho}><div><p>CONCEITOS NOS MATERIAIS</p><h2 id="titulo-mapa-conceitos">Mapa de conceitos observados</h2><span>Os termos vêm de arquivos analisados. A presença em uma descrição de sessão é apenas uma menção; tamanho indica quantidade de registros relacionados.</span></div><strong>{dados.conceitos.length} conceito(s)</strong></header>
    {!dados.conceitos.length ? <div className={estilos.vazio}><p>Seus conceitos aparecerão aqui conforme arquivos dos módulos forem analisados. Registre sessões com descrições para observar menções.</p><Link href="/modulos">Abrir módulos</Link></div> : <>
      <div aria-label="Conceitos encontrados nos arquivos analisados" className={estilos.mapa} role="group">
        {dados.conceitos.map((conceito) => <button
          aria-controls="detalhe-conceito-dashboard" aria-pressed={selecionado?.chave === conceito.chave}
          className={estilos.no} data-volume={conceito.quantidadeSessoesMencionadas >= 5 ? "alto" : conceito.quantidadeSessoesMencionadas >= 2 ? "medio" : "baixo"}
          key={conceito.chave} onClick={() => definirChaveSelecionada(conceito.chave)} type="button"
        ><span>{conceito.nome}</span><small>{conceito.quantidadeSessoesMencionadas} menção(ões) em sessões</small></button>)}
      </div>
      <div aria-live="polite" className={estilos.detalhe} id="detalhe-conceito-dashboard">
        {selecionado ? <>
          <h3>{selecionado.nome}</h3>
          <p>{selecionado.quantidadeMateriais} {selecionado.quantidadeMateriais === 1 ? "arquivo analisado" : "arquivos analisados"} · {selecionado.quantidadeSessoesMencionadas} {selecionado.quantidadeSessoesMencionadas === 1 ? "sessão com menção" : "sessões com menção"}. Essas contagens não avaliam domínio.</p>
          <div className={estilos.colunas}><div><h4>Arquivos relacionados</h4><ul>{selecionado.materiais.map((material) => <li key={material.id}>{material.titulo} · {nomeModulo(material.moduloId)}</li>)}</ul></div><div><h4>Contexto das menções</h4>{selecionado.sessoesMencionadas.length ? <><p>Métodos registrados: {metodosRelacionados.map(formatarMetodoEstudo).join(", ") || "não informados"}.</p><ul>{selecionado.sessoesMencionadas.map((sessao) => <li key={sessao.id}>{nomeModulo(sessao.moduloId)} · {formatarData(sessao.encerradaEm)}</li>)}</ul></> : <p>Nenhuma descrição de sessão válida mencionou este conceito.</p>}</div></div>
        </> : <p>Selecione um conceito para ver os arquivos e as menções em sessões relacionadas.</p>}
      </div>
      <details className={estilos.alternativa}><summary>Ver todos os conceitos em tabela</summary><div className={estilos.tabela}><table><caption>Presença textual de conceitos, sem avaliação de aprendizagem</caption><thead><tr><th scope="col">Conceito</th><th scope="col">Arquivos</th><th scope="col">Sessões com menção</th></tr></thead><tbody>{dados.conceitos.map((conceito) => <tr key={conceito.chave}><td>{conceito.nome}</td><td>{conceito.quantidadeMateriais}</td><td>{conceito.quantidadeSessoesMencionadas}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
