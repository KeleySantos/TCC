// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { agregarComparacaoMembros, ComparacaoMembros, type ParticipanteComparacao } from "./comparacao-membros";

const participantes: ParticipanteComparacao[] = [
  {
    vinculoId: "ana",
    nome: "Ana",
    evolucaoPercepcaoEvidencia: [
      { quantidadePercepcoes: 2, mediaCompreensaoPercebida: 5, quantidadeEvidencias: 2, desempenhoMedioEvidencias: 80 },
      { quantidadePercepcoes: 1, mediaCompreensaoPercebida: 3, quantidadeEvidencias: 1, desempenhoMedioEvidencias: 50 },
    ],
  },
  {
    vinculoId: "bruno",
    nome: "Bruno",
    evolucaoPercepcaoEvidencia: [
      { quantidadePercepcoes: 0, mediaCompreensaoPercebida: null, quantidadeEvidencias: 0, desempenhoMedioEvidencias: null },
    ],
  },
];

const fonte = readFileSync(resolve(process.cwd(), "src/app/salas/comparacao-membros.tsx"), "utf8");
const estilos = readFileSync(resolve(process.cwd(), "src/app/salas/dashboard-sala.module.css"), "utf8");
const fontePagina = readFileSync(resolve(process.cwd(), "src/app/salas/[identificador]/modulos/[moduloId]/page.tsx"), "utf8");
const fontePaineis = readFileSync(resolve(process.cwd(), "src/servidor/paineis-salas.ts"), "utf8");

afterEach(cleanup);

describe("comparação de percepção e evidências por participante", () => {
  it("agrega médias ponderadas no período, normaliza percepção e preserva ausência", () => {
    const dados = agregarComparacaoMembros(participantes);

    expect(dados[0]).toMatchObject({ vinculoId: "ana", nome: "Ana", quantidadePercepcoes: 3, quantidadeEvidencias: 3 });
    expect(dados[0].percepcao).toBeCloseTo(83.333, 2);
    expect(dados[0].evidencias).toBeCloseTo(70, 5);
    expect(dados[1]).toMatchObject({ vinculoId: "bruno", percepcao: null, evidencias: null, quantidadePercepcoes: 0, quantidadeEvidencias: 0 });
  });

  it("mantém comparação e tabela sempre visíveis, sem toggle, e explicita dados ausentes", () => {
    render(createElement(ComparacaoMembros, { participantes }));

    expect(screen.getByRole("heading", { name: "Percepção × evidências por participante" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /comparação/i })).toBeNull();
    expect(screen.getByRole("table", { name: "Percepção e evidências por participante" })).toBeTruthy();
    expect(screen.getByText("83/100")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("Sem percepção no período")).toBeTruthy();
    expect(screen.getByText("Sem evidências válidas no período")).toBeTruthy();
  });

  it("usa barras verticais agrupadas, domínio 0–100 e tokens das séries", () => {
    expect(fonte).toContain("<BarChart");
    expect(fonte).not.toContain('layout="vertical"');
    expect(fonte).toMatch(/<XAxis[^>]*dataKey="nome"/s);
    expect(fonte).toMatch(/<YAxis[^>]*domain=\{\[0, 100\]\}/s);
    expect(fonte).toMatch(/<Bar[^>]*dataKey="percepcao"[^>]*fill="var\(--cor-dados-azul\)"[^>]*name="Percepção"/s);
    expect(fonte).toMatch(/<Bar[^>]*dataKey="evidencias"[^>]*fill="var\(--cor-dados-amarelo\)"[^>]*name="Evidências"/s);
  });

  it("integra a comparação ao fundo sem delimitador visual de card", () => {
    const regra = estilos.match(/\.comparacao\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(regra).not.toMatch(/(?:border|border-radius|background|box-shadow)\s*:/);
    expect(fonte).not.toContain("useState");
    expect(fonte).not.toContain("Mostrar comparação");
    expect(fonte).not.toContain("Ocultar comparação");
  });

  it("consome somente a série existente de vínculos ativos, sem nova consulta ou históricos anônimos", () => {
    expect(fontePagina).toContain("dashboardModulo.individuais.map");
    expect(fontePagina).toContain("item.aprendizagem?.resumoResultados.evolucaoPercepcaoEvidencia ?? []");
    expect(fontePagina).not.toMatch(/comparaveis\s*=\s*dashboardModulo\.evidenciasHistoricas/);
    expect(fontePaineis).toMatch(/vinculos:\s*\{[\s\S]*?situacao:\s*SituacaoVinculoModuloSala\.ATIVO[\s\S]*?participacaoModuloSala:\s*\{\s*situacao:\s*SituacaoParticipacaoModuloSala\.ATIVA/s);
  });
});
