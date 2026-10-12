import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import type { DashboardObservacional } from "@/dominio/analises/dashboard-observacional";
import type { MetodoEstudo } from "@/gerado/prisma/enums";
import { AjudaMetrica } from "./ajuda-metrica";
import estilos from "@/app/dashboard/page.module.css";

const DESCRICAO_CONSISTENCIA = "Mostra em quantos módulos analisáveis cada método apresentou compreensão percebida de pelo menos 4/5 e evidência posterior de pelo menos 70%. É uma associação observacional.";

export function ConsistenciaMetodosDashboard({ itens }: { itens: DashboardObservacional["consistenciaMetodos"] }) {
  return <section aria-labelledby="titulo-consistencia-metodos" className={estilos.cartao}>
    <div className={estilos.cabecalhoCartao}><h2 id="titulo-consistencia-metodos">Consistência dos métodos entre módulos</h2><AjudaMetrica descricao={DESCRICAO_CONSISTENCIA} titulo="Consistência dos métodos entre módulos" /></div>
    {itens.length ? <div className={estilos.tabelaConsistencia}><table>
      <thead><tr><th scope="col">Método</th><th scope="col">Consistência</th><th scope="col">Evidências</th></tr></thead>
      <tbody>{itens.map((item) => <tr key={item.chave}>
        <th scope="row">{formatarMetodoEstudo(item.chave as MetodoEstudo)}{item.poucosDados && <small className={estilos.poucosDados}>Poucos dados</small>}</th>
        <td>{item.modulosPositivos} de {item.modulosAnalisaveis} {item.modulosAnalisaveis === 1 ? "módulo" : "módulos"}</td>
        <td>{item.quantidadeEvidencias}</td>
      </tr>)}</tbody>
    </table></div> : <div className={estilos.vazio}><p>Ainda não há métodos com dados suficientes em um módulo. São necessárias ao menos duas compreensões e duas evidências posteriores por método em cada módulo analisado.</p></div>}
  </section>;
}
