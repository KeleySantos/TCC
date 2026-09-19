import Link from "next/link";
import { BookOpenText, Plus } from "lucide-react";
import { criarRascunhoModulo } from "@/app/modulos/acoes";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarModulosPessoais } from "@/servidor/modulos";
import { obterPainelPessoal } from "@/servidor/paineis";
import estilos from "./page.module.css";

export default async function PaginaModulos({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const [resumo, modulosBiblioteca] = await Promise.all([
    obterPainelPessoal(usuario.id),
    listarModulosPessoais(usuario.id, { incluirRascunhos: true }),
  ]);
  const erro = parametros.erro === "duplicado"
    ? "Já existe um módulo com este título na sua conta."
    : parametros.erro
      ? "Revise os dados do módulo."
      : null;
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0] || "estudante";

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
      <main className={estilos.paginaModulos} id="conteudo-principal" tabIndex={-1}>
        <header className={estilos.topoConta}>
          <div className={estilos.contextoAtual}><BookOpenText aria-hidden="true" /><span>Módulos de aprendizagem</span></div>
          <Link className={estilos.conta} href="/perfil">
            <span className={estilos.avatar} aria-hidden="true">{primeiroNome.slice(0, 1).toUpperCase()}</span>
            <span><strong>{usuario.nome}</strong><small>Ver perfil</small></span>
          </Link>
        </header>

        <div className={estilos.areaConteudo}>
          <header className={estilos.apresentacaoPagina}>
            <div><p className={estilos.sobretitulo}>SEUS ESPAÇOS DE ESTUDO</p><h1>Módulos</h1><p>Organize assuntos, tópicos e materiais sem misturar seus contextos de aprendizagem.</p></div>
            <dl className={estilos.resumoPagina}>
              <div><dt>Módulos ativos</dt><dd>{resumo.modulos.length}</dd></div>
              <div><dt>Avaliações</dt><dd>{resumo.quantidadeTentativas}</dd></div>
            </dl>
          </header>

          {parametros.sucesso === "arquivado" && <p className="mensagem-sucesso" role="status">Módulo arquivado sem apagar seus registros.</p>}

          <div className={estilos.gradePrincipal}>
            <section aria-labelledby="titulo-lista-modulos">
              <div className={estilos.cabecalhoSecao}>
                <div><p className={estilos.sobretitulo}>BIBLIOTECA PESSOAL</p><h2 id="titulo-lista-modulos">Continue de onde parou</h2></div>
                <form action={criarRascunhoModulo}>
                  <button className={estilos.botaoAdicionar} title="Criar novo módulo" type="submit">
                    <Plus aria-hidden="true" />
                    <span className={estilos.textoAcessivel}>Criar novo módulo</span>
                  </button>
                </form>
              </div>

              {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

              <div className={estilos.gradeModulos}>
                {modulosBiblioteca.map((modulo) => (
                  <Link
                    aria-label={`${modulo.rascunho ? "Continuar configuração de" : "Abrir módulo"} ${modulo.rascunho ? "Módulo sem nome" : modulo.titulo}`}
                    className={estilos.cartaoModulo}
                    href={`/modulos/${modulo.identificador}`}
                    key={modulo.id}
                  >
                    <span className={estilos.iconeModulo}><BookOpenText aria-hidden="true" /></span>
                    <h3>{modulo.rascunho ? "Módulo sem nome" : modulo.titulo}</h3>
                  </Link>
                ))}
              </div>

              {modulosBiblioteca.length === 0 && <div className={estilos.estadoVazio}><BookOpenText aria-hidden="true" /><h3>Seu primeiro módulo começa aqui</h3><p>Use o botão “+” para criar um espaço de estudo.</p></div>}
            </section>
          </div>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
