import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Ellipsis, Plus, Trash2, UserMinus } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterSalaDaConta } from "@/servidor/salas";
import { BotaoEnvio } from "../botao-envio";
import { CartaoModuloSala } from "../cartoes-salas";
import { RemoverParticipanteSala } from "./remover-participante-sala";
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
        <div className={estilos.barraSuperiorSala}>
          <Link className={estilos.voltar} href="/salas"><ArrowLeft aria-hidden="true" /> Voltar para Salas</Link>
          {proprietario ? <details className={estilos.menuAcoesSala}>
            <summary aria-label="Ações da sala" title="Ações da sala"><Ellipsis aria-hidden="true" /></summary>
            <div className={estilos.conteudoMenuSala}>
              {!somenteLeitura && <form action={arquivarSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoNeutro}><Archive aria-hidden="true" /> Arquivar sala</BotaoEnvio></form>}<form action={excluirSalaAtual}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio className={estilos.botaoPerigo}><Trash2 aria-hidden="true" /> Excluir sala</BotaoEnvio></form>
            </div>
          </details> : <form action={sairSala} className={estilos.acaoSairSala}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><BotaoEnvio><UserMinus aria-hidden="true" /> Sair da sala</BotaoEnvio></form>}
        </div>
        <header className={estilos.apresentacao}>
          <div><p className={estilos.sobretitulo}>{proprietario ? "SALA ADMINISTRADA POR VOCÊ" : "SALA EM QUE VOCÊ PARTICIPA"}</p><h1>{sala.nome}</h1><p>{sala.descricao}</p></div>
          {proprietario && sala.modulos.length < 5 && !somenteLeitura ? <details className={estilos.criacaoModuloSala}><summary aria-label="Adicionar módulo" title="Adicionar módulo"><Plus aria-hidden="true" />Adicionar módulo</summary><form action={criarNovoModuloSala} className={estilos.formularioCriacaoModulo}><input name="salaId" type="hidden" value={sala.id} /><input name="identificadorSala" type="hidden" value={sala.identificador} /><h3>Novo módulo</h3><label>Título<input maxLength={120} minLength={3} name="titulo" required /></label><label>Descrição<textarea maxLength={500} minLength={3} name="descricao" required rows={2} /></label><BotaoEnvio>Adicionar módulo ({sala.modulos.length}/5)</BotaoEnvio></form></details> : null}
        </header>
        {somenteLeitura && <p className={estilos.aviso}>Esta sala está arquivada e permanece disponível somente para consulta.</p>}
        {parametros.erro && <p className="mensagem-erro" role="alert">{mensagensErro[parametros.erro] ?? "A operação não pôde ser concluída."}</p>}
        {parametros.sucesso && <p className="mensagem-sucesso" role="status">Operação concluída.</p>}

        <div className={`${estilos.gradeDetalhe} ${proprietario ? "" : estilos.gradeDetalheSemLateral}`}>
          <div className={estilos.colunaPrincipal}>
            <section className={`${estilos.painel} ${estilos.painelModulosSala}`} aria-labelledby="titulo-modulos-sala">
              <div className={estilos.cabecalhoSecao}><div><h2 id="titulo-modulos-sala">Módulos da sala</h2></div></div>
              <div className={estilos.listaModulos}>
                {sala.modulos.map((modulo) => {
                  const vinculo = proprietario ? null : modulo.vinculos[0];
                  const resumoVinculo = proprietario
                    ? `${modulo.vinculos.length} ${modulo.vinculos.length === 1 ? "instância" : "instâncias"}`
                    : vinculo ? "Instância vinculada" : "Sem vínculo";
                  return <CartaoModuloSala
                    href={`/salas/${sala.identificador}/modulos/${modulo.id}`}
                    instanciaVinculada={vinculo ? { vinculoId: vinculo.id, titulo: vinculo.moduloPessoal.titulo, descricao: vinculo.moduloPessoal.descricao } : undefined}
                    key={modulo.id}
                    resumo={resumoVinculo}
                    titulo={modulo.titulo}
                  />;
                })}
              </div>
            </section>

          </div>

          {proprietario && <aside className={estilos.colunaAcoes}>
            <section className={estilos.painel} aria-labelledby="titulo-participantes-sala">
              <div className={estilos.cabecalhoSecao}><div><h2 id="titulo-participantes-sala">Participantes da sala</h2></div></div>
              <div className={estilos.listaParticipantes}>{sala.participantes.length === 0
                ? <p className={estilos.estadoVazioParticipantes}>Ainda não há participantes vinculados aos módulos desta sala.</p>
                : sala.participantes.map((participante) => <div className={estilos.membro} key={participante.usuarioId}>
                  <div className={estilos.cabecalhoMembro}><strong>{participante.nome}</strong>{!somenteLeitura && participante.usuarioId !== usuario.id ? <RemoverParticipanteSala identificadorSala={sala.identificador} nome={participante.nome} salaId={sala.id} usuarioId={participante.usuarioId} /> : null}</div>
                  <ul className={estilos.modulosParticipante} aria-label={`Módulos de ${participante.nome}`}>
                    {participante.modulos.map((modulo) => <li key={modulo.id}>{modulo.titulo}</li>)}
                  </ul>
                </div>)}</div>
            </section>
          </aside>}
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
