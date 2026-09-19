import type { ConteudoInterpretacao, DtoInterpretacao } from "@/dominio/interpretacoes/esquema";

export class ErroProvedorInterpretacao extends Error {
  constructor(public readonly codigo: "TEMPO_ESGOTADO" | "COTA" | "FALHA_EXTERNA") {
    super(codigo);
  }
}

export interface ProvedorInterpretacoes {
  interpretar(dto: DtoInterpretacao): Promise<unknown>;
}

export type ProvedorValidado = ProvedorInterpretacoes & { interpretar(dto: DtoInterpretacao): Promise<ConteudoInterpretacao> };
