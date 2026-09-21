import type { ConteudoInterpretacao, DtoInterpretacao } from "@/dominio/interpretacoes/esquema";

export type CodigoErroProvedor = "TEMPO_ESGOTADO" | "COTA" | "AUTENTICACAO" | "INDISPONIVEL" | "RESPOSTA_INVALIDA";

export class ErroProvedorInterpretacao extends Error {
  constructor(public readonly codigo: CodigoErroProvedor, public readonly aguardarSegundos?: number) {
    super(codigo);
  }
}

export interface ProvedorInterpretacoes {
  interpretar(dto: DtoInterpretacao): Promise<unknown>;
  testarConexao?(): Promise<void>;
  obterModeloUtilizado?(): string | undefined;
}

export type ProvedorValidado = ProvedorInterpretacoes & { interpretar(dto: DtoInterpretacao): Promise<ConteudoInterpretacao> };
