"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpenText, BrainCircuit, CalendarClock, CalendarRange, Lightbulb, RefreshCw, Shuffle, Timer, X } from "lucide-react";
import { METODOS_ESTUDO } from "@/dominio/sessoes/metodos";
import estilos from "./page.module.css";

type ExemploMetodo =
  | { tipo: "FEYNMAN"; disciplina: string; tema: string; proposta: string; explicacao: string; orientacao: string }
  | { tipo: "CICLOS"; disciplina: string; atividade: string; etapas: readonly { rotulo: string; atividade: string; duracao: string }[]; observacao: string }
  | { tipo: "RECUPERACAO"; disciplina: string; tema: string; pergunta: string; resposta: string; orientacao: string }
  | { tipo: "REVISOES"; disciplina: string; tema: string; momentos: readonly { momento: string; acao: string }[]; observacao: string }
  | { tipo: "INTERCALAMENTO"; disciplina: string; tema: string; introducao: string; exercicios: readonly string[]; conclusao: string; observacao: string }
  | { tipo: "SESSOES"; disciplina: string; tema: string; concentrado: string; distribuido: string; sessoes: readonly { dia: string; atividade: string; duracao: string }[]; orientacao: string };

type ConteudoMetodo = {
  titulo: string;
  subtitulo: string;
  explicacao: string;
  passos: readonly string[];
  exemplo: ExemploMetodo;
  quandoUtilizar: string;
  Icone: LucideIcon;
};

