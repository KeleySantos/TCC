import Link from "next/link";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { BotaoEnvio } from "../../botao-envio";
import { entrarEmSala } from "../../acoes";
import estilos from "../../page.module.css";

export default async function PaginaConviteSala({ params }: { params: Promise<{ codigo: string }> }) {
  const [usuario, { codigo }] = await Promise.all([exigirUsuario(), params]);
  return <EstruturaAutenticada usuarioNome={usuario.nome} administradorIa={usuario.administradorIa} usuarioFotoVersao={usuario.fotoPerfilAtualizadaEm?.toISOString()}><main className={estilos.paginaCentralizada} id="conteudo-principal" tabIndex={-1}><section className={estilos.painelConvite}><p className={estilos.sobretitulo}>CONVITE PARA SALA</p><h1>Entrar na sala</h1><p>Ao continuar, você passará a fazer parte desta sala imediatamente. Seus módulos e dados permanecem privados até você vincular uma instância à Sala.</p><form action={entrarEmSala}><input name="codigo" type="hidden" value={codigo} /><BotaoEnvio>Entrar na sala</BotaoEnvio></form><Link href="/salas">Voltar para Salas</Link></section></main></EstruturaAutenticada>;
}
