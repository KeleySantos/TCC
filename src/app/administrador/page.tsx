import Link from "next/link";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelAdministrador } from "@/servidor/consultas";
import { cadastrarProfessor } from "./acoes";

export default async function PaginaAdministrador({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const usuario = await exigirUsuario(PapelUsuario.ADMINISTRADOR);
  const [painel, parametros] = await Promise.all([obterPainelAdministrador(), searchParams]);
  const mensagemErro = parametros.erro === "usuario" ? "Este nome de usuário já está em uso." : parametros.erro === "dados" ? "Revise os dados informados." : null;
  return <main className="pagina" id="conteudo-principal">
    <header className="cabecalho"><div><p className="marca">APRENDER COM EVIDÊNCIAS</p><h1>Administração</h1><p className="rotulo">Olá, {usuario.nome}. Cadastre professores para o ambiente de demonstração.</p></div><Link className="botao botao-secundario" href="/entrar">Trocar conta</Link></header>
    <div className="aviso"><strong>Dados sintéticos.</strong> Crie somente contas fictícias para esta demonstração local.</div>
    <section className="grade" style={{ marginTop: 28 }}>
      <form action={cadastrarProfessor} className="cartao formulario-cadastro">
        <h2>Cadastrar professor</h2>
        {mensagemErro && <p className="mensagem-erro" role="alert">{mensagemErro}</p>}
        {parametros.sucesso === "professor" && <p className="mensagem-sucesso" role="status">Professor cadastrado com sucesso.</p>}
        <div className="campo-formulario"><label htmlFor="nome">Nome completo</label><input id="nome" name="nome" required type="text" /></div>
        <div className="campo-formulario"><label htmlFor="nomeUsuario">Usuário</label><input autoComplete="username" id="nomeUsuario" name="nomeUsuario" pattern="[A-Za-z0-9._-]+" required type="text" /></div>
        <div className="campo-formulario"><label htmlFor="senha">Senha inicial</label><input autoComplete="new-password" id="senha" minLength={8} name="senha" required type="password" /></div>
        <button className="botao" type="submit">Cadastrar professor</button>
      </form>
      <section className="cartao" aria-labelledby="titulo-professores"><h2 id="titulo-professores">Professores cadastrados</h2><p className="rotulo">{painel.professores.length} conta(s) de professor.</p><div className="tabela-responsiva"><table><thead><tr><th scope="col">Nome</th><th scope="col">Usuário</th><th scope="col">Turmas</th></tr></thead><tbody>{painel.professores.map((professor) => <tr key={professor.id}><td>{professor.nome}</td><td>{professor.nomeUsuario}</td><td>{professor.quantidadeTurmas}</td></tr>)}</tbody></table></div></section>
    </section>
  </main>;
}
