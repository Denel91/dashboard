import { describe, expect, it } from 'vitest';
import { dataBreve, etichettaGiorno, limitiMese, meseDaParametro, meseVicino, nomeMese } from './date';

describe('mesi (tavola 05)', () => {
  it('legge ?mese= e ripiega sul mese di oggi', () => {
    expect(meseDaParametro('2026-09', '2026-11-10')).toBe('2026-09');
    expect(meseDaParametro(undefined, '2026-11-10')).toBe('2026-11');
    expect(meseDaParametro('2026-13', '2026-11-10')).toBe('2026-11');
    expect(meseDaParametro('novembre', '2026-11-10')).toBe('2026-11');
    expect(meseDaParametro('2027-01', '2026-11-10')).toBe('2026-11');
  });

  it('calcola primo e ultimo giorno, anche a febbraio e nei bisestili', () => {
    expect(limitiMese('2026-02')).toEqual({ inizio: '2026-02-01', fine: '2026-02-28' });
    expect(limitiMese('2028-02')).toEqual({ inizio: '2028-02-01', fine: '2028-02-29' });
    expect(limitiMese('2026-11')).toEqual({ inizio: '2026-11-01', fine: '2026-11-30' });
  });

  it('passa al mese prima e dopo, anche tra due anni', () => {
    expect(meseVicino('2026-01', -1)).toBe('2025-12');
    expect(meseVicino('2026-12', 1)).toBe('2027-01');
  });

  it('dà il nome del mese, con l’anno solo se non è quello di oggi', () => {
    expect(nomeMese('2026-11', '2026-11-10')).toBe('novembre');
    expect(nomeMese('2025-12', '2026-01-03')).toBe('dicembre 2025');
  });
});

describe('etichettaGiorno', () => {
  it('scrive oggi, ieri e gli altri giorni', () => {
    expect(etichettaGiorno('2026-11-10', '2026-11-10')).toBe('oggi · martedì 10 novembre');
    expect(etichettaGiorno('2026-11-09', '2026-11-10')).toBe('ieri · lunedì 9 novembre');
    expect(etichettaGiorno('2026-11-03', '2026-11-10')).toBe('martedì 3 novembre');
    expect(etichettaGiorno('2025-12-31', '2026-01-01')).toBe('ieri · mercoledì 31 dicembre 2025');
  });
});

describe('dataBreve', () => {
  it('scrive gg/mm/aaaa nel fuso italiano', () => {
    expect(dataBreve('2026-11-03T10:00:00+00:00')).toBe('03/11/2026');
    expect(dataBreve('2026-11-03T23:30:00Z')).toBe('04/11/2026');
  });
});
