import { atualizarPerfil, trocarSenha } from "./acoes";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";

export default async function PaginaPerfil({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const mensagemErro = parametros.erro === "email" ? "Este e-mail já está em uso por outra conta sintética." : parametros.erro === "atual" ? "A senha atual não confere." : parametros.erro === "senha" ? "Revise a nova senha e sua confirmação." : parametros.erro === "dados" ? "Revise os dados do perfil." : null;
  const mensagemSucesso = parametros.sucesso === "perfil" ? "Perfil atualizado." : parametros.sucesso === "senha" ? "Senha atualizada." : null;
  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className="pagina" id="conteudo-principal" tabIndex={-1}>
    <header className="cabecalho"><div><p className="marca">LABORATÓRIO PESSOAL DE APRENDIZAGEM</p><h1>Seu perfil</h1><p className="rotulo">Apenas você pode alterar os dados desta conta.</p></div></header>
    <div className="aviso"><strong>Ambiente sintético.</strong> Use somente nomes, e-mails e senhas fictícios nesta demonstração local.</div>
    <section className="grade" style={{ marginTop: 28 }}>
      <form action={atualizarPerfil} className="cartao formulario-cadastro" aria-describedby="aviso-perfil"><h2>Dados básicos</h2><p className="rotulo" id="aviso-perfil">Seu nome de usuário é <strong>{usuario.nomeUsuario}</strong> e não é alterado neste protótipo.</p>{mensagemErro && <p className="mensagem-erro" role="alert">{mensagemErro}</p>}{mensagemSucesso === "Perfil atualizado." && <p className="mensagem-sucesso" role="status">{mensagemSucesso}</p>}<div className="campo-formulario"><label htmlFor="nome">Nome</label><input defaultValue={usuario.nome} id="nome" name="nome" required type="text" /></div><div className="campo-formulario"><label htmlFor="email">E-mail sintético opcional</label><input defaultValue={usuario.email ?? ""} id="email" name="email" type="email" /></div><button className="botao" type="submit">Salvar perfil</button></form>
      <form action={trocarSenha} className="cartao formulario-cadastro"><h2>Trocar senha</h2>{mensagemSucesso === "Senha atualizada." && <p className="mensagem-sucesso" role="status">{mensagemSucesso}</p>}<div className="campo-formulario"><label htmlFor="senhaAtual">Senha atual</label><input autoComplete="current-password" id="senhaAtual" name="senhaAtual" required type="password" /></div><div className="campo-formulario"><label htmlFor="novaSenha">Nova senha</label><input autoComplete="new-password" id="novaSenha" minLength={8} name="novaSenha" required type="password" /></div><div className="campo-formulario"><label htmlFor="confirmarSenha">Confirmar nova senha</label><input autoComplete="new-password" id="confirmarSenha" minLength={8} name="confirmarSenha" required type="password" /></div><button className="botao" type="submit">Atualizar senha</button></form>
    </section>
  </main></EstruturaAutenticada>;
}
