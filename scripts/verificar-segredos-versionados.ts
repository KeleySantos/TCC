import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const padroes = [
  /gsk_[A-Za-z0-9]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /sk-[A-Za-z0-9_-]{24,}/,
  /(?:GROQ_API_KEY|GEMINI_API_KEY|DASHSCOPE_API_KEY|CHAVE_MESTRA_CREDENCIAIS_IA)\s*=\s*["']?[^\s"']{16,}/,
];

const saida = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" });
const arquivos = saida.split("\0").filter(Boolean);
const suspeitos: string[] = [];

for (const arquivo of arquivos) {
  try {
    const conteudo = readFileSync(path.resolve(arquivo), "utf8");
    if (padroes.some((padrao) => padrao.test(conteudo))) suspeitos.push(arquivo);
  } catch {
    // Arquivos binários ou removidos entre a listagem e a leitura são ignorados.
  }
}

if (suspeitos.length) {
  console.error(`Possível segredo encontrado em ${suspeitos.length} arquivo(s):`);
  for (const arquivo of suspeitos) console.error(`- ${arquivo}`);
  process.exit(1);
}

console.log(`Verificação concluída em ${arquivos.length} arquivo(s) versionáveis; nenhum padrão de credencial foi encontrado.`);
