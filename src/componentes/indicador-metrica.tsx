export function IndicadorMetrica({ titulo, valor, detalhe }: { titulo: string; valor: string | number; detalhe: string }) {
  return <article className="cartao indicador-metrica"><p className="rotulo">{titulo}</p><p className="valor">{valor}</p><p className="rotulo">{detalhe}</p></article>;
}
