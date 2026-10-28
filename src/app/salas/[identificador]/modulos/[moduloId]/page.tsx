import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Link2, UserMinus } from "lucide-react";
import { ConteudoDashboardModulo } from "@/app/modulos/[identificador]/conteudo-dashboard-modulo";
import { PainelMetricasSessoes } from "@/app/modulos/[identificador]/painel-metricas-sessoes";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarModulosPessoais } from "@/servidor/modulos";
import { obterDashboardModuloSalaDoProprietario, serializarMetricasSala } from "@/servidor/paineis-salas";
import { obterModuloSalaDaConta } from "@/servidor/salas";
import { aderirModuloSala, removerParticipanteModulo, revogarConvite, sairModulo } from "../../../acoes";
import { BotaoEnvio } from "../../../botao-envio";
import { ComparacaoMembros } from "../../../comparacao-membros";
import { GeradorConvite } from "../../../gerador-convite";
import { InterpretacaoMembroSala } from "../../../interpretacao-membro";
import estilosSala from "../../../page.module.css";
import estilosDashboard from "../../../dashboard-sala.module.css";
import { AbasModuloSala } from "./abas-modulo-sala";
import estilos from "./page.module.css";

export default async function PaginaModuloSala({ params }: { params: Promise<{ identificador: string; moduloId: string }> }) {
  const [usuario, { identificador, moduloId }] = await Promise.all([exigirUsuario(), params]);
  const modulo = await obterModuloSalaDaConta(usuario.id, identificador, moduloId);
  if (!modulo) notFound();

  const administrador = modulo.papel === "ADMINISTRADOR";
  const somenteLeitura = modulo.sala.situacao !== "ATIVA";
  const [dashboardModulo, modulosPessoais] = await Promise.all([
    administrador ? obterDashboardModuloSalaDoProprietario(usuario.id, identificador, modulo.id) : Promise.resolve(null),
    administrador ? Promise.resolve([]) : listarModulosPessoais(usuario.id),
  ]);

  let conteudo: React.ReactNode;
  if (administrador) {
    if (!dashboardModulo) notFound();
    const individuaisPorVinculo = new Map(dashboardModulo.individuais.map((individual) => [individual.vinculoId, individual]));
    const participantes = modulo.participacoes.filter((participacao) => participacao.papel === "PARTICIPANTE");
    const comparaveis = dashboardModulo.individuais.map((item) => ({ vinculoId: item.vinculoId, nome: item.nome, metricas: serializarMetricasSala(item.metricas) }));
    const dashboard = <div className={estilosDashboard.conteudoModulo}>
      {dashboardModulo.agregado.disponivel && dashboardModulo.agregado.metricas
        ? <div className={estilosDashboard.painelMetricas}><PainelMetricasSessoes idTitulo={`titulo-agregado-${modulo.id}`} metricas={serializarMetricasSala(dashboardModulo.agregado.metricas)} tituloModulo={modulo.titulo} tituloPainel={`Visão geral de ${modulo.titulo}`} /></div>
        : <p className={estilosDashboard.avisoPrivacidade}>Dashboard protegido: existem {dashboardModulo.agregado.quantidadeContribuidores} de 3 participantes necessários com sessão válida.</p>}
      <ComparacaoMembros participantes={comparaveis} />
    </div>;
    const membros = participantes.map((participacao) => {
      const vinculo = participacao.vinculo;
      const individual = vinculo ? individuaisPorVinculo.get(vinculo.id) : null;
      const metricas = individual ? serializarMetricasSala(individual.metricas) : null;
      const remocao = !somenteLeitura && <form action={removerParticipanteModulo} className={estilos.removerParticipante}>
        <input name="identificadorSala" type="hidden" value={modulo.sala.identificador} />
        <input name="moduloSalaId" type="hidden" value={modulo.id} />
        <input name="participacaoId" type="hidden" value={participacao.id} />
        <BotaoEnvio className={estilosSala.botaoPerigoSecundario}><UserMinus aria-hidden="true" /> Remover deste módulo</BotaoEnvio>
      </form>;
      if (!vinculo || !individual || !metricas) return {
        id: participacao.id,
        nome: participacao.usuario.nome,
        resumo: "Aguardando vínculo",
        estado: "aguardando_vinculo" as const,
        conteudo: remocao,
      };
      return {
        id: participacao.id,
        nome: participacao.usuario.nome,
        resumo: `${metricas.tempoEstudo.quantidadeSessoesValidas} ${metricas.tempoEstudo.quantidadeSessoesValidas === 1 ? "sessão válida" : "sessões válidas"}`,
        estado: "vinculado" as const,
        conteudo: <div className={estilosDashboard.conteudoIndividual}>
          {individual.aprendizagem
            ? <ConteudoDashboardModulo aprendizagem={individual.aprendizagem} idTitulo={`titulo-individual-${vinculo.id}`} metricas={metricas} tituloModulo={modulo.titulo} tituloPainel={`Dashboard de ${participacao.usuario.nome}`} />
            : <PainelMetricasSessoes idTitulo={`titulo-individual-${vinculo.id}`} metricas={metricas} tituloModulo={modulo.titulo} tituloPainel={`Dashboard de ${participacao.usuario.nome}`} />}
          <InterpretacaoMembroSala identificadorSala={modulo.sala.identificador} vinculoId={vinculo.id} />
          {remocao}
        </div>,
      };
    });
    const cabecalhoMembros = !somenteLeitura && <div className={estilos.gestaoConvites}>
      <GeradorConvite identificadorSala={modulo.sala.identificador} moduloSalaId={modulo.id} />
      {modulo.convites.map((convite) => <form action={revogarConvite} key={convite.id}>
        <input name="conviteId" type="hidden" value={convite.id} />
        <input name="identificadorSala" type="hidden" value={modulo.sala.identificador} />
        <input name="moduloSalaId" type="hidden" value={modulo.id} />
        <span>Convite válido até {convite.expiraEm.toLocaleDateString("pt-BR")}</span>
        <BotaoEnvio className={estilosSala.botaoNeutro}>Revogar</BotaoEnvio>
      </form>)}
    </div>;
    conteudo = <AbasModuloSala cabecalhoMembros={cabecalhoMembros} dashboard={dashboard} membros={membros} />;
  } else {
    const minhaParticipacao = modulo.participacoes.find((participacao) => participacao.usuarioId === usuario.id);
    const meuVinculo = minhaParticipacao?.vinculo;
    conteudo = <section aria-labelledby="titulo-participacao" className={estilosSala.painel}>
      <h2 id="titulo-participacao">Sua participação</h2>
      {meuVinculo ? <div className={estilosSala.areaVinculo}>
        <p><Link href={`/modulos/${meuVinculo.moduloPessoal.identificador}`}><Link2 aria-hidden="true" /> Abrir {meuVinculo.moduloPessoal.titulo}</Link></p>
        <p className={estilosSala.textoSecundario}>Enquanto você participar deste módulo, os dados dessa instância alimentam automaticamente o dashboard e as comparações do módulo compartilhado.</p>
        {!somenteLeitura && <form action={sairModulo}><input name="identificadorSala" type="hidden" value={modulo.sala.identificador} /><input name="moduloSalaId" type="hidden" value={modulo.id} /><BotaoEnvio className={estilosSala.botaoPerigoSecundario}>Sair do módulo</BotaoEnvio></form>}
      </div> : somenteLeitura ? <p className={estilosSala.textoSecundario}>A Sala está arquivada e este módulo permanece somente para consulta.</p> : <div className={estilosSala.acoesVinculo}>
        <p className={estilosSala.textoSecundario}>Escolha como conectar sua rotina pessoal a este módulo compartilhado.</p>
        <form action={aderirModuloSala} className={estilosSala.formularioLinha}><input name="identificadorSala" type="hidden" value={modulo.sala.identificador} /><input name="moduloSalaId" type="hidden" value={modulo.id} /><input name="modo" type="hidden" value="criar" /><BotaoEnvio>Criar instância com o mesmo nome</BotaoEnvio></form>
        <form action={aderirModuloSala} className={estilosSala.formularioLinha}><input name="identificadorSala" type="hidden" value={modulo.sala.identificador} /><input name="moduloSalaId" type="hidden" value={modulo.id} /><input name="modo" type="hidden" value="vincular" /><label><span className={estilosSala.textoAcessivel}>Módulo pessoal</span><select name="moduloPessoalId" required><option value="">Vincular módulo existente…</option>{modulosPessoais.map((pessoal) => <option key={pessoal.id} value={pessoal.id}>{pessoal.titulo}</option>)}</select></label><BotaoEnvio>Vincular módulo existente</BotaoEnvio></form>
      </div>}
    </section>;
  }

  return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
    <main className={estilos.pagina} id="conteudo-principal" tabIndex={-1}>
      <div className={estilos.conteudo}>
        <Link className={estilos.voltar} href={`/salas/${modulo.sala.identificador}`}><ArrowLeft aria-hidden="true" /> Voltar para {modulo.sala.nome}</Link>
        <header className={estilos.cabecalho}><h1>{modulo.titulo}</h1><p>{modulo.descricao}</p></header>
        {conteudo}
      </div>
    </main>
  </EstruturaAutenticada>;
}
