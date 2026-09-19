import { BrainCircuit, CheckCircle2, Layers3 } from "lucide-react";
import { formatarData, formatarPorcentagem } from "@/biblioteca/formatacao";
import { GraficoBloom, type DadoGraficoBloom } from "./grafico-bloom";
import estilos from "./painel-bloom.module.css";

type NivelBloomApresentado = {
  nivelBloom: string;
  quantidadeRespostas: number;
  respostasCorretas: number;
  taxaAcerto: number | null;
  nivelEvidencia: string;
  periodoInicio: Date | null;
  periodoFim: Date | null;
};

function formatarNivelBloom(nivel: string) {
  const rotulos: Record<string, string> = {
    LEMBRAR: "Lembrar",
    COMPREENDER: "Compreender",
    APLICAR: "Aplicar",
    ANALISAR: "Analisar",
    AVALIAR: "Avaliar",
    CRIAR: "Criar",
  };
  return rotulos[nivel] ?? nivel;
}

function formatarPeriodo(inicio: Date | null, fim: Date | null) {
  if (!inicio || !fim) return "Sem período suficiente";
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

export function PainelBloom({
  niveis,
  quantidadeRespostasClassificadas,
  quantidadeNiveisComEvidencia,
  versaoAlgoritmo,
}: {
  niveis: NivelBloomApresentado[];
  quantidadeRespostasClassificadas: number;
  quantidadeNiveisComEvidencia: number;
  versaoAlgoritmo: string;
}) {
  const dadosGrafico: DadoGraficoBloom[] = niveis.flatMap((nivel) => nivel.taxaAcerto === null ? [] : [{
    nivel: formatarNivelBloom(nivel.nivelBloom),
    taxaAcerto: nivel.taxaAcerto * 100,
    quantidadeRespostas: nivel.quantidadeRespostas,
  }]);

  return (
    <article className={estilos.painel} aria-labelledby="titulo-painel-bloom">
      <header className={estilos.cabecalho}>
        <div className={estilos.titulo}>
          <span><BrainCircuit aria-hidden="true" /></span>
          <div><p>PROFUNDIDADE DAS QUESTÕES</p><h3 id="titulo-painel-bloom">Acerto por nível de Bloom</h3></div>
        </div>
        <span className={estilos.versao}>{versaoAlgoritmo}</span>
      </header>

      <p className={estilos.introducao}>A leitura considera somente respostas de questões classificadas. Cada nível precisa de duas respostas para exibir uma taxa; ausência de amostra nunca é mostrada como zero.</p>

      <div className={estilos.gradeConteudo}>
        <div className={estilos.grafico}>
          <GraficoBloom dados={dadosGrafico} />
        </div>
        <dl className={estilos.resumo} aria-label="Resumo da análise de Bloom">
          <div><dt><Layers3 aria-hidden="true" />Respostas classificadas</dt><dd>{quantidadeRespostasClassificadas}</dd><small>Em todos os níveis observados</small></div>
          <div><dt><CheckCircle2 aria-hidden="true" />Níveis com evidência</dt><dd>{quantidadeNiveisComEvidencia}</dd><small>Com ao menos duas respostas</small></div>
        </dl>
      </div>

      <details className={estilos.detalhes}>
        <summary>Ver valores, amostra e períodos em tabela</summary>
        <div className={estilos.tabelaResponsiva}>
          <table>
            <caption>Amostra classificada por nível de Bloom</caption>
            <thead><tr><th scope="col">Nível</th><th scope="col">Respostas</th><th scope="col">Acertos</th><th scope="col">Taxa</th><th scope="col">Evidência</th><th scope="col">Período</th></tr></thead>
            <tbody>
              {niveis.length === 0 ? (
                <tr><td colSpan={6}>Ainda não há respostas classificadas neste módulo.</td></tr>
              ) : niveis.map((nivel) => (
                <tr key={nivel.nivelBloom}>
                  <td>{formatarNivelBloom(nivel.nivelBloom)}</td>
                  <td>{nivel.quantidadeRespostas}</td>
                  <td>{nivel.respostasCorretas}</td>
                  <td>{formatarPorcentagem(nivel.taxaAcerto === null ? null : nivel.taxaAcerto * 100)}</td>
                  <td>{nivel.nivelEvidencia.toLowerCase()}</td>
                  <td>{formatarPeriodo(nivel.periodoInicio, nivel.periodoFim)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