const CONTEUDOS_METODOS: Partial<Record<string, ConteudoMetodo>> = {
  FEYNMAN: {
    titulo: "Técnica Feynman", subtitulo: "Aprender explicando com simplicidade",
    explicacao: "A Técnica Feynman consiste em explicar um conteúdo com suas próprias palavras, como se você estivesse ensinando alguém que ainda não conhece o assunto. Ao tentar simplificar a explicação, fica mais fácil perceber quais partes você compreendeu e quais precisam ser revisadas.",
    passos: ["Escolha um conceito que deseja compreender melhor.", "Tente explicá-lo em voz alta ou por escrito, usando palavras simples e sem consultar o material.", "Identifique dúvidas, lacunas ou partes difíceis de explicar.", "Revise esses pontos e refaça a explicação de forma mais clara."],
    exemplo: { tipo: "FEYNMAN", disciplina: "Disciplina: Estruturas de Dados", tema: "Tema: Pilhas (stacks)", proposta: "Como você explicaria o funcionamento de uma pilha para alguém que nunca programou?", explicacao: "Imagine uma pilha de pratos: normalmente, você coloca um prato no topo e retira primeiro o prato que está por cima. Em programação, uma pilha segue essa ideia: o último elemento que entra é o primeiro a sair.", orientacao: "Se você não conseguir explicar por que essa estrutura segue a regra “último a entrar, primeiro a sair” (LIFO), revise o conceito e tente novamente sem olhar as anotações." },
    quandoUtilizar: "Para aprender conceitos novos, compreender assuntos abstratos e verificar se você consegue explicar um conteúdo sem depender do material de apoio.", Icone: Lightbulb,
  },
  POMODORO: {
    titulo: "Pomodoro", subtitulo: "Organização do estudo em ciclos de foco e pausa",
    explicacao: "O Pomodoro é uma técnica de organização do tempo que alterna períodos de concentração com pausas curtas. Uma configuração conhecida utiliza 25 minutos de foco e 5 minutos de descanso, mas esses intervalos podem ser adaptados às necessidades do estudante.",
    passos: ["Escolha uma atividade específica para realizar.", "Estude com foco durante um período definido, como 25 minutos.", "Faça uma pausa curta, como 5 minutos, ao finalizar o período.", "Repita os ciclos e, após cerca de quatro períodos de foco, faça uma pausa maior, por exemplo, de 15 a 30 minutos."],
    exemplo: { tipo: "CICLOS", disciplina: "Disciplina: Algoritmos", atividade: "Atividade: Resolver exercícios sobre estruturas de repetição", etapas: [{ rotulo: "1", atividade: "Resolver exercícios com atenção total", duracao: "25 min" }, { rotulo: "2", atividade: "Fazer uma pausa breve", duracao: "5 min" }, { rotulo: "3", atividade: "Retomar os exercícios", duracao: "25 min" }, { rotulo: "4", atividade: "Fazer outra pausa breve", duracao: "5 min" }, { rotulo: "Após quatro focos", atividade: "Fazer uma pausa maior", duracao: "15–30 min" }], observacao: "Os tempos são sugestões, não regras obrigatórias. O importante é alternar blocos de atenção e descanso de forma organizada." },
    quandoUtilizar: "Para organizar tarefas de estudo, manter a concentração por períodos definidos e incluir pausas regulares em atividades prolongadas.", Icone: Timer,
  },
  RECUPERACAO_ATIVA: {
    titulo: "Recuperação ativa", subtitulo: "Praticar a lembrança sem consultar a resposta",
    explicacao: "A recuperação ativa é uma estratégia em que você tenta lembrar informações da memória antes de consultar o material. Em vez de apenas reler anotações, você responde a perguntas, explica conceitos ou resolve exercícios para verificar o que consegue recordar.",
    passos: ["Estude um conteúdo e depois afaste o material de consulta.", "Formule uma pergunta ou escolha um exercício relacionado ao assunto.", "Tente responder usando somente o que você lembra.", "Confira a resposta, identifique erros ou lacunas e revise o que for necessário."],
    exemplo: { tipo: "RECUPERACAO", disciplina: "Disciplina: Algoritmos", tema: "Tema: Recursão", pergunta: "O que caracteriza uma função recursiva e por que a condição de parada é importante?", resposta: "Uma função recursiva chama a si mesma, direta ou indiretamente, para resolver um problema em partes. A condição de parada define quando essas chamadas devem terminar, evitando uma recursão sem fim.", orientacao: "Primeiro responda mentalmente ou no caderno. Só depois revele a resposta e compare com o que você recordou." },
    quandoUtilizar: "Para revisar conteúdos, verificar o que realmente foi aprendido e se preparar para provas, exercícios e explicações sem consulta.", Icone: RefreshCw,
  },
  REPETICAO_ESPACADA: {
    titulo: "Repetição espaçada", subtitulo: "Revisar um conteúdo em intervalos ao longo do tempo",
    explicacao: "A repetição espaçada consiste em retomar o mesmo conteúdo em diferentes momentos, deixando intervalos entre as revisões. A ideia é reforçar a lembrança ao longo do tempo, ajustando a frequência conforme a dificuldade de recordar o assunto.",
    passos: ["Escolha o conteúdo que deseja manter na memória.", "Faça uma primeira revisão após o estudo inicial.", "Retome o mesmo assunto em dias posteriores, mantendo intervalos entre as revisões.", "Reduza o intervalo quando houver muita dificuldade e amplie-o quando conseguir recordar com facilidade."],
    exemplo: { tipo: "REVISOES", disciplina: "Disciplina: Compiladores", tema: "Tema: Tokens e análise léxica", momentos: [{ momento: "Dia 0", acao: "Estudar o conceito de tokens" }, { momento: "Dia 1", acao: "Tentar lembrar os tipos de tokens sem consultar" }, { momento: "Dia 3", acao: "Revisar os conceitos com perguntas" }, { momento: "Dia 7", acao: "Retomar exemplos de identificação de tokens" }, { momento: "Dia 14", acao: "Verificar novamente o que foi lembrado" }], observacao: "Esses dias são apenas um exemplo. Não existe um intervalo único ideal para todos os conteúdos e estudantes; a programação deve ser ajustada de acordo com a dificuldade de recordar." },
    quandoUtilizar: "Para manter na memória conceitos, fórmulas, definições e outros conhecimentos que precisarão ser lembrados ao longo de semanas ou meses.", Icone: CalendarClock,
  },
  INTERCALAMENTO: {
    titulo: "Intercalamento", subtitulo: "Alternância entre diferentes conteúdos ou tipos de exercícios.",
    explicacao: "O Intercalamento é uma estratégia de estudo que consiste em alternar diferentes assuntos, conceitos ou tipos de problemas durante uma mesma sequência de estudo, em vez de praticar repetidamente apenas um tipo de atividade. Essa alternância estimula o estudante a identificar diferenças entre os conteúdos e selecionar a abordagem adequada para cada situação.",
    passos: ["Selecione conteúdos relacionados: escolha dois ou mais assuntos ou tipos de exercícios que deseja praticar.", "Organize uma sequência variada: distribua as atividades alternando os conteúdos, em vez de concluir todos os exercícios de um único tipo primeiro.", "Pratique identificando as diferenças: ao resolver cada atividade, procure reconhecer qual conceito ou estratégia deve ser utilizado.", "Avalie os resultados: identifique os assuntos com maior dificuldade e ajuste a distribuição das próximas práticas."],
    exemplo: { tipo: "INTERCALAMENTO", disciplina: "Disciplina: Algoritmos e Estruturas de Dados", tema: "Tema: Algoritmos de ordenação", introducao: "Imagine que você está estudando três algoritmos de ordenação: Bubble Sort, Selection Sort e Insertion Sort. Em vez de resolver cinco exercícios de cada algoritmo em blocos separados, você pode alterná-los:", exercicios: ["Exercício 1: Bubble Sort", "Exercício 2: Insertion Sort", "Exercício 3: Selection Sort", "Exercício 4: Bubble Sort", "Exercício 5: Selection Sort", "Exercício 6: Insertion Sort"], conclusao: "Ao alternar os exercícios, você pratica o reconhecimento das características de cada algoritmo e aprende a diferenciar suas aplicações.", observacao: "A ordem apresentada é apenas ilustrativa. O objetivo é variar os tipos de problemas ao longo da prática." },
    quandoUtilizar: "O Intercalamento é especialmente útil quando o estudante precisa aprender a distinguir conceitos semelhantes, escolher entre diferentes estratégias de resolução ou praticar conteúdos relacionados. Pode ser aplicado em disciplinas como Algoritmos, Matemática, Estruturas de Dados e Programação.", Icone: Shuffle,
  },
  PRATICA_DISTRIBUIDA: {
    titulo: "Prática distribuída", subtitulo: "Distribuir o estudo em diferentes sessões",
    explicacao: "A prática distribuída consiste em dividir o tempo dedicado a um assunto em várias sessões separadas, em vez de concentrar todo o estudo de uma só vez. Essa organização permite retomar o conteúdo em diferentes dias e praticar de maneira mais regular.",
    passos: ["Defina o assunto e o tempo total que pretende dedicar a ele.", "Divida esse tempo em sessões menores distribuídas ao longo dos dias.", "Planeje uma atividade ou objetivo para cada sessão.", "Retome o conteúdo nas sessões seguintes, fazendo exercícios e verificando seu progresso."],
    exemplo: { tipo: "SESSOES", disciplina: "Disciplina: Algoritmos", tema: "Tema: Algoritmos de ordenação", concentrado: "Estudo concentrado: dedicar 120 minutos de uma só vez ao assunto.", distribuido: "Prática distribuída: dividir os mesmos 120 minutos em três encontros de 40 minutos.", sessoes: [{ dia: "Segunda-feira", atividade: "Compreender a lógica de um algoritmo de ordenação", duracao: "40 min" }, { dia: "Quarta-feira", atividade: "Resolver exemplos passo a passo", duracao: "40 min" }, { dia: "Sexta-feira", atividade: "Praticar com exercícios e revisar dificuldades", duracao: "40 min" }], orientacao: "O objetivo é distribuir a prática entre sessões. Os dias e durações são apenas um exemplo e podem ser adaptados à rotina." },
    quandoUtilizar: "Para organizar a rotina de estudos, trabalhar assuntos extensos e evitar concentrar toda a prática em uma única sessão próxima à avaliação.", Icone: CalendarRange,
  },
};

