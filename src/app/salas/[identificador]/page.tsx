import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, BookOpenText, Link2, MessageSquareText, ShieldCheck, Trash2, UserMinus, UsersRound } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { PainelMetricasSessoes } from "@/app/modulos/[identificador]/painel-metricas-sessoes";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarModulosPessoais } from "@/servidor/modulos";
import { obterDashboardsSalaDoProprietario, serializarMetricasSala } from "@/servidor/paineis-salas";
import { obterSalaDaConta } from "@/servidor/salas";
import { BotaoEnvio } from "../botao-envio";
import { GeradorConvite } from "../gerador-convite";
import { ComparacaoMembros } from "../comparacao-membros";
import { InterpretacaoMembroSala } from "../interpretacao-membro";
import {
  aderirModuloSala,
  arquivarSalaAtual,
  atualizarConsentimentos,
  criarNovoModuloSala,
  decidirSolicitacao,
  desvincularInstancia,
  excluirSalaAtual,
  publicarComentario,
  removerMembro,
  revogarConvite,
  sairSala,
} from "../acoes";
import estilos from "../page.module.css";
import estilosDashboard from "../dashboard-sala.module.css";

const mensagensErro: Record<string, string> = {
  dados: "Revise os dados informados.", indisponivel: "O recurso não está disponível.", limite: "A sala já possui o máximo de cinco módulos.", vinculo: "Você já possui uma instância vinculada a este módulo.", falha: "A operação falhou.",
};

