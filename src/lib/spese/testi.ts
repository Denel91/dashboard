import { formattaEuro, quotaAltraPersona, type Divisione } from '@/lib/money';

// Frasi sul saldo e sull'anteprima (tavole 04, 06, 19b). Sempre con il nome
// dell'altra persona, mai solo il colore (NF-09).

/**
 * Il saldo visto da me. `saldoCentesimi` viene dalla vista `saldi`:
 * positivo = l'altra persona mi deve quella cifra.
 *   2340 → "Simona ti deve 23,40 €"
 *  -2340 → "Devi a Simona 23,40 €"
 *      0 → "Siete in pari"
 */
export function testoSaldo(saldoCentesimi: number, altra: string): string {
  if (saldoCentesimi > 0) return `${altra} ti deve ${formattaEuro(saldoCentesimi)}`;
  if (saldoCentesimi < 0) return `Devi a ${altra} ${formattaEuro(-saldoCentesimi)}`;
  return 'Siete in pari';
}

/** Avviso dopo il salvataggio (F7): "Spesa salvata · Simona ti deve 47,05 €". */
export function testoSpesaSalvata(saldoCentesimi: number | null, altra: string | null): string {
  if (saldoCentesimi === null || !altra) return 'Spesa salvata';
  return `Spesa salvata · ${testoSaldo(saldoCentesimi, altra)}`;
}

export type Anteprima = {
  testo: string;
  /** Chi dovrà i soldi: la sua iniziale e il suo colore tenue accanto al testo. */
  debitore: 'io' | 'altra';
};

/**
 * Anteprima del form (tavola 06): cosa cambia questa spesa tra voi due.
 * Stessa regola della vista quote_spese (quotaAltraPersona, R2–R4).
 *   pagata da me, 47,30 €, a metà      → "Simona ti dovrà 23,65 €"
 *   pagata da Simona, 38,00 €, a metà  → "Dovrai a Simona 19,00 €"
 * null se l'importo non è (ancora) valido.
 */
export function anteprimaSpesa(
  importoCentesimi: number | null,
  pagataDaMe: boolean,
  divisione: Divisione,
  altra: string,
): Anteprima | null {
  if (importoCentesimi === null || importoCentesimi <= 0) return null;
  const quota = formattaEuro(quotaAltraPersona(importoCentesimi, divisione));
  return pagataDaMe
    ? { testo: `${altra} ti dovrà ${quota}`, debitore: 'altra' }
    : { testo: `Dovrai a ${altra} ${quota}`, debitore: 'io' };
}
