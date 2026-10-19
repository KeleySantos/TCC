import { describe, expect, it } from "vitest";
import { cadastrarContaPessoal, ErroCadastroConta } from "./contas";
import { verificarSenha } from "./senhas";

function clienteFalso(opcoes: { duplicada?: boolean } = {}) {
  let dadosCriados: Record<string, unknown> | null = null;
  return {
    cliente: {
      usuario: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          if (opcoes.duplicada) throw Object.assign(new Error("restrição única"), { code: "P2002" });
          dadosCriados = data;
          return { id: "conta-nova", nome: data.nome as string, nomeUsuario: data.nomeUsuario as string };
        },
      },
    },
    obterDadosCriados: () => dadosCriados,
  };
}

describe("cadastro de conta pessoal", () => {
  it("gera o identificador interno a partir do nome e armazena somente o hash da senha", async () => {
    const falso = clienteFalso();
    const conta = await cadastrarContaPessoal({
      nome: "  Marina Costa  ",
      senha: "Estudo@2026",
      confirmarSenha: "Estudo@2026",
    }, falso.cliente);

    const persistido = falso.obterDadosCriados();
    expect(conta).toEqual({ id: "conta-nova", nome: "Marina Costa", nomeUsuario: "marina.costa" });
    expect(persistido?.senhaHash).not.toBe("Estudo@2026");
    expect(verificarSenha("Estudo@2026", persistido?.senhaHash as string)).toBe(true);
  });

  it.each([
    [{ nome: "M", senha: "Estudo@2026", confirmarSenha: "Estudo@2026" }, "DADOS_INVALIDOS"],
    [{ nome: "Marina", senha: "curta", confirmarSenha: "curta" }, "DADOS_INVALIDOS"],
    [{ nome: "Marina", senha: "Estudo@2026", confirmarSenha: "Outra@2026" }, "SENHAS_DIFERENTES"],
  ])("rejeita dados inválidos sem persistir", async (dados, codigo) => {
    const falso = clienteFalso();
    await expect(cadastrarContaPessoal(dados, falso.cliente)).rejects.toMatchObject({ codigo });
    expect(falso.obterDadosCriados()).toBeNull();
  });

  it("traduz a restrição única para nome já existente", async () => {
    const falso = clienteFalso({ duplicada: true });
    await expect(cadastrarContaPessoal({
      nome: "Marina Costa",
      senha: "Estudo@2026",
      confirmarSenha: "Estudo@2026",
    }, falso.cliente)).rejects.toEqual(expect.objectContaining<Partial<ErroCadastroConta>>({ codigo: "NOME_EXISTENTE" }));
  });

  it("reserva o identificador ADMIN e não permite criá-lo pelo cadastro público", async () => {
    const falso = clienteFalso();
    await expect(cadastrarContaPessoal({ nome: "ADMIN", senha: "Estudo@2026", confirmarSenha: "Estudo@2026" }, falso.cliente)).rejects.toMatchObject({ codigo: "NOME_EXISTENTE" });
    expect(falso.obterDadosCriados()).toBeNull();
  });
});
