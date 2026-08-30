import Link from "next/link";
import { notFound } from "next/navigation";
import { PapelUsuario, SituacaoAprovacao } from "@/gerado/prisma/enums";
import { formatarFormato, formatarPorcentagem } from "@/biblioteca/formatacao";
import { prisma } from "@/biblioteca/prisma";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelAluno } from "@/servidor/consultas";
import { CronometroEstudo } from "@/componentes/cronometro-estudo";
import { Quiz } from "@/componentes/quiz";

export default async function PaginaTopico({ params }: { params: Promise<{ identificador: string }> }) {
  const usuario = await exigirUsuario(PapelUsuario.ALUNO);
  const { identificador } = await params;
  const topico = await prisma.topico.findUnique({ where: { identificador }, include: { recursos: { where: { ativo: true }, include: { aprovacoes: true } }, avaliacoes: { where: { ativa: true }, include: { questoes: { orderBy: { posicao: "asc" } } } } } });
  if (!topico) notFound();
  const painel = await obterPainelAluno(usuario.perfilAlunoId!);
  const itemPainel = painel.topicos.find((item) => item.id === topico.id);
  return <main className="pagina" id="conteudo-principal">
    <header className="cabecalho"><div><p className="marca">APRENDER COM EVIDÊNCIAS</p><h1>{topico.nome}</h1><p className="rotulo">{topico.descricao}</p></div><Link className="botao botao-secundario" href="/aluno">Voltar ao painel</Link></header>
    <section className="grade"><article className="cartao"><p className="rotulo">Última nota</p><p className="valor">{formatarPorcentagem(itemPainel?.analise.ultimaNota)}</p></article><article className="cartao"><p className="rotulo">Evidências válidas</p><p className="valor">{itemPainel?.analise.evidencias.length ?? 0}</p></article></section>
    <section style={{ marginTop: 28 }}><h2>Materiais para estudar</h2><div className="grade">{topico.recursos.map((recurso) => <article className="cartao" key={recurso.id}><span className="selo">{formatarFormato(recurso.formato)}</span>{recurso.aprovacoes.some((aprovacao) => aprovacao.situacao === SituacaoAprovacao.APROVADO) && <span className="selo" style={{ marginLeft: 6 }}>Aprovado pelo professor</span>}<h3>{recurso.titulo}</h3><p className="rotulo">{recurso.descricao}</p><p className="rotulo">Tempo estimado: {recurso.minutosEstimados} minutos</p><CronometroEstudo recursoId={recurso.id} /></article>)}</div></section>
    {itemPainel?.recomendacao && <section className="cartao" style={{ marginTop: 28 }}><span className="selo">Recomendação com evidência {itemPainel.recomendacao.nivelEvidencia.toLowerCase()}</span><h2>Próximo passo sugerido</h2><p>{itemPainel.recomendacao.justificativa}</p></section>}
    {topico.avaliacoes.map((avaliacao) => <section key={avaliacao.id} style={{ marginTop: 28 }}><Quiz avaliacaoId={avaliacao.id} questoes={avaliacao.questoes.map((questao) => ({ id: questao.id, enunciado: questao.enunciado, opcoes: JSON.parse(questao.opcoesJson) as string[] }))} /></section>)}
  </main>;
}