function apresentacaoMetodo(metodo: string): { descricao: string; Icone: LucideIcon } {
  const apresentacoes: Record<string, { descricao: string; Icone: LucideIcon }> = {
    FEYNMAN: { descricao: "Explique o conteúdo com suas próprias palavras.", Icone: BrainCircuit }, RECUPERACAO_ATIVA: { descricao: "Tente recuperar ideias antes de consultar o material.", Icone: RefreshCw }, REPETICAO_ESPACADA: { descricao: "Retome o conteúdo em momentos separados.", Icone: CalendarClock }, POMODORO: { descricao: "Organize o estudo em blocos com pausas planejadas.", Icone: Timer }, INTERCALAMENTO: { descricao: "Alterne assuntos ou tipos de exercício na sessão.", Icone: Shuffle }, PRATICA_DISTRIBUIDA: { descricao: "Distribua sessões de estudo ao longo de vários dias.", Icone: CalendarRange },
  };
  return apresentacoes[metodo] ?? { descricao: "Registre este método no contexto da sessão.", Icone: BookOpenText };
}

function CabecalhoExemplo({ titulo, complemento, Icone }: { titulo: string; complemento?: string; Icone: LucideIcon }) {
  return <div className={estilos.cabecalhoExemploMetodo}><div><p className={estilos.sobretituloExemplo}>EXEMPLO PRÁTICO</p><h3>{titulo}</h3>{complemento && <p>{complemento}</p>}</div><Icone aria-hidden="true" /></div>;
}

