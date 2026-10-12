import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, ModoRegistroSessao, SituacaoSessao } from "../src/gerado/prisma/enums";
import { CENARIO_SINTETICO_DIEGO } from "../src/dominio/cenarios/cenario-sintetico-diego";
import { gravarArquivoMaterial, removerArquivoMaterial } from "../src/servidor/arquivos-materiais";

export const MARCADOR_CENARIO_DIEGO = "CENARIO_SINTETICO_RICO_DIEGO_V1";

export async function aplicarCenarioSinteticoDiego(
  prisma: PrismaClient,
  conta: { usuario: { id: string }; modulo: { id: string } },
  referencia: Date,
) {
  const identificadores = CENARIO_SINTETICO_DIEGO.materiais.map((material) => material.identificador);
  const recursosAnteriores = await prisma.recursoConteudo.findMany({
    where: { moduloId: conta.modulo.id, identificador: { in: identificadores } },
    select: { arquivo: { select: { chaveArmazenamento: true } } },
  });
  await prisma.evidenciaAprendizagem.deleteMany({
    where: { moduloId: conta.modulo.id, dadosOrigemJson: { contains: MARCADOR_CENARIO_DIEGO } },
  });
  await prisma.sessaoEstudo.deleteMany({
    where: { usuarioId: conta.usuario.id, moduloId: conta.modulo.id, observacao: MARCADOR_CENARIO_DIEGO },
  });
  await prisma.recursoConteudo.deleteMany({ where: { moduloId: conta.modulo.id, identificador: { in: identificadores } } });
  await Promise.all(recursosAnteriores.flatMap((recurso) => recurso.arquivo ? [removerArquivoMaterial(recurso.arquivo.chaveArmazenamento)] : []));

  const recursos = new Map<string, string>();
  for (const material of CENARIO_SINTETICO_DIEGO.materiais) {
    const bytes = new TextEncoder().encode(material.conteudo);
    const chaveArmazenamento = randomUUID();
    await gravarArquivoMaterial(chaveArmazenamento, bytes);
    const recurso = await prisma.recursoConteudo.create({ data: {
      moduloId: conta.modulo.id,
      identificador: material.identificador,
      titulo: material.titulo,
      descricao: "Arquivo textual sintético para demonstrar análise de conceitos.",
      formato: FormatoConteudo.TEXTO,
      minutosEstimados: 20,
      origem: "ARQUIVO",
      funcao: material.funcao,
      dataEvento: material.funcao === "REFERENCIA" ? null : referencia,
      arquivo: { create: {
        nomeOriginal: material.nomeArquivo,
        tipoMime: "text/plain",
        tamanhoBytes: bytes.byteLength,
        chaveArmazenamento,
        extensaoNormalizada: "txt",
      } },
      analise: { create: {
        situacao: "CONCLUIDA",
        resumo: material.resumo,
        conceitosJson: JSON.stringify(material.conceitos),
        pontosRevisaoJson: JSON.stringify(["Revise as relações entre os conceitos do arquivo.", "Compare um exemplo correto e um caso de borda."]),
        metodosSugeridosJson: JSON.stringify(["Explique sem consulta e confira as lacunas.", "Resolva uma aplicação curta e registre a percepção."]),
        proximasSessoesJson: JSON.stringify(["Retome os conceitos em uma sessão distribuída.", "Combine explicação e recuperação ativa."]),
        perguntasReflexaoJson: JSON.stringify(["Quais relações você conseguiu explicar sem consultar?", "Qual conceito ainda exige um novo exemplo?"]),
        origem: "LOCAL",
        caracteresExtraidos: material.conteudo.length,
        tentativas: 1,
        hashConteudo: createHash("sha256").update(bytes).digest("hex"),
        analisadaEm: referencia,
      } },
    } });
    recursos.set(material.identificador, recurso.id);
    for (const nome of material.conceitos) {
      const chave = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
      const conceito = await prisma.conceitoAprendizagem.upsert({
        where: { moduloId_chave: { moduloId: conta.modulo.id, chave } },
        create: { moduloId: conta.modulo.id, chave, nome, origem: "CENARIO_SINTETICO" },
        update: { nome, ativo: true },
      });
      await prisma.conceitoMaterial.upsert({
        where: { conceitoId_recursoId: { conceitoId: conceito.id, recursoId: recurso.id } },
        create: { conceitoId: conceito.id, recursoId: recurso.id, trechosJson: JSON.stringify([material.conteudo]) },
        update: { trechosJson: JSON.stringify([material.conteudo]) },
      });
    }
  }

  const diasAntes = (dias: number) => new Date(referencia.getTime() - dias * 86_400_000);
  for (const [indice, sessao] of CENARIO_SINTETICO_DIEGO.sessoes.entries()) {
    const iniciadaEm = diasAntes(sessao.diasAntes);
    iniciadaEm.setUTCHours(9 + indice % 7, (indice * 11) % 60, 0, 0);
    const sessaoCriada = await prisma.sessaoEstudo.create({ data: {
      usuarioId: conta.usuario.id,
      moduloId: conta.modulo.id,
      descricao: sessao.descricao,
      modoRegistro: ModoRegistroSessao.MANUAL,
      dificuldadePercebida: sessao.dificuldadePercebida,
      compreensaoPercebida: sessao.compreensaoPercebida,
      observacao: MARCADOR_CENARIO_DIEGO,
      iniciadaEm,
      encerradaEm: new Date(iniciadaEm.getTime() + sessao.duracaoMinutos * 60_000),
      duracaoMinutos: sessao.duracaoMinutos,
      situacao: SituacaoSessao.CONCLUIDA,
      metodos: { create: sessao.metodos.map((metodo) => ({ metodo })) },
      formatos: { create: sessao.formatos.map((formato) => ({ formato })) },
      materiais: { create: sessao.materiais.map((identificador) => {
        const recursoId = recursos.get(identificador);
        if (!recursoId) throw new Error(`Material sintético não encontrado: ${identificador}`);
        return { recursoId };
      }) },
    } });
    const conceitosDaSessao = await prisma.conceitoAprendizagem.findMany({
      where: { moduloId: conta.modulo.id, materiais: { some: { recursoId: { in: sessao.materiais.map((identificador) => recursos.get(identificador)!) } } } },
      select: { id: true },
    });
    if (conceitosDaSessao.length) await prisma.conceitoSessao.createMany({ data: conceitosDaSessao.map((conceito) => ({ conceitoId: conceito.id, sessaoId: sessaoCriada.id })) });
  }

  const evidenciasSinteticas = [
    { titulo: "Exercício de funções 1", diasAntes: 43, desempenho: 45, conceitos: ["funções", "escopo léxico"] },
    { titulo: "Exercício de funções 2", diasAntes: 22, desempenho: 78, conceitos: ["funções", "closures"] },
    { titulo: "Lista de coleções 1", diasAntes: 36, desempenho: 55, conceitos: ["arrays", "map", "filter"] },
    { titulo: "Lista de coleções 2", diasAntes: 12, desempenho: 74, conceitos: ["arrays", "reduce"] },
    { titulo: "Atividade de assincronismo 1", diasAntes: 29, desempenho: 42, conceitos: ["event loop", "promessas"] },
    { titulo: "Atividade de assincronismo 2", diasAntes: 1, desempenho: 82, conceitos: ["event loop", "async await"] },
  ];
  for (const [indice, item] of evidenciasSinteticas.entries()) {
    const conceitos = await prisma.conceitoAprendizagem.findMany({ where: { moduloId: conta.modulo.id, nome: { in: item.conceitos } }, select: { id: true } });
    await prisma.evidenciaAprendizagem.create({ data: {
      moduloId: conta.modulo.id,
      titulo: item.titulo,
      tipo: "EXERCICIO",
      dataEvento: diasAntes(item.diasAntes),
      desempenhoPercentual: item.desempenho,
      resumo: "Evidência sintética registrada para demonstrar desempenho por conceito.",
      dadosOrigemJson: JSON.stringify({ marcador: MARCADOR_CENARIO_DIEGO }),
      conceitos: { create: conceitos.map((conceito) => ({ conceitoId: conceito.id })) },
      questoes: { create: [0, 1, 2].map((questao) => ({ identificador: `${indice + 1}.${questao + 1}`, resumo: `Questão sintética ${questao + 1} de ${item.titulo}`, tipo: "APLICACAO", resultado: questao < Math.round(item.desempenho / 34) ? "ACERTO" : "ERRO" })) },
    } });
  }

  const recursoAvaliacaoId = recursos.get("arquivo-qualidade-javascript")!;
  const conceitosAvaliacao = await prisma.conceitoAprendizagem.findMany({ where: { moduloId: conta.modulo.id, materiais: { some: { recursoId: recursoAvaliacaoId } } }, select: { id: true } });
  await prisma.evidenciaAprendizagem.create({ data: {
    moduloId: conta.modulo.id,
    recursoId: recursoAvaliacaoId,
    titulo: "Avaliação de qualidade de código registrada",
    tipo: "AVALIACAO",
    dataEvento: diasAntes(3),
    desempenhoPercentual: 68,
    resumo: "Evidência sintética disponível automaticamente para as análises.",
    dadosOrigemJson: JSON.stringify({ marcador: MARCADOR_CENARIO_DIEGO }),
    conceitos: { create: conceitosAvaliacao.map((conceito) => ({ conceitoId: conceito.id })) },
    questoes: { create: [{ identificador: "1", resumo: "Aplicar tratamento de erros", tipo: "APLICACAO", resultado: "ACERTO" }, { identificador: "2", resumo: "Identificar caso de borda", tipo: "APLICACAO", resultado: "ERRO" }] },
  } });

  return { quantidadeSessoes: CENARIO_SINTETICO_DIEGO.sessoes.length, quantidadeMateriais: recursos.size, quantidadeEvidencias: evidenciasSinteticas.length + 1 };
}
