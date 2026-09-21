"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { RefreshCw, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import estilos from "./page.module.css";

const ACEITOS = ".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.doc,.docx,.odt,.csv,.xls,.xlsx,.ods,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov";

export function AcoesArquivoMaterial({ materialId, podeAnalisar, situacao }: { materialId: string; podeAnalisar: boolean; situacao: string }) {
  const roteador = useRouter();
  const seletor = useRef<HTMLInputElement>(null);
  const [processando, definirProcessando] = useState(false);
  const [mensagem, definirMensagem] = useState<string | null>(null);

  async function analisar() {
    definirProcessando(true); definirMensagem("Analisando material...");
    const resposta = await fetch(`/api/materiais/${encodeURIComponent(materialId)}/analise`, { method: "POST" }).catch(() => null);
    definirMensagem(resposta?.ok ? "Análise atualizada." : "A análise continuará pendente para uma nova tentativa.");
    definirProcessando(false); roteador.refresh();
  }

  async function substituir(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    definirProcessando(true); definirMensagem("Substituindo arquivo...");
    const dados = new FormData(); dados.set("arquivo", arquivo);
    const resposta = await fetch(`/api/materiais/${encodeURIComponent(materialId)}/arquivo/substituir`, { method: "POST", body: dados }).catch(() => null);
    if (resposta?.ok) {
      const corpo = await resposta.json() as { analisar?: boolean };
      definirMensagem("Arquivo substituído. Preparando nova análise...");
      if (corpo.analisar) await fetch(`/api/materiais/${encodeURIComponent(materialId)}/analise`, { method: "POST" }).catch(() => null);
    } else definirMensagem("Não foi possível substituir o arquivo.");
    definirProcessando(false); evento.target.value = ""; roteador.refresh();
  }

  async function excluir() {
    if (!window.confirm("Excluir permanentemente este material, seu arquivo e sua análise? Esta ação não pode ser desfeita.")) return;
    definirProcessando(true);
    const resposta = await fetch(`/api/materiais/${encodeURIComponent(materialId)}`, { method: "DELETE" }).catch(() => null);
    if (resposta?.ok) roteador.refresh();
    else { definirMensagem("Não foi possível excluir o material."); definirProcessando(false); }
  }

  return <div className={estilos.acoesArquivoMaterial}>
    <input accept={ACEITOS} aria-label="Selecionar novo arquivo" hidden onChange={substituir} ref={seletor} type="file" />
    <button disabled={processando} onClick={() => seletor.current?.click()} type="button"><Upload aria-hidden="true" />Substituir arquivo</button>
    {podeAnalisar && (situacao === "FALHA" || situacao === "PENDENTE") && <button disabled={processando} onClick={analisar} type="button"><RefreshCw aria-hidden="true" />Tentar análise</button>}
    <button className={estilos.botaoExcluirMaterial} disabled={processando} onClick={excluir} type="button"><Trash2 aria-hidden="true" />Excluir permanentemente</button>
    {mensagem && <small role="status">{mensagem}</small>}
  </div>;
}
