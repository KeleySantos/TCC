"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import estilos from "./perfil-usuario.module.css";

type Perfil = { nome: string; nomeUsuario: string; administradorIa: boolean; fotoVersao: string | null };
const erros: Record<string, string> = {
  DADOS_INVALIDOS: "Confira os campos e a confirmação. A nova senha precisa ter pelo menos oito caracteres.",
  SENHA_INCORRETA: "A senha atual não confere.",
  NOME_EXISTENTE: "Esse nome de usuário já está em uso ou é reservado.",
  ADMIN_PROTEGIDO: "O login e a exclusão da conta ADMIN são protegidos para manter a configuração global da IA.",
  FOTO_INVALIDA: "Selecione uma imagem JPG, PNG ou WebP válida, de até 2 MB.",
};

export function PerfilUsuario({ nome, fotoVersao, className, classeAvatar, classeNome }: { nome: string; fotoVersao?: string | null; className?: string; classeAvatar?: string; classeNome?: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const roteador = useRouter();
  const [perfil, definirPerfil] = useState<Perfil | null>(null);
  const [processando, definirProcessando] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState<{ erro: boolean; texto: string } | null>(null);
  const nomeAtual = perfil?.nome ?? nome;
  const versaoAtual = perfil ? perfil.fotoVersao : fotoVersao;
  const urlFoto = versaoAtual ? `/api/perfil/foto?v=${encodeURIComponent(versaoAtual)}` : null;

  async function abrir() {
    definirMensagem(null);
    definirPerfil(null);
    dialogo.current?.showModal();
    definirProcessando("CARREGAR");
    try {
      const resposta = await fetch("/api/perfil", { cache: "no-store" });
      if (!resposta.ok) throw new Error();
      definirPerfil((await resposta.json()).perfil);
    } catch { definirMensagem({ erro: true, texto: "Não foi possível carregar o perfil. Feche e tente novamente." }); }
    finally { definirProcessando(null); }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>, operacao: "NOME" | "SENHA" | "FOTO" | "EXCLUIR") {
    evento.preventDefault();
    if (processando) return;
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    dados.set("operacao", operacao);
    definirMensagem(null);
    definirProcessando(operacao);
    try {
      const resposta = await fetch("/api/perfil", operacao === "EXCLUIR"
        ? { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senhaAtual: dados.get("senhaAtual"), confirmacao: dados.get("confirmacao") }) }
        : { method: "PATCH", body: dados });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(erros[resultado.erro] ?? "Não foi possível salvar a alteração. Tente novamente.");
      if (operacao === "EXCLUIR") {
        dialogo.current?.close();
        roteador.replace("/entrar");
        roteador.refresh();
        return;
      }
      if (resultado.perfil) definirPerfil(resultado.perfil);
      if (operacao !== "NOME") formulario.reset();
      definirMensagem({ erro: false, texto: operacao === "SENHA" ? "Senha atualizada." : operacao === "FOTO" ? "Foto de perfil atualizada." : "Nome atualizado. Use o novo nome de usuário no próximo login." });
      roteador.refresh();
    } catch (erro) { definirMensagem({ erro: true, texto: erro instanceof Error ? erro.message : "Não foi possível concluir a operação." }); }
    finally { definirProcessando(null); }
  }

  return <>
    <button aria-haspopup="dialog" aria-label={`Abrir configurações do perfil de ${nomeAtual}`} className={className} onClick={abrir} ref={botao} title="Configurações do perfil" type="button">
      <span className={classeAvatar} aria-hidden="true">{urlFoto ? <Image alt="" height={34} src={urlFoto} unoptimized width={34} /> : nomeAtual.trim().slice(0, 1).toUpperCase()}</span>
      <span className={classeNome}>{nomeAtual}</span>
    </button>
    <dialog aria-labelledby="titulo-configuracoes-perfil" className={estilos.dialogo} onClick={(evento) => { if (evento.target === evento.currentTarget) dialogo.current?.close(); }} onClose={() => botao.current?.focus()} ref={dialogo}>
      <header className={estilos.cabecalho}><div><p>SUA CONTA</p><h2 id="titulo-configuracoes-perfil">Configurações do perfil</h2></div><button aria-label="Fechar configurações do perfil" onClick={() => dialogo.current?.close()} type="button"><X aria-hidden="true" /></button></header>
      <div className={estilos.conteudo}>
        {processando === "CARREGAR" && <p role="status">Carregando perfil...</p>}
        {mensagem && <p className={mensagem.erro ? estilos.erro : estilos.sucesso} role={mensagem.erro ? "alert" : "status"}>{mensagem.texto}</p>}
        {perfil && <>
          <form className={estilos.secao} onSubmit={(evento) => enviar(evento, "NOME")}>
            <h3>Alterar nome de usuário</h3>
            <fieldset disabled={Boolean(processando)}>
              <label htmlFor="perfil-nome">Nome exibido<input defaultValue={perfil.nome} id="perfil-nome" maxLength={80} minLength={2} name="nome" required /></label>
              <label htmlFor="perfil-login">Nome de usuário<input autoCapitalize="none" autoComplete="username" defaultValue={perfil.nomeUsuario} id="perfil-login" maxLength={40} minLength={2} name="nomeUsuario" pattern="[a-z0-9]+([._-][a-z0-9]+)*" readOnly={perfil.administradorIa} required /></label>
              <p>Use letras minúsculas, números, ponto, hífen ou sublinhado. Esse é o identificador usado para entrar.</p>
              {perfil.administradorIa && <p>O login admin é reservado à configuração global da IA.</p>}
              <button type="submit">{processando === "NOME" ? "Salvando..." : "Salvar nome"}</button>
            </fieldset>
          </form>
          <form className={estilos.secao} onSubmit={(evento) => enviar(evento, "SENHA")}>
            <h3>Alterar senha</h3>
            <fieldset disabled={Boolean(processando)}>
              <label htmlFor="perfil-senha-atual">Senha atual<input autoComplete="current-password" id="perfil-senha-atual" maxLength={128} name="senhaAtual" required type="password" /></label>
              <label htmlFor="perfil-nova-senha">Nova senha<input autoComplete="new-password" id="perfil-nova-senha" maxLength={128} minLength={8} name="novaSenha" required type="password" /></label>
              <label htmlFor="perfil-confirmar-senha">Confirmar nova senha<input autoComplete="new-password" id="perfil-confirmar-senha" maxLength={128} minLength={8} name="confirmarSenha" required type="password" /></label>
              <button type="submit">{processando === "SENHA" ? "Salvando..." : "Salvar senha"}</button>
            </fieldset>
          </form>
          <form className={estilos.secao} onSubmit={(evento) => enviar(evento, "FOTO")}>
            <h3>Alterar foto de perfil</h3>
            <fieldset disabled={Boolean(processando)}>
              {urlFoto && <Image alt="Foto de perfil atual" className={estilos.foto} height={72} src={urlFoto} unoptimized width={72} />}
              <label htmlFor="perfil-foto">Nova foto<input accept="image/jpeg,image/png,image/webp" id="perfil-foto" name="foto" required type="file" /></label>
              <p>JPG, PNG ou WebP, até 2 MB.</p>
              <button type="submit">{processando === "FOTO" ? "Enviando..." : "Salvar foto"}</button>
            </fieldset>
          </form>
          <section className={`${estilos.secao} ${estilos.exclusao}`}>
            <h3>Excluir conta</h3>
            {perfil.administradorIa ? <p>A conta ADMIN não pode ser excluída porque mantém a configuração global da IA.</p> : <details><summary>Quero excluir minha conta</summary><p>Esta ação é permanente. Sua conta, módulos, materiais, sessões e Salas que você administra serão excluídos. Módulos pessoais de outros participantes são preservados.</p><form onSubmit={(evento) => enviar(evento, "EXCLUIR")}><fieldset disabled={Boolean(processando)}><label htmlFor="perfil-senha-exclusao">Confirme sua senha<input autoComplete="current-password" id="perfil-senha-exclusao" maxLength={128} name="senhaAtual" required type="password" /></label><label htmlFor="perfil-confirmar-exclusao">Digite EXCLUIR para confirmar<input autoComplete="off" id="perfil-confirmar-exclusao" name="confirmacao" pattern="EXCLUIR" required /></label><button type="submit">{processando === "EXCLUIR" ? "Excluindo..." : "Excluir minha conta permanentemente"}</button></fieldset></form></details>}
          </section>
        </>}
      </div>
    </dialog>
  </>;
}
