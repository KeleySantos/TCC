import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pagina = readFileSync(new URL("./[identificador]/page.tsx", import.meta.url), "utf8");
const removerParticipanteSala = readFileSync(new URL("./[identificador]/remover-participante-sala.tsx", import.meta.url), "utf8");
const paginaModulo = readFileSync(new URL("./[identificador]/modulos/[moduloId]/page.tsx", import.meta.url), "utf8");
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
    expect(comparacao).toContain("Percepção × evidências por participante");
    expect(comparacao).not.toContain("consent");
    expect(interpretacao).toContain("INTERPRETAÇÃO POR IA");
    expect(interpretacao).not.toContain("AUTORIZADA PELO MEMBRO");
  });

  it("mantém dashboard e convites estritamente dentro do módulo", () => {
    expect(pagina).not.toContain("Dashboard geral da sala");
    expect(pagina).not.toContain("GeradorConvite");
    expect(pagina).not.toContain("titulo-convites");
    expect(paginaModulo).toContain("obterModuloSalaDaConta");
    expect(paginaModulo).toContain("obterDashboardModuloSalaDoProprietario");
    expect(paginaModulo).toContain("GeradorConvite");
    expect(paginaModulo).toContain("moduloSalaId");
    expect(paineis).not.toContain("obterDashboardsSalaDoProprietario");
    expect(paineis).not.toContain("calcularDashboardObservacionalSala");
  });

  it("mantém convite no módulo e permite a remoção completa de participante no nível da Sala", () => {
    expect(servicoSalas).not.toContain("export async function gerarConviteSala");
    expect(servicoSalas).not.toContain("export async function entrarSalaComCodigo");
    expect(servicoSalas).not.toContain("export async function removerMembroSala");
    expect(servicoSalas).toContain("export async function removerUsuarioDaSala");
    expect(servicoSalas).toContain("export async function gerarConviteModuloSala");
    expect(servicoSalas).toContain("export async function sairDoModuloSala");
    expect(acoes).toContain("removerUsuarioDaSala");
    expect(removerParticipanteSala).toContain("Confirmar remoção");
    expect(removerParticipanteSala).toContain("removerParticipanteDaSala");
  });
});
