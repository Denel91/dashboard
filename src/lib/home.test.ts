import { describe, expect, it } from 'vitest';
import {
  contaPerPersona,
  frasePareggio,
  giornoCorto,
  giornoEMese,
  mediaAlGiorno,
  periodoPrecedente,
  quotePagate,
  serieDelMese,
  variazione,
  type SpesaDelMese,
} from './home';

const IO = 'io';
const LEI = 'lei';
const s = (importo: number, chi: string, giorno: string, terza: string | null = null): SpesaDelMese => ({
  importo_centesimi: importo,
  pagata_da: chi,
  data_spesa: `2026-11-${giorno}`,
  terza_persona: terza,
});

describe('quotePagate (anello della tavola C1)', () => {
  it('somma per persona, anticipi esclusi, resi compresi', () => {
    const q = quotePagate([s(46307, IO, '01'), s(36000, LEI, '02'), s(-1067, LEI, '03'), s(3000, IO, '04', 'Marco')], IO);
    expect(q).toEqual({ mie: 46307, altra: 34933, totale: 81240, percentuale: 57 });
  });
  it('senza spese, o con solo resi, non c’è percentuale', () => {
    expect(quotePagate([], IO).percentuale).toBeNull();
    expect(quotePagate([s(-500, IO, '01')], IO).percentuale).toBeNull();
  });
});

describe('contaPerPersona e frasePareggio', () => {
  it('conta le spese di ciascuno', () => {
    const c = contaPerPersona([{ pagata_da: IO }, { pagata_da: LEI }, { pagata_da: IO }], IO);
    expect(c).toEqual({ mie: 2, altra: 1 });
    expect(frasePareggio(c, 'Simona')).toBe('2 spese tue e 1 di Simona');
  });
  it('singolare e nessuna', () => {
    expect(frasePareggio({ mie: 1, altra: 0 }, 'Simona')).toBe('1 spesa tua e nessuna di Simona');
    expect(frasePareggio({ mie: 0, altra: 9 }, 'Simona')).toBe('nessuna spesa tua e 9 di Simona');
  });
});

describe('serieDelMese (mini grafici)', () => {
  it('progressivi per giorno fino a oggi', () => {
    const serie = serieDelMese([s(1000, IO, '01'), s(500, LEI, '03'), s(800, IO, '03', 'Marco'), s(900, IO, '05')], 4);
    expect(serie.totale).toEqual([1000, 1000, 1500, 1500]);
    expect(serie.numero).toEqual([1, 1, 2, 2]);
    expect(serie.media).toEqual([1000, 500, 500, 375]);
  });
});

describe('mediaAlGiorno e variazione', () => {
  it('media arrotondata al centesimo', () => {
    expect(mediaAlGiorno(81240, 9)).toBe(9027);
    expect(mediaAlGiorno(100, 0)).toBe(0);
  });
  it('variazione in punti percentuali, senza confronto se prima era zero', () => {
    expect(variazione(81240, 76640)).toBe(6);
    expect(variazione(9027, 9300)).toBe(-3);
    expect(variazione(1000, 0)).toBeNull();
  });
});

describe('periodoPrecedente', () => {
  it('stesso giorno del mese prima, o l’ultimo se è più corto', () => {
    expect(periodoPrecedente('2026-10', 11)).toEqual({ inizio: '2026-10-01', fine: '2026-10-11' });
    expect(periodoPrecedente('2027-02', 31)).toEqual({ inizio: '2027-02-01', fine: '2027-02-28' });
    expect(periodoPrecedente('2028-02', 30)).toEqual({ inizio: '2028-02-01', fine: '2028-02-29' });
  });
});

describe('giornoEMese e giornoCorto', () => {
  it('"31 ottobre", con l’anno solo se è un altro anno', () => {
    expect(giornoEMese('2026-10-31', '2026-11-11')).toBe('31 ottobre');
    expect(giornoEMese('2025-12-20', '2026-01-03')).toBe('20 dicembre 2025');
  });
  it('Oggi, Ieri o gg/mm', () => {
    expect(giornoCorto('2026-11-11', '2026-11-11')).toBe('Oggi');
    expect(giornoCorto('2026-11-10', '2026-11-11')).toBe('Ieri');
    expect(giornoCorto('2026-11-07', '2026-11-11')).toBe('07/11');
    expect(giornoCorto('2025-12-31', '2026-01-02')).toBe('31/12/2025');
  });
});
