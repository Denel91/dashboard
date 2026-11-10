import type { Mese } from '@/lib/date';

// Numeri della Home sul computer (tavola C1 v2, D23): l'anello "pagato da
// te" e le spese dall'ultimo pareggio nella card del saldo, i riquadri
// numerici con il mini grafico e il confronto con il mese prima.
// Sono riepiloghi del mese, non conti tra le persone: il saldo resta quello
// della vista `saldi` (Fase 3, sezione 5, regola 5). Anticipi per terzi
// esclusi, resi compresi (riducono il totale), come il totale del mese.

export type SpesaDelMese = {
  importo_centesimi: number;
  pagata_da: string;
  data_spesa: string;
  terza_persona: string | null;
};

const comune = (s: SpesaDelMese) => s.terza_persona === null;

/** Quanto ha pagato ciascuno nel mese e la percentuale di chi guarda (anello "57% pagato da te"). */
export function quotePagate(spese: SpesaDelMese[], ioId: string) {
  let mie = 0;
  let altra = 0;
  for (const s of spese.filter(comune)) {
    if (s.pagata_da === ioId) mie += s.importo_centesimi;
    else altra += s.importo_centesimi;
  }
  const totale = mie + altra;
  // Con un totale nullo o negativo (solo resi) la percentuale non ha senso
  const percentuale = totale > 0 ? Math.min(100, Math.max(0, Math.round((mie / totale) * 100))) : null;
  return { mie, altra, totale, percentuale };
}

/** Quante spese ha registrato ciascuno (dall'ultimo pareggio): "12 spese tue e 9 di Simona". */
export function contaPerPersona(spese: { pagata_da: string }[], ioId: string) {
  let mie = 0;
  for (const s of spese) if (s.pagata_da === ioId) mie++;
  return { mie, altra: spese.length - mie };
}

/** Giorno del mese di una data AAAA-MM-GG. */
const giornoDi = (data: string) => Number(data.slice(8, 10));

/**
 * Serie per i mini grafici dei riquadri, un valore per giorno dal primo a
 * `fino` (oggi): totale progressivo, numero di spese progressivo e media
 * al giorno progressiva.
 */
export function serieDelMese(spese: SpesaDelMese[], fino: number) {
  const perGiorno = Array.from({ length: fino }, () => ({ importo: 0, numero: 0 }));
  for (const s of spese.filter(comune)) {
    const g = giornoDi(s.data_spesa);
    if (g >= 1 && g <= fino) {
      perGiorno[g - 1].importo += s.importo_centesimi;
      perGiorno[g - 1].numero++;
    }
  }
  const totale: number[] = [];
  const numero: number[] = [];
  const media: number[] = [];
  let t = 0;
  let n = 0;
  perGiorno.forEach((g, i) => {
    t += g.importo;
    n += g.numero;
    totale.push(t);
    numero.push(n);
    media.push(Math.round(t / (i + 1)));
  });
  return { totale, numero, media };
}

/** Media al giorno del mese fino a oggi, in centesimi interi. */
export function mediaAlGiorno(totaleCentesimi: number, giorni: number): number {
  return giorni > 0 ? Math.round(totaleCentesimi / giorni) : 0;
}

/**
 * Variazione rispetto allo stesso periodo del mese prima, in punti
 * percentuali interi ("↗ 6% su ottobre"). Senza un valore di confronto
 * positivo non c'è confronto.
 */
export function variazione(attuale: number, precedente: number): number | null {
  if (precedente <= 0) return null;
  return Math.round(((attuale - precedente) / precedente) * 100);
}

/**
 * Il periodo del mese prima da confrontare: dal primo allo stesso giorno di
 * oggi, o all'ultimo giorno se il mese prima è più corto (31 marzo → 28 o
 * 29 febbraio).
 */
export function periodoPrecedente(mesePrima: Mese, giorno: number) {
  const [a, m] = mesePrima.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const g = String(Math.min(giorno, ultimo)).padStart(2, '0');
  return { inizio: `${mesePrima}-01`, fine: `${mesePrima}-${g}` };
}

const fmtGiornoMese = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtGiornoMeseAnno = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "31 ottobre" (con l'anno se non è quello di oggi), per "Dall'ultimo pareggio del 31 ottobre". */
export function giornoEMese(giorno: string, oggi: string): string {
  const d = new Date(`${giorno}T00:00:00Z`);
  return (giorno.slice(0, 4) === oggi.slice(0, 4) ? fmtGiornoMese : fmtGiornoMeseAnno).format(d);
}

/** "Oggi", "Ieri" o "07/11" nella riga delle ultime spese (C1): "Oggi · Daniele". */
export function giornoCorto(giorno: string, oggi: string): string {
  const ieri = new Date(`${oggi}T00:00:00Z`);
  ieri.setUTCDate(ieri.getUTCDate() - 1);
  if (giorno === oggi) return 'Oggi';
  if (giorno === ieri.toISOString().slice(0, 10)) return 'Ieri';
  const [a, m, g] = giorno.split('-');
  return a === oggi.slice(0, 4) ? `${g}/${m}` : `${g}/${m}/${a}`;
}

/** "12 spese tue e 9 di Simona", "1 spesa tua e nessuna di Simona". */
export function frasePareggio(conteggio: { mie: number; altra: number }, nomeAltra: string): string {
  const tue = conteggio.mie === 0 ? 'nessuna spesa tua' : conteggio.mie === 1 ? '1 spesa tua' : `${conteggio.mie} spese tue`;
  const sue = conteggio.altra === 0 ? `nessuna di ${nomeAltra}` : `${conteggio.altra} di ${nomeAltra}`;
  return `${tue} e ${sue}`;
}
