import estilos from "./grafico-anel-observacional.module.css";

export function GraficoAnelObservacional({
  ariaLabel,
  centro,
  primario,
  secundario,
}: {
  ariaLabel: string;
  centro: string;
  primario: { descricao: string; rotulo: string; valor: number };
  secundario: { descricao: string; rotulo: string; valor: number };
}) {
  const circunferencia = 2 * Math.PI * 52;
  const total = Math.max(primario.valor + secundario.valor, 1);
  const proporcaoPrimaria = Math.max(0, Math.min(1, primario.valor / total));
  const proporcaoSecundaria = Math.max(0, Math.min(1 - proporcaoPrimaria, secundario.valor / total));
  const folga = total > 1 ? 8 : 0;
  const comprimentoPrimario = Math.max(0, proporcaoPrimaria * circunferencia - folga);
  const comprimentoSecundario = Math.max(0, proporcaoSecundaria * circunferencia - folga);
  const deslocamentoSecundario = -(proporcaoPrimaria * circunferencia + folga / 2);

  return <div aria-label={ariaLabel} className={estilos.componente} role="img">
    <div className={estilos.anel}>
      <svg aria-hidden="true" viewBox="0 0 120 120">
        <circle className={estilos.trilha} cx="60" cy="60" r="52" />
        {comprimentoPrimario > 0 && <circle className={estilos.primario} cx="60" cy="60" r="52" strokeDasharray={`${comprimentoPrimario} ${circunferencia - comprimentoPrimario}`} transform="rotate(-90 60 60)" />}
        {comprimentoSecundario > 0 && <circle className={estilos.secundario} cx="60" cy="60" r="52" strokeDasharray={`${comprimentoSecundario} ${circunferencia - comprimentoSecundario}`} strokeDashoffset={deslocamentoSecundario} transform="rotate(-90 60 60)" />}
      </svg>
      <span className={estilos.centro}>{centro}</span>
    </div>
    <ul aria-hidden="true" className={estilos.legenda}>
      <li><span className={estilos.ponto} /><span><strong>{primario.rotulo}</strong><small>{primario.descricao}</small></span></li>
      <li><span className={estilos.ponto} /><span><strong>{secundario.rotulo}</strong><small>{secundario.descricao}</small></span></li>
    </ul>
  </div>;
}
