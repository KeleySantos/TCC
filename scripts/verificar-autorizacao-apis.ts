import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { removerArquivoMaterial } from "../src/servidor/arquivos-materiais";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está definida.");
const endereco = process.env.URL_APLICACAO_DEMONSTRACAO ?? "http://localhost:3000";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
function afirmar(valor: unknown, mensagem: string): asserts valor { if (!valor) throw new Error(`Autorização inválida: ${mensagem}`); }
const cabecalhos = (usuarioId?: string) => usuarioId ? { Cookie: `usuario_demonstracao=${usuarioId}` } : {};
function formulario(moduloId: string) { const dados = new FormData(); dados.set("moduloId", moduloId); dados.set("titulo", `Arquivo autenticado ${Date.now()}`); dados.set("descricao", "Arquivo sintético para autorização."); dados.set("minutosEstimados", "10"); dados.set("arquivo", new Blob([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])], { type: "image/png" }), "teste.png"); return dados; }

async function principal() {
  const [ana, bruno] = await Promise.all([prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }), prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } })]);
  const modulo = await prisma.moduloAprendizagem.findFirstOrThrow({ where: { usuarioId: ana.id, identificador: "javascript" } });
  const material = await prisma.recursoConteudo.findFirstOrThrow({ where: { moduloId: modulo.id, ativo: true } });
  for (const rota of ["/api/sessoes", "/api/interpretacoes", "/api/materiais/upload", "/api/modulos/javascript/interpretacoes", "/api/desafios"]) {
    const resposta = await fetch(`${endereco}${rota}`, { method: "POST" });
    afirmar(resposta.status === 401, `${rota} sem sessão deve retornar 401.`);
  }
  afirmar((await fetch(`${endereco}/api/materiais/inexistente/analise`, { method: "POST" })).status === 401, "análise de material sem sessão deve retornar 401.");
  afirmar((await fetch(`${endereco}/api/materiais/inexistente`, { method: "DELETE" })).status === 401, "exclusão de material sem sessão deve retornar 401.");
  const desafioAlheio = await fetch(`${endereco}/api/desafios`, { method: "POST", headers: { ...cabecalhos(bruno.id), "Content-Type": "application/json" }, body: JSON.stringify({ moduloId: modulo.id, metodo: "FEYNMAN", meta: "Tentativa em módulo alheio." }) });
  afirmar(desafioAlheio.status === 404, "outra conta não pode criar desafio no módulo.");
  const uploadAlheio = await fetch(`${endereco}/api/materiais/upload`, { method: "POST", headers: cabecalhos(bruno.id), body: formulario(modulo.id) });
  afirmar(uploadAlheio.status === 404, "outra conta não pode enviar material ao módulo.");

  let materialId: string | null = null; let chave: string | null = null; let desafioId: string | null = null; let sessaoId: string | null = null;
  try {
    const upload = await fetch(`${endereco}/api/materiais/upload`, { method: "POST", headers: cabecalhos(ana.id), body: formulario(modulo.id) });
    afirmar(upload.status === 201, "proprietária deve enviar material.");
    const corpoUpload = await upload.json() as { material: { id: string } }; materialId = corpoUpload.material.id;
    const persistido = await prisma.recursoConteudo.findUniqueOrThrow({ where: { id: materialId }, include: { arquivo: true } }); chave = persistido.arquivo!.chaveArmazenamento;
    afirmar((await fetch(`${endereco}/api/materiais/${materialId}/arquivo`)).status === 401, "download sem sessão deve retornar 401.");
    afirmar((await fetch(`${endereco}/api/materiais/${materialId}/arquivo`, { headers: cabecalhos(bruno.id) })).status === 404, "download alheio deve retornar 404.");
    const download = await fetch(`${endereco}/api/materiais/${materialId}/arquivo`, { headers: cabecalhos(ana.id) });
    afirmar(download.status === 200 && download.headers.get("x-content-type-options") === "nosniff", "download próprio deve usar cabeçalhos seguros.");
    afirmar((await fetch(`${endereco}/api/materiais/${materialId}/analise`, { method: "POST", headers: cabecalhos(bruno.id) })).status === 404, "outra conta não pode analisar o material.");
    afirmar((await fetch(`${endereco}/api/materiais/${materialId}`, { method: "DELETE", headers: cabecalhos(bruno.id) })).status === 404, "outra conta não pode excluir o material.");
    const substituicaoAlheia = new FormData(); substituicaoAlheia.set("arquivo", new Blob([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])], { type: "image/png" }), "outro.png");
    afirmar((await fetch(`${endereco}/api/materiais/${materialId}/arquivo/substituir`, { method: "POST", headers: cabecalhos(bruno.id), body: substituicaoAlheia })).status === 404, "outra conta não pode substituir o arquivo.");

    afirmar((await fetch(`${endereco}/api/modulos/logica/interpretacoes`, { method: "POST", headers: cabecalhos(bruno.id) })).status === 404, "interpretação alheia deve retornar 404.");
    afirmar((await fetch(`${endereco}/api/modulos/logica/interpretacoes`, { method: "POST", headers: cabecalhos(ana.id) })).status === 200, "interpretação própria deve funcionar.");
    const desafio = await fetch(`${endereco}/api/desafios`, { method: "POST", headers: { ...cabecalhos(ana.id), "Content-Type": "application/json" }, body: JSON.stringify({ moduloId: modulo.id, metodo: "FEYNMAN", meta: "Desafio temporário de autorização." }) });
    afirmar(desafio.status === 201, "proprietária deve criar desafio."); desafioId = (await desafio.json() as { desafio: { id: string } }).desafio.id;
    const sessao = await fetch(`${endereco}/api/sessoes`, { method: "POST", headers: { ...cabecalhos(ana.id), "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "CRONOMETRO", moduloId: modulo.id, descricao: "Sessão temporária vinculada ao desafio.", metodos: ["FEYNMAN"], formatos: ["PDF"], materialIds: [material.id], desafioId }) });
    afirmar(sessao.status === 201, "sessão própria deve vincular desafio e material."); sessaoId = (await sessao.json() as { sessao: { id: string } }).sessao.id;
    afirmar((await fetch(`${endereco}/api/desafios/${desafioId}/cancelar`, { method: "POST", headers: cabecalhos(bruno.id) })).status === 404, "outra conta não pode cancelar desafio.");
    afirmar((await fetch(`${endereco}/api/desafios/${desafioId}/cancelar`, { method: "POST", headers: cabecalhos(ana.id) })).status === 200, "proprietária deve cancelar desafio.");
    const interpretacao = await fetch(`${endereco}/api/interpretacoes`, { method: "POST", headers: cabecalhos(ana.id) });
    afirmar(interpretacao.status === 200, "interpretação geral deve possuir contingência local.");
    console.log("Autorização verificada: autenticação, propriedade de módulos, materiais, sessões, desafios e interpretações.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.deleteMany({ where: { id: sessaoId } });
    if (desafioId) await prisma.desafioExperimentacao.deleteMany({ where: { id: desafioId } });
    if (chave) await removerArquivoMaterial(chave);
    if (materialId) await prisma.recursoConteudo.deleteMany({ where: { id: materialId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro) => { console.error(erro); process.exit(1); });
