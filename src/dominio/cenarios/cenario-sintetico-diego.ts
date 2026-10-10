import { FormatoConteudo, FuncaoMaterial, MetodoEstudo } from "@/gerado/prisma/enums";

export type MaterialSinteticoDiego = {
  identificador: string;
  titulo: string;
  nomeArquivo: string;
  conceitos: string[];
  conteudo: string;
  resumo: string;
  funcao: FuncaoMaterial;
};

export type SessaoSinteticaDiego = {
  diasAntes: number;
  duracaoMinutos: number;
  dificuldadePercebida: number;
  compreensaoPercebida: number;
  metodos: MetodoEstudo[];
  formatos: FormatoConteudo[];
  materiais: string[];
  descricao: string;
};

const materiais: MaterialSinteticoDiego[] = [
  {
    identificador: "arquivo-funcoes-javascript", titulo: "Funções e escopo em JavaScript", nomeArquivo: "funcoes-e-escopo.txt",
    conceitos: ["funções", "parâmetros", "escopo léxico", "closures", "funções de ordem superior"],
    resumo: "Material sintético sobre composição de funções, passagem de parâmetros e regras de escopo em JavaScript.", funcao: FuncaoMaterial.REFERENCIA,
    conteudo: "Funções recebem parâmetros e podem retornar valores. O escopo léxico determina a resolução de nomes. Closures preservam referências ao contexto e funções de ordem superior recebem ou retornam outras funções.",
  },
  {
    identificador: "arquivo-colecoes-javascript", titulo: "Coleções e transformação de dados", nomeArquivo: "colecoes-e-transformacoes.txt",
    conceitos: ["arrays", "objetos", "métodos de array", "map", "filter", "reduce"],
    resumo: "Material sintético sobre coleções e operações declarativas de transformação de dados.", funcao: FuncaoMaterial.ANOTACAO,
    conteudo: "Arrays e objetos representam coleções. Métodos de array como map, filter e reduce permitem transformar, selecionar e acumular valores sem alterar a coleção original.",
  },
  {
    identificador: "arquivo-assincronismo-javascript", titulo: "Assincronismo e fluxo de execução", nomeArquivo: "assincronismo-e-event-loop.txt",
    conceitos: ["event loop", "fila de tarefas", "pilha de chamadas", "promessas", "async await"],
    resumo: "Material sintético sobre o fluxo assíncrono, a fila de tarefas e a coordenação por promessas.", funcao: FuncaoMaterial.EVIDENCIA_VISUAL,
    conteudo: "O event loop coordena a pilha de chamadas e a fila de tarefas. Promessas representam operações futuras, enquanto async await organiza o encadeamento assíncrono com leitura sequencial.",
  },
  {
    identificador: "arquivo-dom-javascript", titulo: "DOM e eventos do navegador", nomeArquivo: "dom-e-eventos.txt",
    conceitos: ["DOM", "eventos", "seletores", "propagação de eventos", "manipulação de elementos"],
    resumo: "Material sintético sobre consulta, alteração e interação com elementos de uma página.", funcao: FuncaoMaterial.REFERENCIA,
    conteudo: "O DOM representa a página. Seletores localizam nós, eventos registram interações, a propagação de eventos define o percurso e a manipulação de elementos atualiza conteúdo e atributos.",
  },
  {
    identificador: "arquivo-qualidade-javascript", titulo: "Erros, depuração e testes", nomeArquivo: "erros-depuracao-e-testes.txt",
    conceitos: ["tratamento de erros", "try catch", "depuração", "testes unitários", "casos de borda"],
    resumo: "Material sintético sobre diagnóstico de falhas e verificação automatizada de comportamentos.", funcao: FuncaoMaterial.AVALIACAO,
    conteudo: "Tratamento de erros com try catch permite responder a falhas esperadas. Depuração ajuda a localizar causas. Testes unitários verificam regras e casos de borda preservam comportamentos extremos.",
  },
];

const metodosPorCiclo: MetodoEstudo[][] = [
  [MetodoEstudo.FEYNMAN],
  [MetodoEstudo.RECUPERACAO_ATIVA],
  [MetodoEstudo.POMODORO],
  [MetodoEstudo.REPETICAO_ESPACADA],
  [MetodoEstudo.FEYNMAN, MetodoEstudo.RECUPERACAO_ATIVA],
  [MetodoEstudo.POMODORO, MetodoEstudo.REPETICAO_ESPACADA],
];

const formatosPorCiclo: FormatoConteudo[][] = [
  [FormatoConteudo.PDF, FormatoConteudo.TEXTO],
  [FormatoConteudo.VIDEO, FormatoConteudo.EXERCICIO_PRATICO],
  [FormatoConteudo.DOCUMENTO, FormatoConteudo.MAPA_MENTAL],
  [FormatoConteudo.AUDIO, FormatoConteudo.PODCAST],
  [FormatoConteudo.PLANILHA, FormatoConteudo.EXERCICIO_PRATICO, FormatoConteudo.TEXTO],
  [FormatoConteudo.IMAGEM, FormatoConteudo.VIDEO, FormatoConteudo.MAPA_MENTAL],
];

const diasAntes = [55, 53, 51, 48, 46, 44, 41, 39, 37, 34, 32, 30, 27, 25, 23, 20, 18, 16, 13, 11, 9, 6, 4, 2];
const dificuldades = [5, 4, 4, 3, 3, 2, 5, 4, 3, 3, 2, 1, 5, 4, 4, 3, 3, 2, 5, 4, 3, 3, 2, 1];
const compreensoes = [1, 2, 2, 3, 3, 4, 2, 3, 4, 4, 5, 3, 1, 2, 3, 4, 4, 5, 2, 3, 4, 5, 4, 5];
const acoes = [
  "Expliquei os exemplos com minhas próprias palavras e anotei dúvidas.",
  "Recuperei os conceitos sem consulta e depois conferi o material.",
  "Resolvi exercícios curtos e registrei os passos que exigiram revisão.",
  "Comparei exemplos corretos e incorretos antes de escrever um resumo.",
  "Montei um mapa das relações e pratiquei uma aplicação pequena.",
  "Revisei os pontos anteriores e descrevi um exemplo novo ao final.",
];

const sessoes: SessaoSinteticaDiego[] = diasAntes.map((dias, indice) => {
  const material = materiais[indice % materiais.length];
  return {
    diasAntes: dias,
    duracaoMinutos: 24 + (indice * 7) % 33,
    dificuldadePercebida: dificuldades[indice],
    compreensaoPercebida: compreensoes[indice],
    metodos: metodosPorCiclo[indice % metodosPorCiclo.length],
    formatos: formatosPorCiclo[indice % formatosPorCiclo.length],
    materiais: [material.identificador],
    descricao: `${acoes[indice % acoes.length]} Conceitos registrados: ${material.conceitos.join(", ")}.`,
  };
});

export const CENARIO_SINTETICO_DIEGO = Object.freeze({ materiais, sessoes });
