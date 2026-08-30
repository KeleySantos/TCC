import { entrarComCredenciais } from "./acoes";

export default async function PaginaEntrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const parametros = await searchParams;
  const credenciaisInvalidas = parametros.erro === "credenciais";
  return <main className="pagina pagina-entrada" id="conteudo-principal">
    <section className="apresentacao apresentacao-login" aria-labelledby="titulo-entrada">
      <div>
        <p className="marca marca-clara">APRENDER COM EVIDÊNCIAS</p>
        <h1 id="titulo-entrada">Acesse sua área de aprendizagem.</h1>
        <p>Use suas credenciais para entrar. O sistema identifica seu perfil e direciona você para a área de aluno, professor ou administração.</p>
      </div>
      <form action={entrarComCredenciais} className="formulario-login" aria-describedby="aviso-demonstracao">
        <h2>Entrar</h2>
        <p id="aviso-demonstracao">Ambiente local com contas e dados exclusivamente fictícios.</p>
        {credenciaisInvalidas && <p className="mensagem-erro" role="alert">Usuário ou senha inválidos.</p>}
        <div className="campo-formulario"><label htmlFor="nomeUsuario">Usuário</label><input autoComplete="username" id="nomeUsuario" name="nomeUsuario" required type="text" /></div>
        <div className="campo-formulario"><label htmlFor="senha">Senha</label><input autoComplete="current-password" id="senha" name="senha" required type="password" /></div>
        <button className="botao botao-largo" type="submit">Entrar na plataforma</button>
      </form>
    </section>
  </main>;
}
