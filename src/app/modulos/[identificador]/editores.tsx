"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useFormStatus } from "react-dom";
import { atualizarModulo } from "../acoes";
import estilos from "./page.module.css";

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <button className={estilos.botaoPrimario} disabled={pending} type="submit"><Check aria-hidden="true" />{pending ? "Salvando..." : rotulo}</button>;
}

export function EditorModulo({ id, identificador, inicialmenteEditando, titulo, descricao }: {
  id: string;
  identificador: string;
  inicialmenteEditando: boolean;
  titulo: string;
  descricao: string;
}) {
  const [editando, definirEditando] = useState(inicialmenteEditando);
  const idFormulario = `editor-modulo-${id}`;

  return <div className={estilos.identidadeModulo}>
    <div className={estilos.tituloEditavel}>
      <div>
        <p className={estilos.sobretituloPagina}>MÓDULO DE APRENDIZAGEM</p>
        <h1>{titulo}</h1>
        <p>{descricao}</p>
      </div>
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
