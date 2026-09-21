"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Archive, CalendarClock, CheckCircle2, Pencil, Play, Plus, RotateCcw, Timer, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { METODOS_ESTUDO } from "@/dominio/sessoes/metodos";
import estilos from "./painel-sessoes.module.css";

type MaterialSessao = { id: string; titulo: string };

export type SessaoModulo = {
  id: string;
  descricao: string;
  modoRegistro: "MANUAL" | "CRONOMETRO";
  dificuldadePercebida: number | null;
  compreensaoPercebida: number | null;
  iniciadaEm: string;
  encerradaEm: string | null;
  duracaoMinutos: number | null;
  situacao: "PLANEJADA" | "ATIVA" | "CONCLUIDA" | "ABANDONADA" | "INVALIDADA";
  arquivada: boolean;
  metodos: { metodo: string }[];
  formatos: { formato: string }[];
  materiais: { recurso: MaterialSessao }[];
};

type Propriedades = {
  moduloId: string;
  sessoesIniciais: SessaoModulo[];
  materiais: MaterialSessao[];
  agoraIso: string;
};

const FORMATOS = [
  ["TEXTO", "Texto"], ["PDF", "PDF"], ["VIDEO", "Vídeo"], ["AUDIO", "Áudio"],
  ["IMAGEM", "Imagem"], ["DOCUMENTO", "Documento"], ["PLANILHA", "Planilha"],
  ["MAPA_MENTAL", "Mapa mental"], ["PODCAST", "Podcast"], ["QUIZ", "Quiz"],
  ["EXERCICIO_PRATICO", "Exercício prático"],
] as const;

const ROTULOS_SITUACAO: Record<SessaoModulo["situacao"], string> = {
  PLANEJADA: "Planejada",
  ATIVA: "Em andamento",
  CONCLUIDA: "Concluída",
  ABANDONADA: "Abandonada",
  INVALIDADA: "Inválida",
};

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor));
}

function formatarDuracao(minutos: number | null) {
  if (minutos === null) return "Em andamento";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;
  return restantes ? `${horas}h ${restantes}min` : `${horas}h`;
}

function paraDataLocal(valor: string) {
  const data = new Date(valor);
  const parte = (numero: number) => String(numero).padStart(2, "0");
  return `${data.getFullYear()}-${parte(data.getMonth() + 1)}-${parte(data.getDate())}T${parte(data.getHours())}:${parte(data.getMinutes())}`;
}

function obterMensagemErro(dados: unknown) {
  return dados && typeof dados === "object" && "erro" in dados && typeof dados.erro === "string" ? dados.erro : "Não foi possível concluir a operação.";
}

function selecionarValores(formulario: FormData, nome: string) {
  return formulario.getAll(nome).filter((valor): valor is string => typeof valor === "string");
}

function OpcoesContexto({ materiais, sessao, prefixo, desabilitado }: { materiais: MaterialSessao[]; sessao?: SessaoModulo; prefixo: string; desabilitado: boolean }) {
  const metodosAtuais = new Set(sessao?.metodos.map((item) => item.metodo));
  const formatosAtuais = new Set(sessao?.formatos.map((item) => item.formato));
  const materiaisAtuais = new Set(sessao?.materiais.map((item) => item.recurso.id));
  return <>
    <fieldset className={estilos.grupoOpcoes} disabled={desabilitado}>
      <legend>Métodos de estudo</legend>
      <p>Marque pelo menos um método utilizado.</p>
      <div className={estilos.opcoes}>{METODOS_ESTUDO.map((item) => <label key={item.valor} htmlFor={`${prefixo}-metodo-${item.valor}`}><input defaultChecked={metodosAtuais.has(item.valor)} id={`${prefixo}-metodo-${item.valor}`} name="metodos" type="checkbox" value={item.valor} /><span>{item.rotulo}</span></label>)}</div>
    </fieldset>
    <fieldset className={estilos.grupoOpcoes} disabled={desabilitado}>
      <legend>Formatos utilizados</legend>
      <p>Informe como o conteúdo foi estudado, mesmo sem material cadastrado.</p>
      <div className={estilos.opcoes}>{FORMATOS.map(([valor, rotulo]) => <label key={valor} htmlFor={`${prefixo}-formato-${valor}`}><input defaultChecked={formatosAtuais.has(valor)} id={`${prefixo}-formato-${valor}`} name="formatos" type="checkbox" value={valor} /><span>{rotulo}</span></label>)}</div>
    </fieldset>
    {materiais.length > 0 && <fieldset className={estilos.grupoOpcoes} disabled={desabilitado}>
      <legend>Materiais vinculados <small>opcional</small></legend>
      <p>A sessão também pode ser registrada sem selecionar materiais.</p>
      <div className={estilos.opcoes}>{materiais.map((material) => <label key={material.id} htmlFor={`${prefixo}-material-${material.id}`}><input defaultChecked={materiaisAtuais.has(material.id)} id={`${prefixo}-material-${material.id}`} name="materialIds" type="checkbox" value={material.id} /><span>{material.titulo}</span></label>)}</div>
    </fieldset>}
  </>;
}

