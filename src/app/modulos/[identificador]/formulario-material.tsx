"use client";

import { useState, type FormEvent } from "react";
import { ClipboardCheck, FileText, Image, NotebookPen, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import estilos from "./page.module.css";

type FuncaoArquivo = "REFERENCIA" | "AVALIACAO" | "ANOTACAO" | "EVIDENCIA_VISUAL";

const FUNCOES_ARQUIVO = [
  ["REFERENCIA", "Material", FileText],
  ["AVALIACAO", "Avaliação", ClipboardCheck],
  ["ANOTACAO", "Anotação", NotebookPen],
  ["EVIDENCIA_VISUAL", "Evidência visual", Image],
] as const;

function mensagemUpload(codigo: string | null, status: number) {
  if (status === 413) return "O arquivo excede o limite permitido.";
  if (codigo === "IDENTIFICADOR_DUPLICADO") return "Já existe um material com esse nome no módulo.";
  if (codigo === "ARQUIVO_INVALIDO") return "O tipo, o conteúdo ou o tamanho do arquivo não é permitido.";
  if (codigo === "NAO_ENCONTRADO") return "O módulo não está mais disponível.";
  return "Não foi possível armazenar o arquivo. Tente novamente.";
}

export function FormularioMaterial({ moduloId }: { moduloId: string }) {
  const roteador = useRouter();
  const [aberto, definirAberto] = useState(false);
  const [funcao, definirFuncao] = useState<FuncaoArquivo>("REFERENCIA");
  const [processando, definirProcessando] = useState(false);
  const [mensagem, definirMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);

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
      const sucesso = corpo && typeof corpo === "object" ? corpo as { material?: { id?: unknown }; analisar?: unknown } : {};
      formulario.reset();
      definirFuncao("REFERENCIA");
      definirMensagem({ tipo: "sucesso", texto: sucesso.analisar ? "Arquivo adicionado. A análise automática foi iniciada." : "Arquivo adicionado ao módulo." });
      roteador.refresh();
      if (sucesso.analisar && typeof sucesso.material?.id === "string") {
        void fetch(`/api/materiais/${encodeURIComponent(sucesso.material.id)}/analise`, { method: "POST" }).finally(() => roteador.refresh());
      }
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
      onClick={() => { definirAberto((estado) => !estado); definirMensagem(null); }}
      title="Adicionar material"
      type="button"
    >
      {aberto ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
    </button>

    {aberto && <div className={estilos.painelFormularioMaterial} id="formulario-novo-material">
      <p className={estilos.instrucaoTipoArquivo}>Que tipo de arquivo você vai adicionar?</p>
      <div className={estilos.seletorTipoMaterial} aria-label="Tipo do arquivo" role="group">
        {FUNCOES_ARQUIVO.map(([valor, rotulo, Icone]) => <button aria-pressed={funcao === valor} key={valor} onClick={() => { definirFuncao(valor); definirMensagem(null); }} type="button"><Icone aria-hidden="true" />{rotulo}</button>)}
      </div>

      <form className={estilos.formularioMaterial} encType="multipart/form-data" onSubmit={enviarArquivo}>
        <input name="moduloId" type="hidden" value={moduloId} />
        <input name="funcao" type="hidden" value={funcao} />
        {funcao !== "REFERENCIA" && <div className={estilos.campo}>
          <label htmlFor="data-evento-novo-material">Data do arquivo</label>
          <input id="data-evento-novo-material" max={hoje} name="dataEvento" type="date" />
          <small>Se não for informada, será usada a data do envio.</small>
        </div>}
        <div className={estilos.campo}>
          <label htmlFor="arquivo-novo-material">Selecionar arquivo</label>
          <input accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.doc,.docx,.odt,.csv,.xls,.xlsx,.ods" autoFocus id="arquivo-novo-material" name="arquivo" required type="file" />
          <small>PDF, planilhas, imagens e arquivos de texto. O limite varia conforme o arquivo.</small>
        </div>
        <button className={estilos.botaoPrimario} disabled={processando} type="submit">{processando ? "Enviando..." : "Enviar arquivo"}</button>
      </form>

      {mensagem && <p className={mensagem.tipo === "erro" ? estilos.mensagemErroLocal : estilos.mensagemSucessoLocal} role={mensagem.tipo === "erro" ? "alert" : "status"}>{mensagem.texto}</p>}
    </div>}
  </div>;
}
