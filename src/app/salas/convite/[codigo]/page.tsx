import Link from "next/link";
import { notFound } from "next/navigation";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { obterContextoConviteModuloSala } from "@/servidor/salas";
import { BotaoEnvio } from "../../botao-envio";
import { entrarEmSala } from "../../acoes";
import estilos from "../../page.module.css";

export default async function PaginaConviteSala({ params }: { params: Promise<{ codigo: string }> }) {
  const [usuario, { codigo }] = await Promise.all([exigirUsuario(), params]);
  const contexto = await obterContextoConviteModuloSala(codigo);
  if (!contexto) notFound();
  return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}><main className={estilos.paginaCentralizada} id="conteudo-principal" tabIndex={-1}><section className={estilos.painelConvite}><p className={estilos.sobretitulo}>CONVITE PARA MÓDULO</p><h1>Acessar {contexto.tituloModulo}</h1><p>Este módulo pertence à Sala {contexto.nomeSala}. O convite autoriza somente este módulo; no primeiro acesso, você poderá criar ou vincular sua instância pessoal.</p><form action={entrarEmSala}><input name="codigo" type="hidden" value={codigo} /><BotaoEnvio>Acessar módulo</BotaoEnvio></form><Link href="/salas">Voltar para Salas</Link></section></main></EstruturaAutenticada>;
}
