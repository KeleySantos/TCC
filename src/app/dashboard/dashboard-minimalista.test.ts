import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pagina = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");
const estilosGraficos = readFileSync(new URL("../../componentes/graficos-dashboard.module.css", import.meta.url), "utf8");
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

  it("mantém as métricas da base sem os blocos explicativos", () => {
    expect(pagina).toContain("Base das análises");
    expect(pagina).toContain("Sessões válidas");
    expect(pagina).toContain("Tempo estudado");
    expect(pagina).toContain("Dias com estudo");
    expect(pagina).toContain("Duração média");
    expect(pagina).not.toContain("Ver métricas de atividade");
    expect(pagina).not.toContain("<details className={estilos.tradicionais}>");
    expect(pagina).not.toContain("CONTEXTO DAS ANÁLISES");
    expect(pagina).not.toContain("Todo o histórico válido dos módulos ativos");
    expect(pagina).not.toContain("As percepções são autorrelatos");
    expect(pagina).not.toContain("Como interpretar estes dados");
    expect(pagina).toContain("<InterpretacaoAutomatica compacto");
  });

  it("usa fundo escuro e ação invertida no card da IA", () => {
    expect(estilos).toMatch(/\.areaInterpretacao\s+:global\(\.cartao\)[^{]*\{[^}]*background:\s*var\(--cor-acao\)/s);
    expect(estilos).toMatch(/\.areaInterpretacao\s+:global\(\.cartao\)[^{]*\{[^}]*color:\s*#fff/s);
    expect(estilos).toMatch(/\.areaInterpretacao[^}]*:global\(\.botao\)[^{]*\{[^}]*background:\s*#fff/s);
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
