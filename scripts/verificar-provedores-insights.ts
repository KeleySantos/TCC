import "dotenv/config";
import { prisma } from "../src/biblioteca/prisma";
import type { DtoInterpretacao } from "../src/dominio/interpretacoes/esquema";
import { obterDefinicaoProvedor } from "../src/servidor/ia/catalogo-provedores";
import { obterCredencialConfigurada } from "../src/servidor/ia/configuracoes";
import { criarProvedorGroq } from "../src/servidor/ia/groq";

const nomeUsuario = "admin";
const usuario = await prisma.usuario.findUnique({ where: { nomeUsuario }, select: { id: true } });
if (!usuario) throw new Error(`Conta de teste não encontrada: ${nomeUsuario}`);

const dto: DtoInterpretacao = {
  escopo: "MODULO", versaoAlgoritmo: "diagnostico-provedor-v1", quantidadeModulos: 1, quantidadeSessoesValidas: 1, minutosValidos: 20,
  periodo: { inicio: null, fim: null }, modulos: [], evolucaoSemanal: [], descricoesSessoes: [], limitacoes: ["Diagnóstico técnico sem dados pessoais."],
};

const provedor = "GROQ" as const;
const chave = await obterCredencialConfigurada(usuario.id, provedor);
console.log(`GROQ_API_KEY encontrada: ${chave ? "sim" : "não"}`);
if (chave) {
  const definicao = obterDefinicaoProvedor(provedor);
  const cliente = criarProvedorGroq(chave, definicao.modelo);
  const inicio = Date.now();
  try {
    await cliente.testarConexao?.();
    const resposta = await cliente.interpretar(dto);
    const valida = Boolean(resposta && typeof resposta === "object" && "insights" in resposta && Array.isArray(resposta.insights));
    console.log(JSON.stringify({ provedor, modelo: cliente.obterModeloUtilizado?.() ?? definicao.modelo, conexao: "OK", estrutura: valida ? "OK" : "INVALIDA", duracaoMs: Date.now() - inicio }));
  } catch (erro) {
    const codigo = erro && typeof erro === "object" && "codigo" in erro ? erro.codigo : erro instanceof Error ? erro.name : "DESCONHECIDO";
    console.log(JSON.stringify({ provedor, modelo: definicao.modelo, conexao: "FALHA", codigo, duracaoMs: Date.now() - inicio }));
  }
}

await prisma.$disconnect();
