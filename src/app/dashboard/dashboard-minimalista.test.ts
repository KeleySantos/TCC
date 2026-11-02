import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pagina = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");
const estilosGraficos = readFileSync(new URL("../../componentes/graficos-dashboard.module.css", import.meta.url), "utf8");
const estilosInsights = readFileSync(new URL("../../componentes/cartoes-insights-dashboard.module.css", import.meta.url), "utf8");
const estilosAnel = readFileSync(new URL("../../componentes/grafico-anel-observacional.module.css", import.meta.url), "utf8");
const estilosGlobais = readFileSync(new URL("../globais.css", import.meta.url), "utf8");
const estilosModulo = readFileSync(new URL("../modulos/[identificador]/page.module.css", import.meta.url), "utf8");
const estilosInterpretacao = readFileSync(new URL("../../componentes/interpretacao-automatica.module.css", import.meta.url), "utf8");
const filtroPeriodo = readFileSync(new URL("../modulos/[identificador]/filtro-periodo-modulo.tsx", import.meta.url), "utf8");

describe("composição minimalista do Dashboard", () => {
  it("apresenta a saudação pelo primeiro nome acima do título Dashboard", () => {
    expect(pagina).toContain("<CabecalhoPagina idTitulo=\"titulo-dashboard\" preTitulo={<>Olá, {primeiroNome}!</>} titulo=\"DASHBOARD\" />");
    expect(pagina).not.toContain("SUA JORNADA DE APRENDIZAGEM");
    expect(pagina).not.toContain("Observe como você tem estudado");
    expect(pagina).not.toContain("Leitura recente");
    expect(pagina).toContain('import { CabecalhoPagina } from "@/componentes/cabecalho-pagina"');
  });

  it("mantém somente as três métricas solicitadas na base", () => {
    expect(pagina).toContain("Base das análises");
    expect(pagina).toContain("Métodos registrados");
    expect(pagina).toContain("Sessões concluídas válidas");
    expect(pagina).toContain("Duração média");
    expect(pagina).not.toContain("Sessões válidas");
    expect(pagina).not.toContain("Módulos com sessões");
    expect(pagina).not.toContain("Arquivos analisados com conceitos");
    expect(pagina).not.toContain("Tempo estudado");
    expect(pagina).not.toContain("Dias com estudo");
    expect(pagina).not.toContain("Ver métricas de atividade");
    expect(pagina).not.toContain("<details className={estilos.tradicionais}>");
    expect(pagina).not.toContain("CONTEXTO DAS ANÁLISES");
    expect(pagina).not.toContain("Todo o histórico válido dos módulos ativos");
    expect(pagina).not.toContain("As percepções são autorrelatos");
    expect(pagina).not.toContain("Como interpretar estes dados");
    expect(pagina).toContain("<InterpretacaoAutomatica compacto");
    expect(pagina).toContain("modalLateral");
    expect(pagina).not.toContain("<aside aria-label=\"Interpretação opcional\"");
  });

  it("integra cards e gráficos ao fundo sem borda ou sombra", () => {
    expect(estilosInsights).toMatch(/\.cartao\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
    expect(estilosGraficos).toMatch(/\.cartaoGrafico\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
    expect(estilos).toMatch(/\.cartao\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
    expect(estilos).toMatch(/\.cartaoBase\s*\{[^}]*background:\s*var\(--cor-navegacao\)/s);
    expect(estilos).toMatch(/\.cartaoBase\s+:is\(h2,\s*dt,\s*dd\)\s*\{[^}]*color:\s*#fff/s);
    expect(estilos).toMatch(/\.cartaoBase\s+\.base\s+dt\s*\{[^}]*color:\s*#fff/s);
    expect(estilos).toMatch(/\.poucosDados\s*\{[^}]*background:\s*#EF8D4B/s);
  });

  it("usa os tokens de identidade no cabeçalho, na base e no botão de interpretação", () => {
    expect(estilos).toMatch(/\.paginaDashboard\s+:global\(\[data-trilha-pre-titulo="preenchida"\]\)\s*\{[^}]*color:\s*var\(--cor-dados-azul\)/s);
    expect(estilos).toMatch(/\.paginaDashboard\s+:global\(#titulo-dashboard\)\s*\{[^}]*color:\s*var\(--cor-navegacao\)/s);
    expect(estilos).toMatch(/\.cartaoBase\s*\{[^}]*background:\s*var\(--cor-navegacao\)/s);
    expect(estilosInterpretacao).toMatch(/\.botaoAbrir\s*\{[^}]*border:\s*1px solid var\(--cor-navegacao\)[^}]*background:\s*var\(--cor-navegacao\)[^}]*transition:[^}]*transform[^}]*box-shadow/s);
    expect(estilosInterpretacao).toMatch(/\.botaoAbrir:hover\s*\{[^}]*transform:\s*translateY\(-2px\)[^}]*box-shadow:/s);
  });

  it("aproxima a saudação do cabeçalho dos registros e alinha as ações nele", () => {
    expect(pagina).toContain("<CartoesInsightsDashboard acoes={");
    expect(estilos).toMatch(/\.areaConteudo\s*\{[^}]*padding:\s*clamp\(38px,\s*4\.8vw,\s*64px\)/s);
    expect(estilos).not.toMatch(/\.boasVindas/);
    expect(estilosInsights).toMatch(/\.cabecalho\s*\{[^}]*padding-bottom:\s*16px[^}]*border-bottom:\s*1px solid var\(--cor-borda\)/s);
  });

  it("apresenta os nomes da consistência com a mesma tipografia dos valores", () => {
    expect(estilos).toMatch(/\.tabelaConsistencia tbody th\s*\{[^}]*color:\s*inherit[^}]*font-size:\s*inherit[^}]*font-weight:\s*400/s);
  });

  it("alinha verticalmente o filtro ao botão de interpretação em todas as telas", () => {
    expect(estilosModulo).toMatch(/\.botaoFiltroPeriodo\s*\{[^}]*min-height:\s*48px/s);
    expect(estilosInterpretacao).toMatch(/\.botaoAbrir\s*\{[^}]*min-height:\s*48px/s);
  });

  it("mantém o painel do filtro legível e usa um CTA curto", () => {
    expect(filtroPeriodo).toContain(">Filtrar</button>");
    expect(filtroPeriodo).not.toContain("Concluir filtro");
    expect(estilosModulo).toMatch(/\.painelFiltroPeriodo\s*\{[^}]*width:\s*min\(510px,\s*calc\(100vw - 32px\)\)[^}]*max-width:\s*none/s);
    expect(estilosModulo).toMatch(/\.painelFiltroPeriodo form\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(150px,\s*1fr\)\)\s+auto/s);
    expect(estilosModulo).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*?\.painelFiltroPeriodo\s*\{[^}]*width:\s*min\(360px,\s*calc\(100vw - 28px\)\)[^}]*max-width:\s*none/s);
  });

  it("separa visualmente os quatro insights sem recriar cards", () => {
    expect(estilosInsights).toMatch(/\.grade\s*\{[^}]*column-gap:\s*36px/s);
    expect(estilosInsights).toMatch(/\.cartao:not\(:last-child\)::after\s*\{[^}]*right:\s*-18px[^}]*content:\s*""[^}]*width:\s*2px[^}]*background:\s*#000/s);
    expect(estilosInsights).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*?\.cartao::after\s*\{[^}]*display:\s*none/s);
  });

  it("mantém a base das análises compacta", () => {
    expect(estilos).toMatch(/\.cartaoBase\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(150px,\s*\.65fr\)\s+minmax\(0,\s*2fr\)[^}]*padding:\s*16px 24px/s);
    expect(estilos).toMatch(/\.cartaoBase\s*>\s*h2\s*\{[^}]*border-right:\s*1px solid rgb\(255 255 255 \/ 24%\)/s);
    expect(estilos).toMatch(/\.cartaoBase\s+\.base\s+div\s*\{[^}]*padding:\s*6px 14px/s);
  });

  it("usa Inter nos títulos analíticos e amplia o anel com legendas abaixo", () => {
    expect(estilosGraficos).toMatch(/\.cabecalhoGrafico h3\s*\{[^}]*font-family:\s*Inter,/s);
    expect(estilos).toMatch(/\.cartao h2\s*\{[^}]*font-family:\s*Inter,/s);
    expect(estilosAnel).toMatch(/\.componente\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(estilosAnel).toMatch(/\.anel\s*\{[^}]*width:\s*min\(100%,\s*210px\)/s);
    expect(estilosAnel).toMatch(/\.legenda\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  });

  it("empilha os gráficos contextuais no breakpoint mobile", () => {
    expect(estilosGraficos).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*?\.gradeContextos\s*\{[^}]*grid-template-columns:\s*1fr/s);
    expect(estilosGraficos).toMatch(/@media\s*\(max-width:\s*720px\)[\s\S]*?\.cabecalhoGrafico\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
  });

  it("define o fundo estrutural de todas as páginas como branco suave", () => {
    expect(estilosGlobais).toMatch(/--cor-fundo:\s*#FCFCFC;/);
    expect(estilosGlobais).toMatch(/body\s*\{[^}]*background:\s*var\(--cor-fundo\)/s);
  });
});
