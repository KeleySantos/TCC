import Link from "next/link";
import { PapelUsuario } from "@/gerado/prisma/enums";
import { formatarPorcentagem } from "@/biblioteca/formatacao";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterPainelProfessor } from "@/servidor/consultas";
import { formatarFormato } from "@/biblioteca/formatacao";
import { atualizarCuradoria } from "./acoes";

export default async function PaginaProfessor() {
  const usuario = await exigirUsuario(PapelUsuario.PROFESSOR);
  const painel = await obterPainelProfessor(usuario.perfilProfessorId!);
  return <main className="pagina" id="conteudo-principal">
    <header className="cabecalho"><div><p className="marca">APRENDER COM EVIDÊNCIAS</p><h1>Painel do professor</h1></div><Link className="botao botao-secundario" href="/entrar">Trocar conta</Link></header>
    <div className="aviso">Os alertas indicam necessidade de atenção e conversa pedagógica. Eles não são diagnóstico, ranking ou medida fixa de capacidade.</div>
    <section className="grade" style={{ marginTop: 18 }}><article className="cartao"><p className="rotulo">Alunos vinculados</p><p className="valor">{painel.quantidadeAlunos}</p></article><article className="cartao"><p className="rotulo">Turmas</p><p className="valor">{painel.turmas.length}</p></article></section>
    <section style={{ marginTop: 34 }}><h2>Visão por tópico</h2><div className="grade">{painel.topicos.map((topico) => <article className="cartao" key={topico.id}><h3>{topico.nome}</h3><p><strong>Média mais recente:</strong> {formatarPorcentagem(topico.media)}</p><p><strong>Atenção:</strong> {topico.alunosAtencao} aluno(s) com última nota abaixo de 60%.</p><p className="rotulo">Amostra: {topico.notas.length} resultado(s) disponível(is).</p></article>)}</div></section>
    <section style={{ marginTop: 34 }}><h2>Curadoria de materiais</h2><div className="grade">{painel.recursos.map((recurso) => <article className="cartao" key={recurso.id}><span className="selo">{formatarFormato(recurso.formato)}</span><h3>{recurso.titulo}</h3><p className="rotulo">Tópico: {recurso.topico}</p><p><strong>Situação:</strong> {recurso.situacao.toLowerCase()}</p><div className="navegacao"><form action={atualizarCuradoria}><input type="hidden" name="recursoId" value={recurso.id} /><input type="hidden" name="situacao" value="APROVADO" /><button className="botao" type="submit">Aprovar</button></form><form action={atualizarCuradoria}><input type="hidden" name="recursoId" value={recurso.id} /><input type="hidden" name="situacao" value="REJEITADO" /><button className="botao botao-secundario" type="submit">Rejeitar</button></form></div></article>)}</div></section>
  </main>;
}