export default async function PaginaSala({ params, searchParams }: { params: Promise<{ identificador: string }>; searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, { identificador }, parametros] = await Promise.all([exigirUsuario(), params, searchParams]);
  const sala = await obterSalaDaConta(usuario.id, identificador);
  if (!sala) notFound();
  const proprietario = sala.papel === "PROPRIETARIO";
  const [modulosPessoais, dashboards] = await Promise.all([
    proprietario ? Promise.resolve([]) : listarModulosPessoais(usuario.id),
    proprietario ? obterDashboardsSalaDoProprietario(usuario.id, identificador) : Promise.resolve(null),
  ]);
  const somenteLeitura = sala.situacao !== "ATIVA";

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.pagina} id="conteudo-principal" tabIndex={-1}>
        <nav className={estilos.voltar} aria-label="Navegação estrutural"><Link href="/salas">Salas</Link><span aria-hidden="true">/</span><span>{sala.nome}</span></nav>
        <header className={estilos.apresentacao}>
          <div><p className={estilos.sobretitulo}>{proprietario ? "SALA ADMINISTRADA POR VOCÊ" : "SALA EM QUE VOCÊ PARTICIPA"}</p><h1>{sala.nome}</h1><p>{sala.descricao}</p></div>
          <span className={estilos.iconeDestaque}><UsersRound aria-hidden="true" /></span>
        </header>
        {somenteLeitura && <p className={estilos.aviso}>Esta sala está arquivada e permanece disponível somente para consulta.</p>}
        {parametros.erro && <p className="mensagem-erro" role="alert">{mensagensErro[parametros.erro] ?? "A operação não pôde ser concluída."}</p>}
        {parametros.sucesso && <p className="mensagem-sucesso" role="status">Operação concluída.</p>}

        {proprietario && dashboards && <section aria-labelledby="titulo-dashboards-sala" className={estilosDashboard.areaDashboards}>
          <header className={estilosDashboard.cabecalho}><div><p>PAINÉIS AUTORIZADOS</p><h2 id="titulo-dashboards-sala">Dashboards da sala</h2></div><span>Agregados exigem ao menos três contribuidores com sessão válida.</span></header>
          {dashboards.geral.disponivel && dashboards.geral.metricas
            ? <div className={estilosDashboard.painelMetricas}><PainelMetricasSessoes idTitulo="titulo-dashboard-geral-sala" metricas={serializarMetricasSala(dashboards.geral.metricas)} tituloModulo={sala.nome} tituloPainel={`Visão geral de ${sala.nome}`} /></div>
            : <p className={estilosDashboard.avisoPrivacidade}>Dashboard geral protegido: existem {dashboards.geral.quantidadeContribuidores} de 3 contribuidores necessários com sessão válida.</p>}

          {dashboards.modulos.map((modulo, indiceModulo) => {
            const comparaveis = modulo.individuais.filter((item) => item.permitirComparacao).map((item) => ({ vinculoId: item.vinculoId, nome: item.nome, metricas: serializarMetricasSala(item.metricas) }));
            return <details className={estilosDashboard.modulo} key={modulo.id} open={indiceModulo === 0}><summary><strong>{modulo.titulo}</strong><span>{modulo.individuais.length} dashboard(s) ativo(s) · {modulo.quantidadeHistoricas} evidência(s) histórica(s)</span></summary><div className={estilosDashboard.conteudoModulo}>
              {modulo.agregado.disponivel && modulo.agregado.metricas
                ? <div className={estilosDashboard.painelMetricas}><PainelMetricasSessoes idTitulo={`titulo-agregado-${modulo.id}`} metricas={serializarMetricasSala(modulo.agregado.metricas)} tituloModulo={modulo.titulo} tituloPainel={`Visão agregada de ${modulo.titulo}`} /></div>
                : <p className={estilosDashboard.avisoPrivacidade}>Agregado protegido: {modulo.agregado.quantidadeContribuidores} de 3 contribuidores necessários com sessão válida.</p>}
              <ComparacaoMembros participantes={comparaveis} />
              <div className={estilosDashboard.individuais}>{modulo.individuais.map((individual) => <details className={estilosDashboard.individual} key={individual.vinculoId}><summary><strong>{individual.nome}</strong><span>{individual.permitirComparacao ? "comparação autorizada" : "sem comparação"} · {individual.permitirIa ? "IA autorizada" : "sem IA"}</span></summary><div className={estilosDashboard.conteudoIndividual}><PainelMetricasSessoes idTitulo={`titulo-individual-${individual.vinculoId}`} metricas={serializarMetricasSala(individual.metricas)} tituloModulo={modulo.titulo} tituloPainel={`Dashboard de ${individual.nome}`} />{individual.permitirIa && <InterpretacaoMembroSala identificadorSala={sala.identificador} vinculoId={individual.vinculoId} />}</div></details>)}</div>
            </div></details>;
          })}
        </section>}

        <div className={estilos.gradeDetalhe}>
          <div className={estilos.colunaPrincipal}>
            <section className={estilos.painel} aria-labelledby="titulo-modulos-sala">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>MÓDULOS-PAI</p><h2 id="titulo-modulos-sala">Módulos da sala</h2></div><BookOpenText aria-hidden="true" /></div>
              <div className={estilos.listaModulos}>
                {sala.modulos.map((modulo) => {
                  const meuVinculo = proprietario ? undefined : modulo.vinculos[0];
                  return (
                    <article className={estilos.cartaoModulo} key={modulo.id}>
                      <header><div><h3>{modulo.titulo}</h3><p>{modulo.descricao}</p></div><span>{modulo.vinculos.length} {proprietario ? "instância(s)" : meuVinculo ? "instância vinculada" : "sem vínculo"}</span></header>
                      {proprietario && modulo.vinculos.length > 0 && <ul className={estilos.listaCompacta}>{modulo.vinculos.map((vinculo) => <li key={vinculo.id}><strong>{vinculo.usuario.nome}</strong><span>Dashboard compartilhado · comparação {vinculo.permitirComparacao ? "permitida" : "não permitida"} · IA {vinculo.permitirIa ? "permitida" : "não permitida"}</span></li>)}</ul>}
                      {!proprietario && !meuVinculo && !somenteLeitura && (
                        <div className={estilos.acoesVinculo}>
                          <form action={aderirModuloSala} className={estilos.formularioLinha}>
                            <input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="moduloSalaId" type="hidden" value={modulo.id} /><input name="modo" type="hidden" value="criar" />
                            <BotaoEnvio>Criar instância do zero</BotaoEnvio>
                          </form>
                          <form action={aderirModuloSala} className={estilos.formularioLinha}>
                            <input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="moduloSalaId" type="hidden" value={modulo.id} /><input name="modo" type="hidden" value="vincular" />
                            <label><span className={estilos.textoAcessivel}>Módulo pessoal</span><select name="moduloPessoalId" required><option value="">Vincular módulo existente…</option>{modulosPessoais.map((pessoal) => <option key={pessoal.id} value={pessoal.id}>{pessoal.titulo}</option>)}</select></label>
                            <BotaoEnvio>Vincular</BotaoEnvio>
                          </form>
                        </div>
                      )}
                      {!proprietario && meuVinculo && (
                        <div className={estilos.areaConsentimento}>
                          <p><Link href={`/modulos/${meuVinculo.moduloPessoal.identificador}`}><Link2 aria-hidden="true" /> Abrir {meuVinculo.moduloPessoal.titulo}</Link></p>
                          {!somenteLeitura && <><form action={atualizarConsentimentos} className={estilos.formularioConsentimento}>
                            <input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="vinculoId" type="hidden" value={meuVinculo.id} />
                            <label><input defaultChecked={meuVinculo.permitirComparacao} name="permitirComparacao" type="checkbox" /> Permitir comparação individual</label>
                            <label><input defaultChecked={meuVinculo.permitirIa} name="permitirIa" type="checkbox" /> Permitir uso dos meus dados pela IA</label>
                            <BotaoEnvio>Salvar permissões</BotaoEnvio>
                          </form>
                          <form action={desvincularInstancia}><input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="vinculoId" type="hidden" value={meuVinculo.id} /><BotaoEnvio className={estilos.botaoPerigoSecundario}>Parar de compartilhar</BotaoEnvio></form></>}
                        </div>
                      )}
                      {proprietario && !somenteLeitura && <form action={publicarComentario} className={estilos.formularioComentario}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="escopo" type="hidden" value="MODULO" /><input name="moduloSalaId" type="hidden" value={modulo.id} /><label>Comentário para este módulo<textarea maxLength={2000} name="conteudo" required rows={2} /></label><BotaoEnvio>Publicar</BotaoEnvio></form>}
                    </article>
                  );
                })}
              </div>
              {proprietario && sala.modulos.length < 5 && !somenteLeitura && <form action={criarNovoModuloSala} className={estilos.formulario}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><h3>Adicionar módulo</h3><label>Título<input maxLength={120} minLength={3} name="titulo" required /></label><label>Descrição<textarea maxLength={500} minLength={3} name="descricao" required rows={2} /></label><BotaoEnvio>Adicionar módulo ({sala.modulos.length}/5)</BotaoEnvio></form>}
            </section>

            <section className={estilos.painel} aria-labelledby="titulo-comentarios">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>ORIENTAÇÕES</p><h2 id="titulo-comentarios">Comentários</h2></div><MessageSquareText aria-hidden="true" /></div>
              {proprietario && !somenteLeitura && <form action={publicarComentario} className={estilos.formularioComentario}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="escopo" type="hidden" value="SALA" /><label>Comentário para toda a sala<textarea maxLength={2000} name="conteudo" required rows={3} /></label><BotaoEnvio>Publicar para todos</BotaoEnvio></form>}
              <ol className={estilos.listaComentarios}>{sala.comentarios.map((comentario) => <li key={comentario.id}><span>{comentario.escopo === "SALA" ? "Toda a sala" : comentario.escopo === "MODULO" ? "Módulo" : "Individual"}</span><p>{comentario.conteudo}</p><time dateTime={comentario.criadoEm.toISOString()}>{comentario.criadoEm.toLocaleString("pt-BR")}</time></li>)}</ol>
              {sala.comentarios.length === 0 && <p className={estilos.textoSecundario}>Nenhum comentário publicado.</p>}
            </section>
          </div>

          <aside className={estilos.colunaAcoes}>
            {proprietario && !somenteLeitura && <section className={estilos.painel} aria-labelledby="titulo-convites"><div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>ACESSO</p><h2 id="titulo-convites">Convites</h2></div><ShieldCheck aria-hidden="true" /></div><GeradorConvite identificadorSala={sala.identificador} salaId={sala.id} />{sala.convites.map((convite) => <form action={revogarConvite} className={estilos.itemAcao} key={convite.id}><input name="conviteId" type="hidden" value={convite.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><span>Expira em {convite.expiraEm.toLocaleDateString("pt-BR")}</span><BotaoEnvio>Revogar</BotaoEnvio></form>)}</section>}

            {proprietario && sala.solicitacoes.length > 0 && <section className={estilos.painel} aria-labelledby="titulo-solicitacoes"><h2 id="titulo-solicitacoes">Solicitações pendentes</h2>{sala.solicitacoes.map((solicitacao) => <div className={estilos.itemSolicitacao} key={solicitacao.id}><p><strong>{solicitacao.solicitante.nome}</strong><small>@{solicitacao.solicitante.nomeUsuario}</small></p><form action={decidirSolicitacao}><input name="solicitacaoId" type="hidden" value={solicitacao.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><button name="decisao" value="aprovar">Aprovar</button><button className={estilos.botaoNeutro} name="decisao" value="rejeitar">Rejeitar</button></form></div>)}</section>}

            {proprietario && <section className={estilos.painel} aria-labelledby="titulo-membros"><div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>PARTICIPANTES</p><h2 id="titulo-membros">Membros</h2></div><UsersRound aria-hidden="true" /></div>{sala.membros.map((membro) => <div className={estilos.membro} key={membro.id}><p><strong>{membro.usuario.nome}</strong><small>{membro.papel === "PROPRIETARIO" ? "Proprietário" : `@${membro.usuario.nomeUsuario}`}</small></p>{membro.papel === "MEMBRO" && !somenteLeitura && <><form action={publicarComentario} className={estilos.formularioComentario}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="escopo" type="hidden" value="MEMBRO" /><input name="destinatarioId" type="hidden" value={membro.usuarioId} /><label><span className={estilos.textoAcessivel}>Comentário individual</span><textarea maxLength={2000} name="conteudo" placeholder="Comentário individual" required rows={2} /></label><BotaoEnvio>Enviar</BotaoEnvio></form><form action={removerMembro}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><input name="membroId" type="hidden" value={membro.id} /><BotaoEnvio className={estilos.botaoPerigoSecundario}><UserMinus aria-hidden="true" /> Remover</BotaoEnvio></form></>}</div>)}</section>}

            <section className={estilos.painel} aria-labelledby="titulo-controles"><h2 id="titulo-controles">Controles da sala</h2>{proprietario ? <>{!somenteLeitura && <form action={arquivarSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoNeutro}><Archive aria-hidden="true" /> Arquivar sala</BotaoEnvio></form>}<form action={excluirSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoPerigo}><Trash2 aria-hidden="true" /> Excluir sala</BotaoEnvio></form></> : <form action={sairSala}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoPerigoSecundario}><UserMinus aria-hidden="true" /> Sair da sala</BotaoEnvio></form>}</section>
          </aside>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
