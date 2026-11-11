// Date di calendario (AAAA-MM-GG) nel fuso italiano.
// Non sta in un file "use client": la usano anche il server e le Server
// Actions, e una funzione esportata da un Client Component, sul server,
// diventa un riferimento invece della funzione (Fase 3, sezione 5, regola 8).

export const FUSO_ORARIO = 'Europe/Rome';

/**
 * Data di oggi come AAAA-MM-GG nel fuso indicato (predefinito: Italia).
 * A mezzanotte e mezza in Italia il server in UTC è ancora a ieri: per
 * questo il fuso è esplicito.
 */
export function oggiIso(adesso: Date, fuso = FUSO_ORARIO) {
  // en-CA scrive le date proprio come AAAA-MM-GG
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(adesso);
}

// --- Mesi e giorni per l'elenco delle spese (tavola 05) ---------------------

/** Mese come AAAA-MM. */
export type Mese = `${number}-${number}`;

const RE_MESE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Il mese del parametro ?mese=AAAA-MM, se è valido e non nel futuro; altrimenti il mese di oggi. */
export function meseDaParametro(parametro: unknown, oggi: string): Mese {
  const corrente = oggi.slice(0, 7) as Mese;
  if (typeof parametro !== 'string' || !RE_MESE.test(parametro)) return corrente;
  return parametro > corrente ? corrente : (parametro as Mese);
}

/** Primo e ultimo giorno del mese: 2026-02 → 2026-02-01 … 2026-02-28. */
export function limitiMese(mese: Mese) {
  const [anno, m] = mese.split('-').map(Number);
  const ultimo = new Date(Date.UTC(anno, m, 0)).getUTCDate();
  return { inizio: `${mese}-01`, fine: `${mese}-${String(ultimo).padStart(2, '0')}` };
}

/** Il mese prima (-1) o dopo (+1). */
export function meseVicino(mese: Mese, passo: -1 | 1): Mese {
  const [anno, m] = mese.split('-').map(Number);
  const d = new Date(Date.UTC(anno, m - 1 + passo, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` as Mese;
}

const fmtMese = new Intl.DateTimeFormat('it-IT', { month: 'long', timeZone: 'UTC' });
const fmtMeseAnno = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "novembre", oppure "novembre 2025" se non è l'anno di oggi. */
export function nomeMese(mese: Mese, oggi: string): string {
  const d = new Date(`${mese}-01T00:00:00Z`);
  return (mese.slice(0, 4) === oggi.slice(0, 4) ? fmtMese : fmtMeseAnno).format(d);
}

const fmtGiorno = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtGiornoAnno = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Intestazione di un giorno nell'elenco (tavola 05), in minuscolo: la
 * mostra in maiuscolo il CSS.
 *   oggi → "oggi · martedì 10 novembre"; ieri → "ieri · lunedì 9 novembre";
 *   altrimenti "lunedì 3 novembre" (con l'anno se non è quello di oggi).
 */
export function etichettaGiorno(giorno: string, oggi: string): string {
  const d = new Date(`${giorno}T00:00:00Z`);
  const testo = (giorno.slice(0, 4) === oggi.slice(0, 4) ? fmtGiorno : fmtGiornoAnno).format(d);
  const ieri = new Date(`${oggi}T00:00:00Z`);
  ieri.setUTCDate(ieri.getUTCDate() - 1);
  if (giorno === oggi) return `oggi · ${testo}`;
  if (giorno === ieri.toISOString().slice(0, 10)) return `ieri · ${testo}`;
  return testo;
}

const fmtDataBreve = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ORARIO });

/** Un istante (timestamptz) come gg/mm/aaaa nel fuso italiano (NF-03): "03/11/2026". */
export function dataBreve(istante: string | Date): string {
  return fmtDataBreve.format(typeof istante === 'string' ? new Date(istante) : istante);
}

const fmtOra = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: FUSO_ORARIO });

/** Un istante come "03/11/2026 alle 21:30", nel fuso italiano (tavola 07). */
export function dataEOra(istante: string | Date): string {
  const d = typeof istante === 'string' ? new Date(istante) : istante;
  return `${dataBreve(d)} alle ${fmtOra.format(d)}`;
}

/** Una data AAAA-MM-GG come gg/mm/aaaa, senza passare dal fuso: "04/11/2026". */
export function dataIsoBreve(giorno: string): string {
  const [a, m, g] = giorno.split('-');
  return `${g}/${m}/${a}`;
}

/**
 * Valore del campo data di Nuova spesa e Modifica spesa (tavole 06 e 07):
 *   oggi → "Oggi · 04/11/2026"; ieri → "Ieri · 03/11/2026"; altrimenti "02/11/2026".
 */
export function etichettaData(giorno: string, oggi: string): string {
  const ieri = new Date(`${oggi}T00:00:00Z`);
  ieri.setUTCDate(ieri.getUTCDate() - 1);
  if (giorno === oggi) return `Oggi · ${dataIsoBreve(giorno)}`;
  if (giorno === ieri.toISOString().slice(0, 10)) return `Ieri · ${dataIsoBreve(giorno)}`;
  return dataIsoBreve(giorno);
}

/** I mesi da mostrare nella tendina dell'elenco (tavola 05): dal più recente, `quanti` in tutto. */
export function mesiFinoA(mese: Mese, quanti: number): Mese[] {
  const mesi: Mese[] = [mese];
  for (let i = 1; i < quanti; i++) mesi.push(meseVicino(mesi[i - 1], -1));
  return mesi;
}

/** "novembre 2026", sempre con l'anno (riga sotto il titolo di Spese, tavola 05). */
export function meseEAnno(mese: Mese): string {
  return fmtMeseAnno.format(new Date(`${mese}-01T00:00:00Z`));
}

// --- Intestazione della Home sul computer (D23, sezione 9.8) ---------------

const fmtOraNumero = new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: FUSO_ORARIO });

/** "Buongiorno" dalle 5 alle 12, "Buon pomeriggio" fino alle 18, poi "Buonasera" (ora italiana). */
export function saluto(adesso: Date): string {
  const ora = Number(fmtOraNumero.format(adesso));
  if (ora >= 5 && ora < 12) return 'Buongiorno';
  if (ora >= 12 && ora < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

const fmtDataEstesa = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Una data AAAA-MM-GG per esteso, con l'iniziale maiuscola: "Martedì 10 novembre". */
export function dataEstesa(giorno: string): string {
  const t = fmtDataEstesa.format(new Date(`${giorno}T00:00:00Z`));
  return t.charAt(0).toLocaleUpperCase('it-IT') + t.slice(1);
}
