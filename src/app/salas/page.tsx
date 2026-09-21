import Link from "next/link";
import { DoorOpen, Plus, UsersRound } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarSalasDaConta } from "@/servidor/salas";
import { BotaoEnvio } from "./botao-envio";
import { criarNovaSala, pedirEntradaSala } from "./acoes";
import estilos from "./page.module.css";

const mensagensErro: Record<string, string> = {
  dados: "Revise os campos informados.",
  convite: "O código é inválido, expirou ou foi revogado.",
  duplicada: "Você já participa da sala ou possui uma solicitação pendente.",
  falha: "Não foi possível concluir a operação.",
};

const mensagensSucesso: Record<string, string> = {
  solicitada: "Solicitação enviada. Aguarde a aprovação do proprietário.",
  saida: "Você saiu da sala sem perder seus módulos pessoais.",
  arquivada: "Sala arquivada.",
  excluida: "Sala excluída sem apagar os módulos pessoais vinculados.",
};

export default async function PaginaSalas({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const salas = await listarSalasDaConta(usuario.id);
  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.pagina} id="conteudo-principal" tabIndex={-1}>
        <header className={estilos.apresentacao}>
          <div><p className={estilos.sobretitulo}>ACOMPANHAMENTO EM GRUPO</p><h1>Salas</h1><p>Conecte dashboards de módulos pessoais sem compartilhar materiais ou sessões.</p></div>
          <span className={estilos.iconeDestaque}><UsersRound aria-hidden="true" /></span>
        </header>

        {parametros.erro && <p className="mensagem-erro" role="alert">{mensagensErro[parametros.erro] ?? "A operação não pôde ser concluída."}</p>}
        {parametros.sucesso && <p className="mensagem-sucesso" role="status">{mensagensSucesso[parametros.sucesso] ?? "Operação concluída."}</p>}

        <div className={estilos.gradeDuasColunas}>
          <section className={estilos.painel} aria-labelledby="titulo-salas">
            <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>SUAS SALAS</p><h2 id="titulo-salas">Grupos ativos</h2></div><UsersRound aria-hidden="true" /></div>
            <div className={estilos.listaCartoes}>
              {salas.map((sala) => (
                <Link className={estilos.cartaoSala} href={`/salas/${sala.identificador}`} key={sala.id}>
                  <div><h3>{sala.nome}</h3><p>{sala.descricao}</p></div>
                  <dl><div><dt>Módulos</dt><dd>{sala._count.modulos}</dd></div><div><dt>Membros</dt><dd>{sala._count.membros}</dd></div></dl>
                  <small>{sala.papel === "PROPRIETARIO" ? "Você é proprietário" : "Você é membro"}{sala.situacao === "ARQUIVADA" ? " · Arquivada" : ""}</small>
                </Link>
              ))}
            </div>
            {salas.length === 0 && <div className={estilos.estadoVazio}><UsersRound aria-hidden="true" /><h3>Nenhuma sala por enquanto</h3><p>Crie uma sala ou envie um código de convite.</p></div>}
          </section>

          <aside className={estilos.colunaAcoes}>
            <section className={estilos.painel} aria-labelledby="titulo-criar-sala">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>NOVA SALA</p><h2 id="titulo-criar-sala">Criar grupo</h2></div><Plus aria-hidden="true" /></div>
              <form action={criarNovaSala} className={estilos.formulario}>
                <label>Nome da sala<input maxLength={100} minLength={3} name="nome" required /></label>
                <label>Descrição<textarea maxLength={500} minLength={3} name="descricao" required rows={3} /></label>
                <fieldset><legend>Primeiro módulo da sala</legend><label>Título<input maxLength={120} minLength={3} name="tituloModuloInicial" required /></label><label>Descrição<textarea maxLength={500} minLength={3} name="descricaoModuloInicial" required rows={2} /></label></fieldset>
                <BotaoEnvio>Criar sala</BotaoEnvio>
              </form>
            </section>

            <section className={estilos.painel} aria-labelledby="titulo-convite">
              <div className={estilos.cabecalhoSecao}><div><p className={estilos.sobretitulo}>CONVITE</p><h2 id="titulo-convite">Solicitar entrada</h2></div><DoorOpen aria-hidden="true" /></div>
              <form action={pedirEntradaSala} className={estilos.formulario}>
                <label>Código do convite<input autoCapitalize="characters" maxLength={80} minLength={8} name="codigo" required /></label>
                <BotaoEnvio>Enviar solicitação</BotaoEnvio>
              </form>
            </section>
          </aside>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
