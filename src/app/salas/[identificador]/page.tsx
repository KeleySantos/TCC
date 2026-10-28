import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, BookOpenText, Plus, Trash2, UserMinus, UsersRound } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterSalaDaConta } from "@/servidor/salas";
import { BotaoEnvio } from "../botao-envio";
import { CartaoModuloSala } from "../cartoes-salas";
import {
  arquivarSalaAtual,
  criarNovoModuloSala,
  excluirSalaAtual,
  sairSala,
} from "../acoes";
import estilos from "../page.module.css";

const mensagensErro: Record<string, string> = {
  dados: "Revise os dados informados.", indisponivel: "O recurso não está disponível.", limite: "A sala já possui o máximo de cinco módulos.", vinculo: "Você já possui uma instância vinculada a este módulo.", falha: "A operação falhou.",
};

export default async function PaginaSala({ params, searchParams }: { params: Promise<{ identificador: string }>; searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, { identificador }, parametros] = await Promise.all([exigirUsuario(), params, searchParams]);
  const sala = await obterSalaDaConta(usuario.id, identificador);
  if (!sala) notFound();
  const proprietario = sala.papel === "PROPRIETARIO";
  const somenteLeitura = sala.situacao !== "ATIVA";

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
      <main className={estilos.pagina} id="conteudo-principal" tabIndex={-1}>
        <nav className={estilos.voltar} aria-label="Navegação estrutural"><Link href="/salas">Salas</Link><span aria-hidden="true">/</span><span>{sala.nome}</span></nav>
        <header className={estilos.apresentacao}>
          <div><p className={estilos.sobretitulo}>{proprietario ? "SALA ADMINISTRADA POR VOCÊ" : "SALA EM QUE VOCÊ PARTICIPA"}</p><h1>{sala.nome}</h1><p>{sala.descricao}</p></div>
          <span className={estilos.iconeDestaque}><UsersRound aria-hidden="true" /></span>
        </header>
        {somenteLeitura && <p className={estilos.aviso}>Esta sala está arquivada e permanece disponível somente para consulta.</p>}
        {parametros.erro && <p className="mensagem-erro" role="alert">{mensagensErro[parametros.erro] ?? "A operação não pôde ser concluída."}</p>}
        {parametros.sucesso && <p className="mensagem-sucesso" role="status">Operação concluída.</p>}

        <div className={estilos.gradeDetalhe}>
          <div className={estilos.colunaPrincipal}>
            <section className={`${estilos.painel} ${estilos.painelModulosSala}`} aria-labelledby="titulo-modulos-sala">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>MÓDULOS-PAI</p><h2 id="titulo-modulos-sala">Módulos da sala</h2></div>{proprietario && sala.modulos.length < 5 && !somenteLeitura ? <details className={estilos.criacaoModuloSala}><summary aria-label="Criar módulo da sala" title="Criar módulo da sala"><Plus aria-hidden="true" /></summary><form action={criarNovoModuloSala} className={estilos.formularioCriacaoModulo}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><h3>Novo módulo</h3><label>Título<input maxLength={120} minLength={3} name="titulo" required /></label><label>Descrição<textarea maxLength={500} minLength={3} name="descricao" required rows={2} /></label><BotaoEnvio>Adicionar módulo ({sala.modulos.length}/5)</BotaoEnvio></form></details> : <BookOpenText aria-hidden="true" />}</div>
              <div className={estilos.listaModulos}>
                {sala.modulos.map((modulo) => {
                  const resumoVinculo = proprietario
                    ? `${modulo.vinculos.length} ${modulo.vinculos.length === 1 ? "instância" : "instâncias"}`
                    : modulo.vinculos[0] ? "Instância vinculada" : "Sem vínculo";
                  return <CartaoModuloSala descricao={modulo.descricao} href={`/salas/${sala.identificador}/modulos/${modulo.id}`} key={modulo.id} resumo={resumoVinculo} titulo={modulo.titulo} />;
                })}
              </div>
            </section>

          </div>

          <aside className={estilos.colunaAcoes}>
            {proprietario && <section className={estilos.painel} aria-labelledby="titulo-participantes-sala">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>VISÃO CONSOLIDADA</p><h2 id="titulo-participantes-sala">Participantes da sala</h2></div><UsersRound aria-hidden="true" /></div>
              {sala.participantes.length === 0
                ? <p className={estilos.textoSecundario}>Ainda não há participantes vinculados aos módulos desta sala.</p>
                : sala.participantes.map((participante) => <div className={estilos.membro} key={participante.usuarioId}>
                  <p><strong>{participante.nome}</strong><small>@{participante.nomeUsuario}</small></p>
                  <ul className={estilos.modulosParticipante} aria-label={`Módulos de ${participante.nome}`}>
                    {participante.modulos.map((modulo) => <li key={modulo.id}>{modulo.titulo}</li>)}
                  </ul>
                </div>)}
            </section>}

            <section className={estilos.painel} aria-labelledby="titulo-controles"><h2 id="titulo-controles">Controles da sala</h2>{proprietario ? <>{!somenteLeitura && <form action={arquivarSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoNeutro}><Archive aria-hidden="true" /> Arquivar sala</BotaoEnvio></form>}<form action={excluirSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoPerigo}><Trash2 aria-hidden="true" /> Excluir sala</BotaoEnvio></form></> : <form action={sairSala}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoPerigoSecundario}><UserMinus aria-hidden="true" /> Sair da sala</BotaoEnvio></form>}</section>
          </aside>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
