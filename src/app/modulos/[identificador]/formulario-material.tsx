"use client";

import { useState, type FormEvent } from "react";
import { FileUp, Link2, Plus, Type, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { criarMaterial } from "../acoes";
import estilos from "./page.module.css";

type OrigemFormulario = "ARQUIVO" | "LINK" | "TEXTO";
type TopicoMaterial = { id: string; nome: string };

const FORMATOS_LINK = [
  ["TEXTO", "Página ou artigo"],
  ["VIDEO", "Vídeo"],
  ["AUDIO", "Áudio"],
  ["PDF", "PDF"],
  ["IMAGEM", "Imagem"],
  ["DOCUMENTO", "Documento"],
  ["PLANILHA", "Planilha"],
] as const;

function BotaoAdicionar() {
  const { pending } = useFormStatus();
  return <button className={estilos.botaoPrimario} disabled={pending} type="submit">{pending ? "Adicionando..." : "Adicionar material"}</button>;
}

function CamposComuns({ topicos }: { topicos: TopicoMaterial[] }) {
  return <>
    <div className={estilos.campo}>
      <label htmlFor="topico-novo-material">Tópico</label>
      <select defaultValue={topicos[0]?.id} id="topico-novo-material" name="topicoId" required>
        {topicos.map((topico) => <option key={topico.id} value={topico.id}>{topico.nome}</option>)}
      </select>
    </div>
    <div className={estilos.campo}>
      <label htmlFor="titulo-novo-material">Nome do material</label>
      <input autoFocus id="titulo-novo-material" maxLength={120} minLength={3} name="titulo" placeholder="Ex.: Resumo da aula 3" required type="text" />
    </div>
    <div className={estilos.campo}>
      <label htmlFor="descricao-novo-material">Descrição</label>
      <textarea id="descricao-novo-material" maxLength={500} minLength={3} name="descricao" placeholder="Como este material ajuda no estudo?" required rows={3} />
    </div>
    <div className={estilos.campo}>
      <label htmlFor="minutos-novo-material">Tempo estimado</label>
      <div className={estilos.campoComSufixo}><input defaultValue={10} id="minutos-novo-material" max={600} min={1} name="minutosEstimados" required type="number" /><span>min</span></div>
    </div>
  </>;
}

function mensagemUpload(codigo: string | null, status: number) {
  if (status === 413) return "O arquivo excede o limite permitido.";
  if (codigo === "IDENTIFICADOR_DUPLICADO") return "Já existe um material com esse nome no tópico.";
  if (codigo === "ARQUIVO_INVALIDO") return "O tipo, o conteúdo ou o tamanho do arquivo não é permitido.";
  if (codigo === "NAO_ENCONTRADO") return "O tópico não está mais disponível.";
  return "Não foi possível armazenar o arquivo. Tente novamente.";
}

export function FormularioMaterial({
  identificadorModulo,
  topicos,
}: {
  identificadorModulo: string;
  topicos: TopicoMaterial[];
}) {
  const roteador = useRouter();
  const [aberto, definirAberto] = useState(false);
  const [origem, definirOrigem] = useState<OrigemFormulario>("ARQUIVO");
  const [processando, definirProcessando] = useState(false);
  const [mensagem, definirMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);

  async function enviarArquivo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    definirProcessando(true);
    definirMensagem(null);
    const formulario = evento.currentTarget;
    try {
      const resposta = await fetch("/api/materiais/upload", { method: "POST", body: new FormData(formulario) });
      const corpo: unknown = await resposta.json().catch(() => null);
      const codigo = corpo && typeof corpo === "object" && "erro" in corpo && typeof corpo.erro === "string" ? corpo.erro : null;
      if (!resposta.ok) {
        definirMensagem({ tipo: "erro", texto: mensagemUpload(codigo, resposta.status) });
        return;
      }
      formulario.reset();
      definirMensagem({ tipo: "sucesso", texto: "Arquivo adicionado ao módulo." });
      roteador.refresh();
    } catch {
      definirMensagem({ tipo: "erro", texto: "A conexão falhou durante o envio do arquivo." });
    } finally {
      definirProcessando(false);
    }
  }

  return <div className={estilos.adicionarMaterial}>
    <button
      aria-controls="formulario-novo-material"
      aria-expanded={aberto}
      aria-label={aberto ? "Fechar inclusão de material" : "Adicionar material"}
      className={estilos.botaoAdicionar}
      disabled={topicos.length === 0}
      onClick={() => { definirAberto((estado) => !estado); definirMensagem(null); }}
      title={topicos.length ? "Adicionar material" : "Crie um tópico antes de adicionar materiais"}
      type="button"
    >
      {aberto ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
    </button>

    {aberto && <div className={estilos.painelFormularioMaterial} id="formulario-novo-material">
      <div className={estilos.seletorOrigem} aria-label="Origem do material" role="group">
        {([
          ["ARQUIVO", "Arquivo", FileUp],
          ["LINK", "Link", Link2],
          ["TEXTO", "Texto", Type],
        ] as const).map(([valor, rotulo, Icone]) => <button aria-pressed={origem === valor} key={valor} onClick={() => { definirOrigem(valor); definirMensagem(null); }} type="button"><Icone aria-hidden="true" />{rotulo}</button>)}
      </div>

      {origem === "ARQUIVO" ? <form className={estilos.formularioMaterial} encType="multipart/form-data" onSubmit={enviarArquivo}>
        <CamposComuns topicos={topicos} />
        <div className={estilos.campo}>
          <label htmlFor="arquivo-novo-material">Selecionar arquivo</label>
          <input accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.doc,.docx,.odt,.csv,.xls,.xlsx,.ods,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov" id="arquivo-novo-material" name="arquivo" required type="file" />
          <small>Imagens, documentos, planilhas, áudios ou vídeos. O limite varia conforme o formato.</small>
        </div>
        <button className={estilos.botaoPrimario} disabled={processando} type="submit">{processando ? "Enviando..." : "Enviar arquivo"}</button>
      </form> : <form action={criarMaterial} className={estilos.formularioMaterial}>
        <input name="identificadorModulo" type="hidden" value={identificadorModulo} />
        <CamposComuns topicos={topicos} />
        {origem === "LINK" ? <>
          <input name="conteudoTexto" type="hidden" value="" />
          <div className={estilos.campo}>
            <label htmlFor="formato-link-material">Tipo do conteúdo</label>
            <select defaultValue="TEXTO" id="formato-link-material" name="formato">{FORMATOS_LINK.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select>
          </div>
          <div className={estilos.campo}>
            <label htmlFor="url-novo-material">Endereço do link</label>
            <input id="url-novo-material" name="url" placeholder="https://" required type="url" />
          </div>
        </> : <>
          <input name="formato" type="hidden" value="TEXTO" />
          <input name="url" type="hidden" value="" />
          <div className={estilos.campo}>
            <label htmlFor="texto-novo-material">Conteúdo</label>
            <textarea id="texto-novo-material" maxLength={8000} name="conteudoTexto" placeholder="Registre aqui suas notas ou resumo." required rows={6} />
          </div>
        </>}
        <BotaoAdicionar />
      </form>}

      {mensagem && <p className={mensagem.tipo === "erro" ? estilos.mensagemErroLocal : estilos.mensagemSucessoLocal} role={mensagem.tipo === "erro" ? "alert" : "status"}>{mensagem.texto}</p>}
    </div>}
  </div>;
}
