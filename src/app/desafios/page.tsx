import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  UserRound,
} from "lucide-react";
import { formatarData } from "@/biblioteca/formatacao";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { formatarMetodoEstudo, METODOS_ESTUDO } from "@/dominio/sessoes/metodos";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarModulosPessoais } from "@/servidor/modulos";
import { obterComparacoesDesafiosPessoais } from "@/servidor/metricas";
import { BotaoCancelarDesafio, BotaoCriarDesafio } from "./botoes-formulario";
import { cancelarDesafio, criarDesafio } from "./acoes";
import estilos from "./page.module.css";

function mensagemErro(codigo?: string) {
  if (codigo === "dados") return "Revise o módulo, o método e a meta informada.";
  if (codigo === "indisponivel") return "O desafio não está disponível na sua conta.";
  return null;
}

function apresentacaoMetodo(metodo: string): { descricao: string; Icone: LucideIcon } {
  const apresentacoes: Record<string, { descricao: string; Icone: LucideIcon }> = {
    FEYNMAN: { descricao: "Explique o conteúdo com suas próprias palavras.", Icone: BrainCircuit },
    RECUPERACAO_ATIVA: { descricao: "Tente recuperar ideias antes de consultar o material.", Icone: RefreshCw },
    REPETICAO_ESPACADA: { descricao: "Retome o conteúdo em momentos separados.", Icone: CalendarClock },
    POMODORO: { descricao: "Organize o estudo em blocos com pausas planejadas.", Icone: Timer },
    INTERCALAMENTO: { descricao: "Alterne assuntos ou tipos de exercício na sessão.", Icone: Shuffle },
    PRATICA_DISTRIBUIDA: { descricao: "Distribua sessões de estudo ao longo de vários dias.", Icone: CalendarRange },
  };
  return apresentacoes[metodo] ?? { descricao: "Registre este método no contexto da sessão.", Icone: BookOpenText };
}

