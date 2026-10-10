import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import type { MetodoEstudo } from "@/gerado/prisma/enums";
import estilos from "@/app/dashboard/page.module.css";

export function ConsistenciaMetodosDashboard({ itens }: { itens: DashboardObservacional["consistenciaMetodos"] }) {
  return <section aria-labelledby="titulo-consistencia-metodos" className={estilos.cartao}>
    <p className={estilos.sobretitulo}>RESULTADOS EM DIFERENTES CONTEXTOS</p>
    <h2 id="titulo-consistencia-metodos">Consistência dos métodos entre módulos</h2>
    <p className={estilos.introducao}>Mostra em quantos módulos analisáveis cada método apresentou compreensão percebida de pelo menos 4/5 e evidência posterior de pelo menos 70%. É uma associação observacional.</p>
    {itens.length ? <div className={estilos.tabelaConsistencia}><table>
      <caption className={estilos.legendaTabela}>Métodos ordenados da maior para a menor consistência observada</caption>
      <thead><tr><th scope="col">Método</th><th scope="col">Consistência</th><th scope="col">Evidências</th></tr></thead>
      <tbody>{itens.map((item) => <tr key={item.chave}>
        <th scope="row">{formatarMetodoEstudo(item.chave as MetodoEstudo)}{item.poucosDados && <small className={estilos.poucosDados}>Poucos dados</small>}</th>
        <td>{item.modulosPositivos} de {item.modulosAnalisaveis} {item.modulosAnalisaveis === 1 ? "módulo" : "módulos"}</td>
        <td>{item.quantidadeEvidencias}</td>
      </tr>)}</tbody>
    </table></div> : <div className={estilos.vazio}><p>Ainda não há métodos com dados suficientes em um módulo. São necessárias ao menos duas compreensões e duas evidências posteriores por método em cada módulo analisado.</p></div>}
  </section>;
}
