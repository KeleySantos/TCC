"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { BookOpenText, Pencil, SquareStop, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TextoCartaoModulo } from "@/componentes/texto-cartao-modulo";
import { editarInstanciaVinculada, pararCompartilhamentoDaInstancia } from "./acoes";
import estilosCartao from "./page.module.css";
import estilos from "./modal-instancia-vinculada.module.css";

type PropriedadesModalInstancia = {
  vinculoId: string;
  titulo: string;
  descricao: string;
  resumo: string;
};

type ModoModal = "acoes" | "editar" | "confirmar";

export function ModalInstanciaVinculada({ vinculoId, titulo, descricao, resumo }: PropriedadesModalInstancia) {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState<ModoModal>("acoes");
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState("");
  const gatilho = useRef<HTMLButtonElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const roteador = useRouter();

  useEffect(() => {
    if (!aberto || !dialogo.current) return;
    if (typeof dialogo.current.showModal === "function") dialogo.current.showModal();
    else dialogo.current.setAttribute("open", "");
    fechar.current?.focus();
  }, [aberto]);

  function abrirModal() {
    setModo("acoes");
    setErro("");
    setAberto(true);
  }

  function fecharModal() {
    if (dialogo.current?.open && typeof dialogo.current.close === "function") dialogo.current.close();
    setAberto(false);
    setModo("acoes");
    setErro("");
    gatilho.current?.focus();
  }

  function tratarTeclado(evento: KeyboardEvent<HTMLDialogElement>) {
    if (evento.key !== "Escape") return;
    evento.preventDefault();
    fecharModal();
  }

  async function editar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPendente(true);
    setErro("");
    const resultado = await editarInstanciaVinculada({}, new FormData(evento.currentTarget));
    setPendente(false);
    if (resultado.sucesso) {
      fecharModal();
      roteador.refresh();
      return;
    }
    setErro("Não foi possível salvar as alterações.");
  }

  async function parar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPendente(true);
    setErro("");
    const resultado = await pararCompartilhamentoDaInstancia({}, new FormData(evento.currentTarget));
    setPendente(false);
    if (resultado.sucesso) {
      fecharModal();
      roteador.refresh();
      return;
    }
    setErro("Não foi possível parar o compartilhamento.");
  }

  return <>
    <button aria-label={`Gerenciar instância ${titulo}`} className={`${estilosCartao.cartaoModulo} ${estilos.gatilho}`} onClick={abrirModal} ref={gatilho} type="button">
      <span className={estilosCartao.iconeModuloSala}><BookOpenText aria-hidden="true" /></span>
      <span className={estilosCartao.conteudoCartaoSala}>
        <TextoCartaoModulo variante="claro">{titulo}</TextoCartaoModulo>
        <span className={`${estilosCartao.papelCartaoSala} ${estilosCartao.resumoModuloSala}`}>{resumo}</span>
      </span>
    </button>

    {aberto && <dialog aria-labelledby="titulo-modal-instancia" aria-modal="true" className={estilos.dialogo} onCancel={(evento) => { evento.preventDefault(); fecharModal(); }} onKeyDown={tratarTeclado} ref={dialogo}>
      <div className={estilos.cabecalho}>
        <div><p>INSTÂNCIA VINCULADA</p><h2 id="titulo-modal-instancia">Gerenciar {titulo}</h2></div>
        <button aria-label="Fechar" className={estilos.fechar} onClick={fecharModal} ref={fechar} type="button"><X aria-hidden="true" /></button>
      </div>

      {modo === "acoes" && <div className={estilos.acoes}>
        <button onClick={() => setModo("editar")} type="button"><Pencil aria-hidden="true" />Editar</button>
        <button className={estilos.perigo} onClick={() => setModo("confirmar")} type="button"><SquareStop aria-hidden="true" />Parar compartilhamento</button>
      </div>}

      {modo === "editar" && <form className={estilos.formulario} onSubmit={editar}>
        <input name="vinculoId" type="hidden" value={vinculoId} />
        <label>Nome da instância<input defaultValue={titulo} maxLength={120} minLength={3} name="titulo" required /></label>
        <label>Descrição<textarea defaultValue={descricao} maxLength={500} minLength={3} name="descricao" required rows={3} /></label>
        {erro && <p className={estilos.erro} role="alert">{erro}</p>}
        <div className={estilos.rodape}><button onClick={() => setModo("acoes")} type="button">Cancelar</button><button className={estilos.primario} disabled={pendente} type="submit">{pendente ? "Salvando..." : "Salvar alterações"}</button></div>
      </form>}

      {modo === "confirmar" && <form className={estilos.confirmacao} onSubmit={parar}>
        <input name="vinculoId" type="hidden" value={vinculoId} />
        <h3>Parar compartilhamento?</h3>
        <p>A instância permanecerá em Módulos, mas deixará de receber atualizações e não aparecerá mais nesta sala.</p>
        {erro && <p className={estilos.erro} role="alert">{erro}</p>}
        <div className={estilos.rodape}><button onClick={() => setModo("acoes")} type="button">Cancelar</button><button className={estilos.perigoConfirmacao} disabled={pendente} type="submit">{pendente ? "Parando..." : "Confirmar parada do compartilhamento"}</button></div>
      </form>}
    </dialog>}
  </>;
}
