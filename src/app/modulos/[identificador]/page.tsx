import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Gauge,
  MoreHorizontal,
  Plus,
  Target,
} from "lucide-react";
import { formatarData, formatarFormato, formatarPorcentagem } from "@/biblioteca/formatacao";
import { CronometroEstudo } from "@/componentes/cronometro-estudo";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { GraficoDesempenhoContextual } from "@/componentes/grafico-desempenho-contextual";
import { GraficoPercepcaoResultado } from "@/componentes/grafico-percepcao-resultado";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { PainelBloom } from "@/componentes/painel-bloom";
import { Quiz } from "@/componentes/quiz";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarDesafiosAtivosDoModuloPessoal } from "@/servidor/desafios";
import { obterAnaliseBloomModuloPessoal, obterMetricasModuloPessoal } from "@/servidor/metricas";
import { obterModuloPessoal } from "@/servidor/modulos";
import { arquivarMaterial, arquivarModulo, arquivarTopico, atualizarMaterial, atualizarModulo, criarRascunhoTopico } from "../acoes";
import { EditorModulo, EditorTopico } from "./editores";
import { FormularioMaterial } from "./formulario-material";
import { GraficoEvolucaoTopicos } from "./grafico-evolucao-topicos";
import estilos from "./page.module.css";

function mensagemDeErro(codigo?: string) {
  if (codigo === "duplicado") return "Já existe um item com este título neste contexto.";
  if (codigo === "indisponivel") return "O item não foi encontrado na sua conta ou está arquivado.";
  if (codigo === "dados") return "Revise os campos obrigatórios e os limites informados.";
  return null;
}

function formatarDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;
  return restantes ? `${horas}h ${restantes}min` : `${horas}h`;
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
}

function rotuloDificuldade(status: "ALTA" | "INTERMEDIARIA" | "BAIXA" | null) {
  if (status === "ALTA") return "Alta";
  if (status === "INTERMEDIARIA") return "Intermediária";
  if (status === "BAIXA") return "Baixa";
  return "Sem dados";
}

