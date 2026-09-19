"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { atualizarModulo, atualizarTopico } from "../acoes";
import estilos from "./page.module.css";

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <button className={estilos.botaoPrimario} disabled={pending} type="submit"><Check aria-hidden="true" />{pending ? "Salvando..." : rotulo}</button>;
}

export function EditorModulo({
  id,
  identificador,
  titulo,
  descricao,
}: {
  id: string;
  identificador: string;
  titulo: string;
  descricao: string;
}) {
  const [editando, definirEditando] = useState(false);
  const idFormulario = `editor-modulo-${id}`;

  return <div className={estilos.identidadeModulo}>
    <div className={estilos.tituloEditavel}>
      <div>
        <p className={estilos.sobretituloPagina}>MÓDULO DE APRENDIZAGEM</p>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>
      <button
        aria-controls={idFormulario}
        aria-expanded={editando}
        aria-label={editando ? "Fechar edição do módulo" : "Editar nome e descrição do módulo"}
        className={estilos.botaoIcone}
        onClick={() => definirEditando((estado) => !estado)}
        title="Editar módulo"
        type="button"
      >
        {editando ? <X aria-hidden="true" /> : <Pencil aria-hidden="true" />}
      </button>
    </div>

    {editando && <form action={atualizarModulo} className={estilos.formularioEdicao} id={idFormulario}>
      <input name="id" type="hidden" value={id} />
      <input name="identificadorAtual" type="hidden" value={identificador} />
      <div className={estilos.campo}>
        <label htmlFor={`nome-modulo-${id}`}>Nome do módulo</label>
        <input autoFocus defaultValue={titulo} id={`nome-modulo-${id}`} maxLength={120} minLength={3} name="titulo" required type="text" />
      </div>
      <div className={estilos.campo}>
        <label htmlFor={`descricao-modulo-${id}`}>Descrição</label>
        <textarea defaultValue={descricao} id={`descricao-modulo-${id}`} maxLength={500} minLength={3} name="descricao" required rows={3} />
      </div>
      <div className={estilos.acoesFormulario}>
        <BotaoSalvar rotulo="Salvar módulo" />
        <button className={estilos.botaoTexto} onClick={() => definirEditando(false)} type="button">Cancelar</button>
      </div>
    </form>}
  </div>;
}

export function EditorTopico({
  id,
  identificadorModulo,
  nome,
  descricao,
  rascunho,
  inicialmenteEditando,
}: {
  id: string;
  identificadorModulo: string;
  nome: string;
  descricao: string;
  rascunho: boolean;
  inicialmenteEditando: boolean;
}) {
  const [editando, definirEditando] = useState(inicialmenteEditando);
  const idFormulario = `editor-topico-${id}`;

  return <div className={estilos.editorTopico}>
    <div className={estilos.tituloEditavel}>
      <div>
        {rascunho && <span className={estilos.seloRascunho}>Rascunho</span>}
        <h3>{rascunho ? "Tópico sem nome" : nome}</h3>
        <p>{rascunho ? "Defina um nome e uma descrição para começar." : descricao}</p>
      </div>
      <button
        aria-controls={idFormulario}
        aria-expanded={editando}
        aria-label={editando ? "Fechar edição do tópico" : `Editar o tópico ${nome}`}
        className={estilos.botaoIcone}
        onClick={() => definirEditando((estado) => !estado)}
        title={rascunho ? "Configurar tópico" : "Editar tópico"}
        type="button"
      >
        {editando ? <X aria-hidden="true" /> : <Pencil aria-hidden="true" />}
      </button>
    </div>

    {editando && <form action={atualizarTopico} className={estilos.formularioEdicao} id={idFormulario}>
      <input name="id" type="hidden" value={id} />
      <input name="identificadorModulo" type="hidden" value={identificadorModulo} />
      <div className={estilos.campo}>
        <label htmlFor={`nome-topico-${id}`}>Nome do tópico</label>
        <input autoFocus={inicialmenteEditando} defaultValue={nome} id={`nome-topico-${id}`} maxLength={120} minLength={3} name="titulo" placeholder="Ex.: Estruturas condicionais" required type="text" />
      </div>
      <div className={estilos.campo}>
        <label htmlFor={`descricao-topico-${id}`}>Descrição</label>
        <textarea defaultValue={descricao} id={`descricao-topico-${id}`} maxLength={500} minLength={3} name="descricao" placeholder="O que será estudado neste tópico?" required rows={3} />
      </div>
      <div className={estilos.acoesFormulario}>
        <BotaoSalvar rotulo={rascunho ? "Criar tópico" : "Salvar tópico"} />
        <button className={estilos.botaoTexto} onClick={() => definirEditando(false)} type="button">Cancelar</button>
      </div>
    </form>}
  </div>;
}
