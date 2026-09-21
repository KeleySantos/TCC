import Link from "next/link";
import { formatarData, formatarFormato } from "@/biblioteca/formatacao";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { formatarMetodoEstudo } from "@/dominio/sessoes/metodos";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarHistoricoPessoal } from "@/servidor/sessoes";

function rotuloSituacao(situacao: string) {
  const rotulos: Record<string, string> = { CONCLUIDA: "concluída", PLANEJADA: "planejada", ATIVA: "ativa", INVALIDADA: "invalidada" };
  return rotulos[situacao] ?? situacao.toLowerCase();
}

export default async function PaginaHistorico() {
  const usuario = await exigirUsuario();
  const sessoes = await listarHistoricoPessoal(usuario.id);
  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className="pagina" id="conteudo-principal" tabIndex={-1}>
    <header className="cabecalho"><div><p className="marca">LABORATÓRIO PESSOAL DE APRENDIZAGEM</p><h1>Histórico de sessões</h1><p className="rotulo">Todos os seus registros de estudo, em ordem cronológica e sem depender de tópicos ou avaliações.</p></div></header>
    <div className="aviso"><strong>Como interpretar.</strong> Sessões planejadas, ativas e invalidadas permanecem visíveis para transparência, mas somente sessões concluídas válidas entram nas métricas. Sessões arquivadas preservam o histórico estudado.</div>
    {sessoes.length === 0 ? <section className="cartao" style={{ marginTop: 24 }}><h2>Sem sessões ainda</h2><p className="rotulo">Abra um módulo e registre sua primeira sessão manualmente ou pelo cronômetro.</p></section> : <section className="tabela-responsiva cartao" style={{ marginTop: 24 }}><table><caption>Suas sessões, da mais recente para a mais antiga.</caption><thead><tr><th scope="col">Data</th><th scope="col">Módulo</th><th scope="col">Conteúdo estudado</th><th scope="col">Métodos e formatos</th><th scope="col">Duração e percepção</th></tr></thead><tbody>{sessoes.map((sessao) => <tr key={sessao.id}>
      <td>{formatarData(sessao.iniciadaEm)}<br /><span className="rotulo">{rotuloSituacao(sessao.situacao)}{sessao.arquivada ? " · arquivada" : ""}</span></td>
      <td><Link href={`/modulos/${encodeURIComponent(sessao.modulo.identificador)}`}>{sessao.modulo.titulo}</Link>{sessao.desafio ? <><br /><span className="rotulo">Desafio: {sessao.desafio.meta}</span></> : null}</td>
      <td>{sessao.descricao}{sessao.materiais.length ? <><br /><span className="rotulo">Materiais: {sessao.materiais.map((item) => item.recurso.titulo).join(", ")}</span></> : null}</td>
      <td>{sessao.metodos.map((item) => formatarMetodoEstudo(item.metodo)).join(", ") || "—"}<br /><span className="rotulo">{sessao.formatos.map((item) => formatarFormato(item.formato)).join(", ") || "—"}</span></td>
      <td>{sessao.duracaoMinutos ?? "—"} min<br /><span className="rotulo">Dificuldade {sessao.dificuldadePercebida ?? "—"}/5 · Compreensão {sessao.compreensaoPercebida ?? "—"}/5</span></td>
    </tr>)}</tbody></table></section>}
  </main></EstruturaAutenticada>;
}
