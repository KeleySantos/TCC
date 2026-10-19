import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/biblioteca/prisma";
import { obterAprendizagemModuloPessoal } from "../src/servidor/aprendizagem-modulo";
import { cenariosTcc, identificadorModuloCenarioTcc, referenciaTcc, usuariosCenariosTcc } from "../testes/fixtures/cenarios-tcc";

async function principal() {
  const resultados = [];
  let sessoes = 0;
  let evidencias = 0;

  for (const [indiceCenario, atribuicao] of usuariosCenariosTcc.entries()) {
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: atribuicao.nomeUsuario } });
    assert.equal(usuario.nome, atribuicao.nome);
    const definicao = cenariosTcc[indiceCenario];

    for (let numeroModulo = 0; numeroModulo < 3; numeroModulo++) {
      const identificador = identificadorModuloCenarioTcc(atribuicao.cenario, numeroModulo);
      const modulo = await prisma.moduloAprendizagem.findUniqueOrThrow({
        where: { usuarioId_identificador: { usuarioId: usuario.id, identificador } },
        include: { _count: { select: { sessoesEstudo: true, evidencias: true } } },
      });
      assert.equal(modulo._count.sessoesEstudo, 10);
      assert.equal(modulo._count.evidencias, 10);

      const aprendizagem = await obterAprendizagemModuloPessoal(usuario.id, modulo.id, referenciaTcc);
      assert(aprendizagem);
      const conceito = aprendizagem.analises.conceitos.find((item) => item.chave === "conceito");
      assert(conceito);
      assert.equal(conceito.desempenhoMedio, definicao.medias[numeroModulo]);
      assert.equal(conceito.tendencia, definicao.tendencias[numeroModulo]);
      assert.equal(conceito.evidencias, indiceCenario === 3 ? numeroModulo : 10);

      sessoes += modulo._count.sessoesEstudo;
      evidencias += modulo._count.evidencias;
      resultados.push({ usuario: usuario.nomeUsuario, cenario: atribuicao.cenario, modulo: numeroModulo + 1, media: conceito.desempenhoMedio, tendencia: conceito.tendencia, evidenciasConceito: conceito.evidencias });
    }
  }

  assert.equal(resultados.length, 15);
  assert.equal(sessoes, 150);
  assert.equal(evidencias, 150);
  console.log(JSON.stringify({ usuarios: usuariosCenariosTcc, modulos: resultados.length, sessoes, evidencias, resultados }));
}

principal().catch((erro: unknown) => { console.error(erro); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