function EscalasPercebidas({ prefixo, sessao, obrigatorias = true, desabilitado }: { prefixo: string; sessao?: SessaoModulo; obrigatorias?: boolean; desabilitado: boolean }) {
  return <div className={estilos.gradeEscalas}>
    <label htmlFor={`${prefixo}-dificuldade`}>Dificuldade percebida
      <select defaultValue={sessao?.dificuldadePercebida ?? ""} disabled={desabilitado} id={`${prefixo}-dificuldade`} name="dificuldadePercebida" required={obrigatorias}><option value="">Selecione</option>{[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor} — {valor === 1 ? "muito baixa" : valor === 5 ? "muito alta" : ""}</option>)}</select>
    </label>
    <label htmlFor={`${prefixo}-compreensao`}>Compreensão percebida
      <select defaultValue={sessao?.compreensaoPercebida ?? ""} disabled={desabilitado} id={`${prefixo}-compreensao`} name="compreensaoPercebida" required={obrigatorias}><option value="">Selecione</option>{[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor} — {valor === 1 ? "muito baixa" : valor === 5 ? "muito alta" : ""}</option>)}</select>
    </label>
  </div>;
}

function FormularioRegistro({ tipo, moduloId, materiais, sessao, processando, agora, aoCancelar, aoSalvar }: {
  tipo: "MANUAL" | "CRONOMETRO" | "EDICAO";
  moduloId: string;
  materiais: MaterialSessao[];
  sessao?: SessaoModulo;
  processando: boolean;
  agora: number;
  aoCancelar: () => void;
  aoSalvar: (entrada: Record<string, unknown>) => Promise<void>;
}) {
  const prefixo = `${tipo.toLowerCase()}-${sessao?.id ?? "nova"}`;
  const foco = useRef<HTMLTextAreaElement>(null);
  const [inicio, definirInicio] = useState(sessao ? paraDataLocal(sessao.iniciadaEm) : "");
  const [fim, definirFim] = useState(sessao?.encerradaEm ? paraDataLocal(sessao.encerradaEm) : "");
  const planejada = tipo !== "CRONOMETRO" && Boolean(inicio && fim && (new Date(inicio).getTime() > agora || new Date(fim).getTime() > agora));

  useEffect(() => { foco.current?.focus(); }, []);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const metodos = selecionarValores(formulario, "metodos");
    const formatos = selecionarValores(formulario, "formatos");
    if (!metodos.length || !formatos.length) return aoSalvar({ erroLocal: "Selecione pelo menos um método e um formato." });
    const entrada: Record<string, unknown> = {
      descricao: formulario.get("descricao"), metodos, formatos, materialIds: selecionarValores(formulario, "materialIds"),
    };
    if (tipo !== "EDICAO") entrada.moduloId = moduloId;
    if (tipo !== "CRONOMETRO") {
      const inicioInformado = formulario.get("iniciadaEm");
      const fimInformado = formulario.get("encerradaEm");
      if (typeof inicioInformado !== "string" || typeof fimInformado !== "string" || !inicioInformado || !fimInformado) return aoSalvar({ erroLocal: "Informe o início e o fim da sessão." });
      const inicioUtc = new Date(inicioInformado);
      const fimUtc = new Date(fimInformado);
      if (Number.isNaN(inicioUtc.getTime()) || Number.isNaN(fimUtc.getTime())) return aoSalvar({ erroLocal: "Informe um período válido." });
      entrada.iniciadaEm = inicioUtc.toISOString();
      entrada.encerradaEm = fimUtc.toISOString();
      const planejadaNoEnvio = inicioUtc.getTime() > agora || fimUtc.getTime() > agora;
      if (!planejadaNoEnvio) {
        entrada.dificuldadePercebida = formulario.get("dificuldadePercebida");
        entrada.compreensaoPercebida = formulario.get("compreensaoPercebida");
      }
    }
    await aoSalvar(entrada);
  };

  return <form className={estilos.formulario} onSubmit={enviar}>
    <div className={estilos.cabecalhoFormulario}><div><span>{tipo === "CRONOMETRO" ? "CRONÔMETRO" : tipo === "EDICAO" ? "CORREÇÃO" : "REGISTRO MANUAL"}</span><h3>{tipo === "CRONOMETRO" ? "Iniciar uma sessão agora" : tipo === "EDICAO" ? "Editar sessão" : "Registrar ou planejar sessão"}</h3></div><button aria-label="Fechar formulário" disabled={processando} onClick={aoCancelar} type="button"><X aria-hidden="true" /></button></div>
    <label className={estilos.campoLargo} htmlFor={`${prefixo}-descricao`}>O que você está estudando?
      <textarea defaultValue={sessao?.descricao} disabled={processando} id={`${prefixo}-descricao`} maxLength={2000} minLength={3} name="descricao" placeholder="Descreva os conteúdos ou atividades desta sessão." ref={foco} required rows={4} />
      <small>Entre 3 e 2.000 caracteres.</small>
    </label>
    {tipo !== "CRONOMETRO" && <div className={estilos.gradeDatas}>
      <label htmlFor={`${prefixo}-inicio`}>Início<input defaultValue={inicio} disabled={processando} id={`${prefixo}-inicio`} name="iniciadaEm" onChange={(evento) => definirInicio(evento.target.value)} required type="datetime-local" /></label>
      <label htmlFor={`${prefixo}-fim`}>Fim<input defaultValue={fim} disabled={processando} id={`${prefixo}-fim`} name="encerradaEm" onChange={(evento) => definirFim(evento.target.value)} required type="datetime-local" /></label>
    </div>}
    {tipo !== "CRONOMETRO" && <p className={estilos.avisoPlanejamento}>{planejada ? "Como o período está no futuro, a sessão será salva como planejada e as percepções serão preenchidas na conclusão." : "A duração será calculada automaticamente. Sessões concluídas exigem as duas percepções."}</p>}
    <OpcoesContexto desabilitado={processando} materiais={materiais} prefixo={prefixo} sessao={sessao} />
    {tipo !== "CRONOMETRO" && !planejada && <EscalasPercebidas desabilitado={processando} prefixo={prefixo} sessao={sessao} />}
    <div className={estilos.acoesFormulario}><button disabled={processando} onClick={aoCancelar} type="button">Cancelar</button><button aria-busy={processando} className={estilos.primario} disabled={processando} type="submit">{processando ? "Salvando..." : tipo === "CRONOMETRO" ? "Iniciar agora" : tipo === "EDICAO" ? "Salvar alterações" : planejada ? "Planejar sessão" : "Registrar sessão"}</button></div>
  </form>;
}

