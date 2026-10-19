import Link from "next/link";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { resolverPeriodoModulo } from "@/dominio/periodo-modulo";
import { exigirUsuario } from "@/servidor/autenticacao";
import { ErroCompartilhamentoModulo } from "@/servidor/compartilhamento-modulos";
import { obterDashboardCompartilhado } from "@/servidor/dashboard-compartilhado";
import { DashboardCompartilhado } from "./dashboard-compartilhado";
import estilos from "@/app/modulos/[identificador]/page.module.css";

export default async function PaginaModuloCompartilhado({ params, searchParams }: { params: Promise<{ moduloId: string }>; searchParams: Promise<{ inicio?: string | string[]; fim?: string | string[] }> }) {
  const [usuario, { moduloId }, parametros] = await Promise.all([exigirUsuario(), params, searchParams]);
  const periodo = resolverPeriodoModulo(parametros);
  let dados;
  try { dados = await obterDashboardCompartilhado(usuario.id, moduloId, { inicio: periodo.inicio, fim: periodo.fim }); }
  catch (erro) { if (!(erro instanceof ErroCompartilhamentoModulo)) throw erro; }
  return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}>
    <main className={estilos.paginaModulo} id="conteudo-principal" tabIndex={-1}>
      {dados ? <DashboardCompartilhado inicial={dados} key={`${moduloId}-${periodo.inicioTexto}-${periodo.fimTexto}`} periodo={{ inicio: periodo.inicioTexto, fim: periodo.fimTexto, hoje: periodo.hoje, ativo: periodo.ativo, erro: periodo.erro }} /> : <section><h1>Dashboard indisponível</h1><p role="alert">Você não possui acesso ativo a este dashboard.</p><Link href="/salas?aba=compartilhado-comigo">Voltar a Compartilhado comigo</Link></section>}
    </main>
  </EstruturaAutenticada>;
}
