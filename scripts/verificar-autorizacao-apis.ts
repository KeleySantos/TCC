import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { PapelUsuario } from "../src/gerado/prisma/enums";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");

const enderecoAplicacao = process.env.URL_APLICACAO_DEMONSTRACAO ?? "http://localhost:3000";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de autorização falhou: ${mensagem}`);
}

function cabecalhosComSessao(usuarioId?: string) {
  return usuarioId ? { Cookie: `usuario_demonstracao=${usuarioId}` } : {};
}

async function principal() {
  const [ana, bruno, professor, recurso] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "prof.rafael" } }),
    prisma.recursoConteudo.findFirstOrThrow({ where: { identificador: "loops-pdf", ativo: true } }),
  ]);
  afirmar(ana.papel === PapelUsuario.ALUNO && bruno.papel === PapelUsuario.ALUNO, "Ana e Bruno devem ser alunos no cenário sintético.");
  afirmar(professor.papel === PapelUsuario.PROFESSOR, "o usuário professor deve possuir papel de professor.");

  const semSessao = await fetch(`${enderecoAplicacao}/api/sessoes`, { method: "POST" });
  afirmar(semSessao.status === 401, "requisição sem sessão deve receber 401.");

  const comoProfessor = await fetch(`${enderecoAplicacao}/api/sessoes`, { method: "POST", headers: cabecalhosComSessao(professor.id) });
  afirmar(comoProfessor.status === 403, "professor não deve iniciar sessão de aluno.");

  let sessaoId: string | null = null;
  try {
    const inicioAna = await fetch(`${enderecoAplicacao}/api/sessoes`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" },
      body: JSON.stringify({ recursoId: recurso.id }),
    });
    afirmar(inicioAna.status === 200, "Ana deve conseguir iniciar uma sessão própria.");
    const corpoInicio: unknown = await inicioAna.json();
    afirmar(typeof corpoInicio === "object" && corpoInicio !== null && "sessaoId" in corpoInicio && typeof corpoInicio.sessaoId === "string", "a criação deve retornar identificador de sessão.");
    sessaoId = corpoInicio.sessaoId;

    const tentativaBruno = await fetch(`${enderecoAplicacao}/api/sessoes/${sessaoId}/concluir`, { method: "POST", headers: cabecalhosComSessao(bruno.id) });
    afirmar(tentativaBruno.status === 404, "Bruno não deve encerrar uma sessão pertencente a Ana.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.delete({ where: { id: sessaoId } });
  }

  console.log("Autorização das APIs verificada: 401 sem sessão, 403 para professor e 404 para sessão de outro aluno.");
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
