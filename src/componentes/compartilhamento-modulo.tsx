"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Share2, X } from "lucide-react";
import type { ResumoCompartilhamentoModulo } from "@/servidor/compartilhamento-modulos";
import estilosModal from "./perfil-usuario.module.css";
import estilos from "./compartilhamento-modulo.module.css";

export function CompartilhamentoModulo({ identificadorModulo, titulo }: { identificadorModulo: string; titulo: string }) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const abrirBotao = useRef<HTMLButtonElement>(null);
  const codigoCampo = useRef<HTMLInputElement>(null);
  const tituloId = useId();
  const [dados, definirDados] = useState<ResumoCompartilhamentoModulo | null>(null);
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState("");
  const [aviso, definirAviso] = useState("");
  const [confirmacao, definirConfirmacao] = useState<{ convidadoId?: string; nome?: string } | null>(null);
  const endpoint = `/api/modulos/${encodeURIComponent(identificadorModulo)}/compartilhamento`;

  const carregar = useCallback(async () => {
    const resposta = await fetch(endpoint, { cache: "no-store" });
    if (!resposta.ok) throw new Error("Não foi possível consultar o compartilhamento.");
    definirDados((await resposta.json()).compartilhamento);
  }, [endpoint]);
  const executar = useCallback(async (operacao: () => Promise<void>) => {
    definirOcupado(true); definirErro(""); definirAviso("");
    try { await operacao(); } catch { definirErro("Não foi possível concluir a operação. Tente novamente."); }
    finally { definirOcupado(false); }
  }, []);
  useEffect(() => {
    const retomar = () => { if (dialogo.current?.open) void executar(carregar); };
    window.addEventListener("focus", retomar);
    return () => window.removeEventListener("focus", retomar);
  }, [carregar, executar]);

  async function gerar() {
    await executar(async () => {
      const resposta = await fetch(endpoint, { method: "POST" });
      if (!resposta.ok) throw new Error("Falha ao gerar código");
      definirDados((await resposta.json()).compartilhamento);
      router.refresh();
    });
  }
  async function confirmar() {
    if (!confirmacao) return;
    const alvo = confirmacao.convidadoId ? `${endpoint}/${encodeURIComponent(confirmacao.convidadoId)}` : endpoint;
    await executar(async () => {
      const resposta = await fetch(alvo, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Falha ao revogar acesso");
      definirConfirmacao(null);
      await carregar(); router.refresh();
    });
  }
  async function copiar() {
    if (!dados?.codigo) return;
    try { await navigator.clipboard.writeText(dados.codigo); definirAviso("Código copiado."); }
    catch { codigoCampo.current?.select(); definirAviso("Não foi possível copiar automaticamente; copie manualmente o código selecionado."); }
  }

  return <>
    <button aria-label="Compartilhar" className={estilos.botaoAbrir} onClick={() => { definirConfirmacao(null); dialogo.current?.showModal(); void executar(carregar); }} ref={abrirBotao} title="Compartilhar módulo" type="button"><Share2 aria-hidden="true" size={17} /></button>
    <dialog aria-labelledby={tituloId} className={estilosModal.dialogo} onClick={(evento) => { if (evento.target === evento.currentTarget) dialogo.current?.close(); }} onClose={() => abrirBotao.current?.focus()} ref={dialogo}>
      <header className={estilosModal.cabecalho}><div><h2 id={tituloId}>Compartilhamento do módulo</h2><p className={estilos.nomeModulo}>{titulo}</p></div><button aria-label="Fechar compartilhamento" onClick={() => dialogo.current?.close()} type="button"><X aria-hidden="true" size={20} /></button></header>
      <div className={estilosModal.conteudo}>
        <section className={estilosModal.secao}>
          <p>Compartilhe somente o dashboard e seus insights. Seus convidados não podem editar registros ou acessar materiais privados.</p>
          {ocupado && <p role="status">Atualizando compartilhamento...</p>}
          {erro && <p className={estilosModal.erro} role="alert">{erro}</p>}
          {aviso && <p className={estilosModal.sucesso} role="status">{aviso}</p>}
          {dados && <fieldset disabled={ocupado} className={estilos.controles}>
            {dados.codigo ? <><label>Código de compartilhamento<input onFocus={(evento) => evento.currentTarget.select()} readOnly ref={codigoCampo} value={dados.codigo} /></label><button onClick={() => void copiar()} type="button"><Copy aria-hidden="true" size={16} />Copiar código</button></> : <button onClick={() => void gerar()} type="button">Gerar código de compartilhamento</button>}
            <strong>{dados.quantidadeAtivos} de 3 pessoas</strong>
            {dados.quantidadeAtivos === 3 && <p>Não há vagas. Remova um acesso para permitir outra pessoa.</p>}
            <ul className={estilos.convidados}>{dados.convidados.map((convidado) => <li key={convidado.usuarioId}><span>{convidado.nome}</span><button aria-label={`Remover acesso de ${convidado.nome}`} onClick={() => definirConfirmacao({ convidadoId: convidado.usuarioId, nome: convidado.nome })} type="button">Remover acesso</button></li>)}</ul>
            {!dados.convidados.length && <p>Nenhuma pessoa possui acesso neste momento.</p>}
            {dados.codigo && <button className={estilos.perigo} onClick={() => definirConfirmacao({})} type="button">Encerrar compartilhamento</button>}
          </fieldset>}
        </section>
        {confirmacao && <section aria-label="Confirmar revogação" className={estilos.confirmacao} role="alertdialog"><p>{confirmacao.convidadoId ? `Remover o acesso de ${confirmacao.nome}?` : "Encerrar todos os acessos e invalidar o código atual?"}</p><div><button autoFocus disabled={ocupado} onClick={() => definirConfirmacao(null)} type="button">Cancelar</button><button disabled={ocupado} onClick={() => void confirmar()} type="button">{confirmacao.convidadoId ? "Confirmar remoção" : "Confirmar encerramento"}</button></div></section>}
      </div>
    </dialog>
  </>;
}
