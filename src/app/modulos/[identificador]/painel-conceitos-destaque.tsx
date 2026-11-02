import type { ClassificacaoConceitoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import estilos from "./page.module.css";

function escala(valor: number | null) { return valor === null ? "—" : `${valor.toFixed(1).replace(".", ",")}/5`; }
function ListaConceitos({ itens }: { itens: ClassificacaoConceitoAprendizagem[] }) {
  if (!itens.length) return <div className={estilos.estadoVazioAnalise}><p>Ainda não há dados suficientes para classificar conceitos.</p><small>São necessárias pelo menos duas observações recentes.</small></div>;
  return (
    <ul className={estilos.listaConceitosDestaque}>
      {itens.map((item) => (
        <li key={item.chave}>
          <div className={estilos.cabecalhoConceito}>
            <strong>{item.nome}</strong>
            <span className={estilos.indiceConceito}>
              <small>Índice exploratório</small>
              {item.indice.toFixed(1)}/100
            </span>
          </div>
          <dl className={estilos.metricasConceito}>
            <div>
              <dt>Dificuldade percebida</dt>
              <dd>{escala(item.dificuldadeMedia)} <small>n={item.quantidadeDificuldades}</small></dd>
            </div>
            <div>
              <dt>Compreensão percebida</dt>
              <dd>{escala(item.compreensaoMedia)} <small>n={item.quantidadeCompreensoes}</small></dd>
            </div>
            <div>
              <dt>Desempenho médio</dt>
              <dd>{item.desempenhoMedio === null ? "—" : `${item.desempenhoMedio.toFixed(0)}%`}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function PainelConceitosDestaque({ maiorDificuldade, maiorCompreensao, visualEnxuto = false }: { maiorDificuldade: ClassificacaoConceitoAprendizagem[]; maiorCompreensao: ClassificacaoConceitoAprendizagem[]; visualEnxuto?: boolean }) {
  return <section className={`${estilos.gradeConceitosDestaque}${visualEnxuto ? ` ${estilos.dashboardEnxuto}` : ""}`} aria-label="Conceitos em destaque nos últimos 90 dias"><article className={estilos.blocoAprendizagem}><h2>Conceitos com maiores sinais de dificuldade</h2>{!visualEnxuto && <p>Índice exploratório dos últimos 90 dias: média dos sinais disponíveis de dificuldade, compreensão invertida e desempenho invertido. Não mede aprendizagem comprovada.</p>}<ListaConceitos itens={maiorDificuldade} /></article><article className={estilos.blocoAprendizagem}><h2>Conceitos com maiores sinais de compreensão</h2>{!visualEnxuto && <p>Índice exploratório dos últimos 90 dias: média dos sinais disponíveis de compreensão, dificuldade invertida e desempenho. Cada fonte tem peso igual; ausências são excluídas.</p>}<ListaConceitos itens={maiorCompreensao} /></article></section>;
}