function ExemploPratico({ exemplo }: { exemplo: ExemploMetodo }) {
  const [revelado, definirRevelado] = useState(false);
  if (exemplo.tipo === "FEYNMAN") return <><CabecalhoExemplo Icone={Lightbulb} complemento={exemplo.tema} titulo={exemplo.disciplina} /><div className={estilos.perguntaDestaque}><strong>Proposta ao estudante</strong><p>{exemplo.proposta}</p></div><div className={estilos.explicacaoDestaque}><strong>Exemplo de explicação simples</strong><p>{exemplo.explicacao}</p></div><p className={estilos.orientacaoExemplo}>{exemplo.orientacao}</p></>;
  if (exemplo.tipo === "CICLOS") return <><CabecalhoExemplo Icone={Timer} complemento={exemplo.atividade} titulo={exemplo.disciplina} /><div aria-label="Sequência ilustrativa de foco e pausa" className={estilos.sequenciaCiclos}>{exemplo.etapas.map((etapa) => <div className={estilos.itemSequencia} key={`${etapa.rotulo}-${etapa.atividade}`}><span>{etapa.rotulo}</span><p>{etapa.atividade}</p><strong>{etapa.duracao}</strong></div>)}</div><p className={estilos.orientacaoExemplo}>{exemplo.observacao}</p></>;
  if (exemplo.tipo === "RECUPERACAO") return <><CabecalhoExemplo Icone={RefreshCw} complemento={exemplo.tema} titulo={exemplo.disciplina} /><div className={estilos.perguntaDestaque}><strong>Pergunta para recordar</strong><p>{exemplo.pergunta}</p></div><button aria-expanded={revelado} className={estilos.botaoRevelar} onClick={() => definirRevelado((atual) => !atual)} type="button">{revelado ? "Ocultar resposta" : "Ver resposta"}</button>{revelado && <div aria-live="polite" className={estilos.respostaRecuperacao}><strong>Resposta de referência</strong><p>{exemplo.resposta}</p></div>}<p className={estilos.orientacaoExemplo}>{exemplo.orientacao}</p></>;
  if (exemplo.tipo === "REVISOES") return <><CabecalhoExemplo Icone={CalendarClock} complemento={exemplo.tema} titulo={exemplo.disciplina} /><ol className={estilos.linhaTempoExemplo}>{exemplo.momentos.map((item) => <li key={item.momento}><strong>{item.momento}</strong><span>{item.acao}</span></li>)}</ol><p className={estilos.orientacaoExemplo}>{exemplo.observacao}</p></>;
  if (exemplo.tipo === "INTERCALAMENTO") return <><CabecalhoExemplo Icone={Shuffle} complemento={exemplo.tema} titulo={exemplo.disciplina} /><p className={estilos.introducaoExemplo}>{exemplo.introducao}</p><ol aria-label="Sequência ilustrativa de exercícios intercalados" className={estilos.sequenciaIntercalada}>{exemplo.exercicios.map((exercicio) => <li key={exercicio}>{exercicio}</li>)}</ol><p className={estilos.conclusaoExemplo}>{exemplo.conclusao}</p><p className={estilos.orientacaoExemplo}>{exemplo.observacao}</p></>;
  return <><CabecalhoExemplo Icone={CalendarRange} complemento={exemplo.tema} titulo={exemplo.disciplina} /><div className={estilos.comparacaoPratica}><p>{exemplo.concentrado}</p><p>{exemplo.distribuido}</p></div><div className={estilos.sessoesDistribuidas}>{exemplo.sessoes.map((sessao) => <div key={sessao.dia}><strong>{sessao.dia}</strong><p>{sessao.atividade}</p><span>{sessao.duracao}</span></div>)}</div><p className={estilos.orientacaoExemplo}>{exemplo.orientacao}</p></>;
}

