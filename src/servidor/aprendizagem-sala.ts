import type { ClassificacaoConceitoAprendizagem, EvolucaoPercepcaoEvidencia, ResultadoContextoAprendizagem } from "@/dominio/analises/aprendizagem-modulo";
import { obterAprendizagemModuloPessoal } from "./aprendizagem-modulo";

type ResumoResultadosSala = {
  duracaoSessoesComMelhorResultado: { mediaMinutos: number | null; quantidadeSessoes: number; compreensaoMinima: number; desempenhoMinimo: number };
  metodoMaiorCompreensao: ResultadoContextoAprendizagem | null;
  formatoMaiorCompreensao: ResultadoContextoAprendizagem | null;
};

export type ResumoAprendizagemSala = {
  moduloId: string;
  resumoResultados: ResumoResultadosSala & {
    evolucaoPercepcaoEvidencia: Array<Omit<EvolucaoPercepcaoEvidencia, "periodoInicio" | "periodoFim"> & { periodoInicio: string; periodoFim: string }>;
  };
  metodosResultados: ResultadoContextoAprendizagem[];
  formatosResultados: ResultadoContextoAprendizagem[];
  conceitosMaiorDificuldade: ClassificacaoConceitoAprendizagem[];
  conceitosMaiorCompreensao: ClassificacaoConceitoAprendizagem[];
};

type AnalisesParaSala = {
  resumoResultados: ResumoResultadosSala;
  evolucaoPercepcaoEvidencia: EvolucaoPercepcaoEvidencia[];
  metodosResultados: ResultadoContextoAprendizagem[];
  formatosResultados: ResultadoContextoAprendizagem[];
  conceitosMaiorDificuldade: ClassificacaoConceitoAprendizagem[];
  conceitosMaiorCompreensao: ClassificacaoConceitoAprendizagem[];
};

export function serializarResumoAprendizagemSala<T extends AnalisesParaSala>(analises: T, moduloId = "") : ResumoAprendizagemSala {
  return {
    moduloId,
    resumoResultados: {
      ...analises.resumoResultados,
      evolucaoPercepcaoEvidencia: analises.evolucaoPercepcaoEvidencia.map((ponto) => ({
        ...ponto,
        periodoInicio: ponto.periodoInicio.toISOString(),
        periodoFim: ponto.periodoFim.toISOString(),
      })),
    },
    metodosResultados: analises.metodosResultados,
    formatosResultados: analises.formatosResultados,
    conceitosMaiorDificuldade: analises.conceitosMaiorDificuldade,
    conceitosMaiorCompreensao: analises.conceitosMaiorCompreensao,
  };
}

export async function obterResumoAprendizagemVinculoSala(
  usuarioId: string,
  moduloPessoalId: string,
  moduloSalaId: string,
  dadosDesde: Date | null,
) {
  const aprendizagem = await obterAprendizagemModuloPessoal(usuarioId, moduloPessoalId, { inicio: dadosDesde, fim: new Date() });
  return aprendizagem ? serializarResumoAprendizagemSala(aprendizagem.analises, moduloSalaId) : null;
}
