import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PainelMateriaisModulo } from "./painel-materiais-modulo";

vi.mock("../acoes", () => ({ arquivarMaterial: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");

describe("biblioteca de materiais do módulo", () => {
  it("mantém o cabeçalho de Materiais sem o ícone decorativo", () => {
    const html = renderToStaticMarkup(createElement(PainelMateriaisModulo, {
      moduloId: "modulo-1",
      identificadorModulo: "javascript",
      materiais: [],
    } as never));

    expect(html).toContain('id="titulo-biblioteca-materiais">Materiais</h2>');
    expect(html).toContain("Seus arquivos aparecerão aqui.");
    expect(html).toContain('aria-label="Adicionar material"');
    expect(html).not.toContain("lucide-folder-open");
    expect(estilos).toMatch(/\.cabecalhoPainelLateral\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/s);
  });

  it("identifica a função do arquivo sem apresentar sua classificação de formato", () => {
    const html = renderToStaticMarkup(createElement(PainelMateriaisModulo, {
      moduloId: "modulo-1",
      identificadorModulo: "javascript",
      materiais: [{
        id: "material-1",
        titulo: "Resultado da atividade",
        descricao: "Atividade corrigida.",
        minutosEstimados: 15,
        funcao: "AVALIACAO",
        dataEvento: new Date("2026-09-20T00:00:00.000Z"),
        origem: "ARQUIVO",
        formato: "PDF",
        arquivo: { nomeOriginal: "resultado-arquivo", tamanhoBytes: 1024, extensaoNormalizada: "pdf", tipoMime: "application/pdf" },
        analise: null,
        evidencia: null,
        url: null,
        conteudoTexto: null,
      }],
    } as never));

    expect(html).toContain(">Avaliação<");
    expect(html).not.toContain(">PDF<");
    expect(html).not.toContain("min estimados");
    expect(html).not.toContain("Método usado");
    expect(html).not.toContain("Iniciar sessão de estudo");
    expect(html).not.toContain("Editar material");
    expect(html).not.toContain("BIBLIOTECA");
    expect(html).toContain('aria-label="Adicionar material"');
    expect(html).toContain("<details");
  });

  it("escolhe o ícone do material a partir do tipo real do arquivo", () => {
    const base = {
      descricao: "Arquivo do módulo.",
      minutosEstimados: null,
      funcao: "REFERENCIA",
      dataEvento: new Date("2026-09-20T00:00:00.000Z"),
      origem: "ARQUIVO",
      formato: "DOCUMENTO",
      analise: null,
      evidencia: null,
      url: null,
      conteudoTexto: null,
    };
    const arquivo = (id: string, extensaoNormalizada: string, tipoMime: string) => ({
      ...base,
      id,
      titulo: id,
      arquivo: { nomeOriginal: `${id}.${extensaoNormalizada}`, tamanhoBytes: 1024, extensaoNormalizada, tipoMime },
    });
    const html = renderToStaticMarkup(createElement(PainelMateriaisModulo, {
      moduloId: "modulo-1",
      identificadorModulo: "javascript",
      materiais: [
        arquivo("imagem", "png", "image/png"),
        arquivo("documento", "pdf", "application/pdf"),
        arquivo("planilha", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        arquivo("texto", "txt", "text/plain"),
      ],
    } as never));

    expect(html).toContain('data-tipo-arquivo="imagem"');
    expect(html).toContain('data-tipo-arquivo="pdf"');
    expect(html).toContain('data-tipo-arquivo="planilha"');
    expect(html).toContain('data-tipo-arquivo="texto"');
  });
});
