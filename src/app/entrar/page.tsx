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
import { entrarComCredenciais } from "./acoes";
import estilos from "./page.module.css";

export default async function PaginaEntrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const parametros = await searchParams;
  const credenciaisInvalidas = parametros.erro === "credenciais";

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
              <span><strong>Organize seus estudos</strong><small>Reúna módulos, tópicos e materiais.</small></span>
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
              <span>Organizar</span><i /><span>Estudar</span><i /><span>Avaliar</span><i /><span>Refletir</span>
            </div>
            <svg className={estilos.graficoPrevia} viewBox="0 0 620 112" role="img" aria-label="Linha ascendente meramente ilustrativa">
              <defs>
                <linearGradient id="area-grafico-entrada" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7252f4" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#7252f4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M6 91 C64 88 77 64 130 70 S209 88 264 55 S351 67 407 38 S492 48 552 21 S595 19 614 9 L614 108 L6 108 Z" fill="url(#area-grafico-entrada)" />
              <path d="M6 91 C64 88 77 64 130 70 S209 88 264 55 S351 67 407 38 S492 48 552 21 S595 19 614 9" fill="none" stroke="#6241ed" strokeLinecap="round" strokeWidth="4" />
              <circle cx="614" cy="9" fill="#6241ed" r="6" />
            </svg>
          </div>
        </div>

        <aside className={estilos.painelAcesso} aria-label="Acesso à área pessoal">
          <p className={estilos.fraseApoio}>“Aprender também é observar como você aprende.”</p>

          <form action={entrarComCredenciais} className={estilos.formularioLogin} aria-describedby="aviso-demonstracao">
            <div className={estilos.cabecalhoFormulario}>
              <span className={estilos.indicadorAcesso}>ACESSO PESSOAL</span>
              <h2>Boas-vindas de volta!</h2>
              <p>Entre para continuar sua jornada de aprendizagem.</p>
            </div>

            {credenciaisInvalidas && <p className="mensagem-erro" role="alert">Usuário ou senha inválidos.</p>}

            <div className={estilos.campoLogin}>
              <label htmlFor="nomeUsuario">Usuário</label>
              <span className={estilos.controleCampo}>
                <UserRound aria-hidden="true" />
                <input autoComplete="username" id="nomeUsuario" name="nomeUsuario" placeholder="Digite seu usuário" required type="text" />
              </span>
            </div>

            <div className={estilos.campoLogin}>
              <label htmlFor="senha">Senha</label>
              <span className={estilos.controleCampo}>
                <LockKeyhole aria-hidden="true" />
                <input autoComplete="current-password" id="senha" name="senha" placeholder="Digite sua senha" required type="password" />
              </span>
            </div>

            <button className={estilos.botaoEntrar} type="submit">
              <span>Entrar na área pessoal</span>
              <ArrowRight aria-hidden="true" />
            </button>

            <p className={estilos.avisoDemonstracao} id="aviso-demonstracao">
              <ShieldCheck aria-hidden="true" />
              <span>Ambiente local com contas e dados exclusivamente fictícios.</span>
            </p>
          </form>
        </aside>
      </section>
    </main>
  );
}