function FormularioConclusao({ sessao, processando, aoCancelar, aoConcluir }: { sessao: SessaoModulo; processando: boolean; aoCancelar: () => void; aoConcluir: (entrada: Record<string, unknown>) => Promise<void> }) {
  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    await aoConcluir({ dificuldadePercebida: formulario.get("dificuldadePercebida"), compreensaoPercebida: formulario.get("compreensaoPercebida") });
  };
  return <form className={estilos.formularioConclusao} onSubmit={enviar}>
    <h4>Como foi esta sessão?</h4><p>As duas percepções são obrigatórias para concluir.</p>
    <EscalasPercebidas desabilitado={processando} prefixo={`conclusao-${sessao.id}`} sessao={sessao} />
    <div className={estilos.acoesFormulario}><button disabled={processando} onClick={aoCancelar} type="button">Cancelar</button><button className={estilos.primario} disabled={processando} type="submit">{processando ? "Concluindo..." : "Concluir sessão"}</button></div>
  </form>;
}

export function PainelSessoes({ moduloId, sessoesIniciais, materiais, agoraIso }: Propriedades) {
  const roteador = useRouter();
  const [sessoes, definirSessoes] = useState(sessoesIniciais);
  const [formulario, definirFormulario] = useState<"MANUAL" | "CRONOMETRO" | null>(null);
  const [edicaoId, definirEdicaoId] = useState<string | null>(null);
  const [conclusaoId, definirConclusaoId] = useState<string | null>(null);
  const [mostrarArquivadas, definirMostrarArquivadas] = useState(false);
  const [processando, definirProcessando] = useState<string | null>(null);
  const [mensagem, definirMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [agora, definirAgora] = useState(() => new Date(agoraIso).getTime());

  useEffect(() => {
    const atualizador = window.setInterval(() => definirAgora(Date.now()), 60_000);
    return () => window.clearInterval(atualizador);
  }, []);

  const atualizarNaLista = (sessao: SessaoModulo) => definirSessoes((atuais) => [sessao, ...atuais.filter((item) => item.id !== sessao.id)].sort((a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime()));

  const requisitar = async (chave: string, url: string, opcoes: RequestInit, sucesso: string) => {
    definirProcessando(chave); definirMensagem(null);
    try {
      const resposta = await fetch(url, opcoes);
      const dados: unknown = await resposta.json();
      if (!resposta.ok) throw new Error(obterMensagemErro(dados));
      if (!dados || typeof dados !== "object" || !("sessao" in dados)) throw new Error("O servidor não devolveu a sessão atualizada.");
      atualizarNaLista(dados.sessao as SessaoModulo);
      definirMensagem({ tipo: "sucesso", texto: sucesso });
      roteador.refresh();
      return true;
    } catch (erro) {
      definirMensagem({ tipo: "erro", texto: erro instanceof Error ? erro.message : "Não foi possível concluir a operação." });
      return false;
    } finally { definirProcessando(null); }
  };

  const salvarNova = async (tipo: "MANUAL" | "CRONOMETRO", entrada: Record<string, unknown>) => {
    if (typeof entrada.erroLocal === "string") return definirMensagem({ tipo: "erro", texto: entrada.erroLocal });
    const ok = await requisitar(`nova-${tipo}`, "/api/sessoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entrada, tipo }) }, tipo === "CRONOMETRO" ? "Sessão iniciada. Ela continuará disponível se você sair da página." : "Sessão salva com a duração calculada pelo servidor.");
    if (ok) definirFormulario(null);
  };

  const salvarEdicao = async (sessao: SessaoModulo, entrada: Record<string, unknown>) => {
    if (typeof entrada.erroLocal === "string") return definirMensagem({ tipo: "erro", texto: entrada.erroLocal });
    const ok = await requisitar(`editar-${sessao.id}`, `/api/sessoes/${encodeURIComponent(sessao.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entrada) }, "Sessão atualizada e duração recalculada.");
    if (ok) definirEdicaoId(null);
  };

  const concluir = async (sessao: SessaoModulo, entrada: Record<string, unknown>) => {
    const ok = await requisitar(`concluir-${sessao.id}`, `/api/sessoes/${encodeURIComponent(sessao.id)}/concluir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entrada) }, "Sessão concluída e incluída no histórico.");
    if (ok) definirConclusaoId(null);
  };

  const arquivar = async (sessao: SessaoModulo, arquivada: boolean) => {
    await requisitar(`${arquivada ? "arquivar" : "restaurar"}-${sessao.id}`, `/api/sessoes/${encodeURIComponent(sessao.id)}/${arquivada ? "arquivar" : "desarquivar"}`, { method: "POST" }, arquivada ? "Sessão arquivada. O registro foi preservado." : "Sessão restaurada no histórico.");
  };

  const sessoesVisiveis = sessoes.filter((sessao) => sessao.situacao !== "ATIVA" && (mostrarArquivadas || !sessao.arquivada));
  const sessaoAtiva = sessoes.find((sessao) => sessao.situacao === "ATIVA");
  const arquivadas = sessoes.filter((sessao) => sessao.arquivada).length;

  return <section className={estilos.painel} aria-labelledby="titulo-sessoes-modulo">
    <header className={estilos.cabecalho}>
      <div><p>ROTINA DE ESTUDO</p><h2 id="titulo-sessoes-modulo">Sessões de estudo</h2><span>Registre o que estudou, como estudou e por quanto tempo.</span></div>
      <div className={estilos.acoesPrincipais}>
        <button disabled={Boolean(sessaoAtiva) || processando !== null} onClick={() => { definirFormulario("CRONOMETRO"); definirEdicaoId(null); }} type="button"><Play aria-hidden="true" />Iniciar agora</button>
        <button className={estilos.primario} disabled={processando !== null} onClick={() => { definirFormulario("MANUAL"); definirEdicaoId(null); }} type="button"><Plus aria-hidden="true" />Registrar sessão</button>
      </div>
    </header>

    {mensagem && <p className={mensagem.tipo === "erro" ? estilos.mensagemErro : estilos.mensagemSucesso} role={mensagem.tipo === "erro" ? "alert" : "status"}>{mensagem.texto}</p>}

    {formulario && <FormularioRegistro agora={agora} aoCancelar={() => definirFormulario(null)} aoSalvar={(entrada) => salvarNova(formulario, entrada)} materiais={materiais} moduloId={moduloId} processando={processando === `nova-${formulario}`} tipo={formulario} />}

    {sessaoAtiva && <article className={estilos.sessaoAtiva}>
      <div className={estilos.iconeAtiva}><Timer aria-hidden="true" /></div><div className={estilos.conteudoAtiva}><span>SESSÃO EM ANDAMENTO</span><h3>{sessaoAtiva.descricao}</h3><p>Iniciada em {formatarDataHora(sessaoAtiva.iniciadaEm)}. A duração oficial será calculada ao encerrar.</p></div>
      <button className={estilos.primario} disabled={processando !== null} onClick={() => definirConclusaoId(conclusaoId === sessaoAtiva.id ? null : sessaoAtiva.id)} type="button">Encerrar sessão</button>
      {conclusaoId === sessaoAtiva.id && <FormularioConclusao aoCancelar={() => definirConclusaoId(null)} aoConcluir={(entrada) => concluir(sessaoAtiva, entrada)} processando={processando === `concluir-${sessaoAtiva.id}`} sessao={sessaoAtiva} />}
    </article>}

    <div className={estilos.barraHistorico}><div><h3>Histórico do módulo</h3><p>{sessoesVisiveis.length} sessão(ões) exibida(s)</p></div>{arquivadas > 0 && <label><input checked={mostrarArquivadas} onChange={(evento) => definirMostrarArquivadas(evento.target.checked)} type="checkbox" />Mostrar arquivadas ({arquivadas})</label>}</div>

    {sessoesVisiveis.length === 0 ? <div className={estilos.estadoVazio}><CalendarClock aria-hidden="true" /><h3>{sessaoAtiva ? "Sua primeira sessão está em andamento" : "Registre sua primeira sessão"}</h3><p>{sessaoAtiva ? "Ao encerrar o cronômetro, esta sessão aparecerá no histórico do módulo." : "Você pode informar uma sessão já concluída, planejar uma data futura ou iniciar o cronômetro agora."}</p>{!sessaoAtiva && <button className={estilos.primario} onClick={() => definirFormulario("MANUAL")} type="button"><Plus aria-hidden="true" />Criar primeira sessão</button>}</div> : <div className={estilos.lista}>
      {sessoesVisiveis.map((sessao) => <article className={`${estilos.cartao} ${sessao.arquivada ? estilos.cartaoArquivado : ""}`} key={sessao.id}>
        <div className={estilos.linhaPrincipal}><div className={estilos.dataSessao}><span>{formatarDataHora(sessao.iniciadaEm)}</span><strong>{formatarDuracao(sessao.duracaoMinutos)}</strong></div><div className={estilos.descricaoSessao}><div className={estilos.selose}><span data-situacao={sessao.situacao}>{ROTULOS_SITUACAO[sessao.situacao]}</span><span>{sessao.modoRegistro === "CRONOMETRO" ? "Cronômetro" : "Manual"}</span>{sessao.arquivada && <span>Arquivada</span>}</div><h3>{sessao.descricao}</h3><p>{sessao.encerradaEm ? `${formatarDataHora(sessao.iniciadaEm)} — ${formatarDataHora(sessao.encerradaEm)}` : `Iniciada em ${formatarDataHora(sessao.iniciadaEm)}`}</p></div></div>
        <div className={estilos.contextos}><span><b>Métodos:</b> {sessao.metodos.map((item) => METODOS_ESTUDO.find((metodo) => metodo.valor === item.metodo)?.rotulo ?? item.metodo).join(", ")}</span><span><b>Formatos:</b> {sessao.formatos.map((item) => FORMATOS.find(([valor]) => valor === item.formato)?.[1] ?? item.formato).join(", ")}</span>{sessao.materiais.length > 0 && <span><b>Materiais:</b> {sessao.materiais.map((item) => item.recurso.titulo).join(", ")}</span>}{sessao.dificuldadePercebida !== null && <span><b>Percepções:</b> dificuldade {sessao.dificuldadePercebida}/5 · compreensão {sessao.compreensaoPercebida}/5</span>}</div>
        {sessao.situacao !== "ATIVA" && <div className={estilos.acoesCartao}>
          {(sessao.situacao === "PLANEJADA" || sessao.situacao === "CONCLUIDA" || sessao.situacao === "INVALIDADA") && <button disabled={processando !== null} onClick={() => { definirEdicaoId(edicaoId === sessao.id ? null : sessao.id); definirFormulario(null); }} type="button"><Pencil aria-hidden="true" />Editar</button>}
          {sessao.situacao === "PLANEJADA" && sessao.encerradaEm && new Date(sessao.encerradaEm).getTime() <= agora && <button disabled={processando !== null} onClick={() => definirConclusaoId(conclusaoId === sessao.id ? null : sessao.id)} type="button"><CheckCircle2 aria-hidden="true" />Concluir</button>}
          <button disabled={processando !== null} onClick={() => arquivar(sessao, !sessao.arquivada)} type="button">{sessao.arquivada ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}{sessao.arquivada ? "Restaurar" : "Arquivar"}</button>
        </div>}
        {conclusaoId === sessao.id && <FormularioConclusao aoCancelar={() => definirConclusaoId(null)} aoConcluir={(entrada) => concluir(sessao, entrada)} processando={processando === `concluir-${sessao.id}`} sessao={sessao} />}
        {edicaoId === sessao.id && <FormularioRegistro agora={agora} aoCancelar={() => definirEdicaoId(null)} aoSalvar={(entrada) => salvarEdicao(sessao, entrada)} materiais={materiais} moduloId={moduloId} processando={processando === `editar-${sessao.id}`} sessao={sessao} tipo="EDICAO" />}
      </article>)}
    </div>}
  </section>;
}
