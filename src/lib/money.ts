/**
 * Soldi in centesimi interi (R7). Questo modulo NON calcola saldi: quelli
 * arrivano dalle viste del database (saldi, quote_spese). Serve per:
 *   - leggere l'importo scritto nel form ("47,30") → 4730 centesimi;
 *   - mostrare gli importi in formato it-IT ("1.234,56 €", NF-03);
 *   - l'anteprima "Simona ti dovrà 23,65 €" nel form, con la stessa
 *     regola della vista quote_spese.
 */

export type Divisione = 'a_meta' | 'per_altra_persona';

/** Importo massimo accettato nel form: 1.000.000,00 €. */
export const IMPORTO_MASSIMO_CENTESIMI = 100_000_000;

/**
 * Converte il testo scritto dall'utente in centesimi interi.
 * Accetta: "47,30" · "47,3" · "47" · "1.234,56" · "1234.56" · "47.30 €" · "-10,01".
 * Restituisce null se il testo non è un importo valido (più di 2 decimali,
 * lettere, vuoto, oltre il massimo). Lo zero è valido qui: lo rifiuta Zod.
 * Nessun calcolo in virgola mobile: si lavora sulle cifre come testo.
 */
export function euroInCentesimi(testo: string): number | null {
  let t = testo.replace(/[\s  €]/g, '');
  if (t === '') return null;

  let segno = 1;
  if (t.startsWith('-') || t.startsWith('−')) {
    segno = -1;
    t = t.slice(1);
  }

  if (t.includes(',')) {
    // Formato italiano: i punti sono separatori delle migliaia
    if (t.includes('.') && !/^\d{1,3}(\.\d{3})+,/.test(t)) return null;
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.234" o "1.234.567": solo migliaia
    t = t.replace(/\./g, '');
  }

  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;

  const centesimi = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  if (centesimi > IMPORTO_MASSIMO_CENTESIMI) return null;
  return segno * centesimi;
}

const formatoEuro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  // In it-IT i numeri a 4 cifre non avrebbero il punto ("1234,56 €"):
  // 'always' dà "1.234,56 €" come chiede NF-03.
  useGrouping: 'always',
});

/** 123456 → "1.234,56 €" (con spazio non separabile prima di €). */
export function formattaEuro(centesimi: number): string {
  verificaIntero(centesimi);
  return formatoEuro.format(centesimi / 100);
}

/** 4730 → "47,30": il valore da rimettere nel campo quando si modifica una spesa. */
export function centesimiPerCampo(centesimi: number): string {
  verificaIntero(centesimi);
  const segno = centesimi < 0 ? '-' : '';
  const assoluto = Math.abs(centesimi);
  const euro = Math.trunc(assoluto / 100);
  const cent = String(assoluto % 100).padStart(2, '0');
  return `${segno}${euro},${cent}`;
}

/**
 * Quota a carico di chi NON ha pagato. Stessa regola della vista quote_spese:
 *   a_meta            → metà troncata verso lo zero (R2, R4): 1001 → 500, −1001 → −500
 *   per_altra_persona → l'intero importo (R3)
 */
export function quotaAltraPersona(importoCentesimi: number, divisione: Divisione): number {
  verificaIntero(importoCentesimi);
  return divisione === 'a_meta' ? Math.trunc(importoCentesimi / 2) : importoCentesimi;
}

function verificaIntero(centesimi: number): void {
  if (!Number.isSafeInteger(centesimi)) {
    throw new RangeError(`Importo non valido: ${centesimi} (servono centesimi interi)`);
  }
}
