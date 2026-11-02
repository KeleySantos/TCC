// @vitest-environment jsdom
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { entrar, cadastrar } = vi.hoisted(() => ({
  entrar: vi.fn<(formulario: FormData) => Promise<void>>().mockResolvedValue(undefined),
  cadastrar: vi.fn<(formulario: FormData) => Promise<void>>().mockResolvedValue(undefined),
}));
vi.mock("./acoes", () => ({ entrarComCredenciais: entrar, cadastrarConta: cadastrar }));
import PaginaEntrar from "./page";

const estilos = readFileSync(resolve(process.cwd(), "src/app/entrar/page.module.css"), "utf8");

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("apresenta a chamada e quatro benefícios sem a antiga prévia de gráfico", async () => {
  render(await PaginaEntrar({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("resultados reais.");
  const beneficios = screen.getByRole("list", { name: "Recursos do laboratório" });
  expect(within(beneficios).getAllByRole("listitem")).toHaveLength(4);
  expect(within(beneficios).getByText("Experimente métodos")).toBeTruthy();
  expect(screen.queryByLabelText("Prévia ilustrativa do painel de aprendizagem")).toBeNull();
  expect(screen.getByText("Learning Lab")).toBeTruthy();
  expect(screen.queryByText("“Aprender também é observar como você aprende.”")).toBeNull();
  expect(screen.getAllByRole("link", { name: "Criar conta" })).toHaveLength(1);
  expect(screen.queryByRole("link", { name: /esqueceu/i })).toBeNull();
});

it("usa a cor do CTA principal nas abas e no indicador", () => {
  expect(estilos).toMatch(/\.alternadorAcesso a\[aria-current="page"\]\s*\{[^}]*background:\s*#17202e[^}]*box-shadow:\s*0 4px 12px rgb\(23 32 46 \/ 18%\)/s);
  expect(estilos).toMatch(/\.indicadorAcesso::after\s*\{[^}]*background:\s*#17202e/s);
});

it("usa ícones brancos com glifos pretos e destaca o resultado em amarelo", () => {
  expect(estilos).toMatch(/\.iconeBeneficio\s*\{[^}]*color:\s*#000[^}]*background:\s*#fff/s);
  expect(estilos).not.toMatch(/\.beneficios li:nth-child\([234]\) \.iconeBeneficio\s*\{/);
  expect(estilos).toMatch(/\.chamadaPrincipal h1 span\s*\{[^}]*color:\s*#EF8D4B/s);
});

it("revela a senha sem perder o valor nem enviar o formulário e preserva o contrato de login", async () => {
  render(await PaginaEntrar({ searchParams: Promise.resolve({}) }));
  const usuario = userEvent.setup();
  const nome = screen.getByLabelText("Nome") as HTMLInputElement;
  const senha = screen.getByLabelText("Senha", { exact: true }) as HTMLInputElement;
  expect(nome.autocomplete).toBe("username");
  expect(senha.autocomplete).toBe("current-password");
  expect(senha.type).toBe("password");
  await usuario.type(nome, "Ana");
  await usuario.type(senha, "senha-teste");
  await usuario.click(screen.getByRole("button", { name: /^Mostrar senha$/ }));
  expect(senha.type).toBe("text");
  expect(senha.value).toBe("senha-teste");
  expect(entrar).not.toHaveBeenCalled();
  await usuario.click(screen.getByRole("button", { name: /^Ocultar senha$/ }));
  expect(senha.type).toBe("password");
  await usuario.click(screen.getByRole("button", { name: /^Entrar$/ }));
  await waitFor(() => expect(entrar).toHaveBeenCalledOnce());
  const dados = entrar.mock.calls[0][0];
  expect(dados.get("identificador")).toBe("Ana");
  expect(dados.get("senha")).toBe("senha-teste");
});

it.each([undefined, "cadastro"])("remove os textos auxiliares indicados no modo %s sem referências acessíveis quebradas", async (modo) => {
  const tela = render(await PaginaEntrar({ searchParams: Promise.resolve({ modo }) }));
  for (const texto of [
    "NOVA CONTA PESSOAL",
    "Crie uma conta vazia para organizar seus próprios módulos e registros sintéticos.",
    "Entre para continuar sua jornada de aprendizagem.",
    "Ambiente local. Use somente dados fictícios para testar a plataforma.",
    "ou",
  ]) expect(screen.queryByText(texto, { exact: true })).toBeNull();
  expect(tela.container.querySelector('form[aria-describedby="aviso-demonstracao"]')).toBeNull();
  expect(screen.getByRole("button", { name: modo === "cadastro" ? "Criar conta e entrar" : "Entrar" })).toBeTruthy();
});

it("mantém o cadastro com confirmação, restrições e envio dos três campos originais", async () => {
  render(await PaginaEntrar({ searchParams: Promise.resolve({ modo: "cadastro" }) }));
  const usuario = userEvent.setup();
  const senha = screen.getByLabelText("Senha", { exact: true }) as HTMLInputElement;
  const confirmacao = screen.getByLabelText("Confirmar senha") as HTMLInputElement;
  expect(senha.minLength).toBe(8);
  expect(senha.maxLength).toBe(128);
  expect(confirmacao.required).toBe(true);
  await usuario.type(screen.getByLabelText("Nome"), "Marina Demo");
  await usuario.type(senha, "abc12345");
  await usuario.type(confirmacao, "abc12345");
  await usuario.click(screen.getByRole("button", { name: /^Mostrar confirmação de senha$/ }));
  expect(confirmacao.type).toBe("text");
  expect(senha.type).toBe("password");
  await usuario.click(screen.getByRole("button", { name: "Criar conta e entrar" }));
  await waitFor(() => expect(cadastrar).toHaveBeenCalledOnce());
  const dados = cadastrar.mock.calls[0][0];
  expect(dados.get("nome")).toBe("Marina Demo");
  expect(dados.get("senha")).toBe("abc12345");
  expect(dados.get("confirmarSenha")).toBe("abc12345");
});

it("preserva o aviso de erro do login e a indicação da aba ativa", async () => {
  render(await PaginaEntrar({ searchParams: Promise.resolve({ erro: "credenciais" }) }));
  expect(screen.getByRole("alert").textContent).toBe("Nome ou senha inválidos.");
  const nav = screen.getByRole("navigation", { name: "Escolha entre entrar ou criar uma conta" });
  expect(within(nav).getByRole("link", { name: "Entrar" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByLabelText("Nome").hasAttribute("required")).toBe(true);
});

it("inicia o cadastro com a senha oculta e vazia após revelar a senha no login", async () => {
  const tela = render(await PaginaEntrar({ searchParams: Promise.resolve({}) }));
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Senha", { exact: true }), "senha-do-login");
  await usuario.click(screen.getByRole("button", { name: /^Mostrar senha$/ }));
  tela.rerender(await PaginaEntrar({ searchParams: Promise.resolve({ modo: "cadastro" }) }));
  const senhaCadastro = screen.getByLabelText("Senha", { exact: true }) as HTMLInputElement;
  expect(senhaCadastro.type).toBe("password");
  expect(senhaCadastro.value).toBe("");
});

it.each([
  ["dados", "Revise os campos."],
  ["senhas", "A senha e a confirmação precisam ser iguais."],
  ["nome", "Já existe uma conta com esse nome."],
])("preserva o erro %s do cadastro", async (erro, mensagem) => {
  render(await PaginaEntrar({ searchParams: Promise.resolve({ modo: "cadastro", erro }) }));
  expect(screen.getByRole("alert").textContent).toContain(mensagem);
  const nav = screen.getByRole("navigation", { name: "Escolha entre entrar ou criar uma conta" });
  expect(within(nav).getByRole("link", { name: "Criar conta" }).getAttribute("aria-current")).toBe("page");
});
