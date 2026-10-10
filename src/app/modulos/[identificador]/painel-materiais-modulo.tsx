import { Download, ExternalLink, FileText, FolderOpen, Sparkles } from "lucide-react";
import type { obterModuloPessoal } from "@/servidor/modulos";
import { arquivarMaterial } from "../acoes";
import { AcoesArquivoMaterial } from "./acoes-arquivo-material";
import { FormularioMaterial } from "./formulario-material";
import estilos from "./page.module.css";

type Modulo = NonNullable<Awaited<ReturnType<typeof obterModuloPessoal>>>;

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
}

function formatarFuncaoMaterial(funcao: Modulo["materiais"][number]["funcao"]) {
  if (funcao === "AVALIACAO") return "Avaliação";
  if (funcao === "ANOTACAO") return "Anotação";
  if (funcao === "EVIDENCIA_VISUAL") return "Evidência visual";
  return "Material";
}

export function PainelMateriaisModulo({ moduloId, identificadorModulo, materiais }: { moduloId: string; identificadorModulo: string; materiais: Modulo["materiais"] }) {
  return <section className={estilos.painelMateriais} aria-labelledby="titulo-biblioteca-materiais">
    <div className={estilos.cabecalhoPainelLateral}><div className={estilos.iconePainel}><FolderOpen aria-hidden="true" /></div><div><p className={estilos.sobretituloPagina}>BIBLIOTECA</p><h2 id="titulo-biblioteca-materiais">Materiais</h2></div><FormularioMaterial moduloId={moduloId} /></div>
    <p className={estilos.resumoPainel}>{materiais.length ? `${materiais.length} material(is) neste módulo.` : "Seus arquivos aparecerão aqui."}</p>
    {materiais.length === 0 ? <div className={estilos.estadoVazioLateral}><FileText aria-hidden="true" /><p>Nenhum material adicionado.</p><small>Use o botão “+” para inserir o primeiro.</small></div> : <div className={estilos.listaMateriais}>{materiais.map((material) => <details className={estilos.itemMaterial} key={material.id}>
      <summary><span className={estilos.iconeMaterial}><FileText aria-hidden="true" /></span><span><strong>{material.titulo}</strong><small className={estilos.tagFuncaoMaterial}>{formatarFuncaoMaterial(material.funcao)}</small></span></summary>
      <div className={estilos.detalheMaterial}><p>{material.descricao}</p>
        {material.arquivo && <p className={estilos.metadadosArquivo}>{material.arquivo.nomeOriginal} · {formatarTamanho(material.arquivo.tamanhoBytes)}</p>}
        {material.origem === "ARQUIVO" && <a className={estilos.abrirMaterial} href={`/api/materiais/${encodeURIComponent(material.id)}/arquivo`}><Download aria-hidden="true" />Baixar arquivo</a>}
        {material.origem === "ARQUIVO" && material.arquivo && <><div className={estilos.estadoAnaliseMaterial} data-situacao={material.analise?.situacao ?? "NAO_SUPORTADA"}><Sparkles aria-hidden="true" /><span>{material.analise?.situacao === "CONCLUIDA" ? "Análise concluída" : material.analise?.situacao === "PROCESSANDO" ? "Análise em andamento" : material.analise?.situacao === "FALHA" ? "Análise pendente de nova tentativa" : material.analise?.situacao === "PENDENTE" ? "Análise aguardando processamento" : "Arquivo armazenado sem análise"}</span></div>{material.analise?.resumo && <details className={estilos.resultadoAnaliseMaterial}><summary>Ver análise do conteúdo</summary><p>{material.analise.resumo}</p>{material.analise.conteudoTruncado && <small>A análise usou somente a parte inicial devido ao limite de segurança.</small>}</details>}<AcoesArquivoMaterial materialId={material.id} podeAnalisar={["pdf", "txt", "docx", "csv", "xlsx", "png", "jpg", "jpeg", "webp", "gif"].includes(material.arquivo.extensaoNormalizada)} situacao={material.analise?.situacao ?? "NAO_SUPORTADA"} /></>}
        {material.url && <a className={estilos.abrirMaterial} href={material.url} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" />Abrir link</a>}
        {material.conteudoTexto && <div className={estilos.textoMaterial}>{material.conteudoTexto}</div>}
        <form action={arquivarMaterial} className={estilos.formularioArquivarMaterial}><input name="id" type="hidden" value={material.id} /><input name="identificadorModulo" type="hidden" value={identificadorModulo} /><button type="submit">Arquivar material</button></form>
      </div>
    </details>)}</div>}
  </section>;
}
