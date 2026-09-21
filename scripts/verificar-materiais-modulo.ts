import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo } from "../src/gerado/prisma/enums";
import {
  ErroModulo,
  arquivarMaterialPessoal,
  atualizarMaterialPessoal,
  criarMaterialPessoal,
  criarModuloPessoal,
  obterModuloPessoal,
} from "../src/servidor/modulos";
import { registrarSessaoManualPessoal } from "../src/servidor/sessoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de materiais do módulo falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const sufixo = Date.now().toString(36);
  let moduloId: string | null = null;
  try {
    const modulo = await criarModuloPessoal(ana.id, { titulo: `Materiais diretos ${sufixo}`, descricao: "Módulo temporário para validar materiais ligados diretamente ao módulo." });
    moduloId = modulo.id;
    const material = await criarMaterialPessoal(ana.id, {
      moduloId: modulo.id,
      titulo: "Resumo independente",
      descricao: "Material pertencente diretamente ao módulo.",
      formato: FormatoConteudo.PDF,
      minutosEstimados: 15,
      conteudoTexto: "Conteúdo sintético ligado diretamente ao módulo.",
      url: "",
    });
    afirmar(material.moduloId === modulo.id, "novo material deve pertencer diretamente ao módulo.");

    const leitura = await obterModuloPessoal(ana.id, modulo.identificador);
    afirmar(leitura?.materiais.some((item) => item.id === material.id), "biblioteca do módulo deve listar o material direto.");

    const sessao = await registrarSessaoManualPessoal(ana.id, {
      moduloId: modulo.id,
      descricao: "Sessão vinculada opcionalmente ao resumo independente.",
      metodos: ["FEYNMAN"],
      formatos: ["AUDIO"],
      materialIds: [material.id],
      iniciadaEm: "1999-04-01T10:00:00.000Z",
      encerradaEm: "1999-04-01T10:30:00.000Z",
      dificuldadePercebida: 2,
      compreensaoPercebida: 4,
    });
    afirmar(sessao.materiais[0]?.recurso.id === material.id && sessao.formatos[0]?.formato === "AUDIO", "sessão deve aceitar vínculo opcional sem inferir o formato pelo material.");

    const atualizado = await atualizarMaterialPessoal(ana.id, material.id, {
      titulo: "Resumo independente atualizado",
      descricao: "Material direto atualizado pelo proprietário.",
      formato: FormatoConteudo.PDF,
      minutosEstimados: 20,
      conteudoTexto: "Conteúdo sintético atualizado.",
      url: "",
    });
    afirmar(atualizado.moduloId === modulo.id && atualizado.minutosEstimados === 20, "edição deve preservar a propriedade direta do módulo.");

    let bloqueouOutraConta = false;
    try {
      await criarMaterialPessoal(bruno.id, {
        moduloId: modulo.id,
        titulo: "Tentativa indevida",
        descricao: "Outra conta não pode gravar neste módulo.",
        formato: FormatoConteudo.TEXTO,
        minutosEstimados: 10,
        conteudoTexto: "Conteúdo indevido.",
        url: "",
      });
    } catch (erro) {
      bloqueouOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouOutraConta, "autorização deve impedir material em módulo de outra conta.");

    await arquivarMaterialPessoal(ana.id, { id: material.id });
    const aposArquivamento = await obterModuloPessoal(ana.id, modulo.identificador);
    afirmar(aposArquivamento?.materiais.length === 0, "material arquivado deve sair da biblioteca sem ser apagado.");
    afirmar(await prisma.recursoConteudo.count({ where: { id: material.id, ativo: false } }) === 1, "arquivamento deve ser lógico.");

    console.log("Materiais do módulo verificados: propriedade direta, sessão opcional, formatos, edição, autorização e arquivamento.");
  } finally {
    if (moduloId) {
      await prisma.sessaoEstudo.deleteMany({ where: { moduloId } });
      await prisma.recursoConteudo.deleteMany({ where: { moduloId } });
      await prisma.moduloAprendizagem.deleteMany({ where: { id: moduloId } });
    }
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
