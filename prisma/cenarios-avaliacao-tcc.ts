import type { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo, MetodoEstudo, ModoRegistroSessao, SituacaoSessao, TipoEvidenciaAprendizagem } from "../src/gerado/prisma/enums";
import { cenariosTcc, identificadorModuloCenarioTcc, percentualCenario, usuariosCenariosTcc } from "../testes/fixtures/cenarios-tcc";

type UsuarioCenarioTcc = { id: string; nomeUsuario: string };

export async function aplicarCenariosAvaliacaoTcc(prisma: PrismaClient, usuarios: UsuarioCenarioTcc[]) {
  const usuariosPorNome = new Map(usuarios.map((usuario) => [usuario.nomeUsuario, usuario]));
  const aplicados = [];

  for (const [indiceCenario, atribuicao] of usuariosCenariosTcc.entries()) {
    const usuario = usuariosPorNome.get(atribuicao.nomeUsuario);
    if (!usuario) throw new Error(`Usuário sintético ausente para o cenário ${atribuicao.cenario}: ${atribuicao.nomeUsuario}.`);
    const definicao = cenariosTcc[indiceCenario];
    const modulos = [];

    for (let numeroModulo = 0; numeroModulo < 3; numeroModulo++) {
      const identificador = identificadorModuloCenarioTcc(definicao.id, numeroModulo);
      const modulo = await prisma.moduloAprendizagem.upsert({
        where: { usuarioId_identificador: { usuarioId: usuario.id, identificador } },
        create: {
          usuarioId: usuario.id,
          identificador,
          titulo: `${definicao.id} — ${definicao.nome} — Módulo ${numeroModulo + 1}`,
          descricao: `Módulo sintético da avaliação do TCC atribuído a ${atribuicao.nome}.`,
        },
        update: {
          titulo: `${definicao.id} — ${definicao.nome} — Módulo ${numeroModulo + 1}`,
          descricao: `Módulo sintético da avaliação do TCC atribuído a ${atribuicao.nome}.`,
          arquivado: false,
          rascunho: false,
        },
      });

      await prisma.evidenciaAprendizagem.deleteMany({ where: { moduloId: modulo.id } });
      await prisma.sessaoEstudo.deleteMany({ where: { moduloId: modulo.id } });
      await prisma.desafioExperimentacao.deleteMany({ where: { moduloId: modulo.id } });
      await prisma.recursoConteudo.deleteMany({ where: { moduloId: modulo.id } });
      await prisma.conceitoAprendizagem.deleteMany({ where: { moduloId: modulo.id } });

      const conceito = await prisma.conceitoAprendizagem.create({ data: { moduloId: modulo.id, chave: "conceito", nome: "Conceito", origem: "FIXTURE_TCC" } });
      const controle = await prisma.conceitoAprendizagem.create({ data: { moduloId: modulo.id, chave: "controle", nome: "Controle", origem: "FIXTURE_TCC" } });
      const material = indiceCenario === 3 ? null : await prisma.recursoConteudo.create({ data: {
        moduloId: modulo.id,
        identificador: "referencia",
        titulo: "Referência do conceito",
        descricao: "Texto sintético disponível para revisão.",
        formato: FormatoConteudo.TEXTO,
        minutosEstimados: 20,
        conteudoTexto: "Conceito",
        conceitos: { create: { conceitoId: conceito.id } },
      } });

      for (let numeroSessao = 0; numeroSessao < 10; numeroSessao++) {
        const iniciadaEm = new Date(Date.UTC(2026, 8, numeroSessao + 1, 10));
        const encerradaEm = new Date(iniciadaEm.getTime() + 30 * 60_000);
        const sessao = await prisma.sessaoEstudo.create({ data: {
          usuarioId: usuario.id,
          moduloId: modulo.id,
          descricao: "Estudo do Conceito",
          iniciadaEm,
          encerradaEm,
          duracaoMinutos: 30,
          situacao: SituacaoSessao.CONCLUIDA,
          modoRegistro: ModoRegistroSessao.MANUAL,
          arquivada: numeroSessao === 9,
          compreensaoPercebida: indiceCenario === 4 ? [5, 1, 3][numeroModulo] : 3,
          dificuldadePercebida: indiceCenario === 4 ? [1, 5, 3][numeroModulo] : 3,
          metodos: { create: { metodo: numeroSessao < 5 ? MetodoEstudo.FEYNMAN : MetodoEstudo.POMODORO } },
          formatos: { create: { formato: numeroSessao < 5 ? FormatoConteudo.TEXTO : FormatoConteudo.VIDEO } },
          conceitos: { create: { conceitoId: conceito.id } },
          ...(material ? { materiais: { create: { recursoId: material.id } } } : {}),
        } });
        await prisma.evidenciaAprendizagem.create({ data: {
          moduloId: modulo.id,
          titulo: `Atividade sintética ${numeroSessao + 1}`,
          tipo: TipoEvidenciaAprendizagem.EXERCICIO,
          dataEvento: new Date(encerradaEm.getTime() + 60_000),
          desempenhoPercentual: percentualCenario(indiceCenario, numeroModulo, numeroSessao),
          dadosOrigemJson: JSON.stringify({ origem: "FIXTURE_TCC", atividade: numeroSessao + 1, cenario: definicao.id }),
          conceitos: { create: { conceitoId: indiceCenario === 3 && numeroSessao >= numeroModulo ? controle.id : conceito.id } },
          vinculosSessoes: { create: { sessaoId: sessao.id } },
        } });
      }
      modulos.push({ numeroModulo, modulo });
    }
    aplicados.push({ indiceCenario, atribuicao, definicao, usuario, modulos });
  }
  return aplicados;
}
