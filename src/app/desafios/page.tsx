import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  BrainCircuit,
  CalendarClock,
  CalendarRange,
  RefreshCw,
  Shuffle,
  Timer,
} from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { METODOS_ESTUDO } from "@/dominio/sessoes/metodos";
import { exigirUsuario } from "@/servidor/autenticacao";
import estilos from "./page.module.css";

function apresentacaoMetodo(metodo: string): { descricao: string; Icone: LucideIcon } {
  const apresentacoes: Record<string, { descricao: string; Icone: LucideIcon }> = {
    FEYNMAN: { descricao: "Explique o conteúdo com suas próprias palavras.", Icone: BrainCircuit },
    RECUPERACAO_ATIVA: { descricao: "Tente recuperar ideias antes de consultar o material.", Icone: RefreshCw },
    REPETICAO_ESPACADA: { descricao: "Retome o conteúdo em momentos separados.", Icone: CalendarClock },
    POMODORO: { descricao: "Organize o estudo em blocos com pausas planejadas.", Icone: Timer },
    INTERCALAMENTO: { descricao: "Alterne assuntos ou tipos de exercício na sessão.", Icone: Shuffle },
    PRATICA_DISTRIBUIDA: { descricao: "Distribua sessões de estudo ao longo de vários dias.", Icone: CalendarRange },
  };
  return apresentacoes[metodo] ?? { descricao: "Registre este método no contexto da sessão.", Icone: BookOpenText };
}

export default async function PaginaDesafios() {
  const usuario = await exigirUsuario();

  return (
    <EstruturaAutenticada usuarioNome={usuario.nome}>
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
            <div className={estilos.gradeMetodos}>
              {METODOS_ESTUDO.map((metodo) => {
                const { descricao, Icone } = apresentacaoMetodo(metodo.valor);
                return (
                  <article className={estilos.metodo} key={metodo.valor}>
                    <span className={estilos.iconeMetodo}><Icone aria-hidden="true" /></span>
                    <div><h3>{metodo.rotulo}</h3><p>{descricao}</p></div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </EstruturaAutenticada>
  );
}
