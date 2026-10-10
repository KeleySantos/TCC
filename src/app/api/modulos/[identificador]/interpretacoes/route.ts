import { NextResponse } from "next/server";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { ErroInterpretacaoModulo, gerarInterpretacaoModuloPessoal } from "@/servidor/ia/interpretacoes";

export async function POST(requisicao: Request, contexto: { params: Promise<{ identificador: string }> }) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const { identificador } = await contexto.params;
  const url = new URL(requisicao.url);
  const inicio = url.searchParams.get("inicio") ?? undefined;
  const fim = url.searchParams.get("fim") ?? undefined;
  const periodo = resolverPeriodoModulo({ inicio, fim });
  if ((inicio || fim) && periodo.erro) return NextResponse.json({ erro: "PERIODO_INVALIDO" }, { status: 400 });
  try {
    const interpretacao = await gerarInterpretacaoModuloPessoal(acesso.usuario.id, identificador, { inicio: periodo.inicio, fim: periodo.fim });
    return NextResponse.json({ interpretacao }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    if (erro instanceof ErroInterpretacaoModulo) return NextResponse.json({ erro: "NAO_ENCONTRADO" }, { status: 404 });
    return NextResponse.json({ erro: "FALHA_INTERPRETACAO" }, { status: 500 });
  }
}
