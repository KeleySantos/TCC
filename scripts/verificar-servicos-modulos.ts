import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/gerado/prisma/client";
import { FormatoConteudo } from "../src/gerado/prisma/enums";
import {
  arquivarMaterialPessoal,
  arquivarModuloPessoal,
  atualizarMaterialPessoal,
  atualizarModuloPessoal,
  atualizarTopicoPessoal,
  criarMaterialPessoal,
  criarModuloPessoal,
  criarRascunhoModuloPessoal,
  criarRascunhoTopicoPessoal,
  criarTopicoPessoal,
  ErroModulo,
  listarModulosPessoais,
  obterModuloPessoal,
} from "../src/servidor/modulos";
import { obterResumoPessoal } from "../src/servidor/consultas";
import { obterMetricasPessoais } from "../src/servidor/metricas";
import { criarDtoInterpretacao } from "../src/servidor/ia/interpretacoes";

const urlBanco = process.env.DATABASE_URL;
if (!urlBanco) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: urlBanco }) });

function afirmar(condicao: unknown, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Verificação de serviços de módulos falhou: ${mensagem}`);
}

async function principal() {
  const [ana, bruno] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "ana.souza" } }),
    prisma.usuario.findUniqueOrThrow({ where: { nomeUsuario: "bruno.lima" } }),
  ]);
  const sufixo = Date.now().toString(36);
  let moduloId: string | null = null;
  let topicoId: string | null = null;
  let materialId: string | null = null;
  const rascunhosCriados: string[] = [];
  try {
    const modulo = await criarModuloPessoal(ana.id, { titulo: `JavaScript de teste ${sufixo}`, descricao: "Módulo temporário para verificar o CRUD pessoal." });
    moduloId = modulo.id;
    const [resumoAntes, metricasAntes] = await Promise.all([obterResumoPessoal(ana.id), obterMetricasPessoais(ana.id)]);
    const [primeiroRascunho, segundoRascunho] = await Promise.all([
      criarRascunhoModuloPessoal(ana.id),
      criarRascunhoModuloPessoal(ana.id),
    ]);
    rascunhosCriados.push(primeiroRascunho.id, segundoRascunho.id);
    afirmar(primeiroRascunho.rascunho && segundoRascunho.rascunho && primeiroRascunho.identificador.startsWith("rascunho-") && segundoRascunho.identificador.startsWith("rascunho-") && primeiroRascunho.identificador !== segundoRascunho.identificador, "dois rascunhos próprios devem receber identificadores temporários distintos.");
    const rascunhoLido = await obterModuloPessoal(ana.id, primeiroRascunho.identificador);
    afirmar(rascunhoLido?.titulo === "" && rascunhoLido.descricao === "" && rascunhoLido.rascunho, "rascunho deve manter título e descrição vazios até a primeira configuração.");
    const [topicosRascunho, sessoesRascunho, tentativasRascunho, recomendacoesRascunho] = await Promise.all([
      prisma.topico.count({ where: { moduloId: { in: rascunhosCriados } } }),
      prisma.sessaoEstudo.count({ where: { moduloId: { in: rascunhosCriados } } }),
      prisma.tentativaAvaliacao.count({ where: { moduloId: { in: rascunhosCriados } } }),
      prisma.recomendacao.count({ where: { moduloId: { in: rascunhosCriados } } }),
    ]);
    afirmar(topicosRascunho === 0 && sessoesRascunho === 0 && tentativasRascunho === 0 && recomendacoesRascunho === 0, "criar rascunho não pode criar entidades filhas.");
    const bibliotecaComRascunhos = await listarModulosPessoais(ana.id, { incluirRascunhos: true });
    afirmar(bibliotecaComRascunhos.some((item) => item.id === primeiroRascunho.id && item.rascunho), "biblioteca deve incluir rascunho próprio não arquivado.");
    const [resumoComRascunhos, metricasComRascunhos] = await Promise.all([obterResumoPessoal(ana.id), obterMetricasPessoais(ana.id)]);
    afirmar(resumoComRascunhos.modulos.length === resumoAntes.modulos.length && metricasComRascunhos.metricasPorModulo.length === metricasAntes.metricasPorModulo.length && metricasComRascunhos.taxaAcertoGeral.taxaAcerto === metricasAntes.taxaAcertoGeral.taxaAcerto, "Dashboard e métricas devem ignorar rascunhos.");
    afirmar(criarDtoInterpretacao(metricasComRascunhos).quantidadeModulos === metricasAntes.metricasPorModulo.length, "DTO de interpretação não pode incluir rascunhos.");

    let bloqueouLeituraEEscritaDeOutraConta = false;
    try {
      await atualizarModuloPessoal(bruno.id, primeiroRascunho.id, { titulo: "Tentativa indevida", descricao: "Outra conta não pode finalizar este rascunho." });
    } catch (erro) {
      bloqueouLeituraEEscritaDeOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO" && await obterModuloPessoal(bruno.id, primeiroRascunho.identificador) === null;
    }
    afirmar(bloqueouLeituraEEscritaDeOutraConta, "outra conta não pode ler ou finalizar rascunho alheio.");
    let bloqueouArquivamentoDeOutraConta = false;
    try {
      await arquivarModuloPessoal(bruno.id, { id: primeiroRascunho.id });
    } catch (erro) {
      bloqueouArquivamentoDeOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouArquivamentoDeOutraConta, "outra conta não pode arquivar rascunho alheio.");
    let bloqueouTopicoNoRascunho = false;
    try {
      await criarTopicoPessoal(ana.id, { moduloId: primeiroRascunho.id, titulo: "Tópico indevido", descricao: "Rascunho não pode receber tópico antes da configuração." });
    } catch (erro) {
      bloqueouTopicoNoRascunho = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouTopicoNoRascunho, "rascunho não pode receber tópico ou material antes da primeira configuração.");
    let manteveRascunhoComDadosInvalidos = false;
    try {
      await atualizarModuloPessoal(ana.id, primeiroRascunho.id, { titulo: "ab", descricao: "Descrição válida, mas o título é curto." });
    } catch (erro) {
      const rascunhoAposErro = await obterModuloPessoal(ana.id, primeiroRascunho.identificador);
      manteveRascunhoComDadosInvalidos = erro instanceof ErroModulo && erro.codigo === "DADOS_INVALIDOS" && rascunhoAposErro?.rascunho === true;
    }
    afirmar(manteveRascunhoComDadosInvalidos, "dados inválidos devem manter o rascunho e sua URL temporária.");
    let manteveRascunhoComTituloDuplicado = false;
    try {
      await atualizarModuloPessoal(ana.id, primeiroRascunho.id, { titulo: modulo.titulo, descricao: "Descrição válida que tenta repetir um título existente." });
    } catch (erro) {
      const rascunhoAposErro = await obterModuloPessoal(ana.id, primeiroRascunho.identificador);
      manteveRascunhoComTituloDuplicado = erro instanceof ErroModulo && erro.codigo === "IDENTIFICADOR_DUPLICADO" && rascunhoAposErro?.rascunho === true;
    }
    afirmar(manteveRascunhoComTituloDuplicado, "título duplicado deve manter o rascunho e sua URL temporária.");
    const rascunhoFinalizado = await atualizarModuloPessoal(ana.id, segundoRascunho.id, { titulo: `Rascunho configurado ${sufixo}`, descricao: "Módulo finalizado a partir de um rascunho pessoal." });
    afirmar(!rascunhoFinalizado.rascunho && rascunhoFinalizado.identificador === `rascunho-configurado-${sufixo}` && rascunhoFinalizado.titulo.includes("Rascunho configurado"), "primeira configuração deve definir identificador definitivo e remover estado de rascunho.");
    const rascunhoParaArquivar = await criarRascunhoModuloPessoal(ana.id);
    rascunhosCriados.push(rascunhoParaArquivar.id);
    await arquivarModuloPessoal(ana.id, { id: rascunhoParaArquivar.id });
    const bibliotecaAposArquivamento = await listarModulosPessoais(ana.id, { incluirRascunhos: true });
    afirmar(!bibliotecaAposArquivamento.some((item) => item.id === rascunhoParaArquivar.id), "arquivamento deve remover rascunho da biblioteca sem exclusão física.");

    const moduloAtualizado = await atualizarModuloPessoal(ana.id, modulo.id, { titulo: `JavaScript validado ${sufixo}`, descricao: "Módulo pessoal atualizado no serviço." });
    const topico = await criarTopicoPessoal(ana.id, { moduloId: modulo.id, titulo: "Loops de teste", descricao: "Tópico temporário para validar propriedade." });
    topicoId = topico.id;
    const [primeiroRascunhoTopico, segundoRascunhoTopico] = await Promise.all([
      criarRascunhoTopicoPessoal(ana.id, modulo.id),
      criarRascunhoTopicoPessoal(ana.id, modulo.id),
    ]);
    afirmar(primeiroRascunhoTopico.rascunho && segundoRascunhoTopico.rascunho && primeiroRascunhoTopico.identificador.startsWith("rascunho-") && primeiroRascunhoTopico.identificador !== segundoRascunhoTopico.identificador, "tópicos em rascunho devem receber identificadores opacos distintos.");
    const moduloComRascunhosTopico = await obterModuloPessoal(ana.id, moduloAtualizado.identificador);
    afirmar(moduloComRascunhosTopico?.topicos.some((item) => item.id === primeiroRascunhoTopico.id && item.rascunho && item.nome === "" && item.descricao === ""), "a proprietária deve conseguir retomar tópico em rascunho sem conteúdo fictício.");
    let bloqueouMaterialNoRascunho = false;
    try {
      await criarMaterialPessoal(ana.id, { topicoId: primeiroRascunhoTopico.id, titulo: "Material indevido", descricao: "Não pode ser criado antes da configuração.", formato: FormatoConteudo.TEXTO, minutosEstimados: 10, conteudoTexto: "Texto", url: "" });
    } catch (erro) {
      bloqueouMaterialNoRascunho = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouMaterialNoRascunho, "tópico em rascunho não pode receber material, sessão ou avaliação.");
    let bloqueouTopicoDeOutraConta = false;
    try {
      await atualizarTopicoPessoal(bruno.id, primeiroRascunhoTopico.id, { titulo: "Tentativa indevida", descricao: "Outra conta não pode finalizar tópico em rascunho." });
    } catch (erro) {
      bloqueouTopicoDeOutraConta = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouTopicoDeOutraConta, "outra conta não pode atualizar tópico em rascunho.");
    let manteveTopicoRascunhoInvalido = false;
    try {
      await atualizarTopicoPessoal(ana.id, primeiroRascunhoTopico.id, { titulo: "ab", descricao: "Descrição válida, mas título insuficiente." });
    } catch (erro) {
      const aposErro = await prisma.topico.findUnique({ where: { id: primeiroRascunhoTopico.id } });
      manteveTopicoRascunhoInvalido = erro instanceof ErroModulo && erro.codigo === "DADOS_INVALIDOS" && aposErro?.rascunho === true && aposErro.identificador === primeiroRascunhoTopico.identificador;
    }
    afirmar(manteveTopicoRascunhoInvalido, "dados inválidos devem preservar tópico em rascunho e sua URL de estado.");
    let manteveTopicoRascunhoDuplicado = false;
    try {
      await atualizarTopicoPessoal(ana.id, primeiroRascunhoTopico.id, { titulo: topico.nome, descricao: "Descrição válida, mas título já usado no módulo." });
    } catch (erro) {
      const aposErro = await prisma.topico.findUnique({ where: { id: primeiroRascunhoTopico.id } });
      manteveTopicoRascunhoDuplicado = erro instanceof ErroModulo && erro.codigo === "IDENTIFICADOR_DUPLICADO" && aposErro?.rascunho === true;
    }
    afirmar(manteveTopicoRascunhoDuplicado, "duplicidade deve preservar tópico em rascunho.");
    const topicoFinalizado = await atualizarTopicoPessoal(ana.id, segundoRascunhoTopico.id, { titulo: "Funções de teste", descricao: "Tópico configurado após a primeira configuração." });
    afirmar(!topicoFinalizado.rascunho && topicoFinalizado.identificador === "funcoes-de-teste", "configuração válida deve trocar identificador e remover estado de rascunho.");
    const topicoAtualizado = await atualizarTopicoPessoal(ana.id, topico.id, { titulo: "Loops validados", descricao: "Tópico atualizado no serviço." });
    const material = await criarMaterialPessoal(ana.id, { topicoId: topico.id, titulo: "Material textual", descricao: "Material próprio de teste.", formato: FormatoConteudo.TEXTO, minutosEstimados: 10, conteudoTexto: "Conteúdo sintético para a verificação.", url: "" });
    materialId = material.id;
    const materialAtualizado = await atualizarMaterialPessoal(ana.id, material.id, { titulo: "Material atualizado", descricao: "Material próprio atualizado.", formato: FormatoConteudo.TEXTO, minutosEstimados: 12, conteudoTexto: "Conteúdo sintético atualizado.", url: "" });
    const leituraAna = await obterModuloPessoal(ana.id, moduloAtualizado.identificador);
    const leituraBruno = await obterModuloPessoal(bruno.id, moduloAtualizado.identificador);
    afirmar(leituraAna?.topicos.some((item) => item.id === topicoAtualizado.id && item.recursos.some((recurso) => recurso.id === materialAtualizado.id)), "a proprietária deve ler módulo, tópico e material criados.");
    afirmar(leituraBruno === null, "outra conta não pode ler o módulo da proprietária.");

    let bloqueouEscrita = false;
    try {
      await criarTopicoPessoal(bruno.id, { moduloId: modulo.id, titulo: "Tentativa indevida", descricao: "Esta escrita deve ser rejeitada pela propriedade." });
    } catch (erro) {
      bloqueouEscrita = erro instanceof ErroModulo && erro.codigo === "NAO_ENCONTRADO";
    }
    afirmar(bloqueouEscrita, "outra conta não pode criar tópico no módulo da proprietária.");

    await arquivarMaterialPessoal(ana.id, { id: material.id });
    const semMaterialAtivo = await obterModuloPessoal(ana.id, moduloAtualizado.identificador);
    afirmar(semMaterialAtivo?.topicos.find((item) => item.id === topico.id)?.recursos.length === 0, "arquivamento deve ocultar o material sem excluí-lo fisicamente.");
    await arquivarModuloPessoal(ana.id, { id: modulo.id });
    afirmar(await obterModuloPessoal(ana.id, moduloAtualizado.identificador) === null, "módulo arquivado não deve aparecer na leitura ativa.");
    console.log("Serviços pessoais verificados: CRUD, arquivamento e isolamento entre duas contas.");
  } finally {
    if (materialId) await prisma.recursoConteudo.deleteMany({ where: { id: materialId } });
    if (topicoId) await prisma.topico.deleteMany({ where: { id: topicoId } });
    if (rascunhosCriados.length) await prisma.moduloAprendizagem.deleteMany({ where: { id: { in: rascunhosCriados } } });
    if (moduloId) await prisma.moduloAprendizagem.deleteMany({ where: { id: moduloId } });
    await prisma.$disconnect();
  }
}

principal().catch((erro: unknown) => { console.error(erro); process.exit(1); });
