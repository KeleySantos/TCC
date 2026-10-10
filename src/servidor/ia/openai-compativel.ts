import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { criarInstrucaoInterpretacao, extrairRespostaEstruturada, extrairRetryAfter, extrairTextoOpenAi, schemaRespostaInterpretacao } from "./contrato-provedores";
import { ErroProvedorInterpretacao, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

type OpcoesOpenAiCompativel = {
  apiKey: string;
  endpoint: string;
  modelo: string;
  tempoLimiteMs?: number;
  modoEstruturado: "JSON_SCHEMA" | "JSON_OBJECT";
  camposExtras?: Record<string, unknown>;
};

async function classificarResposta(resposta: Response): Promise<never> {
  if (resposta.status === 401 || resposta.status === 403) throw new ErroProvedorInterpretacao("AUTENTICACAO");
  if (resposta.status === 429) throw new ErroProvedorInterpretacao("COTA", extrairRetryAfter(resposta));
  if (resposta.status === 404) throw new ErroProvedorInterpretacao("MODELO_INVALIDO");
  if (resposta.status === 400 || resposta.status === 422) {
    const corpo = await resposta.json().catch(() => null) as { error?: { code?: unknown; type?: unknown; message?: unknown } } | null;
    const resumo = [corpo?.error?.code, corpo?.error?.type, corpo?.error?.message].filter((item): item is string => typeof item === "string").join(" ");
    throw new ErroProvedorInterpretacao(/model|decommission|not_found/i.test(resumo) ? "MODELO_INVALIDO" : "REQUISICAO_INVALIDA");
  }
  throw new ErroProvedorInterpretacao("INDISPONIVEL");
}

async function chamar(opcoes: OpcoesOpenAiCompativel, corpo: Record<string, unknown>, tempoLimiteMs = opcoes.tempoLimiteMs ?? 12_000) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), tempoLimiteMs);
  try {
    const resposta = await fetch(opcoes.endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${opcoes.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(corpo), cache: "no-store", signal: controlador.signal,
    });
    if (!resposta.ok) await classificarResposta(resposta);
    return await resposta.json() as unknown;
  } catch (erro) {
    if (erro instanceof ErroProvedorInterpretacao) throw erro;
    if (erro instanceof Error && erro.name === "AbortError") throw new ErroProvedorInterpretacao("TEMPO_ESGOTADO");
    throw new ErroProvedorInterpretacao("REDE");
  } finally {
    clearTimeout(temporizador);
  }
}

export function criarProvedorOpenAiCompativel(opcoes: OpcoesOpenAiCompativel): ProvedorInterpretacoes {
  return {
    async interpretar(dto: DtoInterpretacao) {
      const resposta = await chamar(opcoes, {
        model: opcoes.modelo,
        messages: [{ role: "user", content: criarInstrucaoInterpretacao(dto) }],
        temperature: 0.35,
        max_completion_tokens: 700,
        response_format: opcoes.modoEstruturado === "JSON_SCHEMA"
          ? { type: "json_schema", json_schema: { name: "insights_aprendizagem", strict: true, schema: schemaRespostaInterpretacao } }
          : { type: "json_object" },
        ...opcoes.camposExtras,
      });
      const texto = extrairTextoOpenAi(resposta);
      const conteudo = texto ? extrairRespostaEstruturada(texto) : null;
      if (!conteudo) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
      return conteudo;
    },
    async testarConexao() {
      const resposta = await chamar(opcoes, {
        model: opcoes.modelo,
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        temperature: 0,
        max_completion_tokens: 128,
        ...opcoes.camposExtras,
      }, Math.min(opcoes.tempoLimiteMs ?? 12_000, 10_000));
      const texto = extrairTextoOpenAi(resposta);
      if (!texto || !/\bOK\b/i.test(texto)) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
    },
  };
}
