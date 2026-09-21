import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Sparkles,
} from "lucide-react";
import { formatarFormato } from "@/biblioteca/formatacao";
import { CronometroEstudo } from "@/componentes/cronometro-estudo";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarDesafiosAtivosDoModuloPessoal } from "@/servidor/desafios";
import { obterMetricasSessoesModuloPessoal } from "@/servidor/metricas";
import { obterModuloPessoal } from "@/servidor/modulos";
import { obterPainelConceitosModulo } from "@/servidor/analises-materiais";
import { listarSessoesModuloPessoal } from "@/servidor/sessoes";
import { arquivarMaterial, arquivarModulo, atualizarMaterial, atualizarModulo } from "../acoes";
import { EditorModulo } from "./editores";
import { AcoesArquivoMaterial } from "./acoes-arquivo-material";
import { FormularioMaterial } from "./formulario-material";
import { PainelMetricasSessoes } from "./painel-metricas-sessoes";
import { PainelSessoes } from "./painel-sessoes";
import { ProcessadorAnalisesPendentes } from "./processador-analises-pendentes";
import estilos from "./page.module.css";

function mensagemDeErro(codigo?: string) {
  if (codigo === "duplicado") return "Já existe um item com este título neste contexto.";
  if (codigo === "indisponivel") return "O item não foi encontrado na sua conta ou está arquivado.";
  if (codigo === "dados") return "Revise os campos obrigatórios e os limites informados.";
  return null;
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
}

