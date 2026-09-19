import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { removerArquivoMaterial } from "../src/servidor/arquivos-materiais";

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

function formularioArquivo(topicoId: string, titulo: string) {
  const formulario = new FormData();
  formulario.set("topicoId", topicoId);
  formulario.set("titulo", titulo);
  formulario.set("descricao", "Arquivo sintético enviado para verificar autorização da rota autenticada.");
  formulario.set("minutosEstimados", "10");
  formulario.set("arquivo", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], { type: "image/png" }), "teste.png");
  return formulario;
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const recursoAna = await prisma.recursoConteudo.findFirstOrThrow({
    where: { ativo: true, topico: { modulo: { usuarioId: ana.id } } },
  });
  const avaliacaoAna = await prisma.avaliacao.findFirstOrThrow({
    where: { ativa: true, topico: { modulo: { usuarioId: ana.id } } },
    include: { questoes: true },
  });
  const topicoAna = await prisma.topico.findFirstOrThrow({ where: { id: recursoAna.topicoId, ativo: true, rascunho: false } });

  const semSessao = await fetch(`${enderecoAplicacao}/api/sessoes`, { method: "POST" });
  afirmar(semSessao.status === 401, "requisição sem sessão deve receber 401.");
  const tentativaSemSessao = await fetch(`${enderecoAplicacao}/api/tentativas`, { method: "POST" });
  afirmar(tentativaSemSessao.status === 401, "tentativa sem sessão deve receber 401.");
  const interpretacaoSemSessao = await fetch(`${enderecoAplicacao}/api/interpretacoes`, { method: "POST" });
  afirmar(interpretacaoSemSessao.status === 401, "interpretação sem sessão deve receber 401.");
  const uploadSemSessao = await fetch(`${enderecoAplicacao}/api/materiais/upload`, { method: "POST" });
  afirmar(uploadSemSessao.status === 401, "upload sem sessão deve receber 401.");
  const interpretacaoModuloSemSessao = await fetch(`${enderecoAplicacao}/api/modulos/javascript/interpretacoes`, { method: "POST" });
  afirmar(interpretacaoModuloSemSessao.status === 401, "interpretação de módulo sem sessão deve receber 401.");
  const desafioSemSessao = await fetch(`${enderecoAplicacao}/api/desafios`, { method: "POST" });
  afirmar(desafioSemSessao.status === 401, "criação de desafio sem sessão deve receber 401.");

  const recursoDeOutraConta = await fetch(`${enderecoAplicacao}/api/sessoes`, {
    method: "POST",
    headers: { ...cabecalhosComSessao(bruno.id), "Content-Type": "application/json" },
    body: JSON.stringify({ recursoId: recursoAna.id, metodo: "LEITURA_ATIVA" }),
  });
  afirmar(recursoDeOutraConta.status === 404, "uma conta não deve iniciar sessão em material de outra conta.");
  const uploadEmTopicoDeOutraConta = await fetch(`${enderecoAplicacao}/api/materiais/upload`, {
    method: "POST",
    headers: cabecalhosComSessao(bruno.id),
    body: formularioArquivo(topicoAna.id, `Arquivo indevido ${Date.now()}`),
  });
  afirmar(uploadEmTopicoDeOutraConta.status === 404, "uma conta não deve enviar arquivo para tópico de outra conta.");
  const desafioEmModuloDeOutraConta = await fetch(`${enderecoAplicacao}/api/desafios`, {
    method: "POST",
    headers: { ...cabecalhosComSessao(bruno.id), "Content-Type": "application/json" },
    body: JSON.stringify({ moduloId: topicoAna.moduloId, metodo: "FEYNMAN", meta: "Tentativa de criar desafio em módulo alheio." }),
  });
  afirmar(desafioEmModuloDeOutraConta.status === 404, "uma conta não deve criar desafio em módulo de outra conta.");

  let sessaoId: string | null = null;
  let sessaoDesafioId: string | null = null;
  let tentativaId: string | null = null;
  let materialArquivoId: string | null = null;
  let chaveArquivo: string | null = null;
  let desafioId: string | null = null;
  try {
    const tituloArquivo = `Arquivo autenticado ${Date.now()}`;
    const uploadAna = await fetch(`${enderecoAplicacao}/api/materiais/upload`, {
      method: "POST",
      headers: cabecalhosComSessao(ana.id),
      body: formularioArquivo(topicoAna.id, tituloArquivo),
    });
    afirmar(uploadAna.status === 201, "a conta A deve enviar arquivo válido ao próprio tópico.");
    const corpoUpload: unknown = await uploadAna.json();
    afirmar(typeof corpoUpload === "object" && corpoUpload !== null && "material" in corpoUpload && typeof corpoUpload.material === "object" && corpoUpload.material !== null && "id" in corpoUpload.material && typeof corpoUpload.material.id === "string", "upload deve devolver metadados seguros do material criado.");
    materialArquivoId = corpoUpload.material.id;
    const arquivoPersistido = await prisma.recursoConteudo.findUniqueOrThrow({ where: { id: materialArquivoId }, include: { arquivo: true } });
    afirmar(arquivoPersistido.arquivo !== null && arquivoPersistido.origem === "ARQUIVO", "upload deve persistir arquivo com origem explícita.");
    chaveArquivo = arquivoPersistido.arquivo.chaveArmazenamento;
    const downloadSemSessao = await fetch(`${enderecoAplicacao}/api/materiais/${materialArquivoId}/arquivo`);
    afirmar(downloadSemSessao.status === 401, "download sem sessão deve receber 401.");
    const downloadOutraConta = await fetch(`${enderecoAplicacao}/api/materiais/${materialArquivoId}/arquivo`, { headers: cabecalhosComSessao(bruno.id) });
    afirmar(downloadOutraConta.status === 404, "outra conta não deve baixar arquivo alheio.");
    const downloadAna = await fetch(`${enderecoAplicacao}/api/materiais/${materialArquivoId}/arquivo`, { headers: cabecalhosComSessao(ana.id) });
    afirmar(downloadAna.status === 200 && downloadAna.headers.get("content-type") === "image/png" && downloadAna.headers.get("x-content-type-options") === "nosniff", "a proprietária deve receber arquivo autenticado com cabeçalhos seguros.");
    const interpretacaoModuloOutraConta = await fetch(`${enderecoAplicacao}/api/modulos/logica/interpretacoes`, { method: "POST", headers: cabecalhosComSessao(bruno.id) });
    afirmar(interpretacaoModuloOutraConta.status === 404, "outra conta não deve interpretar módulo pertencente à conta A.");
    const interpretacaoModuloInexistente = await fetch(`${enderecoAplicacao}/api/modulos/modulo-inexistente/interpretacoes`, { method: "POST", headers: cabecalhosComSessao(ana.id) });
    afirmar(interpretacaoModuloInexistente.status === 404, "interpretação por módulo inexistente deve receber 404.");
    const interpretacaoModuloAna = await fetch(`${enderecoAplicacao}/api/modulos/logica/interpretacoes`, { method: "POST", headers: cabecalhosComSessao(ana.id) });
    afirmar(interpretacaoModuloAna.status === 200, "a conta A deve obter interpretação restrita ao próprio módulo.");
    const corpoInterpretacaoModulo: unknown = await interpretacaoModuloAna.json();
    afirmar(typeof corpoInterpretacaoModulo === "object" && corpoInterpretacaoModulo !== null && "interpretacao" in corpoInterpretacaoModulo && typeof corpoInterpretacaoModulo.interpretacao === "object" && corpoInterpretacaoModulo.interpretacao !== null && "contexto" in corpoInterpretacaoModulo.interpretacao && typeof corpoInterpretacaoModulo.interpretacao.contexto === "object" && corpoInterpretacaoModulo.interpretacao.contexto !== null && "quantidadeModulos" in corpoInterpretacaoModulo.interpretacao.contexto && corpoInterpretacaoModulo.interpretacao.contexto.quantidadeModulos === 1, "interpretação por módulo deve expor somente escopo unitário e contingência compatível.");
    const desafioAna = await fetch(`${enderecoAplicacao}/api/desafios`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" },
      body: JSON.stringify({ moduloId: topicoAna.moduloId, metodo: "FEYNMAN", meta: "Desafio temporário de autorização HTTP." }),
    });
    afirmar(desafioAna.status === 201, "a conta A deve criar desafio no próprio módulo.");
    const corpoDesafio: unknown = await desafioAna.json();
    afirmar(typeof corpoDesafio === "object" && corpoDesafio !== null && "desafio" in corpoDesafio && typeof corpoDesafio.desafio === "object" && corpoDesafio.desafio !== null && "id" in corpoDesafio.desafio && typeof corpoDesafio.desafio.id === "string", "criação deve devolver o identificador seguro do desafio.");
    desafioId = corpoDesafio.desafio.id;
    const sessaoComDesafio = await fetch(`${enderecoAplicacao}/api/sessoes`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" },
      body: JSON.stringify({ recursoId: recursoAna.id, metodo: "FEYNMAN", desafioId }),
    });
    afirmar(sessaoComDesafio.status === 200, "a conta A deve vincular a própria sessão ao desafio ativo.");
    const corpoSessaoDesafio: unknown = await sessaoComDesafio.json();
    afirmar(typeof corpoSessaoDesafio === "object" && corpoSessaoDesafio !== null && "sessaoId" in corpoSessaoDesafio && typeof corpoSessaoDesafio.sessaoId === "string", "sessão vinculada deve devolver identificador.");
    sessaoDesafioId = corpoSessaoDesafio.sessaoId;
    const cancelamentoOutraConta = await fetch(`${enderecoAplicacao}/api/desafios/${encodeURIComponent(desafioId)}/cancelar`, { method: "POST", headers: cabecalhosComSessao(bruno.id) });
    afirmar(cancelamentoOutraConta.status === 404, "outra conta não deve cancelar desafio alheio.");
    const cancelamentoAna = await fetch(`${enderecoAplicacao}/api/desafios/${encodeURIComponent(desafioId)}/cancelar`, { method: "POST", headers: cabecalhosComSessao(ana.id) });
    afirmar(cancelamentoAna.status === 200, "a proprietária deve cancelar o próprio desafio.");
    const inicioCancelado = await fetch(`${enderecoAplicacao}/api/sessoes`, { method: "POST", headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" }, body: JSON.stringify({ recursoId: recursoAna.id, metodo: "FEYNMAN", desafioId }) });
    afirmar(inicioCancelado.status === 404, "desafio cancelado não deve receber nova sessão pela API.");
    const inicioAna = await fetch(`${enderecoAplicacao}/api/sessoes`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" },
      body: JSON.stringify({ recursoId: recursoAna.id, metodo: "LEITURA_ATIVA" }),
    });
    afirmar(inicioAna.status === 200, "a conta A deve conseguir iniciar sessão própria.");
    const corpoInicio: unknown = await inicioAna.json();
    afirmar(typeof corpoInicio === "object" && corpoInicio !== null && "sessaoId" in corpoInicio && typeof corpoInicio.sessaoId === "string", "a criação deve retornar identificador de sessão.");
    sessaoId = corpoInicio.sessaoId;

    const tentativaBruno = await fetch(`${enderecoAplicacao}/api/sessoes/${sessaoId}/concluir`, { method: "POST", headers: { ...cabecalhosComSessao(bruno.id), "Content-Type": "application/json" }, body: JSON.stringify({ dificuldadePercebida: 3, compreensaoPercebida: 3, observacao: "Tentativa sintética." }) });
    afirmar(tentativaBruno.status === 404, "a conta B não deve encerrar sessão pertencente à conta A.");

    const respostasCorretas = Object.fromEntries(avaliacaoAna.questoes.map((questao) => [questao.id, questao.opcaoCorreta]));
    const avaliacaoDeOutraConta = await fetch(`${enderecoAplicacao}/api/tentativas`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(bruno.id), "Content-Type": "application/json" },
      body: JSON.stringify({ avaliacaoId: avaliacaoAna.id, respostas: respostasCorretas }),
    });
    afirmar(avaliacaoDeOutraConta.status === 404, "a conta B não deve concluir avaliação pertencente à conta A.");
    const tentativaAna = await fetch(`${enderecoAplicacao}/api/tentativas`, {
      method: "POST",
      headers: { ...cabecalhosComSessao(ana.id), "Content-Type": "application/json" },
      body: JSON.stringify({ avaliacaoId: avaliacaoAna.id, respostas: respostasCorretas }),
    });
    afirmar(tentativaAna.status === 200, "a conta A deve concluir a própria avaliação.");
    const corpoTentativa: unknown = await tentativaAna.json();
    afirmar(typeof corpoTentativa === "object" && corpoTentativa !== null && "tentativaId" in corpoTentativa && typeof corpoTentativa.tentativaId === "string" && "notaNormalizada" in corpoTentativa && corpoTentativa.notaNormalizada === 100, "a API deve devolver a tentativa corrigida sem expor o gabarito.");
    tentativaId = corpoTentativa.tentativaId;
    const interpretacaoAna = await fetch(`${enderecoAplicacao}/api/interpretacoes`, { method: "POST", headers: cabecalhosComSessao(ana.id) });
    afirmar(interpretacaoAna.status === 200, "a conta A deve obter interpretação local quando não há chave externa.");
    const corpoInterpretacao: unknown = await interpretacaoAna.json();
    afirmar(typeof corpoInterpretacao === "object" && corpoInterpretacao !== null && "interpretacao" in corpoInterpretacao && typeof corpoInterpretacao.interpretacao === "object" && corpoInterpretacao.interpretacao !== null && "origem" in corpoInterpretacao.interpretacao && corpoInterpretacao.interpretacao.origem === "LOCAL", "a ausência de chave deve devolver contingência local e não falhar o painel.");
  } finally {
    if (sessaoId) await prisma.sessaoEstudo.delete({ where: { id: sessaoId } });
    if (sessaoDesafioId) await prisma.sessaoEstudo.delete({ where: { id: sessaoDesafioId } });
    if (tentativaId) await prisma.tentativaAvaliacao.delete({ where: { id: tentativaId } });
    if (chaveArquivo) await removerArquivoMaterial(chaveArquivo);
    if (materialArquivoId) await prisma.recursoConteudo.delete({ where: { id: materialArquivoId } });
    if (desafioId) await prisma.desafioExperimentacao.delete({ where: { id: desafioId } });
  }

  console.log("Autorização pessoal verificada: 401 sem sessão, correção oficial e isolamento de recursos, sessões e avaliações.");
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); }).finally(async () => prisma.$disconnect());
