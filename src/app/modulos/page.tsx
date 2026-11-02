import Link from "next/link";
import { BookOpenText, Plus, Share2 } from "lucide-react";
import { AtualizarAoRetomar } from "@/componentes/atualizar-ao-retomar";
import { CabecalhoPagina } from "@/componentes/cabecalho-pagina";
import { criarRascunhoModulo } from "@/app/modulos/acoes";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarModulosPessoais } from "@/servidor/modulos";
import estilos from "./page.module.css";

export default async function PaginaModulos({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const modulosBiblioteca = await listarModulosPessoais(usuario.id, { incluirRascunhos: true });
  const erro = parametros.erro === "duplicado"
    ? "Já existe um módulo com este título na sua conta."
    : parametros.erro
      ? "Revise os dados do módulo."
      : null;

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
      <main className={estilos.paginaModulos} id="conteudo-principal" tabIndex={-1}>
        <AtualizarAoRetomar />

        <div className={estilos.areaConteudo}>
          <CabecalhoPagina acoes={<form action={criarRascunhoModulo}>
              <button className={estilos.botaoAdicionar} type="submit">
                <Plus aria-hidden="true" />
                <span>Adicionar módulo</span>
              </button>
            </form>} descricao="Organize seus conteúdos, materiais e sessões de estudo em espaços separados." titulo="MÓDULOS" />

          {parametros.sucesso === "arquivado" && <p className="mensagem-sucesso" role="status">Módulo arquivado sem apagar seus registros.</p>}

          <div className={estilos.gradePrincipal}>
            <section aria-label="Módulos pessoais">
              <h2 className={estilos.tituloSecao}>Módulos registrados</h2>
              {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

              <div className={estilos.gradeModulos}>
                {modulosBiblioteca.map((modulo) => (
                  <Link
                    aria-describedby={modulo.vinculoSalaAtivo ? `compartilhamento-${modulo.id}` : undefined}
                    aria-label={`${modulo.rascunho ? "Continuar configuração de" : "Abrir módulo"} ${modulo.rascunho ? "Módulo sem nome" : modulo.titulo}`}
                    className={estilos.cartaoModulo}
                    href={`/modulos/${modulo.identificador}`}
                    key={modulo.id}
                  >
                    <span className={estilos.iconeModulo}><BookOpenText aria-hidden="true" /></span>
                    <h3>{modulo.rascunho ? "Módulo sem nome" : modulo.titulo}</h3>
                    {modulo.vinculoSalaAtivo && <span aria-label={`Instância compartilhada com a sala ${modulo.vinculoSalaAtivo.moduloSala.sala.nome}`} className={estilos.indicadorCompartilhamento} id={`compartilhamento-${modulo.id}`} role="img" title={`Instância compartilhada com a sala ${modulo.vinculoSalaAtivo.moduloSala.sala.nome}`}><Share2 aria-hidden="true" size={16} /></span>}
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