export default async function PaginaModulo({
  params,
  searchParams,
}: {
  params: Promise<{ identificador: string }>;
  searchParams: Promise<{ erro?: string; sucesso?: string; topico?: string }>;
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

  const [metricas, desafiosAtivos, analiseBloom] = await Promise.all([
    obterMetricasModuloPessoal(usuario.id, identificador),
    listarDesafiosAtivosDoModuloPessoal(usuario.id, modulo.id),
    obterAnaliseBloomModuloPessoal(usuario.id, identificador),
  ]);
  if (!metricas || !analiseBloom) notFound();
  const topicosConfigurados = modulo.topicos.filter((topico) => !topico.rascunho);
  const materiais = topicosConfigurados.flatMap((topico) => topico.recursos.map((material) => ({ ...material, topicoNome: topico.nome })));
  const topicosPorId = new Map(topicosConfigurados.map((topico) => [topico.id, topico.nome]));
  const dificuldade = metricas.dificuldadeAtualEstimada;
  const classeDificuldade = dificuldade.status === "ALTA" ? estilos.dificuldadeAlta : dificuldade.status === "INTERMEDIARIA" ? estilos.dificuldadeIntermediaria : dificuldade.status === "BAIXA" ? estilos.dificuldadeBaixa : estilos.dificuldadeAusente;
  const pontosEvolucao = metricas.evolucaoTaxaMediaTopicos.pontos.flatMap((ponto) => ponto.mediaTaxasAcertoTopicos === null ? [] : [{ id: ponto.periodoInicio.toISOString(), rotulo: formatarData(ponto.periodoInicio), intervalo: `${formatarData(ponto.periodoInicio)} a ${formatarData(ponto.periodoFim)}`, taxa: ponto.mediaTaxasAcertoTopicos * 100, quantidadeTopicos: ponto.quantidadeTopicosComEvidencia, quantidadeTentativas: ponto.quantidadeTentativas }]);

  return <EstruturaAutenticada usuarioNome={usuario.nome}>
    <main className={estilos.paginaModulo} id="conteudo-principal" tabIndex={-1}>
      <header className={estilos.cabecalhoModulo}>
        <div className={estilos.barraSuperiorModulo}>
          <Link className={estilos.voltarModulo} href="/modulos"><ArrowLeft aria-hidden="true" />Todos os módulos</Link>
          <details className={estilos.menuModulo}>
            <summary aria-label="Abrir ações do módulo" title="Ações do módulo"><MoreHorizontal aria-hidden="true" /></summary>
            <div className={estilos.conteudoMenuModulo}><strong>Ações do módulo</strong><p>O arquivamento preserva conteúdos e registros.</p><form action={arquivarModulo}><input name="id" type="hidden" value={modulo.id} /><input name="identificadorAtual" type="hidden" value={modulo.identificador} /><button type="submit"><Archive aria-hidden="true" />Arquivar módulo</button></form></div>
          </details>
        </div>
        <EditorModulo descricao={modulo.descricao} id={modulo.id} identificador={modulo.identificador} titulo={modulo.titulo} />
      </header>
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      {parametros.sucesso && <p className="mensagem-sucesso" role="status">Alteração salva na sua conta.</p>}

      <div className={estilos.gradePaginaModulo}>
        <aside className={estilos.colunaContexto} aria-label="Materiais e análises do módulo">
          <section className={estilos.painelMateriais} aria-labelledby="titulo-biblioteca-materiais">
            <div className={estilos.cabecalhoPainelLateral}><div className={estilos.iconePainel}><FolderOpen aria-hidden="true" /></div><div><p className={estilos.sobretituloPagina}>BIBLIOTECA</p><h2 id="titulo-biblioteca-materiais">Materiais</h2></div><FormularioMaterial identificadorModulo={modulo.identificador} topicos={topicosConfigurados.map((topico) => ({ id: topico.id, nome: topico.nome }))} /></div>
            <p className={estilos.resumoPainel}>{materiais.length ? `${materiais.length} material(is) em ${topicosConfigurados.length} tópico(s).` : "Seus arquivos, links e notas aparecerão aqui."}</p>
            {materiais.length === 0 ? <div className={estilos.estadoVazioLateral}><FileText aria-hidden="true" /><p>Nenhum material adicionado.</p><small>Use o botão “+” para inserir o primeiro.</small></div> : <div className={estilos.listaMateriais}>
              {materiais.map((material) => <details className={estilos.itemMaterial} key={material.id}>
                <summary><span className={estilos.iconeMaterial}><FileText aria-hidden="true" /></span><span><strong>{material.titulo}</strong><small>{material.topicoNome} · {formatarFormato(material.formato)}</small></span></summary>
                <div className={estilos.detalheMaterial}>
                  <p>{material.descricao}</p><span className={estilos.tempoMaterial}>{material.minutosEstimados} min estimados</span>
                  {material.arquivo && <p className={estilos.metadadosArquivo}>{material.arquivo.nomeOriginal} · {formatarTamanho(material.arquivo.tamanhoBytes)}</p>}
                  {material.origem === "ARQUIVO" && <a className={estilos.abrirMaterial} href={`/api/materiais/${encodeURIComponent(material.id)}/arquivo`}><Download aria-hidden="true" />Baixar arquivo</a>}
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
          <section aria-labelledby="titulo-indicadores-modulo">
            <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretituloPagina}>VISÃO DO MÓDULO</p><h2 id="titulo-indicadores-modulo">Seu progresso em {modulo.titulo}</h2></div><p>Métricas locais da versão {metricas.versaoAlgoritmo}. Resultados observados não demonstram causa.</p></div>
            <div className={estilos.gradeIndicadores}>
              <article className={estilos.indicadorModulo}><span className={estilos.iconeIndicador}><Target aria-hidden="true" /></span><div><p>Taxa de acerto</p><strong>{formatarPorcentagem(metricas.taxaAcerto === null ? null : metricas.taxaAcerto * 100)}</strong><small>{metricas.quantidadeTentativas} avaliação(ões) concluída(s)</small></div></article>
              <article className={estilos.indicadorModulo}><span className={`${estilos.iconeIndicador} ${estilos.iconeTempo}`}><Clock3 aria-hidden="true" /></span><div><p>Tempo estudado</p><strong>{formatarDuracao(metricas.tempoEstudo.minutosTotais)}</strong><small>{metricas.tempoEstudo.quantidadeSessoesValidas} sessão(ões) com ao menos 5 min</small></div></article>
              <article className={`${estilos.indicadorModulo} ${classeDificuldade}`}><span className={`${estilos.iconeIndicador} ${estilos.iconeDificuldade}`}><Gauge aria-hidden="true" /></span><div><p>Dificuldade atual estimada</p><strong>{rotuloDificuldade(dificuldade.status)}</strong><small>{dificuldade.taxaReferencia === null ? "Sem avaliações suficientes" : `${formatarPorcentagem(dificuldade.taxaReferencia * 100)} nos ${dificuldade.quantidadePeriodos} período(s) recente(s)${dificuldade.amostraReduzida ? " · amostra reduzida" : ""}`}</small></div></article>
            </div>
          </section>

          <article className={estilos.cartaoGraficoPrincipal}>
            <div className={estilos.cabecalhoGrafico}><div><p className={estilos.sobretituloPagina}>EVOLUÇÃO DAS AVALIAÇÕES</p><h2>Sua taxa média de acerto ao longo do tempo</h2><p>Média semanal das taxas dos tópicos que tiveram avaliações. Tópicos sem evidência não são tratados como zero.</p></div><span>{metricas.evolucaoTaxaMediaTopicos.quantidadePeriodosComEvidencia} período(s)</span></div>
            <GraficoEvolucaoTopicos dados={pontosEvolucao} />
          </article>

          <section className={estilos.secaoTopicos} aria-labelledby="titulo-topicos">
            <div className={estilos.cabecalhoTopicos}><div><p className={estilos.sobretituloPagina}>ORGANIZAÇÃO</p><h2 id="titulo-topicos">Tópicos</h2><p>Estruture os assuntos e acompanhe as avaliações de cada parte do módulo.</p></div><form action={criarRascunhoTopico}><input name="moduloId" type="hidden" value={modulo.id} /><input name="identificadorModulo" type="hidden" value={modulo.identificador} /><button aria-label="Adicionar tópico" className={estilos.botaoNovoTopico} title="Adicionar tópico" type="submit"><Plus aria-hidden="true" /></button></form></div>
            {modulo.topicos.length === 0 ? <div className={estilos.estadoVazioTopicos}><BookOpenText aria-hidden="true" /><h3>Comece pelo primeiro tópico</h3><p>Use o botão “+” para criar e nomear uma parte deste módulo.</p></div> : <div className={estilos.listaTopicos}>
              {modulo.topicos.map((topico) => {
                const selecionado = parametros.topico === topico.identificador;
                return <article className={`${estilos.cartaoTopico} ${topico.rascunho ? estilos.cartaoTopicoRascunho : ""}`} id={`topico-${topico.identificador}`} key={topico.id}>
                  <EditorTopico descricao={topico.descricao} id={topico.id} identificadorModulo={modulo.identificador} inicialmenteEditando={selecionado} nome={topico.nome} rascunho={topico.rascunho} />
                  <details className={estilos.acoesTopico}><summary><MoreHorizontal aria-hidden="true" /><span className={estilos.textoAcessivel}>Ações do tópico {topico.nome || "sem nome"}</span></summary><form action={arquivarTopico}><input name="id" type="hidden" value={topico.id} /><input name="identificadorModulo" type="hidden" value={modulo.identificador} /><button type="submit"><Archive aria-hidden="true" />{topico.rascunho ? "Descartar rascunho" : "Arquivar tópico"}</button></form></details>
                  {topico.rascunho && !selecionado && <Link className={estilos.continuarRascunho} href={`/modulos/${encodeURIComponent(modulo.identificador)}?topico=${encodeURIComponent(topico.identificador)}`}>Continuar configuração</Link>}
                  {!topico.rascunho && topico.avaliacoes.map((avaliacao) => <section className={estilos.avaliacaoTopico} key={avaliacao.id}><Quiz avaliacaoId={avaliacao.id} questoes={avaliacao.questoes.map((questao) => ({ id: questao.id, enunciado: questao.enunciado, opcoes: JSON.parse(questao.opcoesJson) as string[] }))} /></section>)}
                </article>;
              })}
            </div>}
          </section>

          <section className={estilos.analisesComplementares} aria-labelledby="titulo-analises-complementares">
            <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretituloPagina}>CONTEXTO</p><h2 id="titulo-analises-complementares">Análises complementares</h2></div><p>Comparações descritivas com amostra e limitações preservadas.</p></div>
            <PainelBloom niveis={analiseBloom.niveis} quantidadeNiveisComEvidencia={analiseBloom.quantidadeNiveisComEvidencia} quantidadeRespostasClassificadas={analiseBloom.quantidadeRespostasClassificadas} versaoAlgoritmo={analiseBloom.versaoAlgoritmo} />
            <div className={estilos.gradeAnalises}>
              <article className={estilos.cartaoAnalise}><h3>Desempenho por formato</h3><p>Somente exposições únicas e válidas entram nesta comparação.</p><GraficoDesempenhoContextual titulo="Média observada por formato" dados={metricas.desempenhoPorFormato.map((item) => ({ contexto: formatarFormato(item.chave), mediaNotas: item.mediaNotas, quantidadeEvidencias: item.quantidadeEvidencias }))} /></article>
              <article className={estilos.cartaoAnalise}><h3>Desempenho por método</h3><p>O método foi registrado ao iniciar a sessão de estudo.</p><GraficoDesempenhoContextual titulo="Média observada por método" dados={metricas.desempenhoPorMetodo.map((item) => ({ contexto: formatarMetodoEstudo(item.chave), mediaNotas: item.mediaNotas, quantidadeEvidencias: item.quantidadeEvidencias }))} /></article>
              <article className={estilos.cartaoAnalise}><h3>Percepção e resultado</h3><p>Uma associação observada não demonstra que a percepção causou a taxa.</p><GraficoPercepcaoResultado dados={metricas.percepcaoVersusResultado.observacoes.map((item) => ({ tentativa: item.numeroTentativa === null ? "Tentativa" : `Tentativa ${item.numeroTentativa}`, nota: item.nota, dificuldadePercebida: item.dificuldadePercebida, compreensaoPercebida: item.compreensaoPercebida }))} /></article>
            </div>
            <article className={estilos.resumoTopicos}><h3>Resumo por tópico</h3><p>Cada linha mantém seu contexto; ausência de avaliação não aparece como nota zero.</p><div className={estilos.tabelaResponsiva}><table><caption>Métricas oficiais por tópico deste módulo</caption><thead><tr><th scope="col">Tópico</th><th scope="col">Tentativas</th><th scope="col">Acerto</th><th scope="col">Tempo estudado</th><th scope="col">Amostra contextual</th></tr></thead><tbody>{metricas.metricasPorTopico.map((topico) => <tr key={topico.topicoId ?? "sem-topico"}><td>{topicosPorId.get(topico.topicoId ?? "") ?? "Tópico arquivado"}</td><td>{topico.quantidadeTentativas}</td><td>{formatarPorcentagem(topico.taxaAcerto === null ? null : topico.taxaAcerto * 100)}</td><td>{formatarDuracao(topico.tempoEstudo.minutosTotais)}</td><td>{topico.percepcaoVersusResultado.amostra}</td></tr>)}</tbody></table></div></article>
          </section>
        </div>
      </div>
    </main>
  </EstruturaAutenticada>;
}
