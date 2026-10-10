export type PeriodoModuloResolvido = {
  inicio: Date | null;
  fim: Date;
  inicioTexto: string;
  fimTexto: string;
  hoje: string;
  ativo: boolean;
  erro: string | null;
};

type EntradaPeriodoModulo = { inicio?: string | string[]; fim?: string | string[] };

function primeiro(valor?: string | string[]) {
  return Array.isArray(valor) ? valor[0] ?? "" : valor ?? "";
}

function dataUtcValida(valor: string, fimDoDia = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}T${fimDoDia ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor ? null : data;
}

export function resolverPeriodoModulo(entrada: EntradaPeriodoModulo, agora = new Date()): PeriodoModuloResolvido {
  const inicioTexto = primeiro(entrada.inicio);
  const fimTexto = primeiro(entrada.fim);
  const hoje = agora.toISOString().slice(0, 10);
  const padrao = (erro: string | null): PeriodoModuloResolvido => ({ inicio: null, fim: agora, inicioTexto, fimTexto, hoje, ativo: false, erro });
  if (!inicioTexto && !fimTexto) return padrao(null);
  if (!inicioTexto || !fimTexto) return padrao("Informe a data de início e a data de fim.");
  const inicio = dataUtcValida(inicioTexto);
  const fim = dataUtcValida(fimTexto, true);
  if (!inicio || !fim) return padrao("Informe datas válidas.");
  if (inicioTexto > hoje || fimTexto > hoje) return padrao("O período não pode incluir datas futuras.");
  if (inicio.getTime() > fim.getTime()) return padrao("A data de início deve ser anterior ou igual à data de fim.");
  return { inicio, fim, inicioTexto, fimTexto, hoje, ativo: true, erro: null };
}

export function dataDentroDoPeriodo(data: Date, periodo: Pick<PeriodoModuloResolvido, "inicio" | "fim">) {
  return (periodo.inicio === null || data.getTime() >= periodo.inicio.getTime()) && data.getTime() <= periodo.fim.getTime();
}
