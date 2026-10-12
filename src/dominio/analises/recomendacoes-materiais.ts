export type ConceitoRecomendacao = {
  id: string; nome: string; desempenhoMedio: number | null; compreensaoMedia: number | null;
  dificuldadeMedia: number | null; evidencias: number;
};
export type MaterialElegivelRecomendacao = {
  id: string; titulo: string; usuarioId: string; moduloId: string; disponivel: boolean; conceitoIds: string[];
};
export type RecomendacaoMaterial = {
  tipo: "MATERIAL" | "EXPLORACAO" | "SEM_MATERIAL";
  moduloId: string; conceitoId: string | null; materialId: string | null; tituloMaterial: string | null;
  regraId: "RM-01" | "RM-02" | "RM-03"; indicadoresUtilizados: ConceitoRecomendacao | null;
  tamanhoAmostra: number; justificativaEstruturada: string; limitacoes: string[];
  nivelEvidencia: "LIMITADA" | "DESCRITIVA";
};
export function recomendarMateriais(entrada: {
  usuarioId: string; moduloId: string; conceitos: ConceitoRecomendacao[]; materiais: MaterialElegivelRecomendacao[];
}): RecomendacaoMaterial[] {
  const limitacoes = [
    "Associações observacionais não demonstram causalidade nem domínio.",
    "Não há controle de dificuldade das atividades; nenhum formato ou método é declarado superior.",
    "A amostra conta evidências distintas do conceito, não sessões nem referências textuais.",
  ];
  const prioridade = (conceito: ConceitoRecomendacao) => conceito.desempenhoMedio !== null && conceito.desempenhoMedio < 70 ? 0 : 1;
  const conceitos = entrada.conceitos.filter((conceito) =>
    (conceito.desempenhoMedio !== null && conceito.desempenhoMedio < 70) ||
    (conceito.compreensaoMedia !== null && conceito.compreensaoMedia < 3) ||
    (conceito.dificuldadeMedia !== null && conceito.dificuldadeMedia >= 3),
  ).sort((a, b) => prioridade(a) - prioridade(b) || (a.desempenhoMedio ?? 100) - (b.desempenhoMedio ?? 100) || a.id.localeCompare(b.id));
  if (!conceitos.length) return [{
    tipo: "EXPLORACAO", moduloId: entrada.moduloId, conceitoId: null, materialId: null, tituloMaterial: null,
    regraId: "RM-03", indicadoresUtilizados: null, tamanhoAmostra: 0, nivelEvidencia: "LIMITADA", limitacoes,
    justificativaEstruturada: "Sem sinais suficientes para selecionar um material. Registre uma sessão e uma evidência de desempenho; a exploração inicial não define preferência de aprendizagem.",
  }];
  const materiaisSelecionados = new Set<string>();
  return conceitos.slice(0, 3).map((conceito) => {
    const material = entrada.materiais.filter((item) => !materiaisSelecionados.has(item.id) && item.disponivel && item.usuarioId === entrada.usuarioId && item.moduloId === entrada.moduloId && item.conceitoIds.includes(conceito.id))
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    if (material) materiaisSelecionados.add(material.id);
    return {
      tipo: material ? "MATERIAL" : "SEM_MATERIAL", moduloId: entrada.moduloId, conceitoId: conceito.id,
      materialId: material?.id ?? null, tituloMaterial: material?.titulo ?? null, regraId: material ? "RM-01" : "RM-02",
      indicadoresUtilizados: conceito, tamanhoAmostra: conceito.evidencias,
      nivelEvidencia: conceito.evidencias >= 3 ? "DESCRITIVA" : "LIMITADA", limitacoes,
      justificativaEstruturada: material
        ? `Revisão exploratória de ${conceito.nome}: há sinais de atenção neste módulo. O material aborda o conceito; sua seleção não indica superioridade de formato.`
        : `Não há material elegível para ${conceito.nome}. Revise o conceito e registre nova evidência de desempenho.`,
    };
  });
}
