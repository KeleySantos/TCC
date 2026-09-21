import type { MetodoEstudo, SituacaoSessao } from "@/gerado/prisma/enums";
import { classificarAmostraSessoes, type NivelAmostraSessao } from "./metricas-sessoes";

export const VERSAO_COMPARACAO_DESAFIO = "comparacao-desafio-v2-sessoes";

export type DesafioParaComparacao = { id: string; moduloId: string; metodo: MetodoEstudo };

export type SessaoParaComparacaoDesafio = {
  id: string;
  moduloId: string;
  desafioId: string | null;
  encerradaEm: Date | null;
  duracaoMinutos: number | null;
  situacao: SituacaoSessao;
  dificuldadePercebida: number | null;
  compreensaoPercebida: number | null;
  metodos: MetodoEstudo[];
};

export type GrupoComparacaoDesafio = {
  quantidadeSessoes: number;
  minutosTotais: number;
  mediaDuracaoMinutos: number | null;
  mediaDificuldadePercebida: number | null;
  mediaCompreensaoPercebida: number | null;
  nivelAmostra: NivelAmostraSessao;
  periodoInicio: Date | null;
  periodoFim: Date | null;
};

export type ComparacaoDesafio = {
  desafioId: string;
  moduloId: string;
  metodo: MetodoEstudo;
  desafio: GrupoComparacaoDesafio;
  contextoExterno: GrupoComparacaoDesafio;
  diferencaDuracaoMedia: number | null;
  diferencaDificuldadePercebida: number | null;
  diferencaCompreensaoPercebida: number | null;
  comparavel: boolean;
  versaoAlgoritmo: string;
  limitacao: string;
};

type SessaoValida = SessaoParaComparacaoDesafio & {
  encerradaEm: Date;
  duracaoMinutos: number;
  dificuldadePercebida: number;
  compreensaoPercebida: number;
};

function media(valores: number[]) {
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

function sessaoValida(sessao: SessaoParaComparacaoDesafio): sessao is SessaoValida {
  return sessao.situacao === "CONCLUIDA"
    && sessao.encerradaEm !== null
    && sessao.duracaoMinutos !== null
    && sessao.duracaoMinutos >= 5
    && sessao.dificuldadePercebida !== null
    && sessao.compreensaoPercebida !== null;
}

function resumirGrupo(sessoes: SessaoValida[]): GrupoComparacaoDesafio {
  const ordenadas = [...sessoes].sort((a, b) => a.encerradaEm.getTime() - b.encerradaEm.getTime() || a.id.localeCompare(b.id));
  const quantidadeSessoes = ordenadas.length;
  const publicarMedias = quantidadeSessoes >= 2;
  const minutosTotais = ordenadas.reduce((soma, sessao) => soma + sessao.duracaoMinutos, 0);
  return {
    quantidadeSessoes,
    minutosTotais,
    mediaDuracaoMinutos: publicarMedias ? minutosTotais / quantidadeSessoes : null,
    mediaDificuldadePercebida: publicarMedias ? media(ordenadas.map((sessao) => sessao.dificuldadePercebida)) : null,
    mediaCompreensaoPercebida: publicarMedias ? media(ordenadas.map((sessao) => sessao.compreensaoPercebida)) : null,
    nivelAmostra: classificarAmostraSessoes(quantidadeSessoes),
    periodoInicio: ordenadas[0]?.encerradaEm ?? null,
    periodoFim: ordenadas.at(-1)?.encerradaEm ?? null,
  };
}

export function calcularComparacaoDesafio(desafio: DesafioParaComparacao, sessoes: SessaoParaComparacaoDesafio[]): ComparacaoDesafio {
  const sessoesDoMetodo = sessoes
    .filter((sessao) => sessao.moduloId === desafio.moduloId && sessao.metodos.includes(desafio.metodo))
    .filter(sessaoValida);
  const grupoDesafio = resumirGrupo(sessoesDoMetodo.filter((sessao) => sessao.desafioId === desafio.id));
  const grupoContextoExterno = resumirGrupo(sessoesDoMetodo.filter((sessao) => sessao.desafioId === null));
  const comparavel = grupoDesafio.mediaDuracaoMinutos !== null && grupoContextoExterno.mediaDuracaoMinutos !== null;
  return {
    desafioId: desafio.id,
    moduloId: desafio.moduloId,
    metodo: desafio.metodo,
    desafio: grupoDesafio,
    contextoExterno: grupoContextoExterno,
    diferencaDuracaoMedia: comparavel ? grupoDesafio.mediaDuracaoMinutos! - grupoContextoExterno.mediaDuracaoMinutos! : null,
    diferencaDificuldadePercebida: comparavel ? grupoDesafio.mediaDificuldadePercebida! - grupoContextoExterno.mediaDificuldadePercebida! : null,
    diferencaCompreensaoPercebida: comparavel ? grupoDesafio.mediaCompreensaoPercebida! - grupoContextoExterno.mediaCompreensaoPercebida! : null,
    comparavel,
    versaoAlgoritmo: VERSAO_COMPARACAO_DESAFIO,
    limitacao: "A comparação descreve duração e percepções registradas nas sessões; não mede aprendizagem objetiva nem demonstra efeito causal do método.",
  };
}
