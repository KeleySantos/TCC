import Link from "next/link";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { BotaoEnvio } from "../../botao-envio";
import { pedirEntradaSala } from "../../acoes";
import estilos from "../../page.module.css";

export default async function PaginaConviteSala({ params }: { params: Promise<{ codigo: string }> }) {
  const [usuario, { codigo }] = await Promise.all([exigirUsuario(), params]);
  return <EstruturaAutenticada usuarioNome={usuario.nome}><main className={estilos.paginaCentralizada} id="conteudo-principal" tabIndex={-1}><section className={estilos.painelConvite}><p className={estilos.sobretitulo}>CONVITE PARA SALA</p><h1>Solicitar participação</h1><p>O proprietário precisará aprovar sua entrada. Seus módulos e dados continuam privados até você vincular uma instância e autorizar o dashboard.</p><form action={pedirEntradaSala}><input name="codigo" type="hidden" value={codigo} /><BotaoEnvio>Enviar solicitação</BotaoEnvio></form><Link href="/salas">Voltar para Salas</Link></section></main></EstruturaAutenticada>;
}
