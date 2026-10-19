import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { InterpretacaoAutomatica } from "@/componentes/interpretacao-automatica";
import { CompartilhamentoModulo } from "@/componentes/compartilhamento-modulo";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterMetricasSessoesModuloPessoal } from "@/servidor/metricas";
import { obterModuloPessoal } from "@/servidor/modulos";
import { listarSessoesModuloPessoal } from "@/servidor/sessoes";
import { obterAprendizagemModuloPessoal } from "@/servidor/aprendizagem-modulo";
import { arquivarModulo, atualizarModulo } from "../acoes";
import { EditorModulo } from "./editores";
import { ConteudoModuloOrganizado } from "./conteudo-modulo-organizado";
import { ConteudoDashboardModulo } from "./conteudo-dashboard-modulo";
import { LayoutDashboardModulo } from "./layout-dashboard-modulo";
import { PainelLinhaTempoModulo } from "./painel-linha-tempo-modulo";
import { PainelMateriaisModulo } from "./painel-materiais-modulo";
import { PainelSessoes } from "./painel-sessoes";
import { ProcessadorAnalisesPendentes } from "./processador-analises-pendentes";
import estilos from "./page.module.css";

function mensagemDeErro(codigo?: string) {
  if (codigo === "duplicado") return "Já existe um item com este título neste contexto.";
  if (codigo === "indisponivel") return "O item não foi encontrado na sua conta ou está arquivado.";
  if (codigo === "dados") return "Revise os campos obrigatórios e os limites informados.";
  return null;
}

export default async function PaginaModulo({
  params,
  searchParams,
}: {
  params: Promise<{ identificador: string }>;
  searchParams: Promise<{ aba?: string | string[]; editar?: string; erro?: string; fim?: string | string[]; inicio?: string | string[]; sucesso?: string }>;
}) {
  const [{ identificador }, usuario, parametros] = await Promise.all([params, exigirUsuario(), searchParams]);
  const modulo = await obterModuloPessoal(usuario.id, identificador);
  if (!modulo) notFound();
  const erro = mensagemDeErro(parametros.erro);

  if (modulo.rascunho) {
    return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
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

  const periodo = resolverPeriodoModulo({ inicio: parametros.inicio, fim: parametros.fim });
  const consultaPeriodo = { inicio: periodo.inicio, fim: periodo.fim };
  const abaSolicitada = Array.isArray(parametros.aba) ? parametros.aba[0] : parametros.aba;
  const abaInicial = abaSolicitada === "linha-do-tempo" || abaSolicitada === "sessoes-materiais" ? abaSolicitada : "dashboard";
  const [resultadoMetricas, sessoes, aprendizagem] = await Promise.all([
    obterMetricasSessoesModuloPessoal(usuario.id, identificador, consultaPeriodo),
    listarSessoesModuloPessoal(usuario.id, modulo.id, { incluirArquivadas: true, ...consultaPeriodo }),
    obterAprendizagemModuloPessoal(usuario.id, modulo.id, consultaPeriodo),
  ]);
  if (!resultadoMetricas) notFound();
  const metricas = resultadoMetricas.metricas;
  const materiais = modulo.materiais;
  const pendentes = materiais.filter((material) => material.analise?.situacao === "PENDENTE").map((material) => material.id);
  const metricasExibicao = {
    ...metricas,
    frequencia: { ...metricas.frequencia, primeiraSessaoEm: metricas.frequencia.primeiraSessaoEm?.toISOString() ?? null, ultimaSessaoEm: metricas.frequencia.ultimaSessaoEm?.toISOString() ?? null },
    evolucaoSemanal: { ...metricas.evolucaoSemanal, pontos: metricas.evolucaoSemanal.pontos.map((ponto) => ({ ...ponto, periodoInicio: ponto.periodoInicio.toISOString(), periodoFim: ponto.periodoFim.toISOString() })) },
  };
  const aprendizagemMetricas = aprendizagem ? {
    ...aprendizagem.analises.resumoResultados,
    evolucaoPercepcaoEvidencia: aprendizagem.analises.evolucaoPercepcaoEvidencia.map((ponto) => ({
      ...ponto,
      periodoInicio: ponto.periodoInicio.toISOString(),
      periodoFim: ponto.periodoFim.toISOString(),
    })),
  } : {
    duracaoSessoesComMelhorResultado: { mediaMinutos: null, quantidadeSessoes: 0, compreensaoMinima: 4, desempenhoMinimo: 70 },
    metodoMaiorCompreensao: null,
    formatoMaiorCompreensao: null,
    evolucaoPercepcaoEvidencia: [],
  };
  const sessoesExibicao = sessoes.map((sessao) => ({
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
  }));

  return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
    <main className={estilos.paginaModulo} id="conteudo-principal" tabIndex={-1}>
      <ProcessadorAnalisesPendentes ids={pendentes} />
      <ConteudoModuloOrganizado abaInicial={abaInicial} acoesDashboard={<InterpretacaoAutomatica compacto fim={periodo.ativo ? periodo.fimTexto : undefined} identificadorModulo={modulo.identificador} inicio={periodo.ativo ? periodo.inicioTexto : undefined} modalLateral />} cabecalho={<><header className={estilos.cabecalhoModulo}>
        <div className={estilos.barraSuperiorModulo}>
          <Link className={estilos.voltarModulo} href="/modulos"><ArrowLeft aria-hidden="true" />Todos os módulos</Link>
          <div className={estilos.acoesCabecalhoModulo}>
          <CompartilhamentoModulo identificadorModulo={modulo.identificador} titulo={modulo.titulo} />
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
        </div>
        <EditorModulo descricao={modulo.descricao} id={modulo.id} identificador={modulo.identificador} inicialmenteEditando={parametros.editar === "modulo"} key={parametros.editar === "modulo" ? "editor-aberto" : "editor-fechado"} titulo={modulo.titulo} />
      </header>
      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      {parametros.sucesso && <p className="mensagem-sucesso" role="status">Alteração salva na sua conta.</p>}</>}
        dashboard={<LayoutDashboardModulo
          conteudo={aprendizagem ? <ConteudoDashboardModulo aprendizagem={{
            resumoResultados: aprendizagemMetricas,
            metodosResultados: aprendizagem.analises.metodosResultados,
            formatosResultados: aprendizagem.analises.formatosResultados,
            conceitosMaiorDificuldade: aprendizagem.analises.conceitosMaiorDificuldade,
            conceitosMaiorCompreensao: aprendizagem.analises.conceitosMaiorCompreensao,
          }} metricas={metricasExibicao} tituloModulo={modulo.titulo} visualEnxuto /> : null}
        />}
        linhaDoTempo={aprendizagem ? <PainelLinhaTempoModulo eventos={aprendizagem.linhaDoTempo} /> : <p>A trajetória ainda não está disponível.</p>}
        periodo={{ inicio: periodo.inicioTexto, fim: periodo.fimTexto, hoje: periodo.hoje, ativo: periodo.ativo, erro: periodo.erro }}
        sessoesMateriais={<div className={estilos.gradeOperacionalModulo}>
          <aside className={estilos.colunaContexto} aria-label="Materiais do módulo"><PainelMateriaisModulo identificadorModulo={modulo.identificador} materiais={materiais} moduloId={modulo.id} /></aside>
          <div className={estilos.conteudoModulo}><PainelSessoes agoraIso={new Date().toISOString()} materiais={materiais.map((material) => ({ id: material.id, titulo: material.titulo }))} moduloId={modulo.id} sessoesIniciais={sessoesExibicao} /></div>
        </div>}
      />
    </main>
  </EstruturaAutenticada>;
}