export default async function PaginaModulo({
  params,
  searchParams,
}: {
  params: Promise<{ identificador: string }>;
  searchParams: Promise<{ editar?: string; erro?: string; sucesso?: string }>;
}) {
  const [{ identificador }, usuario, parametros] = await Promise.all([params, exigirUsuario(), searchParams]);
  const modulo = await obterModuloPessoal(usuario.id, identificador);
  if (!modulo) notFound();
  const erro = mensagemDeErro(parametros.erro);

  if (modulo.rascunho) {
    return <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.paginaRascunho} id="conteudo-principal" tabIndex={-1}>
        <header className={estilos.topoRascunho}>
          <Link className={estilos.voltar} href="/modulos"><ArrowLeft aria-hidden="true" />Voltar aos módulos</Link>
          <span className={estilos.estadoRascunho}><BookOpenText aria-hidden="true" />Novo módulo</span>
        </header>
        <div className={estilos.areaEditor}>
          <section className={estilos.editor} aria-labelledby="titulo-primeira-configuracao">
            <div className={estilos.iconeEditor}><BookOpenText aria-hidden="true" /></div>
            <p className={estilos.sobretitulo}>PRIMEIRA CONFIGURAÇÃO</p>
            <h1 id="titulo-primeira-configuracao">Dê identidade ao seu módulo</h1>
            <p className={estilos.introducao}>Escolha um nome fácil de reconhecer e descreva o assunto que você quer organizar neste espaço.</p>
            {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
            <form action={atualizarModulo} className={estilos.formularioRascunho}>
              <input name="id" type="hidden" value={modulo.id} />
              <input name="identificadorAtual" type="hidden" value={modulo.identificador} />
              <div className={estilos.campoRascunho}><label htmlFor="titulo-modulo">Nome do módulo</label><input autoFocus defaultValue={modulo.titulo} id="titulo-modulo" maxLength={120} minLength={3} name="titulo" placeholder="Ex.: Estruturas de dados" required type="text" /><small>Use entre 3 e 120 caracteres.</small></div>
              <div className={estilos.campoRascunho}><label htmlFor="descricao-modulo">Descrição</label><textarea defaultValue={modulo.descricao} id="descricao-modulo" maxLength={500} minLength={3} name="descricao" placeholder="O que você pretende estudar e acompanhar neste módulo?" required rows={5} /><small>Use entre 3 e 500 caracteres.</small></div>
              <button className={estilos.salvar} type="submit">Salvar e abrir módulo</button>
            </form>
          </section>
          <form action={arquivarModulo} className={estilos.arquivarRascunho}><input name="id" type="hidden" value={modulo.id} /><input name="identificadorAtual" type="hidden" value={modulo.identificador} /><button type="submit">Arquivar este rascunho</button></form>
        </div>
      </main>
    </EstruturaAutenticada>;
  }

  const [resultadoMetricas, desafiosAtivos, sessoes, painelConceitos] = await Promise.all([
    obterMetricasSessoesModuloPessoal(usuario.id, identificador),
    listarDesafiosAtivosDoModuloPessoal(usuario.id, modulo.id),
    listarSessoesModuloPessoal(usuario.id, modulo.id, { incluirArquivadas: true }),
    obterPainelConceitosModulo(usuario.id, modulo.id),
  ]);
  if (!resultadoMetricas) notFound();
  const metricas = resultadoMetricas.metricas;
  const materiais = modulo.materiais;
  const pendentes = materiais.filter((material) => material.analise?.situacao === "PENDENTE").map((material) => material.id);

  return <EstruturaAutenticada usuarioNome={usuario.nome}>
    <main className={estilos.paginaModulo} id="conteudo-principal" tabIndex={-1}>
      <ProcessadorAnalisesPendentes ids={pendentes} />
      <header className={estilos.cabecalhoModulo}>
        <div className={estilos.barraSuperiorModulo}>
          <Link className={estilos.voltarModulo} href="/modulos"><ArrowLeft aria-hidden="true" />Todos os módulos</Link>
          <details className={estilos.menuModulo}>
            <summary aria-label="Abrir ações do módulo" title="Ações do módulo"><MoreHorizontal aria-hidden="true" /></summary>
            <div className={estilos.conteudoMenuModulo}>
              <strong>Ações do módulo</strong>
              <p>Edite a identidade do módulo ou arquive-o preservando conteúdos e registros.</p>
              <Link className={estilos.acaoEditarModulo} href={`/modulos/${encodeURIComponent(modulo.identificador)}?editar=modulo#editor-modulo-${modulo.id}`}><Pencil aria-hidden="true" />Editar nome e descrição</Link>
              <form action={arquivarModulo}><input name="id" type="hidden" value={modulo.id} /><input name="identificadorAtual" type="hidden" value={modulo.identificador} /><button type="submit"><Archive aria-hidden="true" />Arquivar módulo</button></form>
            </div>
          </details>
        </div>
        <EditorModulo descricao={modulo.descricao} id={modulo.id} identificador={modulo.identificador} inicialmenteEditando={parametros.editar === "modulo"} key={parametros.editar === "modulo" ? "editor-aberto" : "editor-fechado"} titulo={modulo.titulo} />
      </header>
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      {parametros.sucesso && <p className="mensagem-sucesso" role="status">Alteração salva na sua conta.</p>}

      <div className={estilos.gradePaginaModulo}>
        <aside className={estilos.colunaContexto} aria-label="Materiais e análises do módulo">
          <section className={estilos.painelMateriais} aria-labelledby="titulo-biblioteca-materiais">
            <div className={estilos.cabecalhoPainelLateral}><div className={estilos.iconePainel}><FolderOpen aria-hidden="true" /></div><div><p className={estilos.sobretituloPagina}>BIBLIOTECA</p><h2 id="titulo-biblioteca-materiais">Materiais</h2></div><FormularioMaterial identificadorModulo={modulo.identificador} moduloId={modulo.id} /></div>
            <p className={estilos.resumoPainel}>{materiais.length ? `${materiais.length} material(is) neste módulo.` : "Seus arquivos, links e notas aparecerão aqui."}</p>
            {materiais.length === 0 ? <div className={estilos.estadoVazioLateral}><FileText aria-hidden="true" /><p>Nenhum material adicionado.</p><small>Use o botão “+” para inserir o primeiro.</small></div> : <div className={estilos.listaMateriais}>
              {materiais.map((material) => <details className={estilos.itemMaterial} key={material.id}>
                <summary><span className={estilos.iconeMaterial}><FileText aria-hidden="true" /></span><span><strong>{material.titulo}</strong><small>{formatarFormato(material.formato)}</small></span></summary>
                <div className={estilos.detalheMaterial}>
                  <p>{material.descricao}</p><span className={estilos.tempoMaterial}>{material.minutosEstimados} min estimados</span>
                  {material.arquivo && <p className={estilos.metadadosArquivo}>{material.arquivo.nomeOriginal} · {formatarTamanho(material.arquivo.tamanhoBytes)}</p>}
                  {material.origem === "ARQUIVO" && <a className={estilos.abrirMaterial} href={`/api/materiais/${encodeURIComponent(material.id)}/arquivo`}><Download aria-hidden="true" />Baixar arquivo</a>}
                  {material.origem === "ARQUIVO" && material.arquivo && <>
                    <div className={estilos.estadoAnaliseMaterial} data-situacao={material.analise?.situacao ?? "NAO_SUPORTADA"}>
                      <Sparkles aria-hidden="true" />
                      <span>{material.analise?.situacao === "CONCLUIDA" ? "Análise concluída" : material.analise?.situacao === "PROCESSANDO" ? "Análise em andamento" : material.analise?.situacao === "FALHA" ? "Análise pendente de nova tentativa" : material.analise?.situacao === "PENDENTE" ? "Análise aguardando processamento" : "Formato armazenado sem análise"}</span>
                    </div>
                    {material.analise?.resumo && <details className={estilos.resultadoAnaliseMaterial}><summary>Ver análise do conteúdo</summary><p>{material.analise.resumo}</p>{material.analise.conteudoTruncado && <small>A análise usou somente a parte inicial devido ao limite de segurança.</small>}</details>}
                    <AcoesArquivoMaterial materialId={material.id} podeAnalisar={["pdf", "txt", "docx", "csv", "xlsx", "png", "jpg", "jpeg", "webp", "gif"].includes(material.arquivo.extensaoNormalizada)} situacao={material.analise?.situacao ?? "NAO_SUPORTADA"} />
                  </>}
                  {material.url && <a className={estilos.abrirMaterial} href={material.url} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" />Abrir link</a>}
                  {material.conteudoTexto && <div className={estilos.textoMaterial}>{material.conteudoTexto}</div>}
                  <CronometroEstudo desafios={desafiosAtivos} recursoId={material.id} />
                  <details className={estilos.edicaoMaterial}>
                    <summary>Editar material</summary>
                    <form action={atualizarMaterial} className={estilos.formularioEdicaoMaterial}>
                      <input name="id" type="hidden" value={material.id} /><input name="identificadorModulo" type="hidden" value={modulo.identificador} />
                      <div className={estilos.campo}><label htmlFor={`titulo-material-${material.id}`}>Nome</label><input defaultValue={material.titulo} id={`titulo-material-${material.id}`} maxLength={120} minLength={3} name="titulo" required type="text" /></div>
                      <div className={estilos.campo}><label htmlFor={`descricao-material-${material.id}`}>Descrição</label><textarea defaultValue={material.descricao} id={`descricao-material-${material.id}`} maxLength={500} minLength={3} name="descricao" required rows={3} /></div>
                      <div className={estilos.campo}><label htmlFor={`minutos-material-${material.id}`}>Minutos estimados</label><input defaultValue={material.minutosEstimados} id={`minutos-material-${material.id}`} max={600} min={1} name="minutosEstimados" required type="number" /></div>
                      {material.origem !== "ARQUIVO" && <><input name="formato" type="hidden" value={material.formato} />{material.origem === "LINK" ? <><input name="conteudoTexto" type="hidden" value="" /><div className={estilos.campo}><label htmlFor={`url-material-${material.id}`}>Link</label><input defaultValue={material.url ?? ""} id={`url-material-${material.id}`} name="url" required type="url" /></div></> : <><input name="url" type="hidden" value="" /><div className={estilos.campo}><label htmlFor={`texto-material-${material.id}`}>Conteúdo</label><textarea defaultValue={material.conteudoTexto ?? ""} id={`texto-material-${material.id}`} maxLength={8000} name="conteudoTexto" required rows={5} /></div></>}</>}
                      <button className={estilos.botaoPrimario} type="submit">Salvar material</button>
                    </form>
                  </details>
                  <form action={arquivarMaterial} className={estilos.formularioArquivarMaterial}><input name="id" type="hidden" value={material.id} /><input name="identificadorModulo" type="hidden" value={modulo.identificador} /><button type="submit">Arquivar material</button></form>
                </div>
              </details>)}
            </div>}
          </section>
          <InterpretacaoAutomatica className={estilos.painelInsights} identificadorModulo={modulo.identificador} />
        </aside>

        <div className={estilos.conteudoModulo}>
          <section className={estilos.painelConceitos} aria-labelledby="titulo-conceitos-materiais">
            <div><p className={estilos.sobretituloPagina}>MATERIAIS × SESSÕES</p><h2 id="titulo-conceitos-materiais">Conceitos observados</h2><p>Comparação textual entre conceitos extraídos dos materiais e descrições de sessões concluídas. Menção não representa domínio ou aprendizagem comprovada.</p></div>
            {painelConceitos.comparacao.length ? <div className={estilos.gradeConceitos}>{painelConceitos.comparacao.map((item) => <article key={item.conceito}><strong>{item.conceito}</strong><span>{item.quantidadeSessoes ? `${item.quantidadeSessoes} sessão(ões) mencionam este conceito` : "Ainda não mencionado nas descrições"}</span></article>)}</div> : <div className={estilos.vazioConceitos}><Sparkles aria-hidden="true" /><p>Os conceitos aparecerão após a análise automática de um material compatível.</p></div>}
            {painelConceitos.materiais.some((material) => material.situacao === "CONCLUIDA") && <details className={estilos.orientacoesConceitos}><summary>Ver sugestões baseadas nos materiais</summary>{painelConceitos.materiais.filter((material) => material.situacao === "CONCLUIDA").map((material) => <section key={material.id}><h3>{material.titulo}</h3>{material.pontosRevisao.map((texto) => <p key={texto}>{texto}</p>)}{material.proximasSessoes.map((texto) => <p key={texto}>{texto}</p>)}</section>)}</details>}
          </section>
          <PainelSessoes
            agoraIso={new Date().toISOString()}
            materiais={materiais.map((material) => ({ id: material.id, titulo: material.titulo }))}
            moduloId={modulo.id}
            sessoesIniciais={sessoes.map((sessao) => ({
              id: sessao.id,
              descricao: sessao.descricao,
              modoRegistro: sessao.modoRegistro,
              dificuldadePercebida: sessao.dificuldadePercebida,
              compreensaoPercebida: sessao.compreensaoPercebida,
              iniciadaEm: sessao.iniciadaEm.toISOString(),
              encerradaEm: sessao.encerradaEm?.toISOString() ?? null,
              duracaoMinutos: sessao.duracaoMinutos,
              situacao: sessao.situacao,
              arquivada: sessao.arquivada,
              metodos: sessao.metodos,
              formatos: sessao.formatos,
              materiais: sessao.materiais.map((vinculo) => ({ recurso: { id: vinculo.recurso.id, titulo: vinculo.recurso.titulo } })),
            }))}
          />
          <PainelMetricasSessoes
            metricas={{
              ...metricas,
              frequencia: {
                ...metricas.frequencia,
                primeiraSessaoEm: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null,
                ultimaSessaoEm: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null,
              },
              evolucaoSemanal: {
                ...metricas.evolucaoSemanal,
                pontos: metricas.evolucaoSemanal.pontos.map((ponto) => ({
                  ...ponto,
                  periodoInicio: ponto.periodoInicio.toISOString(),
                  periodoFim: ponto.periodoFim.toISOString(),
                })),
              },
            }}
            tituloModulo={modulo.titulo}
          />
        </div>
      </div>
    </main>
  </EstruturaAutenticada>;
}