function ModalMetodo({ conteudo, dialogo, botaoAbrir }: { conteudo: ConteudoMetodo; dialogo: React.RefObject<HTMLDialogElement | null>; botaoAbrir: React.RefObject<HTMLButtonElement | null> }) {
  const [chaveExemplo, definirChaveExemplo] = useState(0);
  const conteudoRolavel = useRef<HTMLDivElement>(null);
  const tituloId = useId(); const subtituloId = useId(); const { Icone } = conteudo;
  const fechar = () => dialogo.current?.close();
  const concluirFechamento = () => { definirChaveExemplo((atual) => atual + 1); if (conteudoRolavel.current) conteudoRolavel.current.scrollTop = 0; botaoAbrir.current?.focus(); };
  return <dialog aria-describedby={subtituloId} aria-labelledby={tituloId} className={estilos.dialogoMetodo} onClick={(evento) => { if (evento.target === evento.currentTarget) fechar(); }} onClose={concluirFechamento} ref={dialogo}><div className={estilos.conteudoDialogoMetodo} ref={conteudoRolavel}><header className={estilos.cabecalhoDialogoMetodo}><span className={estilos.iconeDialogoMetodo}><Icone aria-hidden="true" /></span><div><h2 id={tituloId}>{conteudo.titulo}</h2><p id={subtituloId}>{conteudo.subtitulo}</p></div><button aria-label={`Fechar explicação sobre ${conteudo.titulo}`} autoFocus className={estilos.fecharDialogoMetodo} onClick={fechar} type="button"><X aria-hidden="true" /></button></header><div className={estilos.corpoDialogoMetodo}><section><h3>O que é?</h3><p>{conteudo.explicacao}</p></section><section><h3>Como aplicar</h3><ol className={estilos.passosMetodo}>{conteudo.passos.map((passo, indice) => <li key={passo}><span>{indice + 1}</span><p>{passo}</p></li>)}</ol></section><section className={estilos.exemploMetodo}><ExemploPratico exemplo={conteudo.exemplo} key={chaveExemplo} /></section><section><h3>Quando utilizar?</h3><p>{conteudo.quandoUtilizar}</p></section></div></div></dialog>;
}

function AcionadorModal({ conteudo, className, children, rotulo }: { conteudo: ConteudoMetodo; className: string; children: ReactNode; rotulo: string }) {
  const dialogo = useRef<HTMLDialogElement>(null); const botaoAbrir = useRef<HTMLButtonElement>(null);
  return <><button aria-haspopup="dialog" aria-label={rotulo} className={className} onClick={() => dialogo.current?.showModal()} ref={botaoAbrir} type="button">{children}</button><ModalMetodo botaoAbrir={botaoAbrir} conteudo={conteudo} dialogo={dialogo} /></>;
}

function CartaoMetodo({ metodo }: { metodo: typeof METODOS_ESTUDO[number] }) {
  const { descricao, Icone } = apresentacaoMetodo(metodo.valor); const conteudo = CONTEUDOS_METODOS[metodo.valor];
  const corpo = <><span className={estilos.iconeMetodo}><Icone aria-hidden="true" /></span><div><h3>{metodo.rotulo}</h3><p>{descricao}</p>{conteudo && <span className={estilos.indicacaoMetodo}>Conhecer o método</span>}</div></>;
  if (!conteudo) return <article className={estilos.metodo}>{corpo}</article>;
  return <article className={`${estilos.metodo} ${estilos.metodoInterativo}`}><AcionadorModal className={estilos.areaInformativaMetodo} conteudo={conteudo} rotulo={`Conhecer o método ${conteudo.titulo}`}>{corpo}</AcionadorModal></article>;
}

export function CatalogoMetodos() {
  return <div className={estilos.gradeMetodos}>{METODOS_ESTUDO.map((metodo) => <CartaoMetodo key={metodo.valor} metodo={metodo} />)}</div>;
}
