import { criarInstrucaoInterpretacao, extrairRetryAfter, schemaRespostaInterpretacao } from "./contrato-provedores";
import { ErroProvedorInterpretacao, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

const MODELO_PRINCIPAL = "gemini-3.8-flash";
const MODELO_CONTINGENCIA = "gemini-3.7-flash";
const ATRASO_BASE_MS = 750;

type OpcoesGemini = {
  esperar?: (milissegundos: number) => Promise<void>;
  aleatorio?: () => number;
};

class FalhaTentativaGemini extends Error {
  constructor(
    public readonly erro: ErroProvedorInterpretacao,
    public readonly repetivel: boolean,
  ) {
    super(erro.codigo);
  }
}

function modelosCandidatos(modelo: string) {
  return modelo === MODELO_PRINCIPAL ? [MODELO_PRINCIPAL, MODELO_CONTINGENCIA] : [modelo];
}

async function esperarPadrao(milissegundos: number) {
  await new Promise((resolver) => setTimeout(resolver, milissegundos));
}

async function buscarComTempoLimite(url: string, init: RequestInit, tempoLimiteMs: number) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), tempoLimiteMs);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controlador.signal });
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      throw new FalhaTentativaGemini(new ErroProvedorInterpretacao("TEMPO_ESGOTADO"), true);
    }
    throw new FalhaTentativaGemini(new ErroProvedorInterpretacao("INDISPONIVEL"), true);
  } finally {
    clearTimeout(temporizador);
  }
}

function validarRespostaHttp(resposta: Response) {
  if (resposta.status === 401 || resposta.status === 403) {
    throw new FalhaTentativaGemini(new ErroProvedorInterpretacao("AUTENTICACAO"), false);
  }
  if (resposta.status === 429) {
    throw new FalhaTentativaGemini(new ErroProvedorInterpretacao("COTA", extrairRetryAfter(resposta)), false);
  }
  if (!resposta.ok) {
    const repetivel = resposta.status === 408 || resposta.status >= 500;
    throw new FalhaTentativaGemini(new ErroProvedorInterpretacao("INDISPONIVEL"), repetivel);
  }
}

function extrairTexto(resposta: unknown) {
  if (!resposta || typeof resposta !== "object") return null;
  const candidatos = (resposta as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidatos)) return null;
  const partes = (candidatos[0] as { content?: { parts?: Array<{ text?: unknown }> } } | undefined)?.content?.parts;
  const texto = partes?.map((parte) => typeof parte.text === "string" ? parte.text : "").join("");
  return texto || null;
}

export function criarProvedorGemini(apiKey: string, modelo = MODELO_PRINCIPAL, tempoLimiteMs = 20_000, opcoes: OpcoesGemini = {}): ProvedorInterpretacoes {
  const modeloSeguro = /^[a-zA-Z0-9._-]+$/.test(modelo) ? modelo : MODELO_PRINCIPAL;
  const modelos = modelosCandidatos(modeloSeguro);
  const esperar = opcoes.esperar ?? esperarPadrao;
  const aleatorio = opcoes.aleatorio ?? Math.random;
  let modeloUtilizado: string | undefined;

  async function executarComContingencia(executar: (modeloAtual: string) => Promise<void>) {
    let ultimaFalha = new ErroProvedorInterpretacao("INDISPONIVEL");
    for (const [indiceModelo, modeloAtual] of modelos.entries()) {
      const quantidadeTentativas = indiceModelo === 0 ? 2 : 1;
      for (let tentativa = 0; tentativa < quantidadeTentativas; tentativa += 1) {
        try {
          await executar(modeloAtual);
          modeloUtilizado = modeloAtual;
          return;
        } catch (erro) {
          if (!(erro instanceof FalhaTentativaGemini)) throw erro;
          ultimaFalha = erro.erro;
          if (!erro.repetivel) throw erro.erro;
          const possuiNovaTentativa = tentativa + 1 < quantidadeTentativas || indiceModelo + 1 < modelos.length;
          if (possuiNovaTentativa) {
            const atraso = ATRASO_BASE_MS * 2 ** tentativa + Math.floor(aleatorio() * 250);
            await esperar(atraso);
          }
        }
      }
    }
    throw ultimaFalha;
  }

  return {
    async interpretar(dto) {
      let conteudo: unknown;
      try {
        await executarComContingencia(async (modeloAtual) => {
          const resposta = await buscarComTempoLimite(`https://generativelanguage.googleapis.com/v1beta/models/${modeloAtual}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              contents: [{ parts: [{ text: criarInstrucaoInterpretacao(dto) }] }],
              generationConfig: {
                thinkingConfig: { thinkingLevel: "low" },
                responseFormat: { text: { mimeType: "APPLICATION_JSON", schema: schemaRespostaInterpretacao } },
              },
            }),
          }, tempoLimiteMs);
          validarRespostaHttp(resposta);
          const texto = extrairTexto(await resposta.json());
          if (!texto) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
          try {
            conteudo = JSON.parse(texto) as unknown;
          } catch {
            throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
          }
        });
        return conteudo;
      } catch (erro) {
        if (erro instanceof ErroProvedorInterpretacao) throw erro;
        throw new ErroProvedorInterpretacao("INDISPONIVEL");
      }
    },
    async testarConexao() {
      await executarComContingencia(async (modeloAtual) => {
        const resposta = await buscarComTempoLimite(`https://generativelanguage.googleapis.com/v1beta/models/${modeloAtual}`, {
          method: "GET",
          headers: { "x-goog-api-key": apiKey },
        }, Math.min(tempoLimiteMs, 8_000));
        validarRespostaHttp(resposta);
      });
    },
    obterModeloUtilizado() {
      return modeloUtilizado;
    },
  };
}
