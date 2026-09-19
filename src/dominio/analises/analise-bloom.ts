import { NivelBloom, NivelEvidencia } from "@/gerado/prisma/enums";
import { obterNivelEvidencia } from "./evidencias";

export const VERSAO_ANALISE_BLOOM = "analise-bloom-v1";

export type RespostaClassificadaBloom = {
  nivelBloom: NivelBloom | null;
  correta: boolean;
  concluidaEm: Date | null;
};

export type ResumoNivelBloom = {
  nivelBloom: NivelBloom;
  quantidadeRespostas: number;
  respostasCorretas: number;
  taxaAcerto: number | null;
  nivelEvidencia: NivelEvidencia;
  periodoInicio: Date | null;
  periodoFim: Date | null;
};

export type AnaliseBloom = {
  niveis: ResumoNivelBloom[];
  quantidadeRespostasClassificadas: number;
  quantidadeNiveisComEvidencia: number;
  versaoAlgoritmo: string;
};

export function calcularAnaliseBloom(respostas: RespostaClassificadaBloom[]): AnaliseBloom {
  const grupos = new Map<NivelBloom, RespostaClassificadaBloom[]>();
  for (const resposta of respostas) {
    if (!resposta.nivelBloom || !resposta.concluidaEm) continue;
    grupos.set(resposta.nivelBloom, [...(grupos.get(resposta.nivelBloom) ?? []), resposta]);
  }
  const niveis = [...grupos.entries()].map(([nivelBloom, itens]) => {
    const ordenadas = [...itens].sort((a, b) => a.concluidaEm!.getTime() - b.concluidaEm!.getTime());
    const quantidadeRespostas = itens.length;
    const respostasCorretas = itens.filter((item) => item.correta).length;
    return {
      nivelBloom,
      quantidadeRespostas,
      respostasCorretas,
      taxaAcerto: quantidadeRespostas >= 2 ? respostasCorretas / quantidadeRespostas : null,
      nivelEvidencia: obterNivelEvidencia(quantidadeRespostas, itens.map((item) => item.correta ? 100 : 0)),
      periodoInicio: ordenadas[0]?.concluidaEm ?? null,
      periodoFim: ordenadas.at(-1)?.concluidaEm ?? null,
    };
  }).sort((a, b) => a.nivelBloom.localeCompare(b.nivelBloom));
  return {
    niveis,
    quantidadeRespostasClassificadas: niveis.reduce((soma, nivel) => soma + nivel.quantidadeRespostas, 0),
    quantidadeNiveisComEvidencia: niveis.filter((nivel) => nivel.taxaAcerto !== null).length,
    versaoAlgoritmo: VERSAO_ANALISE_BLOOM,
  };
}
