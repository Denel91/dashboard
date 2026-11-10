import { dataIsoBreve } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import type { Membro, NucleoCorrente } from '@/lib/nucleo/corrente';

// Il saldo e i rimborsi visti da chi è collegato (US-30, tavole 04, 08a,
// 15a). Questo modulo NON calcola il saldo: lo dà la vista `saldi` del
// database (D6, K6). Qui lo si traduce in "chi deve a chi" e in testi.

/**
 * - `solo`: nel nucleo c'è una persona sola, non c'è ancora un saldo;
 * - `pari`: saldo a zero (tavola 15a);
 * - `debito`: qualcuno deve dei soldi all'altra persona (tavole 04 e 08a).
 */
export type StatoSaldo =
  | { tipo: 'solo' }
  | { tipo: 'pari'; membri: [Membro, Membro] }
  | { tipo: 'debito'; debitore: Membro; creditore: Membro; importoCentesimi: number; ioDevo: boolean };

type Persone = Pick<NucleoCorrente, 'io' | 'membri'>;

/**
 * Dal saldo di chi è collegato (vista `saldi`: positivo = l'altra persona
 * mi deve) a chi deve quanto a chi.
 *   2340 → Simona deve 23,40 € a Daniele
 *  -2340 → Daniele deve 23,40 € a Simona
 */
export function statoSaldo(saldoMioCentesimi: number, { io, membri }: Persone): StatoSaldo {
  if (!Number.isInteger(saldoMioCentesimi)) throw new Error(`Il saldo deve essere in centesimi interi: ${saldoMioCentesimi}`);
  const altra = membri.find((m) => m.id !== io.id);
  if (!altra) return { tipo: 'solo' };
  // In ordine di ingresso (blu, poi rosa), come le iniziali della tavola 15a
  const coppia = (io.persona === 'a' ? [io, altra] : [altra, io]) as [Membro, Membro];
  if (saldoMioCentesimi === 0) return { tipo: 'pari', membri: coppia };
  return saldoMioCentesimi > 0
    ? { tipo: 'debito', debitore: altra, creditore: io, importoCentesimi: saldoMioCentesimi, ioDevo: false }
    : { tipo: 'debito', debitore: io, creditore: altra, importoCentesimi: -saldoMioCentesimi, ioDevo: true };
}

/** Il colore della card del saldo: quello di chi deve (D17); neutra se siete in pari o se sei solo. */
export function tonoCardSaldo(stato: StatoSaldo): 'persona-a' | 'persona-b' | 'normale' {
  return stato.tipo === 'debito' ? `persona-${stato.debitore.persona}` : 'normale';
}

/** Un rimborso nell'elenco della tavola 08a. */
export type RimborsoInElenco = {
  id: string;
  da: Membro;
  a: Membro;
  importoCentesimi: number;
  /** AAAA-MM-GG */
  data: string;
  nota: string | null;
  annullato: boolean;
};

/** La riga sotto i nomi: "28/10/2026 · Bonifico" (tavola 08a). */
export function sottotitoloRimborso(r: Pick<RimborsoInElenco, 'data' | 'nota'>): string {
  return [dataIsoBreve(r.data), r.nota?.trim() || null].filter(Boolean).join(' · ');
}

type RigaRimborso = {
  id: string;
  da_membro: string;
  a_membro: string;
  importo_centesimi: number;
  data_rimborso: string;
  nota: string | null;
  data_eliminazione: string | null;
};

/**
 * Dalle righe della tabella `rimborsi` all'elenco, con i nomi dei membri.
 * Un rimborso con un membro che non c'è più nel nucleo (uscito, Sprint 8)
 * mostra "Ex membro", con il colore che aveva per posizione.
 */
export function rimborsiInElenco(righe: RigaRimborso[], tuttiIMembri: { id: string; nome: string }[], nucleo: Persone): RimborsoInElenco[] {
  const membro = (id: string): Membro => {
    const attivo = nucleo.membri.find((m) => m.id === id);
    if (attivo) return attivo;
    const i = tuttiIMembri.findIndex((m) => m.id === id);
    return { id, nome: tuttiIMembri[i]?.nome ?? 'Ex membro', persona: i === 0 ? 'a' : 'b', sonoIo: false };
  };
  return righe.map((r) => ({
    id: r.id,
    da: membro(r.da_membro),
    a: membro(r.a_membro),
    importoCentesimi: r.importo_centesimi,
    data: r.data_rimborso,
    nota: r.nota,
    annullato: r.data_eliminazione !== null,
  }));
}

// --- Rimborsi dall'app (US-31, US-32, US-33) --------------------------------

/**
 * La nota sotto l'importo nel foglio "Segna come saldato" (tavola 08b),
 * aggiornata mentre si scrive. `importoCentesimi` è null finché il testo non
 * è un importo valido.
 *   2340 su 2340 → "Il saldo tornerà a zero: siete in pari."
 *   1000 su 2340 → "Resteranno da saldare 13,40 €."
 *   3000 su 2340 → "Al massimo 23,40 €, il saldo attuale."
 */
export function notaImportoRimborso(importoCentesimi: number | null, saldoCentesimi: number): { testo: string; valido: boolean } {
  const massimo = formattaEuro(saldoCentesimi);
  if (importoCentesimi === null) return { testo: 'Scrivi un importo valido, per esempio 23,40.', valido: false };
  if (importoCentesimi <= 0) return { testo: 'Scrivi un importo maggiore di zero.', valido: false };
  if (importoCentesimi > saldoCentesimi) return { testo: `Al massimo ${massimo}, il saldo attuale.`, valido: false };
  if (importoCentesimi === saldoCentesimi) return { testo: 'Il saldo tornerà a zero: siete in pari.', valido: true };
  return { testo: `Resteranno da saldare ${formattaEuro(saldoCentesimi - importoCentesimi)}.`, valido: true };
}

/**
 * Il saldo di chi è collegato se si annulla il rimborso (tavola 19e): il
 * rimborso esce dal conto della vista `saldi` (da_membro +, a_membro −).
 */
export function saldoDopoAnnullamento(saldoMioCentesimi: number, r: Pick<RimborsoInElenco, 'da' | 'a' | 'importoCentesimi'>, ioId: string): number {
  if (r.da.id === ioId) return saldoMioCentesimi - r.importoCentesimi;
  if (r.a.id === ioId) return saldoMioCentesimi + r.importoCentesimi;
  return saldoMioCentesimi;
}

/**
 * La frase di 19e sul saldo dopo l'annullamento:
 *   stesso debitore di oggi → "Il saldo tornerà a 63,40 €."
 *   debitore diverso        → "Dopo, Daniele dovrà 28,70 € a Simona."
 *   zero                    → "Dopo sarete in pari."
 */
export function fraseDopoAnnullamento(prima: StatoSaldo, dopo: StatoSaldo): string {
  if (dopo.tipo !== 'debito') return 'Dopo sarete in pari.';
  if (prima.tipo === 'debito' && prima.debitore.id === dopo.debitore.id) return `Il saldo tornerà a ${formattaEuro(dopo.importoCentesimi)}.`;
  return `Dopo, ${dopo.debitore.nome} dovrà ${formattaEuro(dopo.importoCentesimi)} a ${dopo.creditore.nome}.`;
}
