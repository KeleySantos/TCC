import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pagina = readFileSync(new URL("./[identificador]/page.tsx", import.meta.url), "utf8");
const acoes = readFileSync(new URL("./acoes.ts", import.meta.url), "utf8");
const comparacao = readFileSync(new URL("./comparacao-membros.tsx", import.meta.url), "utf8");
const interpretacao = readFileSync(new URL("./interpretacao-membro.tsx", import.meta.url), "utf8");
const estilos = readFileSync(new URL("./page.module.css", import.meta.url), "utf8");
const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
const servicoSalas = readFileSync(new URL("../../servidor/salas.ts", import.meta.url), "utf8");
const paineis = readFileSync(new URL("../../servidor/paineis-salas.ts", import.meta.url), "utf8");

describe("permissões obrigatórias das Salas", () => {
  it("não oferece controles para desativar comparação ou interpretação por IA", () => {
    expect(pagina).not.toContain("atualizarConsentimentos");
    expect(pagina).not.toContain("Permitir comparação individual");
    expect(pagina).not.toContain("Permitir uso dos meus dados pela IA");
    expect(pagina).not.toContain("Salvar permissões");
    expect(acoes).not.toContain("atualizarConsentimentos");
    expect(estilos).toMatch(/\.formulario\s*\{\s*display:\s*grid;\s*gap:\s*12px;/s);
    expect(estilos).not.toContain("formularioConsentimento");
  });

  it("não persiste nem consulta permissões opcionais nos vínculos", () => {
    for (const fonte of [schema, servicoSalas, paineis, pagina]) {
      expect(fonte).not.toContain("permitirComparacao");
      expect(fonte).not.toContain("permitirIa");
    }
  });

  it("apresenta comparação e IA como recursos dos dashboards compartilhados", () => {
    expect(comparacao).toContain("Evolução dos membros da sala");
    expect(comparacao).not.toContain("consent");
    expect(interpretacao).toContain("INTERPRETAÇÃO POR IA");
    expect(interpretacao).not.toContain("AUTORIZADA PELO MEMBRO");
  });
});
