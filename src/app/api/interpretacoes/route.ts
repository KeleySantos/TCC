import { NextResponse } from "next/server";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { autorizarUsuarioNaApi } from "@/servidor/autorizacao";
import { obterUsuarioAtual } from "@/servidor/autenticacao";
import { gerarInterpretacaoPessoal } from "@/servidor/ia/interpretacoes";

export async function POST(requisicao: Request) {
  const acesso = autorizarUsuarioNaApi(await obterUsuarioAtual());
  if (!acesso.permitido) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  const url = new URL(requisicao.url);
  const inicio = url.searchParams.get("inicio") ?? undefined;
  const fim = url.searchParams.get("fim") ?? undefined;
  const periodo = resolverPeriodoModulo({ inicio, fim });
  if ((inicio || fim) && periodo.erro) return NextResponse.json({ erro: "PERIODO_INVALIDO" }, { status: 400 });
  const interpretacao = await gerarInterpretacaoPessoal(acesso.usuario.id, { inicio: periodo.inicio, fim: periodo.fim });
  return NextResponse.json({ interpretacao }, { headers: { "Cache-Control": "no-store" } });
}
