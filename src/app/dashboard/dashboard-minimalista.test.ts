import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pagina = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");
const estilosGraficos = readFileSync(new URL("../../componentes/graficos-dashboard.module.css", import.meta.url), "utf8");
const estilosInsights = readFileSync(new URL("../../componentes/cartoes-insights-dashboard.module.css", import.meta.url), "utf8");
const estilosAnel = readFileSync(new URL("../../componentes/grafico-anel-observacional.module.css", import.meta.url), "utf8");
const estilosGlobais = readFileSync(new URL("../globais.css", import.meta.url), "utf8");

describe("composição minimalista do Dashboard", () => {
  it("mantém a saudação e remove os textos introdutórios apontados", () => {
    expect(pagina).toContain("<h1 id=\"titulo-dashboard\">Olá, {primeiroNome}!</h1>");
    expect(pagina).not.toContain("SUA JORNADA DE APRENDIZAGEM");
    expect(pagina).not.toContain("Observe como você tem estudado");
    expect(pagina).not.toContain("Leitura recente");
    expect(estilos).toMatch(/\.boasVindas h1\s*\{[^}]*font-family:\s*Inter/s);
    expect(estilos).toMatch(/\.boasVindas h1\s*\{[^}]*font-weight:\s*850/s);
    expect(estilos).toMatch(/\.boasVindas h1\s*\{[^}]*text-transform:\s*uppercase/s);
    expect(estilos).toMatch(/\.boasVindas h1\s*\{[^}]*font-size:\s*clamp\(2\.4rem,\s*4\.8vw,\s*4rem\)/s);
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
    expect(estilos).toMatch(/\.cartaoBase\s*\{[^}]*background:\s*#171717/s);
    expect(estilos).toMatch(/\.cartaoBase\s+:is\(h2,\s*dt,\s*dd\)\s*\{[^}]*color:\s*#fff/s);
    expect(estilos).toMatch(/\.cartaoBase\s+\.base\s+dt\s*\{[^}]*color:\s*#fff/s);
    expect(estilos).toMatch(/\.poucosDados\s*\{[^}]*background:\s*#FCDD9D/s);
  });

  it("aproxima a saudação do cabeçalho dos registros e alinha as ações nele", () => {
    expect(pagina).toContain("<CartoesInsightsDashboard acoes={");
    expect(estilos).toMatch(/\.areaConteudo\s*\{[^}]*padding:\s*clamp\(77px,\s*9\.6vw,\s*128px\)/s);
    expect(estilos).toMatch(/\.boasVindas\s*\{[^}]*margin-bottom:\s*8px/s);
    expect(estilosInsights).toMatch(/\.cabecalho\s*\{[^}]*padding-bottom:\s*16px[^}]*border-bottom:\s*1px solid var\(--cor-borda\)/s);
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
