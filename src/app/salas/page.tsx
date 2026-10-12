import { DoorOpen, Plus, UsersRound } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarSalasDaConta } from "@/servidor/salas";
import { BotaoEnvio } from "./botao-envio";
import { criarNovaSala, entrarEmSala } from "./acoes";
import { GradeSalas } from "./cartoes-salas";
import estilos from "./page.module.css";

const mensagensErro: Record<string, string> = {
  dados: "Revise os campos informados.",
  convite: "O código é inválido, expirou ou foi revogado.",
  duplicada: "Você já participa desta sala.",
  falha: "Não foi possível concluir a operação.",
};

const mensagensSucesso: Record<string, string> = {
  saida: "Você saiu da sala sem perder seus módulos pessoais.",
  arquivada: "Sala arquivada.",
  excluida: "Sala excluída sem apagar os módulos pessoais vinculados.",
};

export default async function PaginaSalas({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const salas = await listarSalasDaConta(usuario.id);
  const quantidadeModulos = salas.reduce((total, sala) => total + sala._count.modulos, 0);

  return <EstruturaAutenticada usuarioNome={usuario.nome}>
    <main className={estilos.paginaSalas} id="conteudo-principal" tabIndex={-1}>

      <div className={estilos.areaConteudoSalas}>
        <header className={estilos.apresentacaoPagina}>
          <div><p className={estilos.sobretitulo}>APRENDIZAGEM EM GRUPO</p><h1>Salas</h1><p>Participe de espaços compartilhados e conecte seus módulos quando quiser colaborar.</p></div>
          <dl className={estilos.resumoPagina}><div><dt>Salas</dt><dd>{salas.length}</dd></div><div><dt>Módulos disponíveis</dt><dd>{quantidadeModulos}</dd></div></dl>
        </header>

        {parametros.erro && <p className="mensagem-erro" role="alert">{mensagensErro[parametros.erro] ?? "A operação não pôde ser concluída."}</p>}
        {parametros.sucesso && <p className="mensagem-sucesso" role="status">{mensagensSucesso[parametros.sucesso] ?? "Operação concluída."}</p>}

        <section aria-labelledby="titulo-salas">
          <div className={estilos.cabecalhoBibliotecaSalas}>
            <div><p className={estilos.sobretitulo}>SUAS SALAS</p><h2 id="titulo-salas">Espaços que você participa</h2></div>
            <div className={estilos.acoesBibliotecaSalas}>
              <details className={estilos.acaoExpansivel}>
                <summary><DoorOpen aria-hidden="true" />Entrar com código</summary>
                <div className={estilos.painelAcaoSala}>
                  <h3>Entrar em uma sala</h3><p>Informe o código compartilhado pelo administrador.</p>
                  <form action={entrarEmSala} className={estilos.formulario}><label>Código da sala<input autoCapitalize="characters" maxLength={80} minLength={8} name="codigo" required /></label><BotaoEnvio>Entrar na sala</BotaoEnvio></form>
                </div>
              </details>
              <details className={estilos.acaoExpansivel}>
                <summary><Plus aria-hidden="true" />Criar sala</summary>
                <div className={estilos.painelAcaoSala}>
                  <h3>Nova sala</h3>
                  <form action={criarNovaSala} className={estilos.formulario}>
                    <label>Nome da sala<input maxLength={100} minLength={3} name="nome" required /></label>
                    <label>Descrição<textarea maxLength={500} minLength={3} name="descricao" required rows={3} /></label>
                    <fieldset><legend>Primeiro módulo da sala</legend><label>Título<input maxLength={120} minLength={3} name="tituloModuloInicial" required /></label><label>Descrição<textarea maxLength={500} minLength={3} name="descricaoModuloInicial" required rows={2} /></label></fieldset>
                    <BotaoEnvio>Criar sala</BotaoEnvio>
                  </form>
                </div>
              </details>
            </div>
          </div>

          <GradeSalas salas={salas} />
          {salas.length === 0 && <div className={estilos.estadoVazio}><UsersRound aria-hidden="true" /><h3>Sua primeira sala começa aqui</h3><p>Crie uma sala ou use um código para entrar em um espaço existente.</p></div>}
        </section>
      </div>
    </main>
  </EstruturaAutenticada>;
}
