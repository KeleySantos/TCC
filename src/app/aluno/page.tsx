import Link from "next/link";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { formatarPorcentagem } from "@/biblioteca/formatacao";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelAluno } from "@/servidor/consultas";
import { GraficoDesempenho } from "@/componentes/grafico-desempenho";

export default async function PaginaAluno() {
  const usuario = await exigirUsuario(PapelUsuario.ALUNO);
  const painel = await obterPainelAluno(usuario.perfilAlunoId!);
  return <main className="pagina" id="conteudo-principal">
    <header className="cabecalho"><div><p className="marca">APRENDER COM EVIDÊNCIAS</p><h1>Olá, {usuario.nome.split(" ")[0]}</h1></div><nav className="navegacao"><Link className="botao botao-secundario" href="/entrar">Trocar conta</Link></nav></header>
    <div className="aviso"><strong>Leitura responsável dos dados.</strong> Os indicadores mostram associações observadas no seu histórico; eles não definem um estilo de aprendizagem nem garantem resultado futuro.</div>
    <section className="grade" style={{ marginTop: 18 }}>
      <article className="cartao"><p className="rotulo">Sessões concluídas</p><p className="valor">{painel.quantidadeSessoesValidas}</p></article>
      <article className="cartao"><p className="rotulo">Tentativas concluídas</p><p className="valor">{painel.quantidadeTentativas}</p></article>
      <article className="cartao"><p className="rotulo">Tópicos disponíveis</p><p className="valor">{painel.topicos.length}</p></article>
    </section>
    <section className="cartao" style={{ marginTop: 18 }}><h2 style={{ marginTop: 0 }}>Último resultado por tópico</h2><GraficoDesempenho dados={painel.topicos.map((topico) => ({ topico: topico.nome, nota: topico.analise.ultimaNota }))} /><p className="rotulo">O gráfico mostra apenas a última nota registrada por tópico; não mede capacidade nem prevê desempenho futuro.</p></section>
    <section style={{ marginTop: 34 }}><h2>Seu percurso por tópico</h2><div className="grade">
      {painel.topicos.map((topico) => <article className="cartao" key={topico.id}>
        <span className="selo">{topico.analise.evidencias.length} evidência(s)</span><h3>{topico.nome}</h3><p className="rotulo">{topico.descricao}</p>
        <p><strong>Última nota:</strong> {formatarPorcentagem(topico.analise.ultimaNota)}</p>
        <p><strong>Próximo passo:</strong> {topico.recomendacao?.justificativa ?? "Não há materiais disponíveis para sugerir agora."}</p>
        <Link className="botao" href={`/aluno/topicos/${topico.identificador}`}>Ver tópico</Link>
      </article>)}
    </div></section>
  </main>;
}
