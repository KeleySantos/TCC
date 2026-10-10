import {
  ArrowRight,
  BookOpenText,
  ChartNoAxesCombined,
  FlaskConical,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { cadastrarConta, entrarComCredenciais } from "./acoes";
import { BotaoSubmissao } from "./botao-submissao";
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
      <div className={estilos.haloSuperior} aria-hidden="true" />
      <section className={estilos.experienciaEntrada} aria-labelledby="titulo-entrada">
        <div className={estilos.painelConceito}>
          <header className={estilos.marcaProduto}>
            <span className={estilos.simboloMarca} aria-hidden="true">
              <FlaskConical strokeWidth={2.2} />
            </span>
            <span>
              <strong>Aprender com Evidências</strong>
              <small>Laboratório pessoal de aprendizagem</small>
            </span>
          </header>

          <div className={estilos.chamadaPrincipal}>
            <p className={estilos.sobretitulo}>SEU ESTUDO, SEUS EXPERIMENTOS</p>
            <h1 id="titulo-entrada">Seu laboratório pessoal de aprendizagem</h1>
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
              <span className={estilos.iconeBeneficio} aria-hidden="true"><Sparkles /></span>
              <span><strong>Reflita com evidências</strong><small>Encontre padrões sem conclusões apressadas.</small></span>
            </li>
          </ul>

          <div className={estilos.previaPainel} aria-label="Prévia ilustrativa do painel de aprendizagem">
            <div className={estilos.cabecalhoPrevia}>
              <span>
                <span className={estilos.iconePrevia} aria-hidden="true"><TrendingUp /></span>
                <span><strong>Seu ciclo de aprendizagem</strong><small>Uma visão conectada do seu progresso</small></span>
              </span>
              <span className={estilos.seloPrevia}>Visão ilustrativa</span>
            </div>
            <div className={estilos.etapasPrevia} aria-hidden="true">
              <span>Organizar</span><i /><span>Estudar</span><i /><span>Observar</span><i /><span>Refletir</span>
            </div>
            <svg className={estilos.graficoPrevia} viewBox="0 0 620 112" role="img" aria-label="Linha ascendente meramente ilustrativa">
              <defs>
                <linearGradient id="area-grafico-entrada" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1976ed" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#1976ed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M6 91 C64 88 77 64 130 70 S209 88 264 55 S351 67 407 38 S492 48 552 21 S595 19 614 9 L614 108 L6 108 Z" fill="url(#area-grafico-entrada)" />
              <path d="M6 91 C64 88 77 64 130 70 S209 88 264 55 S351 67 407 38 S492 48 552 21 S595 19 614 9" fill="none" stroke="#1976ed" strokeLinecap="round" strokeWidth="4" />
              <circle cx="614" cy="9" fill="#1976ed" r="6" />
            </svg>
          </div>
        </div>

        <aside className={estilos.painelAcesso} aria-label={cadastroAtivo ? "Criação de conta pessoal" : "Acesso à área pessoal"}>
          <p className={estilos.fraseApoio}>“Aprender também é observar como você aprende.”</p>

          <div className={estilos.formularioLogin}>
            <nav aria-label="Escolha entre entrar ou criar uma conta" className={estilos.alternadorAcesso}>
              <Link aria-current={!cadastroAtivo ? "page" : undefined} href="/entrar">Entrar</Link>
              <Link aria-current={cadastroAtivo ? "page" : undefined} href="/entrar?modo=cadastro">Criar conta</Link>
            </nav>

            {cadastroAtivo ? (
              <form action={cadastrarConta} aria-describedby="aviso-demonstracao" className={estilos.formularioInterno}>
                <div className={estilos.cabecalhoFormulario}>
                  <span className={estilos.indicadorAcesso}>NOVA CONTA PESSOAL</span>
                  <h2>Comece seu laboratório</h2>
                  <p>Crie uma conta vazia para organizar seus próprios módulos e registros sintéticos.</p>
                </div>

                {mensagemCadastro && <p className="mensagem-erro" role="alert">{mensagemCadastro}</p>}

                <div className={estilos.campoLogin}>
                  <label htmlFor="nome">Nome</label>
                  <span className={estilos.controleCampo}>
                    <UserRound aria-hidden="true" />
                    <input autoComplete="name" id="nome" maxLength={80} minLength={2} name="nome" placeholder="Ex.: Marina Costa" required type="text" />
                  </span>
                </div>

                <div className={estilos.campoLogin}>
                  <label htmlFor="senhaCadastro">Senha</label>
                  <span className={estilos.controleCampo}>
                    <LockKeyhole aria-hidden="true" />
                    <input autoComplete="new-password" id="senhaCadastro" maxLength={128} minLength={8} name="senha" placeholder="Mínimo de 8 caracteres" required type="password" />
                  </span>
                </div>

                <div className={estilos.campoLogin}>
                  <label htmlFor="confirmarSenha">Confirmar senha</label>
                  <span className={estilos.controleCampo}>
                    <LockKeyhole aria-hidden="true" />
                    <input autoComplete="new-password" id="confirmarSenha" maxLength={128} minLength={8} name="confirmarSenha" placeholder="Digite a senha novamente" required type="password" />
                  </span>
                </div>

                <BotaoSubmissao processando="Criando conta...">
                  <span>Criar conta e entrar</span>
                  <ArrowRight aria-hidden="true" />
                </BotaoSubmissao>
              </form>
            ) : (
              <form action={entrarComCredenciais} aria-describedby="aviso-demonstracao" className={estilos.formularioInterno}>
                <div className={estilos.cabecalhoFormulario}>
                  <span className={estilos.indicadorAcesso}>ACESSO PESSOAL</span>
                  <h2>Boas-vindas de volta!</h2>
                  <p>Entre para continuar sua jornada de aprendizagem.</p>
                </div>

                {credenciaisInvalidas && <p className="mensagem-erro" role="alert">Nome ou senha inválidos.</p>}

                <div className={estilos.campoLogin}>
                  <label htmlFor="identificador">Nome</label>
                  <span className={estilos.controleCampo}>
                    <UserRound aria-hidden="true" />
                    <input autoComplete="username" id="identificador" maxLength={80} minLength={2} name="identificador" placeholder="Digite seu nome" required type="text" />
                  </span>
                </div>

                <div className={estilos.campoLogin}>
                  <label htmlFor="senha">Senha</label>
                  <span className={estilos.controleCampo}>
                    <LockKeyhole aria-hidden="true" />
                    <input autoComplete="current-password" id="senha" name="senha" placeholder="Digite sua senha" required type="password" />
                  </span>
                </div>

                <BotaoSubmissao processando="Entrando...">
                  <span>Entrar na área pessoal</span>
                  <ArrowRight aria-hidden="true" />
                </BotaoSubmissao>
              </form>
            )}

            <p className={estilos.avisoDemonstracao} id="aviso-demonstracao">
              <ShieldCheck aria-hidden="true" />
              <span>Ambiente local. Use somente dados fictícios para testar a plataforma.</span>
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
