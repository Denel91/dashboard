import type { ContenutoAvviso } from '@/lib/avvisi';
import { formattaEuro, quotaAltraPersona, type Divisione } from '@/lib/money';
import type { Persona } from '@/lib/nucleo/corrente';

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

type Persone = { io: { nome: string; persona: Persona }; altra: { nome: string; persona: Persona } | null };

/**
 * Il saldo diviso in due parti, per mettere l'importo in grassetto (tavola
 * 19b), con chi deve: la sua iniziale va accanto.
 *   2340 → { testo: "Simona ti deve", importo: "23,40 €", chi: Simona }
 */
export function partiSaldo(saldoCentesimi: number, { io, altra }: Persone & { altra: NonNullable<Persone['altra']> }) {
  if (saldoCentesimi > 0) return { testo: `${altra.nome} ti deve`, importo: formattaEuro(saldoCentesimi), nome: altra.nome, persona: altra.persona };
  if (saldoCentesimi < 0) return { testo: `Devi a ${altra.nome}`, importo: formattaEuro(-saldoCentesimi), nome: io.nome, persona: io.persona };
  return { testo: 'Siete in pari' };
}

/**
 * Avviso dopo un salvataggio (F7, tavola 19b), su tre righe:
 *   Spesa salvata
 *   Esselunga · 47,30 € · Spesa
 *   (S) Simona ti deve 47,05 €
 * Il saldo manca se non si è potuto leggere o se si è ancora soli.
 */
export function avvisoSpesa({
  titolo,
  descrizione,
  importoCentesimi,
  categoria,
  saldoCentesimi,
  persone,
}: {
  titolo: string;
  descrizione: string | null;
  importoCentesimi: number;
  categoria: string | null;
  saldoCentesimi: number | null;
  persone: Persone;
}): ContenutoAvviso {
  const dettaglio = [descrizione, formattaEuro(importoCentesimi), categoria].filter(Boolean).join(' · ');
  const altra = persone.altra;
  return {
    testo: titolo,
    dettaglio,
    conferma: true,
    saldo: saldoCentesimi === null || !altra ? undefined : partiSaldo(saldoCentesimi, { io: persone.io, altra }),
  };
}

export type Anteprima = {
  testo: string;
  /** Il testo senza l'importo e l'importo da solo, per metterlo in grassetto. */
  prima: string;
  importo: string;
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
    ? { testo: `${altra} ti dovrà ${quota}`, prima: `${altra} ti dovrà`, importo: quota, debitore: 'altra' }
    : { testo: `Dovrai a ${altra} ${quota}`, prima: `Dovrai a ${altra}`, importo: quota, debitore: 'io' };
}
