import type { obterAprendizagemModuloPessoal } from "@/servidor/aprendizagem-modulo";
import estilos from "./page.module.css";

type Evento = NonNullable<Awaited<ReturnType<typeof obterAprendizagemModuloPessoal>>>["linhaDoTempo"][number];
function data(valor: Date) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(valor); }

export function PainelLinhaTempoModulo({ eventos }: { eventos: Evento[] }) {
  return <section aria-labelledby="titulo-linha-tempo-modulo" className={estilos.blocoAprendizagem}><header><p className={estilos.sobretituloPagina}>TRAJETÓRIA</p><h2 id="titulo-linha-tempo-modulo">Como minha trajetória de aprendizagem aconteceu?</h2><p>Sessões, materiais e evidências aparecem em ordem cronológica dentro deste módulo.</p></header>{eventos.length ? <ol className={estilos.linhaTempo}>{eventos.map((evento) => <li key={`${evento.tipo}-${evento.id}`}><time dateTime={evento.data.toISOString()}>{data(evento.data)}</time><div><small>{evento.tipo.replaceAll("_", " ")}</small><strong>{evento.titulo}</strong><span>{evento.resumo}</span>{evento.conceitos.length > 0 && <small>{evento.conceitos.join(" · ")}</small>}</div></li>)}</ol> : <p>A trajetória aparecerá quando houver sessões, materiais ou evidências.</p>}</section>;
}
