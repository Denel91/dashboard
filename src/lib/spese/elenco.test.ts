import { describe, expect, it } from 'vitest';
import { etichetteSpesa, raggruppaPerGiorno, riepilogoMese, type SpesaInElenco } from './elenco';

const base: SpesaInElenco = {
  id: 'x',
  importo_centesimi: 1000,
  divisione: 'a_meta',
  descrizione: null,
  data_spesa: '2026-11-10',
  pagata_da: 'm1',
  categoria_id: null,
  terza_persona: null,
  valuta: 'EUR',
  importo_originale: null,
};
const s = (p: Partial<SpesaInElenco>): SpesaInElenco => ({ ...base, ...p });

describe('raggruppaPerGiorno (tavola 05)', () => {
  it('raggruppa per giorno; il totale esclude gli anticipi e conta i resi', () => {
    const giorni = raggruppaPerGiorno([
      s({ id: 'a', data_spesa: '2026-11-10', importo_centesimi: 4730 }),
      s({ id: 'b', data_spesa: '2026-11-09', importo_centesimi: 3800 }),
      s({ id: 'c', data_spesa: '2026-11-09', importo_centesimi: 3000, terza_persona: 'Marco' }),
      s({ id: 'd', data_spesa: '2026-11-09', importo_centesimi: -500 }),
    ]);
    expect(giorni.map((g) => [g.giorno, g.spese.length, g.totaleCentesimi])).toEqual([
      ['2026-11-10', 1, 4730],
      ['2026-11-09', 3, 3300],
    ]);
  });

  it('il riepilogo del mese esclude gli anticipi', () => {
    expect(riepilogoMese([s({ importo_centesimi: 4730 }), s({ importo_centesimi: 3000, terza_persona: 'Marco' })])).toEqual({
      totaleCentesimi: 4730,
      numero: 1,
    });
  });
});

describe('etichetteSpesa', () => {
  it('segna per chi è, anticipi, valuta estera e resi', () => {
    expect(etichetteSpesa(s({ divisione: 'per_altra_persona' }))).toEqual(['per l’altra persona']);
    expect(etichetteSpesa(s({ terza_persona: 'Marco' }))).toEqual(['anticipo per Marco']);
    expect(etichetteSpesa(s({ valuta: 'USD', importo_originale: 120 }))).toEqual(['120 USD']);
    expect(etichetteSpesa(s({ importo_centesimi: -500 }))).toEqual(['reso']);
    expect(etichetteSpesa(s({}))).toEqual([]);
  });
});
