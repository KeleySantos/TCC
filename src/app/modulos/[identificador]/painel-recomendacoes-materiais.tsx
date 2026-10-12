import type { RecomendacaoMaterial } from "@/dominio/analises/recomendacoes-materiais";
import estilos from "./page.module.css";

export function PainelRecomendacoesMateriais({ recomendacoes }: { recomendacoes: RecomendacaoMaterial[] }) {
  return <section className={estilos.blocoAprendizagem} aria-label="Recomendações de estudo">
    <h2>Recomendações de estudo</h2>
    <p>Seleção calculada por regras, disponível mesmo sem IA. Não declara superioridade de método ou formato.</p>
    <ul>{recomendacoes.map((item) => <li key={`${item.regraId}-${item.conceitoId ?? "inicio"}`}>
      <strong>{item.tituloMaterial ?? (item.tipo === "SEM_MATERIAL" ? "Sem material disponível" : "Exploração inicial")}</strong>
      <p>{item.justificativaEstruturada}</p>
      <small>Regra {item.regraId} · n={item.tamanhoAmostra} evidências válidas · {item.nivelEvidencia === "LIMITADA" ? "Base limitada" : "Base descritiva"}</small>
      <details><summary>Indicadores e limites</summary>
        {item.indicadoresUtilizados && <p>{item.indicadoresUtilizados.nome}: compreensão {item.indicadoresUtilizados.compreensaoMedia ?? "—"}/5; dificuldade {item.indicadoresUtilizados.dificuldadeMedia ?? "—"}/5; desempenho médio {item.indicadoresUtilizados.desempenhoMedio === null ? "—" : `${item.indicadoresUtilizados.desempenhoMedio.toFixed(1)}%`}.</p>}
        <ul>{item.limitacoes.map((limite) => <li key={limite}>{limite}</li>)}</ul>
      </details>
    </li>)}</ul>
  </section>;
}