function textoPeriodo(inicio: Date | null, fim: Date | null) {
  if (!inicio || !fim) return "Período ainda indisponível";
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

function formatarEscala(valor: number | null) {
  return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`;
}

function formatarDiferenca(valor: number | null) {
  if (valor === null) return "—";
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor.toFixed(1).replace(".", ",")} ponto(s)`;
}

export default async function PaginaDesafios({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const [modulos, desafios] = await Promise.all([
    listarModulosPessoais(usuario.id),
    obterComparacoesDesafiosPessoais(usuario.id),
  ]);
  const erro = mensagemErro(parametros.erro);
  const modulosConfigurados = modulos.filter((modulo) => !modulo.rascunho);
  const desafiosAtivos = desafios.filter((desafio) => desafio.situacao === "ATIVO").length;
  const comparacoesDisponiveis = desafios.filter((desafio) => desafio.comparacao.comparavel).length;
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.paginaDesafios} id="conteudo-principal" tabIndex={-1}>
        <header className={estilos.topoConta}>
          <div className={estilos.contextoAtual}><FlaskConical aria-hidden="true" /><span>Experimentos pessoais</span></div>
          <Link className={estilos.conta} href="/perfil">
            <span className={estilos.avatar} aria-hidden="true">{primeiroNome.slice(0, 1).toUpperCase()}</span>
            <span><strong>{usuario.nome}</strong><small>Ver perfil</small></span>
          </Link>
        </header>

        <div className={estilos.areaConteudo}>
          <section className={estilos.apresentacao} aria-labelledby="titulo-desafios">
            <div className={estilos.textoApresentacao}>
              <p className={estilos.sobretitulo}>EXPERIMENTAÇÃO PESSOAL</p>
              <h1 id="titulo-desafios">Teste métodos com contexto, não com pressa.</h1>
              <p>Crie um desafio para um módulo, vincule sessões compatíveis e acompanhe somente comparações observacionais da sua própria jornada.</p>
            </div>
            <dl className={estilos.resumoApresentacao} aria-label="Resumo dos desafios">
              <div><dt>Ativos</dt><dd>{desafiosAtivos}</dd></div>
              <div><dt>Com comparação</dt><dd>{comparacoesDisponiveis}</dd></div>
              <div><dt>Métodos disponíveis</dt><dd>{METODOS_ESTUDO.length}</dd></div>
            </dl>
          </section>

          {erro && <p className={estilos.mensagemErro} role="alert">{erro}</p>}
          {parametros.sucesso && (
            <p className={estilos.mensagemSucesso} role="status">
              <CheckCircle2 aria-hidden="true" />
              {parametros.sucesso === "criado"
                ? "Desafio criado. Agora você pode vinculá-lo ao iniciar uma sessão no módulo."
                : "Desafio cancelado. As sessões anteriores foram preservadas."}
            </p>
          )}

          <section className={estilos.catalogoMetodos} aria-labelledby="titulo-metodos">
            <div className={estilos.cabecalhoSecao}>
              <div><p className={estilos.sobretitulo}>SEIS FORMAS DE EXPERIMENTAR</p><h2 id="titulo-metodos">Métodos disponíveis</h2></div>
              <p>Escolha um método ao criar o desafio. O registro descreve o que foi usado; não define um estilo fixo de aprendizagem.</p>
            </div>
            <div className={estilos.gradeMetodos}>
              {METODOS_ESTUDO.map((metodo) => {
                const { descricao, Icone } = apresentacaoMetodo(metodo.valor);
                return (
                  <article className={estilos.metodo} key={metodo.valor}>
                    <span className={estilos.iconeMetodo}><Icone aria-hidden="true" /></span>
                    <div><h3>{metodo.rotulo}</h3><p>{descricao}</p></div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className={estilos.gradePrincipal}>
            <section className={estilos.areaDesafios} aria-labelledby="titulo-desafios-criados">
              <div className={estilos.cabecalhoLista}>
                <div><p className={estilos.sobretitulo}>SEUS REGISTROS</p><h2 id="titulo-desafios-criados">Desafios criados</h2></div>
                <span>{desafios.length} no total</span>
              </div>

              {desafios.length === 0 ? (
                <article className={estilos.estadoVazio}>
                  <span><Sparkles aria-hidden="true" /></span>
                  <h3>Seu primeiro experimento começa ao lado</h3>
                  <p>Escolha um módulo, um método e escreva uma meta curta. O desafio será opcional ao iniciar uma sessão.</p>
                </article>
              ) : (
                <div className={estilos.listaDesafios}>
                  {desafios.map((desafio) => {
                    const grupos = [
                      { id: "desafio", titulo: "Sessões vinculadas", grupo: desafio.comparacao.desafio },
                      { id: "contexto", titulo: "Mesmo contexto, fora do desafio", grupo: desafio.comparacao.contextoExterno },
                    ] as const;
                    return (
                      <article className={estilos.cartaoDesafio} key={desafio.id}>
                        <header className={estilos.cabecalhoDesafio}>
                          <div>
                            <div className={estilos.metadadosDesafio}>
                              <span className={desafio.situacao === "ATIVO" ? estilos.estadoAtivo : estilos.estadoCancelado}>{desafio.situacao === "ATIVO" ? "Ativo" : "Cancelado"}</span>
                              <span>{formatarMetodoEstudo(desafio.metodo)}</span>
                            </div>
                            <h3>{desafio.meta}</h3>
                            <p><Link href={`/modulos/${encodeURIComponent(desafio.modulo.identificador)}`}>{desafio.modulo.titulo}<ArrowRight aria-hidden="true" /></Link><span>Criado em {formatarData(desafio.criadoEm)}</span></p>
                          </div>
                          {desafio.situacao === "ATIVO" && (
                            <form action={cancelarDesafio}>
                              <input name="desafioId" type="hidden" value={desafio.id} />
                              <BotaoCancelarDesafio />
                            </form>
                          )}
                        </header>

                        <div className={estilos.comparacaoVisual} aria-label={`Comparação observacional de ${desafio.meta}`}>
                          {grupos.map(({ id, titulo, grupo }) => (
                            <div className={estilos.grupoComparacao} key={id}>
                              <div className={estilos.rotuloComparacao}>
                                <span><strong>{titulo}</strong><small>{grupo.quantidadeSessoes} sessão(ões) · amostra {grupo.nivelAmostra.toLowerCase()}</small></span>
                                <strong>{formatarEscala(grupo.mediaCompreensaoPercebida)}</strong>
                              </div>
                              {grupo.mediaCompreensaoPercebida === null ? (
                                <div className={estilos.barraIndisponivel}><span>São necessárias duas sessões válidas</span></div>
                              ) : (
                                <progress aria-label={`${titulo}: compreensão percebida ${formatarEscala(grupo.mediaCompreensaoPercebida)}`} max={5} value={grupo.mediaCompreensaoPercebida}>{grupo.mediaCompreensaoPercebida} de 5</progress>
                              )}
                              <small>{grupo.minutosTotais} min no total · {textoPeriodo(grupo.periodoInicio, grupo.periodoFim)}</small>
                            </div>
                          ))}
                        </div>

                        <div className={desafio.comparacao.comparavel ? estilos.resultadoComparavel : estilos.resultadoInsuficiente}>
                          <Target aria-hidden="true" />
                          <p>{desafio.comparacao.comparavel
                            ? <><strong>Diferença observada na compreensão percebida: {formatarDiferenca(desafio.comparacao.diferencaCompreensaoPercebida)}.</strong> Ela descreve apenas estes registros e não demonstra efeito causal.</>
                            : <><strong>Comparação ainda indisponível.</strong> São necessárias duas sessões válidas em cada grupo.</>}
                          </p>
                        </div>

                        <details className={estilos.detalhesTabela}>
                          <summary>Ver amostra e períodos em tabela</summary>
                          <div className={estilos.tabelaResponsiva}>
                            <table>
                              <caption>Comparação observacional do desafio e do mesmo contexto fora dele</caption>
                              <thead><tr><th scope="col">Grupo</th><th scope="col">Sessões</th><th scope="col">Tempo</th><th scope="col">Duração média</th><th scope="col">Dificuldade</th><th scope="col">Compreensão</th><th scope="col">Período</th></tr></thead>
                              <tbody>
                                {[{ titulo: "Desafio", grupo: desafio.comparacao.desafio }, { titulo: "Mesmo módulo e método, fora do desafio", grupo: desafio.comparacao.contextoExterno }].map(({ titulo, grupo }) => (
                                  <tr key={titulo}><td>{titulo}</td><td>{grupo.quantidadeSessoes} · {grupo.nivelAmostra.toLowerCase()}</td><td>{grupo.minutosTotais} min</td><td>{grupo.mediaDuracaoMinutos === null ? "—" : `${grupo.mediaDuracaoMinutos.toFixed(1).replace(".", ",")} min`}</td><td>{formatarEscala(grupo.mediaDificuldadePercebida)}</td><td>{formatarEscala(grupo.mediaCompreensaoPercebida)}</td><td>{textoPeriodo(grupo.periodoInicio, grupo.periodoFim)}</td></tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                        {desafio.situacao !== "ATIVO" && desafio.canceladoEm && <p className={estilos.dataCancelamento}>Cancelado em {formatarData(desafio.canceladoEm)}. O histórico vinculado foi preservado.</p>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className={estilos.colunaCriacao} aria-label="Criar desafio e entender a comparação">
              <section className={estilos.cartaoCriacao} aria-labelledby="titulo-novo-desafio">
                <div className={estilos.iconeCriacao}><FlaskConical aria-hidden="true" /></div>
                <p className={estilos.sobretitulo}>NOVO EXPERIMENTO</p>
                <h2 id="titulo-novo-desafio">Criar desafio</h2>
                <p>A meta é pessoal e descritiva; ela não altera sessões nem métricas.</p>
                <form action={criarDesafio} className={estilos.formularioCadastro}>
                  <div className={estilos.campoFormulario}>
                    <label htmlFor="moduloId">Módulo</label>
                    <select id="moduloId" name="moduloId" required defaultValue="">
                      <option disabled value="">Selecione um módulo</option>
                      {modulosConfigurados.map((modulo) => <option key={modulo.id} value={modulo.id}>{modulo.titulo}</option>)}
                    </select>
                  </div>
                  <div className={estilos.campoFormulario}>
                    <label htmlFor="metodo">Método</label>
                    <select id="metodo" name="metodo" required>
                      {METODOS_ESTUDO.map((metodo) => <option key={metodo.valor} value={metodo.valor}>{metodo.rotulo}</option>)}
                    </select>
                  </div>
                  <div className={estilos.campoFormulario}>
                    <label htmlFor="meta">Meta do desafio</label>
                    <textarea aria-describedby="ajuda-meta" id="meta" maxLength={280} minLength={3} name="meta" placeholder="Ex.: Explicar o conteúdo com minhas próprias palavras ao final da sessão." required rows={4} />
                    <small id="ajuda-meta">De 3 a 280 caracteres. Não inclua dados pessoais.</small>
                  </div>
                  <BotaoCriarDesafio desabilitado={modulosConfigurados.length === 0} />
                  {modulosConfigurados.length === 0 && <p className={estilos.semModulo}>Configure ao menos um módulo antes de criar um desafio.</p>}
                </form>
              </section>

              <section className={estilos.avisoResponsavel} aria-labelledby="titulo-leitura-responsavel">
                <span><ShieldCheck aria-hidden="true" /></span>
                <div><h2 id="titulo-leitura-responsavel">Leitura responsável</h2><p>Comparar sessões não prova que um método causou o resultado. Só há diferença quando os dois grupos possuem ao menos duas sessões válidas.</p></div>
              </section>

              <section className={estilos.comoFunciona} aria-labelledby="titulo-como-funciona">
                <div className={estilos.tituloComoFunciona}><UserRound aria-hidden="true" /><h2 id="titulo-como-funciona">Como funciona</h2></div>
                <ol>
                  <li><span>1</span><p><strong>Crie uma meta</strong> para um módulo e método.</p></li>
                  <li><span>2</span><p><strong>Vincule o desafio</strong> ao iniciar sessões compatíveis.</p></li>
                  <li><span>3</span><p><strong>Observe o contexto</strong> quando houver amostra suficiente.</p></li>
                </ol>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
