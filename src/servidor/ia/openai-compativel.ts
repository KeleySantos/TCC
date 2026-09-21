import type { DtoInterpretacao } from "@/dominio/interpretacoes/esquema";
import { criarInstrucaoInterpretacao, extrairRetryAfter, extrairTextoOpenAi, schemaRespostaInterpretacao } from "./contrato-provedores";
import { ErroProvedorInterpretacao, type ProvedorInterpretacoes } from "./provedor-interpretacoes";

type OpcoesOpenAiCompativel = {
  apiKey: string;
  endpoint: string;
  modelo: string;
  tempoLimiteMs?: number;
  modoEstruturado: "JSON_SCHEMA" | "JSON_OBJECT";
  camposExtras?: Record<string, unknown>;
};

function classificarResposta(resposta: Response): never {
  if (resposta.status === 401 || resposta.status === 403) throw new ErroProvedorInterpretacao("AUTENTICACAO");
  if (resposta.status === 429) throw new ErroProvedorInterpretacao("COTA", extrairRetryAfter(resposta));
  throw new ErroProvedorInterpretacao("INDISPONIVEL");
}

export function criarProvedorOpenAiCompativel(opcoes: OpcoesOpenAiCompativel): ProvedorInterpretacoes {
  return {
    async interpretar(dto: DtoInterpretacao) {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), opcoes.tempoLimiteMs ?? 8_000);
      try {
        const resposta = await fetch(opcoes.endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${opcoes.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: opcoes.modelo,
            messages: [{ role: "user", content: criarInstrucaoInterpretacao(dto) }],
            temperature: 0.2,
            max_completion_tokens: 1_200,
            response_format: opcoes.modoEstruturado === "JSON_SCHEMA"
              ? { type: "json_schema", json_schema: { name: "interpretacao_sessoes", strict: true, schema: schemaRespostaInterpretacao } }
              : { type: "json_object" },
            ...opcoes.camposExtras,
          }),
          cache: "no-store",
          signal: controlador.signal,
        });
        if (!resposta.ok) classificarResposta(resposta);
        const texto = extrairTextoOpenAi(await resposta.json());
        if (!texto) throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
        try {
          return JSON.parse(texto) as unknown;
        } catch {
          throw new ErroProvedorInterpretacao("RESPOSTA_INVALIDA");
        }
      } catch (erro) {
        if (erro instanceof ErroProvedorInterpretacao) throw erro;
        if (erro instanceof Error && erro.name === "AbortError") throw new ErroProvedorInterpretacao("TEMPO_ESGOTADO");
        throw new ErroProvedorInterpretacao("INDISPONIVEL");
      } finally {
        clearTimeout(temporizador);
      }
    },
  };
}
