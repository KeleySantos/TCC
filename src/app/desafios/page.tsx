import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { CabecalhoPagina } from "@/componentes/cabecalho-pagina";
import { exigirUsuario } from "@/servidor/autenticacao";
import { CatalogoMetodos } from "./catalogo-metodos";
import estilos from "./page.module.css";

export default async function PaginaDesafios() {
  const usuario = await exigirUsuario();

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
      <main className={estilos.paginaDesafios} id="conteudo-principal" tabIndex={-1}>

        <div className={estilos.areaConteudo}>
          <CabecalhoPagina descricao="Conheça diferentes formas de estudar e observe quais estratégias fazem sentido durante suas sessões." titulo="MÉTODOS" />

          <section className={estilos.catalogoMetodos} aria-labelledby="titulo-metodos">
            <div className={estilos.cabecalhoSecao}>
              <h2 id="titulo-metodos">Métodos disponíveis</h2>
            </div>
            <CatalogoMetodos />
          </section>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
