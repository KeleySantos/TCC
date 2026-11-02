import {
  ArrowRight,
  BookOpenText,
  ChartNoAxesCombined,
  FlaskConical,
  Lightbulb,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { cadastrarConta, entrarComCredenciais } from "./acoes";
import { BotaoSubmissao } from "./botao-submissao";
import { CampoSenha } from "./campo-senha";
import estilos from "./page.module.css";

const mensagensCadastro: Record<string, string> = {
  dados: "Revise os campos. O nome deve ter ao menos 2 caracteres e a senha deve ter ao menos 8 caracteres.",
  senhas: "A senha e a confirmação precisam ser iguais.",
  nome: "Já existe uma conta com esse nome. Informe outro nome.",
};

export default async function PaginaEntrar({ searchParams }: { searchParams: Promise<{ erro?: string; modo?: string }> }) {
  const parametros = await searchParams;
  const cadastroAtivo = parametros.modo === "cadastro";
  const credenciaisInvalidas = parametros.erro === "credenciais";
  const mensagemCadastro = cadastroAtivo && parametros.erro ? mensagensCadastro[parametros.erro] : null;

  return (
    <main className={estilos.paginaEntrada} id="conteudo-principal" tabIndex={-1}>
      <section className={estilos.experienciaEntrada} aria-labelledby="titulo-entrada">
        <div className={estilos.painelConceito}>
          <header className={estilos.marcaProduto}>
            <span className={estilos.simboloMarca} aria-hidden="true">
              <FlaskConical strokeWidth={2.2} />
            </span>
            <span>
              <strong>Learning Lab</strong>
              <small>Laboratório pessoal de aprendizagem</small>
            </span>
          </header>

          <div className={estilos.chamadaPrincipal}>
            <p className={estilos.sobretitulo}>SEU ESTUDO, SEUS EXPERIMENTOS</p>
            <h1 id="titulo-entrada">Transforme<br />seu estudo em<br /><span>resultados reais.</span></h1>
            <p className={estilos.resumo}>
              Experimente métodos, acompanhe sua evolução e reflita sobre evidências para aprender no seu ritmo.
            </p>
          </div>

          <ul className={estilos.beneficios} aria-label="Recursos do laboratório">
            <li>
              <span className={estilos.iconeBeneficio} aria-hidden="true"><BookOpenText /></span>
              <span><strong>Organize seus estudos</strong><small>Reúna módulos, materiais e sessões.</small></span>
            </li>
            <li>
              <span className={estilos.iconeBeneficio} aria-hidden="true"><ChartNoAxesCombined /></span>
              <span><strong>Acompanhe sua evolução</strong><small>Observe resultados com contexto.</small></span>
            </li>
            <li>
              <span className={estilos.iconeBeneficio} aria-hidden="true"><Lightbulb /></span>
              <span><strong>Reflita com evidências</strong><small>Encontre padrões sem conclusões apressadas.</small></span>
            </li>
            <li>
              <span className={estilos.iconeBeneficio} aria-hidden="true"><Target /></span>
              <span><strong>Experimente métodos</strong><small>Aplique técnicas que fazem sentido para você.</small></span>
            </li>
          </ul>
        </div>

        <aside className={estilos.painelAcesso} aria-label={cadastroAtivo ? "Criação de conta pessoal" : "Acesso à área pessoal"}>
          <div className={estilos.formularioLogin}>
            <nav aria-label="Escolha entre entrar ou criar uma conta" className={estilos.alternadorAcesso}>
              <Link aria-current={!cadastroAtivo ? "page" : undefined} href="/entrar">Entrar</Link>
              <Link aria-current={cadastroAtivo ? "page" : undefined} href="/entrar?modo=cadastro">Criar conta</Link>
            </nav>

            {cadastroAtivo ? (
              <form action={cadastrarConta} className={estilos.formularioInterno} key="cadastro">
                <div className={estilos.cabecalhoFormulario}>
                  <h2>Comece seu laboratório</h2>
                </div>

                {mensagemCadastro && <p className="mensagem-erro" role="alert">{mensagemCadastro}</p>}

                <div className={estilos.campoLogin}>
                  <label htmlFor="nome">Nome</label>
                  <span className={estilos.controleCampo}>
                    <UserRound aria-hidden="true" />
                    <input autoComplete="name" id="nome" maxLength={80} minLength={2} name="nome" placeholder="Ex.: Marina Costa" required type="text" />
                  </span>
                </div>

                <CampoSenha autoComplete="new-password" id="senhaCadastro" maxLength={128} minLength={8} placeholder="Mínimo de 8 caracteres" />
                <CampoSenha autoComplete="new-password" id="confirmarSenha" maxLength={128} minLength={8} nome="confirmarSenha" placeholder="Digite a senha novamente" rotulo="Confirmar senha" />

                <BotaoSubmissao processando="Criando conta...">
                  <span>Criar conta e entrar</span>
                  <ArrowRight aria-hidden="true" />
                </BotaoSubmissao>
              </form>
            ) : (
              <form action={entrarComCredenciais} className={estilos.formularioInterno} key="login">
                <div className={estilos.cabecalhoFormulario}>
                  <span className={estilos.indicadorAcesso}>ACESSO PESSOAL</span>
                  <h2>Boas-vindas de volta!</h2>
                </div>

                {credenciaisInvalidas && <p className="mensagem-erro" role="alert">Nome ou senha inválidos.</p>}

                <div className={estilos.campoLogin}>
                  <label htmlFor="identificador">Nome</label>
                  <span className={estilos.controleCampo}>
                    <UserRound aria-hidden="true" />
                    <input autoComplete="username" id="identificador" maxLength={80} minLength={2} name="identificador" placeholder="Digite seu nome" required type="text" />
                  </span>
                </div>

                <CampoSenha autoComplete="current-password" id="senha" placeholder="Digite sua senha" />

                <BotaoSubmissao processando="Entrando...">
                  <span>Entrar</span>
                  <ArrowRight aria-hidden="true" />
                </BotaoSubmissao>
              </form>
            )}

          </div>
        </aside>
      </section>
    </main>
  );
}
