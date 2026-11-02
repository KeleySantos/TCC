import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("paleta visual", () => {
  it("define azul e laranja nos tokens globais", () => {
    const estilos = readFileSync(resolve(process.cwd(), "src/app/globais.css"), "utf8");
    expect(estilos).toContain("--cor-dados-azul: #2E78F6");
    expect(estilos).toContain("--cor-dados-amarelo: #EF8D4B");
    expect(estilos).toContain("--cor-foco: #EF8D4B");
    expect(estilos).not.toContain("#2C82B5");
    expect(estilos).not.toContain("#FFDA21");
  });
});
