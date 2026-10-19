import type { DtoInterpretacao, InterpretacaoGerada } from "@/dominio/interpretacoes/esquema";
import { obterAprendizagemModuloPessoal } from "../aprendizagem-modulo";
import { ErroCompartilhamentoModulo, exigirAcessoDashboardCompartilhado, type PeriodoCompartilhado } from "../compartilhamento-modulos";
import { obterMetricasSessoesModuloPessoal } from "../metricas";
import { criarDtoInterpretacaoModulo, interpretarDtoAutorizado } from "./interpretacoes";

export async function criarDtoCompartilhado(convidadoId: string, moduloId: string, periodo: PeriodoCompartilhado = {}): Promise<DtoInterpretacao> {
  const acesso = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  const [resultado, aprendizagem] = await Promise.all([
    obterMetricasSessoesModuloPessoal(acesso.proprietarioId, acesso.identificador, periodo),
    obterAprendizagemModuloPessoal(acesso.proprietarioId, moduloId, periodo),
  ]);
  if (!resultado || !aprendizagem) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  // Nenhum evento com título privado, recomendação de material ou descrição sai neste DTO.
  return criarDtoInterpretacaoModulo(resultado.metricas, [], { ...aprendizagem, linhaDoTempo: [], evidencias: [], recomendacoes: [] });
}

export async function gerarInterpretacaoCompartilhada(
  convidadoId: string,
  moduloId: string,
  periodo: PeriodoCompartilhado = {},
  interpretar: (solicitanteId: string, dto: DtoInterpretacao) => Promise<InterpretacaoGerada> = interpretarDtoAutorizado,
) {
  const inicial = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  const dto = await criarDtoCompartilhado(convidadoId, moduloId, periodo);
  const antesDoProvedor = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  if (inicial.versaoAcesso !== antesDoProvedor.versaoAcesso) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  const resposta = await interpretar(convidadoId, dto);
  const final = await exigirAcessoDashboardCompartilhado(convidadoId, moduloId);
  if (inicial.versaoAcesso !== final.versaoAcesso) throw new ErroCompartilhamentoModulo("ACESSO_REVOGADO");
  return resposta;
}
