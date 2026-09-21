import { KeyRound, LockKeyhole, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { EstruturaAutenticada } from "@/componentes/estrutura-autenticada";
import { exigirUsuario } from "@/servidor/autenticacao";
import { listarConfiguracoesIaSeguras } from "@/servidor/ia/configuracoes";
import { alternarProvedorIa, removerChaveIa, salvarChaveIa, testarChaveIa, usarSomenteInterpretacaoLocal } from "./acoes";
import { BotaoEnvio } from "./botao-envio";
import estilos from "./page.module.css";

function rotuloEstado(estado: string | null) {
  if (estado === "FUNCIONANDO") return "Conexão verificada";
  if (estado === "AUTENTICACAO_INVALIDA") return "Chave recusada";
  if (estado === "LIMITADA") return "Limite temporário";
  if (estado === "INDISPONIVEL") return "Provedor indisponível";
  return "Ainda não testada";
}

function mensagem(parametros: { erro?: string; sucesso?: string; teste?: string }) {
  if (parametros.erro === "cofre") return { tipo: "erro", texto: "Não foi possível proteger a chave. Nenhum valor foi salvo." };
  if (parametros.erro) return { tipo: "erro", texto: "Não foi possível concluir essa operação." };
  if (parametros.teste === "FUNCIONANDO") return { tipo: "sucesso", texto: "A chave e o acesso ao modelo foram confirmados sem gerar conteúdo." };
  if (parametros.teste) return { tipo: "erro", texto: "O provedor não confirmou a conexão. Confira a chave, a região, a cota e o faturamento da conta." };
  if (parametros.sucesso === "local") return { tipo: "sucesso", texto: "Chamadas externas desativadas. As análises usarão somente a contingência local." };
  if (parametros.sucesso) return { tipo: "sucesso", texto: "Configuração atualizada com segurança." };
  return null;
}

export default async function PaginaConfiguracoesIa({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string; teste?: string; provedor?: string }> }) {
  const [usuario, parametros] = await Promise.all([exigirUsuario(), searchParams]);
  const configuracoes = await listarConfiguracoesIaSeguras(usuario.id);
  const aviso = mensagem(parametros);
  return <EstruturaAutenticada usuarioNome={usuario.nome}>
    <main className={estilos.pagina} id="conteudo-principal" tabIndex={-1}>
      <header className={estilos.cabecalho}><div><p>CONFIGURAÇÕES</p><h1>Provedores de IA</h1><span>Fila fixa: Groq → Gemini → Qwen → resposta local.</span></div><div className={estilos.seloSeguro}><ShieldCheck aria-hidden="true" />Cofre local criptografado</div></header>
      {aviso && <p className={aviso.tipo === "erro" ? "mensagem-erro" : "mensagem-sucesso"} role={aviso.tipo === "erro" ? "alert" : "status"}>{aviso.texto}</p>}

      <section className={estilos.avisoSeguranca} aria-labelledby="titulo-seguranca-chave"><LockKeyhole aria-hidden="true" /><div><h2 id="titulo-seguranca-chave">Suas chaves não são recuperáveis pela interface</h2><p>Depois de salvas, elas ficam cifradas e nunca retornam ao navegador, aos logs ou ao Git. Uma chave só é enviada por HTTPS ao próprio provedor quando você solicita uma análise ou clica em testar.</p><strong>Para garantir custo zero, mantenha o faturamento automático desativado também na conta de cada provedor.</strong></div></section>

      <div className={estilos.lista}>
        {configuracoes.map((configuracao) => <article className={estilos.provedor} key={configuracao.provedor}>
          <header><span className={estilos.prioridade}>{configuracao.prioridade}</span><div><h2>{configuracao.nome}</h2><p>{configuracao.modelo}</p></div><span className={`${estilos.estado} ${configuracao.ativa ? estilos.ativo : ""}`}>{configuracao.configurada ? configuracao.ativa ? "Ativo" : "Desativado" : "Não configurado"}</span></header>
          <p>{configuracao.descricao}</p>
          <div className={estilos.detalhes}><span>{configuracao.estadoUltimoTeste === "FUNCIONANDO" ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}{rotuloEstado(configuracao.estadoUltimoTeste)}</span>{configuracao.bloqueadaAte && configuracao.bloqueadaAte > new Date() && <small>Em espera automática até {configuracao.bloqueadaAte.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</small>}</div>
          <form action={salvarChaveIa} className={estilos.formularioChave}>
            <input name="provedor" type="hidden" value={configuracao.provedor} />
            <label htmlFor={`chave-${configuracao.provedor}`}>{configuracao.configurada ? "Substituir API Key" : "API Key"}</label>
            <div><input autoCapitalize="none" autoComplete="new-password" id={`chave-${configuracao.provedor}`} maxLength={500} minLength={10} name="chave" placeholder="Cole a chave somente neste campo" required spellCheck={false} type="password" /><BotaoEnvio processando="Protegendo...">{configuracao.configurada ? "Substituir" : "Salvar com criptografia"}</BotaoEnvio></div>
          </form>
          {configuracao.configurada && <div className={estilos.acoes}>
            <form action={testarChaveIa}><input name="provedor" type="hidden" value={configuracao.provedor} /><BotaoEnvio processando="Testando...">Testar conexão</BotaoEnvio></form>
            <form action={alternarProvedorIa}><input name="provedor" type="hidden" value={configuracao.provedor} /><input name="ativa" type="hidden" value={configuracao.ativa ? "nao" : "sim"} /><BotaoEnvio>{configuracao.ativa ? "Desativar" : "Ativar"}</BotaoEnvio></form>
            <form action={removerChaveIa}><input name="provedor" type="hidden" value={configuracao.provedor} /><BotaoEnvio className={estilos.remover} processando="Removendo...">Remover chave</BotaoEnvio></form>
          </div>}
        </article>)}
      </div>

      <section className={estilos.contingencia}><div><KeyRound aria-hidden="true" /><div><h2>Usar somente análise local</h2><p>Desativa os três provedores sem apagar as chaves cifradas. Você poderá reativá-los individualmente depois.</p></div></div><form action={usarSomenteInterpretacaoLocal}><BotaoEnvio>Desativar chamadas externas</BotaoEnvio></form></section>
    </main>
  </EstruturaAutenticada>;
}
