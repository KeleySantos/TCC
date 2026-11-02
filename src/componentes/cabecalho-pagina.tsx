import type { ReactNode } from "react";
import { Subtitulo } from "./subtitulo";
import estilos from "./cabecalho-pagina.module.css";

type PropriedadesCabecalhoPagina = {
  titulo: ReactNode;
  preTitulo?: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
  idTitulo?: string;
};

export function CabecalhoPagina({ titulo, preTitulo, descricao, acoes, idTitulo }: PropriedadesCabecalhoPagina) {
  const trilhaPreTitulo = preTitulo === undefined || preTitulo === null;

  return <header aria-labelledby={idTitulo} className={estilos.cabecalho}>
    <div
      aria-hidden={trilhaPreTitulo ? "true" : undefined}
      className={estilos.trilhaPreTitulo}
      data-trilha-pre-titulo={trilhaPreTitulo ? "vazia" : "preenchida"}
    >{preTitulo}</div>
    <div className={estilos.linhaPrincipal}>
      <div className={estilos.texto}>
        <h1 id={idTitulo}>{titulo}</h1>
        {descricao !== undefined && descricao !== null && <Subtitulo className={estilos.descricao} como="p">{descricao}</Subtitulo>}
      </div>
      {acoes && <div className={estilos.acoes} data-acoes-cabecalho="true">{acoes}</div>}
    </div>
  </header>;
}
