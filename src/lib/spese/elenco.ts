// Elenco delle spese raggruppato per giorno (tavola 05, US-13).
// Il totale del giorno e quello del mese ESCLUDONO gli anticipi per terzi,
// come il totale del mese in Home (US-40): gli anticipi restano nell'elenco
// con la loro etichetta. I resi (importi negativi) riducono i totali.

export type SpesaInElenco = {
  id: string;
  importo_centesimi: number;
  divisione: 'a_meta' | 'per_altra_persona';
  descrizione: string | null;
  data_spesa: string;
  pagata_da: string;
  categoria_id: string | null;
  terza_persona: string | null;
  valuta: string;
  importo_originale: number | null;
};

export type GiornoDiSpese = { giorno: string; spese: SpesaInElenco[]; totaleCentesimi: number };

const contaNelTotale = (s: SpesaInElenco) => s.terza_persona === null;

/** Raggruppa per data_spesa, nell'ordine in cui arrivano (dal più recente). */
export function raggruppaPerGiorno(spese: SpesaInElenco[]): GiornoDiSpese[] {
  const giorni: GiornoDiSpese[] = [];
  for (const s of spese) {
    let g = giorni.at(-1);
    if (!g || g.giorno !== s.data_spesa) {
      g = { giorno: s.data_spesa, spese: [], totaleCentesimi: 0 };
      giorni.push(g);
    }
    g.spese.push(s);
    if (contaNelTotale(s)) g.totaleCentesimi += s.importo_centesimi;
  }
  return giorni;
}

/** Totale e numero delle spese del mese, anticipi esclusi. */
export function riepilogoMese(spese: SpesaInElenco[]) {
  const comuni = spese.filter(contaNelTotale);
  return { totaleCentesimi: comuni.reduce((t, s) => t + s.importo_centesimi, 0), numero: comuni.length };
}

const fmtOriginale = (importo: number, valuta: string) =>
  `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(importo)} ${valuta}`;

/**
 * Etichette dei casi particolari (tavola 05): "per l'altra persona",
 * "anticipo per Marco", "120 USD", "reso". Il reso si riconosce dal segno
 * meno e dall'etichetta, non dal colore (D17).
 */
export function etichetteSpesa(s: SpesaInElenco): string[] {
  const etichette: string[] = [];
  if (s.importo_centesimi < 0) etichette.push('reso');
  if (s.terza_persona) etichette.push(`anticipo per ${s.terza_persona}`);
  if (s.divisione === 'per_altra_persona') etichette.push('per l’altra persona');
  if (s.valuta !== 'EUR' && s.importo_originale !== null) etichette.push(fmtOriginale(s.importo_originale, s.valuta));
  return etichette;
}
