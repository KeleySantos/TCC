import { describe, expect, it } from "vitest";
import { dataDentroDoPeriodo, resolverPeriodoModulo } from "./periodo-modulo";

const agora = new Date("2026-09-27T15:00:00.000Z");

describe("período do módulo", () => {
  it("usa todo o histórico até o momento atual quando não há filtro", () => {
    const periodo = resolverPeriodoModulo({}, agora);
    expect(periodo).toMatchObject({ inicio: null, fim: agora, ativo: false, erro: null, hoje: "2026-09-27" });
  });

  it("transforma datas em um intervalo UTC inclusivo", () => {
    const periodo = resolverPeriodoModulo({ inicio: "2026-07-01", fim: "2026-07-31" }, agora);
    expect(periodo).toMatchObject({ ativo: true, erro: null });
    expect(periodo.inicio?.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(periodo.fim.toISOString()).toBe("2026-07-31T23:59:59.999Z");
    expect(dataDentroDoPeriodo(new Date("2026-07-31T23:59:59.999Z"), periodo)).toBe(true);
  });

  it.each([
    [{ inicio: "2026-07-01" }, "Informe a data de início e a data de fim."],
    [{ inicio: "2026-09-28", fim: "2026-09-28" }, "O período não pode incluir datas futuras."],
    [{ inicio: "2026-09-20", fim: "2026-09-10" }, "A data de início deve ser anterior ou igual à data de fim."],
  ])("recusa intervalo inválido sem aplicá-lo", (entrada, mensagem) => {
    expect(resolverPeriodoModulo(entrada, agora)).toMatchObject({ ativo: false, erro: mensagem, inicio: null, fim: agora });
  });
});
