import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { CatalogoMetodos } from "./catalogo-metodos";
import estilos from "./page.module.css";

export default async function PaginaDesafios() {
  const usuario = await exigirUsuario();

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
      <main className={estilos.paginaDesafios} id="conteudo-principal" tabIndex={-1}>

        <div className={estilos.areaConteudo}>
          <section className={estilos.apresentacao} aria-labelledby="titulo-experimentos">
            <div className={estilos.textoApresentacao}>
              <p className={estilos.sobretitulo}>EXPERIMENTAÇÃO PESSOAL</p>
              <h1 id="titulo-experimentos">Explore métodos com contexto, não com pressa.</h1>
              <p>Conheça diferentes formas de estudar e observe quais estratégias fazem sentido durante suas sessões.</p>
            </div>
          </section>

          <section className={estilos.catalogoMetodos} aria-labelledby="titulo-metodos">
            <div className={estilos.cabecalhoSecao}>
              <div><p className={estilos.sobretitulo}>SEIS FORMAS DE EXPERIMENTAR</p><h2 id="titulo-metodos">Métodos disponíveis</h2></div>
              <p>Use estes métodos ao registrar suas sessões. O registro descreve o que foi usado; não define um estilo fixo de aprendizagem.</p>
            </div>
            <CatalogoMetodos />
          </section>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
