import "dotenv/config";
import { prisma } from "../src/biblioteca/prisma";
import { definirConfiguracaoIaAtiva, listarConfiguracoesIaSeguras, listarCredenciaisAtivas, obterCredencialConfigurada, removerConfiguracaoIa, salvarConfiguracaoIa } from "../src/servidor/ia/configuracoes";

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação das configurações de IA falhou: ${mensagem}`);
}

async function principal() {
  const marcador = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const usuarioA = await prisma.usuario.create({ data: { nome: "Conta sintética do cofre A", nomeUsuario: `cofre.a.${marcador}`, senhaHash: "hash-sintetico" } });
  const usuarioB = await prisma.usuario.create({ data: { nome: "Conta sintética do cofre B", nomeUsuario: `cofre.b.${marcador}`, senhaHash: "hash-sintetico" } });
  const segredo = "credencial-ficticia-para-verificacao-local";
  try {
    await salvarConfiguracaoIa(usuarioA.id, "GROQ", segredo);
    const persistida = await prisma.configuracaoIa.findUniqueOrThrow({ where: { usuarioId_provedor: { usuarioId: usuarioA.id, provedor: "GROQ" } } });
    afirmar(persistida.chaveCifrada !== segredo && !JSON.stringify(persistida).includes(segredo), "o banco não pode conter a chave em texto puro.");
    afirmar((await obterCredencialConfigurada(usuarioA.id, "GROQ")) === segredo, "a proprietária deve conseguir usar a credencial apenas no servidor.");
    afirmar((await obterCredencialConfigurada(usuarioB.id, "GROQ")) === null, "outra conta não pode consultar a credencial.");
    const dtoSeguro = await listarConfiguracoesIaSeguras(usuarioA.id);
    afirmar(!JSON.stringify(dtoSeguro).includes(segredo) && dtoSeguro[0]?.configurada, "o DTO da interface não pode conter a chave.");
    afirmar((await listarCredenciaisAtivas(usuarioA.id))[0]?.provedor === "GROQ", "a fila deve receber a credencial ativa na prioridade correta.");
    await definirConfiguracaoIaAtiva(usuarioA.id, "GROQ", false);
    afirmar((await listarCredenciaisAtivas(usuarioA.id)).length === 0, "provedor desativado não pode entrar na fila.");
    await removerConfiguracaoIa(usuarioA.id, "GROQ");
    afirmar((await obterCredencialConfigurada(usuarioA.id, "GROQ")) === null, "a remoção deve ser definitiva.");
  } finally {
    await prisma.usuario.deleteMany({ where: { id: { in: [usuarioA.id, usuarioB.id] } } });
    await prisma.$disconnect();
  }
  console.log("Configurações de IA verificadas: criptografia, DTO seguro, propriedade, prioridade, desativação e remoção.");
}

principal().catch(async (erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  await prisma.$disconnect();
  process.exit(1);
});
